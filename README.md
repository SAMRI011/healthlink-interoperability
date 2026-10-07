# HealthLink — Next.js Digital Health Interoperability Prototype

A synthetic, full-stack learning prototype that demonstrates diagnostic-result interoperability between a sending diagnostic center and a receiving hospital system.

**No real patient data. Not a production FHIR implementation. Not affiliated with or deployed at any real healthcare facility.**

## What is real in this prototype

The application performs actual backend HTTP/API calls. A diagnostic submission creates a FHIR-style `Bundle` containing `DiagnosticReport` and `Observation`, sends it to an authenticated exchange endpoint, routes it to the hospital endpoint, resolves the external patient identifier through a registry endpoint, validates LOINC/UCUM through a terminology endpoint, and persists accepted results plus exchange audit logs in PostgreSQL.

It supports four synthetic observations:

| Result | LOINC | UCUM unit |
| --- | --- | --- |
| Left ventricular ejection fraction | `10230-1` | `%` |
| Hemoglobin | `718-7` | `g/dL` |
| Creatinine | `2160-0` | `mg/dL` |
| Glucose | `2345-7` | `mg/dL` |

Synthetic patient mappings:

- `DC-8472` → `DEMO-001` (Abebe Kebede)
- `DC-3915` → `DEMO-002` (Hana Tesfaye)

## Architecture

One Next.js deployment exposes five logical components as separate pages and API boundaries:

```text
Diagnostic UI
    |
    | POST /api/diagnostic/send
    v
Interoperability API -----> PostgreSQL audit log
    |  POST /api/exchange
    v
Hospital API -------------> PostgreSQL accepted results
    |\
    | \----> Client Registry API
    |
    \------> Terminology API
```

The server-side diagnostic endpoint adds the API key; the browser never receives it. The interoperability endpoint authenticates the sender. The hospital endpoint accepts only requests marked as coming from the authenticated exchange path.

## Local setup

Requirements: Node.js 20.9+ and a PostgreSQL database (Neon works well).

```bash
npm install
cp .env.example .env.local
```

Set `DIAGNOSTIC_API_KEY` and `DATABASE_URL` in `.env.local`, then:

```bash
npm test
npm run dev
```

Open `http://localhost:3000/diagnostic`.

The database tables are created automatically on first use.

## Deploy to Vercel

1. Push this folder to a GitHub repository.
2. Import the repository into Vercel as a Next.js project.
3. In Vercel Marketplace, add a Neon Postgres database to the project. Confirm the integration provides `DATABASE_URL` (or manually add the Neon connection string as `DATABASE_URL`).
4. Add `DIAGNOSTIC_API_KEY` in **Project → Settings → Environment Variables**. Use a long random value; do not prefix it with `NEXT_PUBLIC_`.
5. Redeploy.
6. Open `/diagnostic`, send `DC-8472` + Hemoglobin `13.5`, then verify `/hospital` and `/exchange`.

### Generate a secret locally

PowerShell:

```powershell
-join ((48..57)+(65..90)+(97..122) | Get-Random -Count 48 | ForEach-Object {[char]$_})
```

## Expected failure behavior

- Missing/wrong exchange API key → `401`
- Unknown external patient ID → `404`
- Unsupported LOINC/unit → `422`
- Database unavailable/misconfigured → `503`
- Valid authenticated, matched, terminology-valid result → `201`

## Why this is different from the original Flask/Render version

The five logical services are preserved as API boundaries, but they live in one full-stack Next.js/Vercel project. This avoids maintaining five independently sleeping demo servers. SQLite was replaced by external PostgreSQL because serverless deployments should not rely on local filesystem state.

## Limitations

This is an educational proof of concept. The patient registry and terminology catalogue are intentionally tiny and deterministic. Authentication is simplified. It does not implement full FHIR conformance, OAuth/OIDC, consent, RBAC, production MPI/terminology infrastructure, queues, retries, high availability, clinical governance, or real healthcare-system integration.
