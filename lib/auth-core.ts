import type { DrizzleD1Database } from 'drizzle-orm/d1';
import { and, eq, gt, sql } from 'drizzle-orm';
import * as schema from '../db/schema.ts';
import {assessPassword} from './password-policy.ts';
export class AuthError extends Error { status: number; constructor(message:string,status=400) { super(message); this.status=status; } }
const encoder=new TextEncoder();
const hex=(bytes:Uint8Array)=>Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');
const unhex=(value:string)=>Uint8Array.from(value.match(/../g)??[],v=>parseInt(v,16));
const random=(length:number)=>hex(crypto.getRandomValues(new Uint8Array(length)));
const digest=async(value:string)=>hex(new Uint8Array(await crypto.subtle.digest('SHA-256',encoder.encode(value))));
async function derive(password:string,salt:Uint8Array,iterations:number) {
  const key=await crypto.subtle.importKey('raw',encoder.encode(password),'PBKDF2',false,['deriveBits']);
  return hex(new Uint8Array(await crypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',salt:salt as BufferSource,iterations},key,256)));
}
export async function hashPassword(password:string):Promise<string> {
  const salt=random(16);return `pbkdf2-sha256$100000$${salt}$${await derive(password,unhex(salt),100000)}`;
}
export async function verifyPassword(password:string,stored:string):Promise<boolean> {
  const [algorithm,iterations,salt,expected]=stored.split('$');
  if(algorithm!=='pbkdf2-sha256'||iterations!=='100000'||!/^[a-f0-9]{32}$/.test(salt??'')||!/^[a-f0-9]{64}$/.test(expected??''))return false;
  const actual=await derive(password,unhex(salt),100000);let difference=0;
  for(let i=0;i<expected.length;i++)difference|=actual.charCodeAt(i)^expected.charCodeAt(i);
  return difference===0;
}
function credentials(input:unknown) {
  if(!input||typeof input!=='object'||Array.isArray(input))throw new AuthError('Проверьте данные формы');
  const data=input as Record<string,unknown>;
  const email=typeof data.email==='string'?data.email.trim().toLowerCase():'';
  if(email.length>254||!/^\S+@[^\s@]+\.[^\s@]+$/.test(email))throw new AuthError('Укажите корректную почту');
  const password=typeof data.password==='string'?data.password:'';
  if(password.length<10||password.length>128)throw new AuthError('Пароль должен содержать от 10 до 128 символов');
  return {data,email,password};
}
export type AppUser={userId:string;name:string;email:string;avatar?:string};
export function createAuth(db:DrizzleD1Database<typeof schema>) {
  const {accounts,sessions,authAttempts}=schema;
  async function session(user:AppUser,remember=false) {
    const token=random(32),expiresAt=Date.now()+(remember?30:1)*86400000;
    await db.insert(sessions).values({tokenHash:await digest(token),userId:user.userId,expiresAt});
    return {user,token,expiresAt};
  }
  async function noteAttempt(email:string) {
    const key=await digest(email),now=Date.now();const existing=await db.select().from(authAttempts).where(eq(authAttempts.key,key)).get();
    if(existing&&existing.expiresAt>now&&existing.count>=8)throw new AuthError('Слишком много попыток. Повторите через 15 минут.',429);
    await db.insert(authAttempts).values({key,count:1,expiresAt:now+900000}).onConflictDoUpdate({target:authAttempts.key,set:{count:sql`CASE WHEN ${authAttempts.expiresAt} <= ${now} THEN 1 ELSE ${authAttempts.count} + 1 END`,expiresAt:sql`CASE WHEN ${authAttempts.expiresAt} <= ${now} THEN ${now+900000} ELSE ${authAttempts.expiresAt} END`}});
    return key;
  }
  async function confirmPassword(userId:string,password:unknown) {
    const key=await noteAttempt(`settings:${userId}`);
    const account=await db.select().from(accounts).where(eq(accounts.id,userId)).get();
    if(typeof password!=='string'||password.length>128||!account||!await verifyPassword(password,account.passwordHash))throw new AuthError('Текущий пароль указан неверно',401);
    await db.delete(authAttempts).where(eq(authAttempts.key,key));
    return account;
  }
  return {
    confirmPassword,
    async changePassword(userId:string,input:unknown,currentToken:string) {
      if(!input||typeof input!=='object'||Array.isArray(input))throw new AuthError('Проверьте данные формы');
      const data=input as Record<string,unknown>;
      const password=typeof data.newPassword==='string'?data.newPassword:'';
      if(!assessPassword(password).valid)throw new AuthError('Новый пароль не соответствует требованиям');
      if(data.confirmPassword!==password)throw new AuthError('Пароли не совпадают');
      if(data.currentPassword===password)throw new AuthError('Новый пароль должен отличаться от текущего');
      const account=await confirmPassword(userId,data.currentPassword);
      const tokenHash=await digest(currentToken);
      const current=await db.select().from(sessions).where(and(eq(sessions.tokenHash,tokenHash),eq(sessions.userId,userId),gt(sessions.expiresAt,Date.now()))).get();
      if(!current)throw new AuthError('Войдите в аккаунт ещё раз',401);
      await db.batch([
        db.update(accounts).set({passwordHash:await hashPassword(password)}).where(eq(accounts.id,account.id)),
        db.delete(sessions).where(and(eq(sessions.userId,userId),sql`${sessions.tokenHash} <> ${tokenHash}`)),
      ]);
      return {ok:true};
    },
    async register(input:unknown) {
      const {data,email,password}=credentials(input);const name=typeof data.name==='string'?data.name.trim():'';
      const assessment=assessPassword(password);
      if(!assessment.valid)throw new AuthError('Пароль не соответствует требованиям: '+assessment.rules.filter(r=>!r.passed).map(r=>r.label.toLowerCase()).join('; '));
      if(name.length<2||name.length>80)throw new AuthError('Укажите имя: от 2 до 80 символов');
      if(data.confirmPassword!==undefined&&password!==data.confirmPassword)throw new AuthError('Пароли не совпадают');
      await noteAttempt(`register:${email}`);
      const user={userId:crypto.randomUUID(),name,email};
      const inserted=await db.insert(accounts).values({id:user.userId,name,email,passwordHash:await hashPassword(password),createdAt:new Date().toISOString()}).onConflictDoNothing({target:accounts.email}).returning({id:accounts.id});
      if(!inserted.length)throw new AuthError('Эта почта уже зарегистрирована. Войдите в аккаунт.',409);
      return session(user,data.remember===true);
    },
    async login(input:unknown) {
      const {data,email,password}=credentials(input);const key=await noteAttempt(email);
      const user=await db.select().from(accounts).where(eq(accounts.email,email)).get();
      // Unknown users also perform a KDF to avoid a cheap account-existence timing signal.
      const valid=await verifyPassword(password,user?.passwordHash??'pbkdf2-sha256$100000$00000000000000000000000000000000$0000000000000000000000000000000000000000000000000000000000000000');
      if(!user||!valid)throw new AuthError('Неверная почта или пароль',401);
      await db.delete(authAttempts).where(eq(authAttempts.key,key));
      return session({userId:user.id,name:user.name,email:user.email},data.remember===true);
    },
    async resolve(token:string,now=Date.now()):Promise<AppUser|null> {
      if(!/^[a-f0-9]{64}$/.test(token))return null;
      const user=await db.select({userId:accounts.id,name:sql<string>`coalesce(${schema.profiles.name}, ${accounts.name})`,email:accounts.email,avatar:sql<string>`coalesce(${schema.profiles.avatar}, '')`}).from(sessions).innerJoin(accounts,eq(sessions.userId,accounts.id)).leftJoin(schema.profiles,eq(schema.profiles.userId,accounts.id)).where(and(eq(sessions.tokenHash,await digest(token)),gt(sessions.expiresAt,now))).get();
      return user??null;
    },
    async logout(token:string) {if(token)await db.delete(sessions).where(eq(sessions.tokenHash,await digest(token)));},
  };
}
