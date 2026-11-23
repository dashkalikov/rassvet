import {readRole,type Role} from './operations-policy';

export const LAST_LOGIN_KEY='rassvet-last-login-v1';
export type LastLogin={email:string;portal:Role;remember:boolean};
type LoginStorage=Pick<Storage,'getItem'|'setItem'|'removeItem'>;
function normalize(value:unknown):LastLogin|null {
 if(!value||typeof value!=='object')return null;
 const input=value as Record<string,unknown>,portal=readRole(input.portal);
 const email=typeof input.email==='string'?input.email.trim().toLowerCase():'';
 if(!portal||email.length>254||!/^\S+@\S+\.\S+$/.test(email))return null;
 return {email,portal,remember:input.remember===true};
}
export function readLastLogin(storage?:LoginStorage):LastLogin|null {
 try{return normalize(JSON.parse((storage??globalThis.localStorage).getItem(LAST_LOGIN_KEY)??'null'));}catch{return null;}
}
export function rememberLastLogin(value:LastLogin,storage?:LoginStorage) {
 const hint=normalize(value);if(!hint)return;
 // Explicitly whitelist non-secret fields; never serialize a credential object.
 try{(storage??globalThis.localStorage).setItem(LAST_LOGIN_KEY,JSON.stringify(hint));}catch{}
}
export function forgetLastLogin(storage?:LoginStorage) {
 try{(storage??globalThis.localStorage).removeItem(LAST_LOGIN_KEY);}catch{}
}
