import {getDb} from '../../../../../db';
import {authenticated,apiError,HttpError} from '../../../../../lib/api';
import {createRecords} from '../../../../../lib/records';
export async function POST(request:Request,{params}:{params:Promise<{id:string}>}){
 try{
  const user=await authenticated(request),{id}=await params;
  if(!id||id.length>80)throw new HttpError('Некорректный номер заявки',400);
  const order=await createRecords(getDb(),user.userId).activateOrder(id);
  if(!order)throw new HttpError('Заявка отсутствует или уже обработана. Обновите страницу.',409);
  return Response.json({order},{headers:{'Cache-Control':'no-store'}});
 }catch(error){return apiError(error);}
}
