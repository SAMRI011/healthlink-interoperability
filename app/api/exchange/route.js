import { json, originFrom, readJsonSafe } from '@/lib/http';
import { logExchange } from '@/lib/db';
import { parseBundle } from '@/lib/fhir';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

function cleanBaseUrl(value) {
  return String(value || '').trim().replace(/\/$/, '');
}

async function audit(entry) {
  try { await logExchange(entry); }
  catch (error) { console.error('Audit log failure', error); }
}

export async function POST(request) {
  const provided = request.headers.get('x-api-key') || '';
  const expected = process.env.DIAGNOSTIC_API_KEY || '';
  let bundle = null;

  try { bundle = await request.json(); }
  catch { return json({ status: 'error', message: 'Request body must be JSON.' }, 400); }

  const base = {
    sourceSystem: provided && expected && provided === expected ? 'Addis Diagnostic Center' : 'Unauthenticated sender',
    destination: 'Hospital EMR',
    resourceType: bundle?.resourceType || 'Unknown',
    bundleId: bundle?.id || null
  };

  if (!expected) return json({ status: 'error', message: 'Exchange service is missing DIAGNOSTIC_API_KEY.' }, 500);
  if (!provided || provided !== expected) {
    await audit({ ...base, status: 'authentication_failed', httpStatus: 401, detail: 'Invalid or missing API key.' });
    return json({ status: 'authentication_failed', message: 'Sender authentication failed.' }, 401);
  }

  const parsed = parseBundle(bundle);
  if (!parsed.ok) {
    await audit({ ...base, status: 'validation_failed', httpStatus: parsed.status, detail: parsed.message });
    return json({ status: 'validation_failed', message: parsed.message }, parsed.status);
  }

  // Resolve the sender's local patient identity through the Exchange-side
  // Client Registry. The registry uses a protected synthetic Fayda identity
  // anchor internally and returns only the Hospital's local identifier.
  const exchangeBase = originFrom(request);
  let registryResponse;
  try {
    registryResponse = await fetch(`${exchangeBase}/api/registry/match/${encodeURIComponent(parsed.externalPatientId)}`, {
      headers: { 'X-Internal-Exchange-Key': expected },
      cache: 'no-store'
    });
  } catch {
    await audit({ ...base, status: 'identity_resolution_failed', httpStatus: 503, detail: 'Client Registry could not be reached.' });
    return json({ status: 'error', message: 'Client Registry could not be reached.' }, 503);
  }

  const registry = await readJsonSafe(registryResponse);
  if (registryResponse.status === 404) {
    await audit({ ...base, status: 'unmatched', httpStatus: 404, detail: 'Client Registry found no patient match.' });
    return json({ status: 'unmatched', message: 'Client Registry found no patient match.' }, 404);
  }
  if (!registryResponse.ok || !registry.hospital_patient_id) {
    await audit({ ...base, status: 'identity_resolution_failed', httpStatus: 503, detail: 'Client Registry returned an unexpected error.' });
    return json({ status: 'error', message: 'Client Registry returned an unexpected error.' }, 503);
  }

  try {
    const hospitalBase = cleanBaseUrl(process.env.HOSPITAL_BASE_URL) || originFrom(request);
    const response = await fetch(`${hospitalBase}/api/hospital/results`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/fhir+json',
        'X-Authenticated-Source': 'Addis Diagnostic Center',
        'X-Internal-Exchange-Key': expected,
        'X-Resolved-Hospital-Patient-ID': registry.hospital_patient_id
      },
      body: JSON.stringify(bundle),
      cache: 'no-store'
    });

    const data = await readJsonSafe(response);
    const status = response.ok ? 'delivered' : 'rejected';
    await audit({ ...base, status, httpStatus: response.status, detail: data.message || status });

    // The Diagnostic Center receives only the exchange outcome. Protected
    // national identity data never leaves the Client Registry.
    return json({ status: data.status, message: data.message }, response.status);
  } catch (error) {
    await audit({ ...base, status: 'delivery_failed', httpStatus: 503, detail: String(error) });
    return json({ status: 'error', message: 'Hospital service could not be reached.' }, 503);
  }
}
