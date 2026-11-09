import {getDb} from '../../../../db';
import {authenticated,apiError,HttpError,readJson} from '../../../../lib/api';
import {createRecords} from '../../../../lib/records';
type Context={params:Promise<{id:string}>};
export async function GET(_request:Request,{params}:Context){
  try{const user=await authenticated(),{id}=await params;const order=await createRecords(getDb(),user.userId).getOrder(id);
    if(!order)throw new HttpError('Заявка не найдена',404);
    return Response.json({order},{headers:{'Cache-Control':'private, no-store'}});
  }catch(e){return apiError(e);}
}
export async function PATCH(request:Request,{params}:Context){
  try{const user=await authenticated(request),{id}=await params;const order=await createRecords(getDb(),user.userId).updateOrder(id,await readJson(request));
    if(!order)throw new HttpError('Заявка не найдена или уже отменена',404);
    return Response.json({order});
  }catch(e){return apiError(e);}
}
