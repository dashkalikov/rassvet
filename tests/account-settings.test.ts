import test from 'node:test';
import assert from 'node:assert/strict';
import {createAuth} from '../lib/auth-core.ts';
import {createRecords} from '../lib/records.ts';
import {databaseFixture} from './sqlite.ts';
import {createAccountSettings} from '../lib/account-settings.ts';
import {readAvatar,MAX_AVATAR_BYTES} from '../lib/avatar.ts';

const password='S0lar-Orbit-2026';
const nextPassword='An0ther-Orbit-2026';
async function setup() {
  const f=databaseFixture(),auth=createAuth(f.db);
  const alice=await auth.register({name:'Анна',email:'anna@example.test',password});
  const bob=await auth.register({name:'Борис',email:'boris@example.test',password});
  return {...f,auth,alice,bob,settings:createAccountSettings(f.db,alice.user.userId),other:createAccountSettings(f.db,bob.user.userId)};
}

test('contact edits update login identity and existing sessions without losing requests',async()=>{
  const f=await setup();try{
    const order=await createRecords(f.db,f.alice.user.userId).addOrder({plan:'home',billing:'monthly',address:'Москва, улица Тестовая, 1'});
    const profile=await f.settings.saveProfile({name:'Анна Новая',email:'  NEW@EXAMPLE.TEST ',phone:'8 (999) 123-45-67',currentPassword:password,userId:f.bob.user.userId});
    assert.equal(profile.name,'Анна Новая');assert.equal(profile.email,'new@example.test');assert.equal(profile.phone,'+79991234567');
    assert.equal((await f.auth.resolve(f.alice.token))?.name,'Анна Новая');
    assert.equal((await f.auth.resolve(f.alice.token))?.email,'new@example.test');
    await assert.rejects(f.auth.login({email:'anna@example.test',password}));
    assert.equal((await f.auth.login({email:'new@example.test',password})).user.userId,f.alice.user.userId);
    assert.equal((await createRecords(f.db,f.alice.user.userId).getOrders())[0].id,order.id);
    assert.equal((await f.other.getProfile()).name,'Борис');
  }finally{f.close();}
});

test('name and phone can change without changing email or confirming a password',async()=>{
  const f=await setup();try{
    await f.settings.saveProfile({name:'Анна Петрова',phone:'+7 999 123-45-67'});
    assert.equal((await f.auth.resolve(f.alice.token))?.name,'Анна Петрова');
    assert.equal((await f.settings.getProfile()).email,'anna@example.test');
    await f.settings.saveProfile({name:'Анна Петрова',phone:''});
    assert.equal((await f.settings.getProfile()).phone,'');
  }finally{f.close();}
});

test('email changes require the correct password and reject duplicate or invalid contacts atomically',async()=>{
  const f=await setup();try{
    const before=await f.settings.getProfile();
    for(const input of [
      {email:'new@example.test'},
      {email:'new@example.test',currentPassword:'wrong-password'},
      {email:'BORIS@EXAMPLE.TEST',currentPassword:password},
      {email:'bad-address',currentPassword:password},
      {phone:'123',currentPassword:password},
    ]) await assert.rejects(f.settings.saveProfile({name:'Не сохранять',phone:'',...input}));
    assert.deepEqual(await f.settings.getProfile(),before);
  }finally{f.close();}
});

