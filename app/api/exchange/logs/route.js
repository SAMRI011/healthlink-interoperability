import { listExchangeLogs } from '@/lib/db'; import { json } from '@/lib/http';
export const dynamic='force-dynamic';
export async function GET(){try{return json({logs:await listExchangeLogs()})}catch(e){return json({status:'error',message:e.message},503)}}
