import { json, originFrom, readJsonSafe } from '@/lib/http';
import { logExchange } from '@/lib/db';

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
  if (bundle?.resourceType !== 'Bundle' || !Array.isArray(bundle?.entry)) {
    await audit({ ...base, status: 'validation_failed', httpStatus: 400, detail: 'Expected a Bundle with entries.' });
    return json({ status: 'validation_failed', message: 'Expected a FHIR-style Bundle with entries.' }, 400);
  }

  try {
    const hospitalBase = cleanBaseUrl(process.env.HOSPITAL_BASE_URL) || originFrom(request);
    const response = await fetch(`${hospitalBase}/api/hospital/results`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/fhir+json',
        'X-Authenticated-Source': 'Addis Diagnostic Center',
        'X-Internal-Exchange-Key': expected
      },
      body: JSON.stringify(bundle),
      cache: 'no-store'
    });

    const data = await readJsonSafe(response);
    const status = response.ok ? 'delivered' : 'rejected';
    await audit({ ...base, status, httpStatus: response.status, detail: data.message || status });
    return json(data, response.status);
  } catch (error) {
    await audit({ ...base, status: 'delivery_failed', httpStatus: 503, detail: String(error) });
    return json({ status: 'error', message: 'Hospital service could not be reached.' }, 503);
  }
}