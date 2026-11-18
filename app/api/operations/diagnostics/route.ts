import {sql} from 'drizzle-orm';
import {getDb} from '../../../../db';
import {authorized,apiError} from '../../../../lib/api';
import {loadOperationalElements} from '../../../../lib/operations-orbits';
export async function GET(){
 try{
  await authorized(['admin','engineer']);
  const db=getDb(),started=performance.now();
  await db.get(sql`SELECT 1`);
  const milliseconds=Math.round(performance.now()-started),catalog=await loadOperationalElements(db),now=Date.now();
  return Response.json({database:true,milliseconds,satellites:catalog.length,stale:catalog.filter(row=>Math.abs(now-Date.parse(row.satellite.epoch))>7*86_400_000).length,asOf:new Date(now).toISOString()},{headers:{'Cache-Control':'no-store'}});
 }catch(error){return apiError(error);}
}
