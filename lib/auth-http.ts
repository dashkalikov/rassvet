import { cookies } from 'next/headers';
import { getDb } from '../db';
import { createAuth } from './auth-core';
import { assertSameOrigin,readJson,apiError } from './api';
import { SESSION_COOKIE,sessionCookie } from './session';
import {readRole} from './operations-policy';
import {HttpError} from './request';
export async function authenticateRequest(request:Request,mode:'register'|'login') {
  try {
    assertSameOrigin(request);
    const auth=createAuth(getDb());const input=await readJson(request);
    const portal=input.portal===undefined?'customer':readRole(input.portal);
    if(!portal)throw new HttpError('Выберите тип входа',400);
    const result=mode==='register'?await auth.register(input):await auth.login(input,portal);
    return Response.json({user:result.user},{status:mode==='register'?201:200,headers:{'Set-Cookie':sessionCookie(result.token,request,result.expiresAt),'Cache-Control':'no-store'}});
  }catch(e){return apiError(e);}
}
export async function logoutRequest(request:Request) {
  try{
    assertSameOrigin(request);const token=(await cookies()).get(SESSION_COOKIE)?.value;
    if(token)await createAuth(getDb()).logout(token);
    return Response.json({ok:true},{headers:{'Set-Cookie':sessionCookie('',request,0),'Cache-Control':'no-store'}});
  }catch(e){return apiError(e);}
}
