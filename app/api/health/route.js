import { hasDatabase } from '@/lib/db'; import { json } from '@/lib/http';
export const dynamic = 'force-dynamic';
export async function GET(){return json({status:'online',database:hasDatabase()?'configured':'not configured',timestamp:new Date().toISOString()});}
