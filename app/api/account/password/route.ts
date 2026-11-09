import {cookies} from 'next/headers';
import {getDb} from '../../../../db';
import {authenticated,apiError,readJson} from '../../../../lib/api';
import {SESSION_COOKIE} from '../../../../lib/cookies';
import {createAccountSettings} from '../../../../lib/account-settings';
export async function POST(request:Request) {
  try {
    const user=await authenticated(request),token=(await cookies()).get(SESSION_COOKIE)?.value??'';
    await createAccountSettings(getDb(),user.userId).changePassword(await readJson(request),token);
    return Response.json({ok:true},{headers:{'Cache-Control':'private, no-store'}});
  }catch(error){return apiError(error);}
}
