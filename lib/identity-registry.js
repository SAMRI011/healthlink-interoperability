// Synthetic identity data used only inside the Client Registry.
// The national identity anchor is deliberately never returned to the
// Diagnostic Center or Hospital EMR.
const DIAGNOSTIC_TO_NATIONAL_ID = {
  'DC-8472': 'FAYDA-DEMO-0001',
  'DC-3915': 'FAYDA-DEMO-0002'
};

const NATIONAL_ID_TO_HOSPITAL = {
  'FAYDA-DEMO-0001': 'DEMO-001',
  'FAYDA-DEMO-0002': 'DEMO-002'
};

const DISPLAY_NAMES = {
  'DC-8472': 'Abebe Kebede',
  'DC-3915': 'Hana Tesfaye'
};

export function resolvePatientIdentity(diagnosticPatientId) {
  const nationalIdentity = DIAGNOSTIC_TO_NATIONAL_ID[diagnosticPatientId];
  if (!nationalIdentity) return null;

  const hospitalPatientId = NATIONAL_ID_TO_HOSPITAL[nationalIdentity];
  if (!hospitalPatientId) return null;

  // Privacy boundary: do not return the national identity value.
  return {
    diagnosticPatientId,
    hospitalPatientId,
    name: DISPLAY_NAMES[diagnosticPatientId] || 'Matched patient',
    matchMethod: 'protected-national-identity-anchor'
  };
}

export function registryOverview() {
  return Object.keys(DIAGNOSTIC_TO_NATIONAL_ID).map((diagnosticPatientId) => {
    const match = resolvePatientIdentity(diagnosticPatientId);
    return {
      diagnosticPatientId,
      hospitalPatientId: match.hospitalPatientId,
      name: match.name,
      identityAnchor: 'Synthetic Fayda (protected)',
      status: 'Matched'
    };
  });
}
