import {eq,sql} from 'drizzle-orm';
import type {DrizzleD1Database} from 'drizzle-orm/d1';
import * as schema from '../db/schema.ts';
import {createAuth,hashPassword,verifyPassword} from './auth-core.ts';
import {assessPassword} from './password-policy.ts';
import {HttpError} from './request.ts';
import {readRole,readSubscriptionStatus,SUBSCRIPTION_TRANSITIONS,type Role,type SubscriptionStatus} from './operations-policy.ts';
import {demoNetworkDays} from './demo-operations.ts';

type Database=DrizzleD1Database<typeof schema>;
const dayMs=86_400_000;
const activeAdmin=(id:string)=>sql`EXISTS (
  SELECT 1 FROM account_access WHERE user_id=${id} AND role='admin' AND blocked=0
)`;

export async function resetAccountPassword(db:Database,actor:string,target:string,input:Record<string,unknown>){
  if(!await db.get(sql`SELECT 1 WHERE ${activeAdmin(actor)}`))throw new HttpError('Требуется доступ администратора.',403);

  const password=typeof input.newPassword==='string'?input.newPassword:'';
  if(!assessPassword(password).valid)throw new HttpError('Новый пароль не соответствует требованиям.',400);
  if(password!==input.confirmPassword)throw new HttpError('Пароли не совпадают.',400);

  const {accounts,sessions}=schema;
  const admin=await createAuth(db).confirmPassword(actor,input.adminPassword);
  const account=await db.get<{passwordHash:string}>(sql`
    SELECT password_hash AS passwordHash FROM accounts WHERE id=${target}
      AND NOT EXISTS (SELECT 1 FROM account_access WHERE user_id=${target} AND role='admin')`);
  if(!account)throw new HttpError('Аккаунт отсутствует или защищён от сброса.',409);
  if(await verifyPassword(password,account.passwordHash))throw new HttpError('Новый пароль должен отличаться от прежнего.',400);

  const passwordHash=await hashPassword(password);
  // A newly salted hash identifies this update inside the atomic D1 batch.
  const changed=sql`EXISTS (SELECT 1 FROM accounts WHERE id=${target} AND password_hash=${passwordHash})`;
  const [updated]=await db.batch([
    db.update(accounts).set({passwordHash}).where(sql`
      id=${target} AND password_hash=${account.passwordHash} AND ${activeAdmin(actor)}
      AND EXISTS (SELECT 1 FROM accounts a WHERE a.id=${actor} AND a.password_hash=${admin.passwordHash})
      AND NOT EXISTS (SELECT 1 FROM account_access WHERE user_id=${target} AND role='admin')`)
      .returning({id:accounts.id}),
    db.delete(sessions).where(sql`${eq(sessions.userId,target)} AND ${changed}`),
    db.insert(schema.accessEvents).select(sql`
      SELECT NULL,a.id,${actor},'password_reset',coalesce(x.role,'customer'),coalesce(x.role,'customer'),
        coalesce(x.blocked,0),coalesce(x.blocked,0),strftime('%Y-%m-%dT%H:%M:%fZ','now')
      FROM accounts a LEFT JOIN account_access x ON x.user_id=a.id
      WHERE a.id=${target} AND ${changed}`),
  ]);
  if(!updated.length)throw new HttpError('Доступ или пароль изменился. Повторите действие.',409);
}

export async function changeAccess(db:Database,actor:string,target:string,input:Record<string,unknown>){
  const role=input.role===undefined?null:readRole(input.role);
  const blocked=input.blocked===undefined?null:input.blocked;
  if(role===undefined||role==='admin'||(blocked!==null&&typeof blocked!=='boolean')||(role===null&&blocked===null)){
    throw new HttpError('Укажите допустимую роль или статус доступа.',400);
  }
  if(!await db.get(sql`SELECT 1 WHERE ${activeAdmin(actor)}`))throw new HttpError('Требуется доступ администратора.',403);
  const updated=await db.all<{user_id:string}>(sql`
    INSERT INTO account_access(user_id,role,blocked,changed_by)
    SELECT id, coalesce(${role},'customer'), coalesce(${blocked===null?null:Number(blocked)},0), ${actor}
    FROM accounts WHERE id=${target} AND ${activeAdmin(actor)}
      AND NOT EXISTS (SELECT 1 FROM account_access WHERE user_id=${target} AND role='admin')
    ON CONFLICT(user_id) DO UPDATE SET
      role=coalesce(${role},account_access.role),
      blocked=coalesce(${blocked===null?null:Number(blocked)},account_access.blocked),
      changed_by=excluded.changed_by
    RETURNING user_id`);
  if(!updated.length)throw new HttpError('Аккаунт отсутствует или защищён от изменения.',409);
}

