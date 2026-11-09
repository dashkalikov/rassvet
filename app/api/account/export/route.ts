import {getDb} from '../../../../db';
import {authenticated,apiError} from '../../../../lib/api';
import {createAccountSettings} from '../../../../lib/account-settings';
export async function GET() {
  try {
    const user=await authenticated();
    const data=await createAccountSettings(getDb(),user.userId).exportData();
    return Response.json(data,{headers:{'Cache-Control':'private, no-store','Content-Disposition':'attachment; filename="rassvet-account.json"','X-Content-Type-Options':'nosniff'}});
  }catch(error){return apiError(error);}
}