test('avatar updates and removal remain private and preserve contact details',async()=>{
  const f=await setup();try{
    await f.settings.saveProfile({name:'Анна Петрова',phone:'+79991234567'});
    const bytes=Uint8Array.from(Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jq1cAAAAASUVORK5CYII=','base64'));
    await f.settings.saveAvatar(bytes,'image/png');
    assert.match((await f.settings.getProfile()).avatar,/^data:image\/png;base64,/);
    assert.equal((await f.other.getProfile()).avatar,'');
    assert.match((await f.auth.resolve(f.alice.token))?.avatar??'',/^data:image\/png/);
    await f.settings.removeAvatar();
    const profile=await f.settings.getProfile();assert.equal(profile.avatar,'');assert.equal(profile.phone,'+79991234567');
  }finally{f.close();}
});

test('avatar upload rejects SVG, disguised bytes and oversized images',async()=>{
  const f=await setup();try{
    await assert.rejects(f.settings.saveAvatar(new TextEncoder().encode('<svg/>'),'image/svg+xml'));
    await assert.rejects(f.settings.saveAvatar(new TextEncoder().encode('<script/>'),'image/png'));
    await assert.rejects(f.settings.saveAvatar(new Uint8Array(256*1024+1),'image/webp'));
    assert.equal((await f.settings.getProfile()).avatar,'');
  }finally{f.close();}
});

test('password change validates both passwords and revokes other sessions while preserving the current one',async()=>{
  const f=await setup();try{
    const other=await f.auth.login({email:'anna@example.test',password});
    for(const input of [
      {currentPassword:'wrong-password',newPassword:nextPassword,confirmPassword:nextPassword},
      {currentPassword:password,newPassword:'weak',confirmPassword:'weak'},
      {currentPassword:password,newPassword:nextPassword,confirmPassword:'different'},
    ]) await assert.rejects(f.settings.changePassword(input,f.alice.token));
    await f.settings.changePassword({currentPassword:password,newPassword:nextPassword,confirmPassword:nextPassword},f.alice.token);
    assert.ok(await f.auth.resolve(f.alice.token));assert.equal(await f.auth.resolve(other.token),null);
    await assert.rejects(f.auth.login({email:'anna@example.test',password}));
    assert.equal((await f.auth.login({email:'anna@example.test',password:nextPassword})).user.userId,f.alice.user.userId);
    assert.ok(await f.auth.resolve(f.bob.token));
  }finally{f.close();}
});

test('account export includes only the owner data and excludes authentication secrets',async()=>{
  const f=await setup();try{
    await createRecords(f.db,f.alice.user.userId).addTicket({subject:'Оборудование',message:'Вопрос Анны: как настроить свой терминал?'});
    await createRecords(f.db,f.bob.user.userId).addTicket({subject:'Оборудование',message:'Секрет Бориса: данные другого пользователя.'});
    const data=await f.settings.exportData(),json=JSON.stringify(data);
    assert.match(json,/Вопрос Анны/);assert.doesNotMatch(json,/Секрет Бориса|passwordHash|password_hash|tokenHash|token_hash|S0lar-Orbit/);
    assert.equal(data.profile.email,'anna@example.test');assert.equal(data.tickets.length,1);
  }finally{f.close();}
});

test('sensitive settings confirmations are rate limited',async()=>{
  const f=await setup();try{
    for(let i=0;i<8;i++)await assert.rejects(f.settings.saveProfile({name:'Анна',phone:'',email:'new@example.test',currentPassword:'wrong-password'}));
    await assert.rejects(f.settings.saveProfile({name:'Анна',phone:'',email:'new@example.test',currentPassword:password}),/попыток/i);
  }finally{f.close();}
});

test('a database write failure rolls back both login and profile changes',async()=>{
  const f=await setup();try{
    await f.settings.saveProfile({name:'Анна',phone:''});
    f.sqlite.exec("CREATE TRIGGER reject_profile BEFORE UPDATE ON profiles BEGIN SELECT RAISE(ABORT, 'test write failure'); END;");
    await assert.rejects(f.settings.saveProfile({name:'Не сохранять',phone:'+79991234567',email:'new@example.test',currentPassword:password}));
    assert.equal((await f.settings.getProfile()).name,'Анна');
    assert.equal((await f.auth.resolve(f.alice.token))?.email,'anna@example.test');
    assert.equal(f.sqlite.prepare('SELECT name FROM accounts WHERE id=?').get(f.alice.user.userId)?.name,'Анна');
  }finally{f.close();}
});

test('streamed avatar uploads are bounded even without a content-length header',async()=>{
  let cancelled=false;
  const body=new ReadableStream<Uint8Array>({pull(controller){controller.enqueue(new Uint8Array(65536));},cancel(){cancelled=true;}});
  const request=new Request('http://local/api/profile/avatar',{method:'PUT',body,duplex:'half'} as RequestInit&{duplex:string});
  await assert.rejects(readAvatar(request),/большое/);assert.equal(cancelled,true);
  await assert.rejects(readAvatar(new Request('http://local/api/profile/avatar',{method:'PUT',headers:{'content-length':String(MAX_AVATAR_BYTES+1)}})),/большое/);
});
