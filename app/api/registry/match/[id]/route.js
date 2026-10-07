import { PATIENT_LINKS } from '@/lib/catalog'; import { json } from '@/lib/http';
export const dynamic='force-dynamic';
export async function GET(_request,{params}){const {id}=await params;const match=PATIENT_LINKS[id];if(!match)return json({status:'unmatched',message:'No patient match found.'},404);return json({external_patient_id:id,hospital_patient_id:match.hospitalPatientId,name:match.name});}
