export const RESULT_TYPES = {
  lvef: {
    key: 'lvef',
    name: 'Left ventricular ejection fraction',
    loinc: '10230-1',
    unit: '%'
  },
  hemoglobin: {
    key: 'hemoglobin',
    name: 'Hemoglobin',
    loinc: '718-7',
    unit: 'g/dL'
  },
  creatinine: {
    key: 'creatinine',
    name: 'Creatinine',
    loinc: '2160-0',
    unit: 'mg/dL'
  },
  glucose: {
    key: 'glucose',
    name: 'Glucose',
    loinc: '2345-7',
    unit: 'mg/dL'
  }
};

export const HOSPITAL_PATIENTS = {
  'DEMO-001': { name: 'Abebe Kebede', dateOfBirth: '1985-04-12' },
  'DEMO-002': { name: 'Hana Tesfaye', dateOfBirth: '1994-09-23' }
};

export function conceptByCode(code) {
  return Object.values(RESULT_TYPES).find((item) => item.loinc === code) ?? null;
}
