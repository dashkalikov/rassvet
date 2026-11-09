export const SESSION_COOKIE='rassvet_session';
export function sessionCookie(token:string,request:Request,expiresAt:number){
  const secure=new URL(request.url).protocol==='https:'?'; Secure':'';
  return `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${Math.max(0,Math.floor((expiresAt-Date.now())/1000))}${secure}`;
}
