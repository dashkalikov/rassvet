import {getCurrentUser} from './session';
export async function publicUser(){
  const user=await getCurrentUser();
  return user?{name:user.name,email:user.email,avatar:user.avatar??'',role:user.role}:null;
}
