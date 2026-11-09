import type { DrizzleD1Database } from 'drizzle-orm/d1';
import { and, desc, eq } from 'drizzle-orm';
import * as schema from '../db/schema.ts';
import { buildOrder, validateProfile, validateTicket } from './domain.ts';
import {readEquipment} from './equipment.ts';
export function createRecords(db: DrizzleD1Database<typeof schema>, userId: string) {
  if (!userId) throw new Error('Требуется авторизация');
  const { orders, profiles, tickets } = schema;
  return {
    async getOrder(id:string){return db.select().from(orders).where(and(eq(orders.id,id),eq(orders.userId,userId))).get();},
    async updateOrder(id:string,input:unknown){
      const existing=await db.select().from(orders).where(and(eq(orders.id,id),eq(orders.userId,userId),eq(orders.status,'new'))).get();
      if(!existing)return null;
      let data=input;
      if(input&&typeof input==='object'&&!Array.isArray(input)&&!('equipment' in input)&&existing.equipmentConfig){const saved=readEquipment(existing.equipmentConfig);if(saved)data={...input,equipment:saved};}
      const values=buildOrder(data);
      const result=await db.update(orders).set({...values,equipmentConfig:values.equipmentConfig??null}).where(and(eq(orders.id,id),eq(orders.userId,userId),eq(orders.status,'new'))).returning();
      return result[0]??null;
    },
    async addOrder(input: unknown) {
      const order = { ...buildOrder(input), id: crypto.randomUUID(), userId, status: 'new', createdAt: new Date().toISOString() };
      await db.insert(orders).values(order); return order;
    },
    async getOrders() { return db.select().from(orders).where(eq(orders.userId,userId)).orderBy(desc(orders.createdAt)).limit(100); },
    async cancelOrder(id: string) {
      const result = await db.update(orders).set({status:'cancelled'}).where(and(eq(orders.id,id),eq(orders.userId,userId),eq(orders.status,'new'))).returning({id:orders.id});
      return result.length > 0;
    },
    async saveProfile(input: unknown) {
      const profile = validateProfile(input); const updatedAt = new Date().toISOString();
      await db.insert(profiles).values({userId,...profile,updatedAt}).onConflictDoUpdate({target:profiles.userId,set:{...profile,updatedAt}});
      return profile;
    },
    async getProfile() { return db.select().from(profiles).where(eq(profiles.userId,userId)).get(); },
    async addTicket(input: unknown) {
      const ticket = {...validateTicket(input),id:crypto.randomUUID(),userId,createdAt:new Date().toISOString()};
      await db.insert(tickets).values(ticket); return ticket;
    },
    async getTickets() { return db.select().from(tickets).where(eq(tickets.userId,userId)).orderBy(desc(tickets.createdAt)).limit(100); },
  };
}
