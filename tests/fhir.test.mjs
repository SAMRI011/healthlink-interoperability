import test from 'node:test';
import assert from 'node:assert/strict';
import { buildBundle, parseBundle } from '../lib/fhir.js';
import { RESULT_TYPES, conceptByCode } from '../lib/catalog.js';
import { resolvePatientIdentity, registryOverview } from '../lib/identity-registry.js';

test('builds and parses a hemoglobin FHIR-style bundle',()=>{
  const b=buildBundle({externalPatientId:'DC-8472',resultType:'hemoglobin',value:'13.5',conclusion:'ok',performedDate:'2026-10-07',catalog:RESULT_TYPES});
  assert.equal(b.resourceType,'Bundle');
  const p=parseBundle(b);
  assert.equal(p.ok,true);
  assert.equal(p.externalPatientId,'DC-8472');
  assert.equal(p.loincCode,'718-7');
  assert.equal(p.value,13.5);
  assert.equal(p.unit,'g/dL');
});

test('rejects malformed bundle',()=>{assert.equal(parseBundle({resourceType:'Patient'}).ok,false)});
test('terminology catalogue contains four concepts',()=>{assert.equal(Object.keys(RESULT_TYPES).length,4);assert.equal(conceptByCode('2160-0').unit,'mg/dL')});

test('client registry resolves diagnostic identity through protected national identity anchor',()=>{
  const match=resolvePatientIdentity('DC-8472');
  assert.equal(match.diagnosticPatientId,'DC-8472');
  assert.equal(match.hospitalPatientId,'DEMO-001');
  assert.equal(match.matchMethod,'protected-national-identity-anchor');
  assert.equal('syntheticFaydaId' in match,false);
});

test('client registry does not expose synthetic Fayda values in its display model',()=>{
  const rows=registryOverview();
  assert.equal(rows[0].identityAnchor,'Synthetic Fayda (protected)');
  assert.equal(Object.values(rows[0]).some(v=>String(v).startsWith('FAYDA-DEMO-')),false);
});

test('unknown diagnostic identity is unmatched',()=>{assert.equal(resolvePatientIdentity('DC-UNKNOWN'),null)});
