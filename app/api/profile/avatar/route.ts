import {getDb} from '../../../../db';
import {authenticated,apiError} from '../../../../lib/api';
import {createAccountSettings} from '../../../../lib/account-settings';
import {readAvatar} from '../../../../lib/avatar';
const headers={'Cache-Control':'private, no-store'};
export async function PUT(request:Request) {
  try {
    const user=await authenticated(request),{bytes,mime}=await readAvatar(request);
    const profile=await createAccountSettings(getDb(),user.userId).saveAvatar(bytes,mime);
    return Response.json({profile},{headers});
  }catch(error){return apiError(error);}
}
export async function DELETE(request:Request) {
  try {
    const user=await authenticated(request);
    const profile=await createAccountSettings(getDb(),user.userId).removeAvatar();
    return Response.json({profile},{headers});
  }catch(error){return apiError(error);}
}
