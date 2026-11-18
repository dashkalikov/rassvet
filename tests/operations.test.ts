import test from 'node:test';
import assert from 'node:assert/strict';
import {createAuth} from '../lib/auth-core.ts';
import {createRecords} from '../lib/records.ts';
import {changeAccess,changeSubscription,loadAllAccessEvents,loadOperations,recordRequest,resetAccountPassword} from '../lib/operations.ts';
import {loadOrbitalArchive,loadSatelliteMetrics,saveOrbitObservations} from '../lib/operations-orbits.ts';
import {parseOrbitCatalog} from '../lib/orbits.ts';
import {readFileSync} from 'node:fs';
import {databaseFixture} from './sqlite.ts';

const password='S0lar-Orbit-2026';
const identity=(key:string)=>({email:key+'@example.test',name:'Тест '+key,password});

test('admin password reset replaces the secret, revokes all target sessions and leaves a safe audit record',async()=>{
  const f=databaseFixture();
  try {
    const auth=createAuth(f.db);
    const admin=await auth.register(identity('admin')),customer=await auth.register(identity('customer'));
    f.sqlite.prepare("INSERT INTO account_access (user_id, role) VALUES (?, 'admin')").run(admin.user.userId);
    const adminSession=await auth.login(identity('admin'),'admin');
    const secondSession=await auth.login(identity('customer'));
    const next='New-Orbit-276!';
    await resetAccountPassword(f.db,admin.user.userId,customer.user.userId,{adminPassword:password,newPassword:next,confirmPassword:next});
    assert.equal(await auth.resolve(customer.token),null);
    assert.equal(await auth.resolve(secondSession.token),null);
    assert.equal((await auth.resolve(adminSession.token))?.role,'admin');
    await assert.rejects(auth.login(identity('customer')),{status:401});
    assert.equal((await auth.login({...identity('customer'),password:next})).user.userId,customer.user.userId);
    const events=await loadAllAccessEvents(f.db);
    assert.ok(events.some(event=>event.action==='password_reset'&&event.userId===customer.user.userId&&event.actorId===admin.user.userId));
    assert.doesNotMatch(JSON.stringify(events),/New-Orbit|S0lar-Orbit|pbkdf2/);
  }finally{f.close();}
});

test('reset requires admin credentials and preserves passwords for denied requests',async()=>{
  const f=databaseFixture();
  try {
    const auth=createAuth(f.db);
    const admin=await auth.register(identity('admin')),customer=await auth.register(identity('customer'));
    f.sqlite.prepare("INSERT INTO account_access (user_id, role) VALUES (?, 'admin')").run(admin.user.userId);
    const form={adminPassword:password,newPassword:'Other-Orbit-2026!',confirmPassword:'Other-Orbit-2026!'};
    await assert.rejects(resetAccountPassword(f.db,customer.user.userId,customer.user.userId,form),{status:403});
    await assert.rejects(resetAccountPassword(f.db,admin.user.userId,admin.user.userId,form),{status:409});
    await assert.rejects(resetAccountPassword(f.db,admin.user.userId,customer.user.userId,{...form,adminPassword:'incorrect-password'}),{status:401});
    await assert.rejects(resetAccountPassword(f.db,admin.user.userId,customer.user.userId,{...form,confirmPassword:''}),{status:400});
    assert.ok(await auth.resolve(customer.token));
    assert.ok(await auth.login(identity('customer')));
  }finally{f.close();}
});

test('a customer cannot self-assign a role or use a staff login, and staff roles are enforced',async()=>{
  const f=databaseFixture();
  try {
    const auth=createAuth(f.db);
    const customer=await auth.register({...identity('customer'),role:'admin'});
    assert.equal((await auth.resolve(customer.token))?.role,'customer');
    await assert.rejects(auth.login(identity('customer'),'engineer'),{status:403});
    await assert.rejects(changeAccess(f.db,customer.user.userId,customer.user.userId,{role:'engineer'}),{status:403});
    f.sqlite.prepare("INSERT INTO account_access (user_id, role) VALUES (?, 'engineer')").run(customer.user.userId);
    assert.equal((await auth.login(identity('customer'),'engineer')).user.role,'engineer');
    await assert.rejects(auth.login(identity('customer'),'admin'),{status:403});
  }finally{f.close();}
});

