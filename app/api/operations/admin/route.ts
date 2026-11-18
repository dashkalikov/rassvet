import {getDb} from '../../../../db';
import {authorized,apiError,assertSameOrigin,HttpError,readJson} from '../../../../lib/api';
import {changeAccess,changeSubscription,resetAccountPassword} from '../../../../lib/operations';

export async function PATCH(request:Request){
  try {
    assertSameOrigin(request);
    const input=await readJson(request);
    const user=await authorized(['admin']);
    if(typeof input.id!=='string'||!input.id||input.id.length>80)throw new HttpError('Некорректный ID записи.',400);
    if(input.action==='access')await changeAccess(getDb(),user.userId,input.id,input);
    else if(input.action==='password_reset')await resetAccountPassword(getDb(),user.userId,input.id,input);
    else if(input.action==='subscription')await changeSubscription(getDb(),user.userId,input.id,input.previous,input.status);
    else throw new HttpError('Неизвестное действие.',400);
    return Response.json({ok:true},{headers:{'Cache-Control':'no-store'}});
  }catch(error){return apiError(error);}
}
