export function buildBundle({ externalPatientId, resultType, value, conclusion, performedDate, catalog }) {
  const definition = catalog[resultType];
  if (!definition) throw new Error('Unsupported result type.');
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) throw new Error('Result value must be numeric.');
  const bundleId = crypto.randomUUID();
  const observationId = crypto.randomUUID();
  const reportId = crypto.randomUUID();
  const issued = new Date().toISOString();

  return {
    resourceType: 'Bundle',
    id: bundleId,
    type: 'collection',
    timestamp: issued,
    entry: [
      {
        fullUrl: `urn:uuid:${reportId}`,
        resource: {
          resourceType: 'DiagnosticReport',
          id: reportId,
          status: 'final',
          code: { text: `${definition.name} report` },
          subject: {
            identifier: {
              system: 'urn:healthlink:addis-diagnostic-center:patient-id',
              value: externalPatientId
            }
          },
          effectiveDateTime: `${performedDate}T12:00:00Z`,
          issued,
          result: [{ reference: `urn:uuid:${observationId}` }],
          conclusion: conclusion || ''
        }
      },
      {
        fullUrl: `urn:uuid:${observationId}`,
        resource: {
          resourceType: 'Observation',
          id: observationId,
          status: 'final',
          code: {
            coding: [{ system: 'http://loinc.org', code: definition.loinc, display: definition.name }],
            text: definition.name
          },
          subject: {
            identifier: {
              system: 'urn:healthlink:addis-diagnostic-center:patient-id',
              value: externalPatientId
            }
          },
          effectiveDateTime: `${performedDate}T12:00:00Z`,
          valueQuantity: {
            value: numericValue,
            unit: definition.unit,
            system: 'http://unitsofmeasure.org',
            code: definition.unit
          }
        }
      }
    ]
  };
}

export function parseBundle(bundle) {
  if (!bundle || bundle.resourceType !== 'Bundle') {
    return { ok: false, status: 400, message: 'Expected a FHIR-style Bundle.' };
  }
  if (!Array.isArray(bundle.entry)) {
    return { ok: false, status: 400, message: 'Bundle entries are missing.' };
  }
  const resources = bundle.entry.map((entry) => entry?.resource).filter(Boolean);
  const report = resources.find((r) => r.resourceType === 'DiagnosticReport');
  const observation = resources.find((r) => r.resourceType === 'Observation');
  if (!report) return { ok: false, status: 400, message: 'DiagnosticReport not found.' };
  if (!observation) return { ok: false, status: 400, message: 'Observation not found.' };

  const externalPatientId = report?.subject?.identifier?.value;
  const coding = observation?.code?.coding?.[0];
  const quantity = observation?.valueQuantity;
  if (!externalPatientId) return { ok: false, status: 400, message: 'Patient identifier missing.' };
  if (!coding?.code || !coding?.system) return { ok: false, status: 400, message: 'Observation coding missing.' };
  if (!quantity || !Number.isFinite(Number(quantity.value))) return { ok: false, status: 400, message: 'Observation value missing or invalid.' };
  if (!quantity.unit || !quantity.system) return { ok: false, status: 400, message: 'Observation unit missing.' };

  return {
    ok: true,
    report,
    observation,
    externalPatientId,
    loincSystem: coding.system,
    loincCode: coding.code,
    observationName: coding.display || observation?.code?.text || coding.code,
    value: Number(quantity.value),
    unit: quantity.unit,
    unitSystem: quantity.system,
    performedDate: String(observation.effectiveDateTime || report.effectiveDateTime || '').slice(0, 10),
    conclusion: report.conclusion || '',
    bundleId: bundle.id || null
  };
}