export async function changeSubscription(db:Database,actor:string,id:string,previous:unknown,next:unknown){
  const from=readSubscriptionStatus(previous),to=readSubscriptionStatus(next);
  if(!from||!to||!SUBSCRIPTION_TRANSITIONS[from].includes(to))throw new HttpError('Этот переход между статусами недоступен.',400);
  if(!await db.get(sql`SELECT 1 WHERE ${activeAdmin(actor)}`))throw new HttpError('Требуется доступ администратора.',403);
  const rows=await db.all<{id:string}>(sql`
    UPDATE orders SET status=${to} WHERE id=${id} AND status=${from} AND ${activeAdmin(actor)}
    RETURNING id`);
  if(!rows.length)throw new HttpError('Статус уже изменился или заявка отсутствует. Обновите данные.',409);
}

export async function recordRequest(db:Database,status:number,durationMs:number,now=new Date()){
  const hour=now.toISOString().slice(0,13)+':00:00.000Z';
  const duration=Math.max(0,Math.round(durationMs));
  await db.run(sql`
    INSERT INTO request_metrics (hour,requests,client_errors,server_errors,total_ms,max_ms)
    VALUES (${hour},1,${status>=400&&status<500?1:0},${status>=500?1:0},${duration},${duration})
    ON CONFLICT(hour) DO UPDATE SET requests=requests+1,
      client_errors=client_errors+excluded.client_errors,
      server_errors=server_errors+excluded.server_errors,
      total_ms=total_ms+excluded.total_ms,max_ms=max(max_ms,excluded.max_ms)`);
}

export function readPeriod(value:unknown){return value==='7'||value===7?7:value==='90'||value===90?90:30;}
export type DayMetric={day:string;registrations:number;opened:number;activations:number;paused:number;cancelled:number;requests:number;clientErrors:number;serverErrors:number;averageMs:number|null;maxMs:number|null};
type Totals={customers:number;staff:number;blocked:number;activeSessions:number;new:number;active:number;paused:number;cancelled:number;tickets:number};
type SubscriptionEvent={orderId:string;plan:string;previous:string|null;status:string;at:string};
type PlanMetric={plan:string;status:string;count:number};
export type OperationsSnapshot=Awaited<ReturnType<typeof loadOperations>>;

export async function loadOperations(db:Database,period:number,now=new Date(),demo=false){
  const end=Date.parse(now.toISOString().slice(0,10)+'T00:00:00Z');
  const days=Array.from({length:period},(_,i):DayMetric=>({
    day:new Date(end-(period-1-i)*dayMs).toISOString().slice(0,10),registrations:0,opened:0,activations:0,paused:0,cancelled:0,
    requests:0,clientErrors:0,serverErrors:0,averageMs:null,maxMs:null,
  }));
  const since=days[0].day;
  const [totals,registrations,transitions,requests,plans,subscriptionEvents]=await Promise.all([
    db.get<Totals>(sql`SELECT
      (SELECT count(*) FROM accounts a LEFT JOIN account_access x ON x.user_id=a.id WHERE coalesce(x.role,'customer')='customer') AS customers,
      (SELECT count(*) FROM account_access WHERE role IN ('admin','engineer')) AS staff,
      (SELECT count(*) FROM account_access WHERE blocked=1) AS blocked,
      (SELECT count(*) FROM sessions s LEFT JOIN account_access x ON x.user_id=s.user_id WHERE s.expires_at>${now.getTime()} AND coalesce(x.blocked,0)=0) AS activeSessions,
      (SELECT count(*) FROM orders WHERE status='new') AS new,
      (SELECT count(*) FROM orders WHERE status='active') AS active,
      (SELECT count(*) FROM orders WHERE status='paused') AS paused,
      (SELECT count(*) FROM orders WHERE status='cancelled') AS cancelled,
      (SELECT count(*) FROM tickets) AS tickets`),
    db.all<{day:string;count:number}>(sql`SELECT substr(created_at,1,10) AS day,count(*) AS count
      FROM accounts WHERE created_at>=${since} GROUP BY day`),
    db.all<{day:string;status:string;count:number}>(sql`SELECT substr(at,1,10) AS day,status,count(*) AS count
      FROM subscription_events WHERE at>=${since} GROUP BY day,status`),
    db.all<{day:string;requests:number;clientErrors:number;serverErrors:number;averageMs:number;maxMs:number}>(sql`
      SELECT substr(hour,1,10) AS day,sum(requests) AS requests,sum(client_errors) AS clientErrors,
        sum(server_errors) AS serverErrors,round(1.0*sum(total_ms)/sum(requests),1) AS averageMs,max(max_ms) AS maxMs
      FROM request_metrics WHERE hour>=${since} GROUP BY day`),
    db.all<PlanMetric>(sql`SELECT plan,status,count(*) AS count FROM orders GROUP BY plan,status ORDER BY plan,status`),
    db.all<SubscriptionEvent>(sql`SELECT order_id AS orderId,plan,previous,status,at
      FROM subscription_events WHERE at>=${since} ORDER BY at DESC,id DESC LIMIT 100`),
  ]);
  const byDay=new Map(days.map(day=>[day.day,day]));
  for(const row of registrations){const day=byDay.get(row.day);if(day)day.registrations=row.count;}
  const statusMetric={new:'opened',active:'activations',paused:'paused',cancelled:'cancelled'} as const;
  for(const row of transitions){
    const day=byDay.get(row.day),status=readSubscriptionStatus(row.status);
    if(day&&status)day[statusMetric[status]]=row.count;
  }
  for(const row of requests){const day=byDay.get(row.day);if(day)Object.assign(day,row);}
  if(demo)for(const row of demoNetworkDays(days.map(day=>day.day)))Object.assign(byDay.get(row.day)!,row);
  return {generatedAt:now.toISOString(),period,dataMode:demo?'demo':'measured',totals:totals!,days,plans,subscriptionEvents};
}

