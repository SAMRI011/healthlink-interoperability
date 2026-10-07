import { RESULT_TYPES } from '@/lib/catalog'; import { buildBundle } from '@/lib/fhir'; import { json, originFrom, readJsonSafe } from '@/lib/http';
export const dynamic='force-dynamic'; export const maxDuration=60;
export async function POST(request){
  try{
    const body=await request.json();
    const externalPatientId=String(body.externalPatientId||'').trim();
    const resultType=String(body.resultType||'').trim();
    const performedDate=String(body.performedDate||'').trim();
    if(!externalPatientId) return json({status:'error',message:'External patient ID is required.'},400);
    if(!RESULT_TYPES[resultType]) return json({status:'error',message:'Unsupported result type.'},400);
    if(!/^\d{4}-\d{2}-\d{2}$/.test(performedDate)) return json({status:'error',message:'A valid performed date is required.'},400);
    const key=process.env.DIAGNOSTIC_API_KEY;
    if(!key) return json({status:'error',message:'Server is missing DIAGNOSTIC_API_KEY.'},500);
    const bundle=buildBundle({externalPatientId,resultType,value:body.value,conclusion:String(body.conclusion||''),performedDate,catalog:RESULT_TYPES});
    const response=await fetch(`${originFrom(request)}/api/exchange`,{method:'POST',headers:{'Content-Type':'application/fhir+json','X-API-Key':key},body:JSON.stringify(bundle),cache:'no-store'});
    const data=await readJsonSafe(response);
    return json(data,response.status);
  }catch(error){return json({status:'error',message:error?.message||'Diagnostic submission failed.'},500);}
}
