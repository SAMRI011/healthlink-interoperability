import { resolvePatientIdentity } from '@/lib/identity-registry';
import { json } from '@/lib/http';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  const provided = request.headers.get('x-internal-exchange-key') || '';
  const expected = process.env.DIAGNOSTIC_API_KEY || '';
  if (!expected || !provided || provided !== expected) {
    return json({ status: 'error', message: 'Client Registry accepts authenticated internal requests only.' }, 401);
  }

  const { id } = await params;
  const match = resolvePatientIdentity(id);
  if (!match) return json({ status: 'unmatched', message: 'No patient match found.' }, 404);

  // The synthetic Fayda value is intentionally not included in this response.
  return json({
    status: 'matched',
    diagnostic_patient_id: match.diagnosticPatientId,
    hospital_patient_id: match.hospitalPatientId,
    match_method: match.matchMethod
  });
}
