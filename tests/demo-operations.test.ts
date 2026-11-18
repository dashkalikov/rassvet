import test from 'node:test';
import assert from 'node:assert/strict';
import {databaseFixture} from './sqlite.ts';
import {seedDemoAccounts,DEMO_PASSWORD,demoNetworkDays} from '../lib/demo-operations.ts';
import {createAuth} from '../lib/auth-core.ts';
test('demo data is repeatable, preserves existing accounts and supports customer and engineer login',async()=>{
 const f=databaseFixture();try{
  await createAuth(f.db).register({email:'own@example.test',name:'Свой аккаунт',password:'Own-Account123!'});
  await seedDemoAccounts(f.db,new Date('2026-11-18T12:00:00Z'));
  const count=()=>f.sqlite.prepare('SELECT count(*) AS n FROM accounts').get()!.n;
  const first=count();assert.ok(Number(first)>=20);
  const orders=f.sqlite.prepare('SELECT count(*) AS n FROM orders').get()!.n;
  const hashes=f.sqlite.prepare('SELECT id,password_hash FROM accounts ORDER BY id').all();
  await seedDemoAccounts(f.db,new Date('2026-11-19T12:00:00Z'));
  assert.equal(count(),first);assert.equal(f.sqlite.prepare('SELECT count(*) AS n FROM orders').get()!.n,orders);
  assert.deepEqual(f.sqlite.prepare('SELECT id,password_hash FROM accounts ORDER BY id').all(),hashes);
  const auth=createAuth(f.db);
  assert.equal((await auth.login({email:'anna.demo@example.test',password:DEMO_PASSWORD})).user.name,'Анна Смирнова');
  assert.equal((await auth.login({email:'engineer.demo@example.test',password:DEMO_PASSWORD},'engineer')).user.role,'engineer');
  await assert.rejects(auth.login({email:'anna.demo@example.test',password:DEMO_PASSWORD},'engineer'),{status:403});
  assert.equal(f.sqlite.prepare("SELECT count(*) AS n FROM account_access WHERE role='admin'").get()!.n,0);
 }finally{f.close();}
});
test('demo network data has explicit provenance and consistent request/error/latency values',()=>{
 const points=demoNetworkDays(['2026-11-17','2026-11-18']);
 assert.deepEqual(points,demoNetworkDays(['2026-11-17','2026-11-18']));
 for(const p of points){assert.ok(p.requests>0);assert.ok(p.clientErrors+p.serverErrors<p.requests);assert.ok(p.averageMs!>0);assert.ok(p.maxMs!>=p.averageMs!);}
});