type AdminAccount={id:string;name:string;email:string;role:Role;blocked:number;createdAt:string;subscriptions:number};
type AdminOrder={id:string;name:string;plan:string;status:SubscriptionStatus;createdAt:string};
type AccessEvent={id:number;userId:string;actorId:string|null;action:'access'|'password_reset';oldRole:Role;role:Role;oldBlocked:number;blocked:number;at:string};
const adminAccounts=sql`SELECT a.id,a.name,a.email,a.created_at AS createdAt,
  coalesce(x.role,'customer') AS role,coalesce(x.blocked,0) AS blocked,
  (SELECT count(*) FROM orders o WHERE o.user_id=a.id AND o.status IN ('active','paused')) AS subscriptions
  FROM accounts a LEFT JOIN account_access x ON x.user_id=a.id`;
const accessEventRows=sql`SELECT id,user_id AS userId,actor_id AS actorId,action,old_role AS oldRole,role,
  old_blocked AS oldBlocked,blocked,at FROM access_events`;

export async function loadAdminAccount(db:Database,id:string){
  return db.get<AdminAccount>(sql`${adminAccounts} WHERE a.id=${id}`);
}

export async function loadAdmin(db:Database,page:number,search:string){
  const pageSize=20,offset=(page-1)*pageSize;
  const filter=search?sql`WHERE instr(lower(a.email),${search})>0 OR instr(lower(a.name),${search})>0 OR instr(a.id,${search})>0`:sql``;
  const [accounts,orders,events]=await Promise.all([
    db.all<AdminAccount>(sql`${adminAccounts} ${filter}
      ORDER BY a.created_at DESC,a.id LIMIT ${pageSize+1} OFFSET ${offset}`),
    db.all<AdminOrder>(sql`SELECT o.id,a.name,o.plan,o.status,o.created_at AS createdAt FROM orders o
      LEFT JOIN accounts a ON a.id=o.user_id ORDER BY o.created_at DESC,o.id LIMIT ${pageSize+1} OFFSET ${offset}`),
    db.all<AccessEvent>(sql`${accessEventRows} ORDER BY at DESC,id DESC LIMIT 50`),
  ]);
  return {accounts:accounts.slice(0,pageSize),orders:orders.slice(0,pageSize),events,
    nextAccounts:accounts.length>pageSize,nextOrders:orders.length>pageSize};
}

export async function loadSubscriptionEvents(db:Database,since:string){
  return db.all<SubscriptionEvent>(sql`SELECT order_id AS orderId,plan,previous,status,at
    FROM subscription_events WHERE at>=${since} ORDER BY at DESC,id DESC`);
}

export async function loadHourlyMetrics(db:Database,since:string){
  return db.all<{hour:string;requests:number;clientErrors:number;serverErrors:number;totalMs:number;maxMs:number}>(sql`
    SELECT hour,requests,client_errors AS clientErrors,server_errors AS serverErrors,total_ms AS totalMs,max_ms AS maxMs
    FROM request_metrics WHERE hour>=${since} ORDER BY hour`);
}

export async function loadCustomerHistory(db:Database,since:string,limit?:number){
  const maxRows=limit?sql`LIMIT ${limit}`:sql``;
  return db.all<{customer:string;name:string;demo:number;createdAt:string;blocked:number;active:number;paused:number;pending:number;cancelled:number}>(sql`
    SELECT a.id AS customer,a.name,CASE WHEN a.id LIKE 'demo-rassvet-%' THEN 1 ELSE 0 END AS demo,a.created_at AS createdAt,coalesce(x.blocked,0) AS blocked,
      count(CASE WHEN o.status='active' THEN 1 END) AS active,
      count(CASE WHEN o.status='paused' THEN 1 END) AS paused,
      count(CASE WHEN o.status='new' THEN 1 END) AS pending,
      count(CASE WHEN o.status='cancelled' THEN 1 END) AS cancelled
    FROM accounts a LEFT JOIN account_access x ON x.user_id=a.id LEFT JOIN orders o ON o.user_id=a.id
    WHERE a.created_at>=${since} AND coalesce(x.role,'customer')='customer'
    GROUP BY a.id ORDER BY a.created_at DESC,a.id ${maxRows}`);
}

export async function loadAllAccessEvents(db:Database){
  return db.all<AccessEvent>(sql`${accessEventRows} ORDER BY at DESC,id DESC`);
}
