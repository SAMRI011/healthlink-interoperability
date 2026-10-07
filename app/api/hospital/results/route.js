import { HOSPITAL_PATIENTS } from '@/lib/catalog';
import { parseBundle } from '@/lib/fhir';
import { json, originFrom, readJsonSafe } from '@/lib/http';
import { listResults, saveResult } from '@/lib/db';

export const dynamic='force-dynamic';
export const maxDuration=60;

export async function GET(){
  try{return json({results:await listResults()})}
  catch(e){return json({status:'error',message:e.message},503)}
}

export async function POST(request){
  const source=request.headers.get('x-authenticated-source');
  const internalKey=request.headers.get('x-internal-exchange-key')||'';
  const expected=process.env.DIAGNOSTIC_API_KEY||'';
  const hospitalPatientId=request.headers.get('x-resolved-hospital-patient-id')||'';

  if(!expected||source!=='Addis Diagnostic Center'||internalKey!==expected){
    return json({status:'error',message:'Hospital accepts results only from the authenticated interoperability layer.'},401);
  }

  if(!hospitalPatientId){
    return json({status:'error',message:'Hospital requires a patient identity resolved by the Client Registry.'},400);
  }

  let bundle;
  try{bundle=await request.json()}
  catch{return json({status:'error',message:'Request body must be JSON.'},400)}

  const parsed=parseBundle(bundle);
  if(!parsed.ok)return json({status:'error',message:parsed.message},parsed.status);

  const patient=HOSPITAL_PATIENTS[hospitalPatientId];
  if(!patient)return json({status:'error',message:'Resolved patient does not exist in Hospital EMR.'},409);

  const origin=originFrom(request);
  let termResponse;
  try{
    termResponse=await fetch(`${origin}/api/terminology/validate`,{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({system:parsed.loincSystem,code:parsed.loincCode,unitSystem:parsed.unitSystem,unit:parsed.unit}),
      cache:'no-store'
    });
  }catch{return json({status:'error',message:'Terminology Service could not be reached.'},503)}

  const term=await readJsonSafe(termResponse);
  if(!termResponse.ok)return json({status:'rejected',message:term.message||'Terminology validation failed.'},termResponse.status===422?422:503);

  try{
    const saved=await saveResult({
      bundleId:parsed.bundleId,
      externalPatientId:parsed.externalPatientId,
      hospitalPatientId,
      patientName:patient.name,
      observationName:term.display||parsed.observationName,
      loincCode:parsed.loincCode,
      value:parsed.value,
      unit:parsed.unit,
      performedDate:parsed.performedDate,
      conclusion:parsed.conclusion,
      sourceSystem:source
    });
    return json({status:'accepted',message:'Diagnostic result accepted and stored by Hospital EMR.',resultId:saved.id},201);
  }catch(e){return json({status:'error',message:`Database storage failed: ${e.message}`},503)}
}
