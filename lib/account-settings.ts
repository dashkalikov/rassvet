import type {DrizzleD1Database} from 'drizzle-orm/d1';
import {desc,eq} from 'drizzle-orm';
import * as schema from '../db/schema.ts';
import {createAuth,AuthError} from './auth-core.ts';
import {validateProfile} from './domain.ts';
import {avatarData} from './avatar.ts';

export function createAccountSettings(db:DrizzleD1Database<typeof schema>,userId:string) {
  if(!userId)throw new AuthError('Войдите в аккаунт',401);
  const {accounts,profiles,orders,tickets}=schema,auth=createAuth(db);
  async function getProfile() {
    const account=await db.select({name:accounts.name,email:accounts.email,createdAt:accounts.createdAt}).from(accounts).where(eq(accounts.id,userId)).get();
    if(!account)throw new AuthError('Аккаунт не найден. Войдите ещё раз.',401);
    const profile=await db.select().from(profiles).where(eq(profiles.userId,userId)).get();
    return {name:profile?.name??account.name,email:account.email,phone:profile?.phone??'',avatar:profile?.avatar??'',createdAt:account.createdAt};
  }
  return {
    getProfile,
    async saveProfile(input:unknown) {
      const contact=validateProfile(input),data=input as Record<string,unknown>,current=await getProfile();
      const email=data.email===undefined?current.email:typeof data.email==='string'?data.email.trim().toLowerCase():'';
      if(email.length>254||!/^\S+@[^\s@]+\.[^\s@]+$/.test(email))throw new AuthError('Укажите корректную почту');
      if(email!==current.email) {
        await auth.confirmPassword(userId,data.currentPassword);
        const duplicate=await db.select({id:accounts.id}).from(accounts).where(eq(accounts.email,email)).get();
        if(duplicate&&duplicate.id!==userId)throw new AuthError('Эта почта уже используется другим аккаунтом',409);
      }
      const updatedAt=new Date().toISOString();
      try {
        await db.batch([
          db.update(accounts).set({name:contact.name,email}).where(eq(accounts.id,userId)),
          db.insert(profiles).values({userId,...contact,updatedAt}).onConflictDoUpdate({target:profiles.userId,set:{...contact,updatedAt}}),
        ]);
      } catch(error) {
        const message=error instanceof Error?error.message+' '+String(error.cause??''):'';
        if(/UNIQUE constraint failed: accounts.email/i.test(message))throw new AuthError('Эта почта уже используется другим аккаунтом',409);
        throw error;
      }
      return getProfile();
    },
    async saveAvatar(bytes:Uint8Array,mime:string) {
      const avatar=avatarData(bytes,mime),current=await getProfile(),updatedAt=new Date().toISOString();
      await db.insert(profiles).values({userId,name:current.name,phone:current.phone,avatar,updatedAt}).onConflictDoUpdate({target:profiles.userId,set:{avatar,updatedAt}});
      return getProfile();
    },
    async removeAvatar() {
      await getProfile();
      await db.update(profiles).set({avatar:'',updatedAt:new Date().toISOString()}).where(eq(profiles.userId,userId));
      return getProfile();
    },
    changePassword:(input:unknown,currentToken:string)=>auth.changePassword(userId,input,currentToken),
    async exportData() {
      const profile=await getProfile();
      const [ownOrders,ownTickets]=await Promise.all([
        db.select().from(orders).where(eq(orders.userId,userId)).orderBy(desc(orders.createdAt)),
        db.select().from(tickets).where(eq(tickets.userId,userId)).orderBy(desc(tickets.createdAt)),
      ]);
      return {service:'РАССВЕТ',exportedAt:new Date().toISOString(),profile,orders:ownOrders,tickets:ownTickets};
    },
  };
}
