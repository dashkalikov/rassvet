import {sql} from 'drizzle-orm';
import type {DrizzleD1Database} from 'drizzle-orm/d1';
import * as schema from '../db/schema.ts';
import {hashPassword} from './auth-core.ts';
import {PLANS} from './domain.ts';
import {DEMO_PASSWORD} from './demo-credentials.ts';
export {DEMO_PASSWORD} from './demo-credentials.ts';
const names=['Анна Смирнова','Михаил Волков','Екатерина Соколова','Дмитрий Кузнецов','Мария Попова','Александр Морозов','Елена Петрова','Сергей Орлов','Ольга Васильева','Андрей Новиков','Наталья Фёдорова','Иван Павлов','Татьяна Козлова','Артём Семёнов','Юлия Лебедева','Алексей Егоров','Виктория Макарова','Николай Андреев','Софья Никитина','Павел Захаров','Дарья Романова','Максим Иванов','Ксения Белова','Роман Алексеев'];
const cities=['Москва','Казань','Владивосток','Якутск','Красноярск','Калининград','Самара','Пермь'];

/** Explicitly seeded local demo identities. Never overwrites passwords, roles or existing orders. */
export async function seedDemoAccounts(db:DrizzleD1Database<typeof schema>,now=new Date()){
 const passwordHash=await hashPassword(DEMO_PASSWORD);
 const date=(days:number)=>new Date(now.getTime()-days*86_400_000).toISOString();
 const queries=[];
 for(const [index,name] of [...names,'Алексей Соколов'].entries()){
  const engineer=index===names.length,id='demo-rassvet-'+String(index+1).padStart(3,'0');
  const email=engineer?'engineer.demo@example.test':index===0?'anna.demo@example.test':'user'+(index+1)+'.demo@example.test';
  queries.push(db.insert(schema.accounts).values({id,email,name,passwordHash,createdAt:date(29-index)}).onConflictDoNothing());
  if(engineer){
   queries.push(db.insert(schema.accountAccess).select(sql`SELECT ${id},'engineer',0,NULL FROM accounts WHERE id=${id} AND email=${email}`).onConflictDoNothing());
   continue;
  }
  const plan=PLANS[index%3],orderId='demo-order-'+String(index+1).padStart(3,'0');
  const status=['active','active','paused','new','cancelled','active'][index%6];
  queries.push(db.insert(schema.orders).select(sql`SELECT ${orderId},${id},${plan.id},'monthly',${cities[index%cities.length]+', Учебная улица, '+(index+1)},${plan.price},${plan.equipment},${plan.price+plan.equipment},${status},${date(28-index)},NULL
   FROM accounts WHERE id=${id} AND email=${email}`).onConflictDoNothing());
  if(status!=='new')queries.push(db.insert(schema.subscriptionEvents).select(sql`SELECT NULL,${orderId},${plan.id},NULL,'new',${date(29-index)} WHERE EXISTS(SELECT 1 FROM orders WHERE id=${orderId}) AND NOT EXISTS(SELECT 1 FROM subscription_events WHERE order_id=${orderId} AND status='new')`));
  if(status==='paused')queries.push(db.insert(schema.subscriptionEvents).select(sql`SELECT NULL,${orderId},${plan.id},'new','active',${date(28.5-index)} WHERE EXISTS(SELECT 1 FROM orders WHERE id=${orderId}) AND NOT EXISTS(SELECT 1 FROM subscription_events WHERE order_id=${orderId} AND status='active')`));
  if(status!=='new')queries.push(db.update(schema.subscriptionEvents).set({previous:status==='paused'?'active':'new'}).where(sql`order_id=${orderId} AND status=${status} AND previous IS NULL`));
 }
 if(queries.length)await db.batch([queries[0],...queries.slice(1)]);
 return {accounts:names.length+1,customers:names.length,engineerEmail:'engineer.demo@example.test',customerEmail:'anna.demo@example.test'};
}

/** Simulated API load; separate from measured request_metrics and never persisted as measurements. */
export function demoNetworkDays(days:readonly string[]){
 return days.map(day=>{
  const seed=Math.floor(Date.parse(day)/86_400_000),wave=Math.sin(seed*.9);
  const requests=Math.round(18000+wave*4500+(seed%7)*1200);
  const clientErrors=Math.round(requests*(.008+Math.abs(Math.cos(seed))*.012));
  const serverErrors=seed%11===0?Math.round(requests*.016):Math.round(requests*.0007);
  return {day,requests,clientErrors,serverErrors,averageMs:Math.round(43+(wave+1)*12),maxMs:seed%11===0?860:Math.round(180+Math.abs(wave)*240)};
 });
}
