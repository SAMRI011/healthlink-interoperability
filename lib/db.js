import { neon } from '@neondatabase/serverless';

function databaseUrl() {
  return process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.NEON_DATABASE_URL || '';
}

export function hasDatabase() {
  return Boolean(databaseUrl());
}

function sqlClient() {
  const url = databaseUrl();
  if (!url) throw new Error('DATABASE_URL is not configured. Connect a Neon/Postgres database to this Vercel project.');
  return neon(url);
}

let schemaPromise;
export async function ensureSchema() {
  if (!schemaPromise) {
    schemaPromise = (async () => {
      const sql = sqlClient();
      await sql`CREATE TABLE IF NOT EXISTS diagnostic_results (
        id BIGSERIAL PRIMARY KEY,
        bundle_id TEXT UNIQUE,
        external_patient_id TEXT NOT NULL,
        hospital_patient_id TEXT NOT NULL,
        patient_name TEXT NOT NULL,
        observation_name TEXT NOT NULL,
        loinc_code TEXT NOT NULL,
        value DOUBLE PRECISION NOT NULL,
        unit TEXT NOT NULL,
        performed_date TEXT,
        conclusion TEXT,
        source_system TEXT NOT NULL,
        received_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`;
      await sql`CREATE TABLE IF NOT EXISTS exchange_logs (
        id BIGSERIAL PRIMARY KEY,
        source_system TEXT NOT NULL,
        destination TEXT NOT NULL,
        resource_type TEXT,
        status TEXT NOT NULL,
        http_status INTEGER NOT NULL,
        bundle_id TEXT,
        detail TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`;
    })().catch((error) => { schemaPromise = undefined; throw error; });
  }
  return schemaPromise;
}

export async function saveResult(result) {
  await ensureSchema();
  const sql = sqlClient();
  const rows = await sql`
    INSERT INTO diagnostic_results (
      bundle_id, external_patient_id, hospital_patient_id, patient_name,
      observation_name, loinc_code, value, unit, performed_date,
      conclusion, source_system
    ) VALUES (
      ${result.bundleId}, ${result.externalPatientId}, ${result.hospitalPatientId}, ${result.patientName},
      ${result.observationName}, ${result.loincCode}, ${result.value}, ${result.unit}, ${result.performedDate},
      ${result.conclusion}, ${result.sourceSystem}
    )
    ON CONFLICT (bundle_id) DO UPDATE SET bundle_id = EXCLUDED.bundle_id
    RETURNING id, received_at
  `;
  return rows[0];
}

export async function listResults() {
  await ensureSchema();
  const sql = sqlClient();
  return sql`SELECT id, bundle_id, external_patient_id, hospital_patient_id, patient_name,
    observation_name, loinc_code, value, unit, performed_date, conclusion, source_system, received_at
    FROM diagnostic_results ORDER BY received_at DESC LIMIT 100`;
}

export async function logExchange(log) {
  await ensureSchema();
  const sql = sqlClient();
  await sql`INSERT INTO exchange_logs
    (source_system, destination, resource_type, status, http_status, bundle_id, detail)
    VALUES (${log.sourceSystem}, ${log.destination}, ${log.resourceType}, ${log.status},
      ${log.httpStatus}, ${log.bundleId}, ${log.detail})`;
}

export async function listExchangeLogs() {
  await ensureSchema();
  const sql = sqlClient();
  return sql`SELECT id, source_system, destination, resource_type, status, http_status, bundle_id, detail, created_at
    FROM exchange_logs ORDER BY created_at DESC LIMIT 100`;
}
