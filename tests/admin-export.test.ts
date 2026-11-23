import test from 'node:test';
import assert from 'node:assert/strict';
import {createAuth} from '../lib/auth-core.ts';
import {createRecords} from '../lib/records.ts';
import {changeSubscription,loadAllAdminAccounts,loadAllAdminOrders} from '../lib/operations.ts';
import {metricCsv} from '../lib/metric-formats.ts';
import {databaseFixture} from './sqlite.ts';

const password='S0lar-Orbit-2026';
const identity=(key:string)=>({email:key+'@example.test',name:'Тест '+key,password});
const accountColumns=['id','name','email','role','blocked','subscriptions','createdAt'];
const orderColumns=['id','name','email','plan','status','createdAt'];

test('admin tables export every account and subscription with stable columns',async()=>{
  const f=databaseFixture();
  try{
    const auth=createAuth(f.db);
    const admin=await auth.register(identity('admin')),customer=await auth.register(identity('customer'));
    f.sqlite.prepare("INSERT INTO account_access (user_id, role) VALUES (?, 'admin')").run(admin.user.userId);
    f.sqlite.prepare("INSERT INTO account_access (user_id, role) VALUES (?, 'engineer')").run(customer.user.userId);
    const order=await createRecords(f.db,customer.user.userId).addOrder({plan:'home',billing:'monthly',address:'Москва, учебная улица, 1'});
    await changeSubscription(f.db,admin.user.userId,order.id,'new','active');
    const accounts=await loadAllAdminAccounts(f.db);
    assert.equal(accounts.length,2);
    assert.deepEqual(accounts.map(row=>[row.email,row.role,row.blocked,row.subscriptions]),[
      [customer.user.email,'engineer',0,1],
      [admin.user.email,'admin',0,0],
    ]);
    for(const row of accounts)assert.deepEqual([...Object.keys(row)].sort(),[...accountColumns].sort());
    const orders=await loadAllAdminOrders(f.db);
    assert.equal(orders.length,1);
    assert.deepEqual([...Object.keys(orders[0])].sort(),[...orderColumns].sort());
    assert.equal(orders[0].id,order.id);
    assert.equal(orders[0].email,customer.user.email);
    assert.equal(orders[0].status,'active');
    const accountCsv=metricCsv(accounts,accountColumns);
    assert.match(accountCsv,/\uFEFF/);
    assert.match(accountCsv,/\uFEFF"id","name","email","role","blocked","subscriptions","createdAt"\r\n/);
    assert.ok(accountCsv.split('\r\n').filter(row=>row.startsWith('"')&&row.includes('@example.test')).length===2);
    const orderCsv=metricCsv(orders,orderColumns);
    assert.match(orderCsv,/\uFEFF"id","name","email","plan","status","createdAt"\r\n/);
    assert.match(orderCsv,/"active"/);
  }finally{f.close();}
});

test('order export survives deleted customer accounts',async()=>{
  const f=databaseFixture();
  try{
    const auth=createAuth(f.db);
    const admin=await auth.register(identity('admin')),customer=await auth.register(identity('customer'));
    f.sqlite.prepare("INSERT INTO account_access (user_id, role) VALUES (?, 'admin')").run(admin.user.userId);
    const order=await createRecords(f.db,customer.user.userId).addOrder({plan:'home',billing:'monthly',address:'Москва, учебная улица, 1'});
    f.sqlite.prepare('DELETE FROM account_access WHERE user_id=?').run(customer.user.userId);
    f.sqlite.prepare('DELETE FROM sessions WHERE user_id=?').run(customer.user.userId);
    f.sqlite.prepare('DELETE FROM accounts WHERE id=?').run(customer.user.userId);
    const orders=await loadAllAdminOrders(f.db);
    assert.equal(orders.length,1);
    assert.equal(orders[0].id,order.id);
    assert.equal(orders[0].name,null);
    assert.equal(orders[0].email,null);
    const csv=metricCsv(orders,orderColumns);
    assert.ok(csv.includes('"",""'));
  }finally{f.close();}
});