test('an administrator can sign in through every portal with the same account',async()=>{
  const f=databaseFixture();
  try {
    const auth=createAuth(f.db);
    const admin=await auth.register(identity('admin'));
    f.sqlite.prepare("INSERT INTO account_access (user_id, role) VALUES (?, 'admin')").run(admin.user.userId);

    for(const portal of ['customer','engineer','admin'] as const){
      const session=await auth.login(identity('admin'),portal);
      assert.equal(session.user.userId,admin.user.userId);
      assert.equal((await auth.resolve(session.token))?.role,'admin');
    }
  } finally {
    f.close();
  }
});

test('admin blocks users, revokes sessions, and restores access without reviving old sessions',async()=>{
  const f=databaseFixture();
  try {
    const auth=createAuth(f.db);
    const [admin,customer]=[await auth.register(identity('admin')),await auth.register(identity('customer'))];
    f.sqlite.prepare("INSERT INTO account_access (user_id, role) VALUES (?, 'admin')").run(admin.user.userId);
    await changeAccess(f.db,admin.user.userId,customer.user.userId,{blocked:true});
    assert.equal(await auth.resolve(customer.token),null);
    await assert.rejects(auth.login(identity('customer')),{status:403});
    await assert.rejects(changeAccess(f.db,admin.user.userId,admin.user.userId,{blocked:true}),{status:409});
    await changeAccess(f.db,admin.user.userId,customer.user.userId,{blocked:false,role:'engineer'});
    assert.equal(await auth.resolve(customer.token),null);
    assert.equal((await auth.login(identity('customer'),'engineer')).user.role,'engineer');
  }finally{f.close();}
});

test('opening and changing a subscription populates the history and measured requests aggregate',async()=>{
  const f=databaseFixture();
  try {
    const auth=createAuth(f.db);
    const admin=await auth.register(identity('admin')),customer=await auth.register(identity('customer'));
    f.sqlite.prepare("INSERT INTO account_access (user_id, role) VALUES (?, 'admin')").run(admin.user.userId);
    const order=await createRecords(f.db,customer.user.userId).addOrder({plan:'home',billing:'monthly',address:'Москва, учебная улица, 1'});
    await assert.rejects(changeSubscription(f.db,customer.user.userId,order.id,'new','active'),{status:403});
    await changeSubscription(f.db,admin.user.userId,order.id,'new','active');
    await assert.rejects(changeSubscription(f.db,admin.user.userId,order.id,'new','cancelled'),{status:409});
    await changeSubscription(f.db,admin.user.userId,order.id,'active','paused');
    await recordRequest(f.db,200,12);
    await recordRequest(f.db,500,24);
    const snapshot=await loadOperations(f.db,7);
    assert.equal(snapshot.totals.customers,1);
    assert.equal(snapshot.totals.paused,1);
    assert.equal(snapshot.days.at(-1)?.registrations,2);
    assert.equal(snapshot.days.at(-1)?.activations,1);
    assert.equal(snapshot.days.at(-1)?.requests,2);
    assert.equal(snapshot.days.at(-1)?.serverErrors,1);
    assert.equal(snapshot.days.at(-1)?.averageMs,18);
    assert.deepEqual(snapshot.subscriptionEvents.map(e=>e.status).sort(),['active','new','paused']);
    assert.doesNotMatch(JSON.stringify(snapshot),/example\.test|учебная улица|password_hash/);
  }finally{f.close();}
});

test('saved orbital elements retain distinct epochs and update the calculated catalogue',async()=>{
  const f=databaseFixture();
  try{
    const original=JSON.parse(readFileSync(new URL('../lib/data/orbit-catalog.json',import.meta.url),'utf8'))[0];
    const input=JSON.stringify([{...original,EPOCH:'2026-11-15T23:00:00'}]);
    const catalog=parseOrbitCatalog(input);
    const result={input,catalog,fetchedAt:'2026-11-16T00:10:00Z',source:'test'};
    await saveOrbitObservations(f.db,result);
    await saveOrbitObservations(f.db,result);
    const satellites=await loadSatelliteMetrics(f.db,new Date('2026-11-20T12:00:00Z'));
    const satellite=satellites.find(row=>row.id===catalog[0].id);
    assert.equal(satellite?.epoch,'2026-11-15T23:00:00.000Z');
    assert.equal(satellite?.calculatedAt,'2026-11-20T12:00:00.000Z');
    const [archive]=await loadOrbitalArchive(f.db,[catalog[0].id]);
    assert.equal(archive.samples.filter(row=>row.epoch===satellite?.epoch).length,1);
    assert.ok(archive.samples.length>=2);
  }finally{f.close();}
});
