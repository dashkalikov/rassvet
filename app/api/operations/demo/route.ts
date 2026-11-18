import {getDb} from '../../../../db';
import {authorized,apiError} from '../../../../lib/api';
import {seedDemoAccounts} from '../../../../lib/demo-operations';
export async function POST(request:Request){
 try{
  await authorized(['admin','engineer'],request);
  return Response.json(await seedDemoAccounts(getDb()),{headers:{'Cache-Control':'no-store'}});
 }catch(error){return apiError(error);}
}
