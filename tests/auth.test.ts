import test from 'node:test';
import assert from 'node:assert/strict';
import { createAuth, hashPassword, verifyPassword } from '../lib/auth-core.ts';
import { databaseFixture } from './sqlite.ts';
const credentials = {name:'Тестовый пользователь',email:'Person@example.test',password:'S0lar-Orbit-2026'};
test('passwords have unique salted hashes and reject a wrong password',async()=>{
  const first=await hashPassword(credentials.password),second=await hashPassword(credentials.password);
  assert.notEqual(first,credentials.password);assert.notEqual(first,second);
  assert.equal(await verifyPassword(credentials.password,first),true);
  assert.equal(await verifyPassword('wrong-password',first),false);
  assert.equal(await verifyPassword(credentials.password,'malformed'),false);
});
test('registration creates a normalized account and an authenticated session without email delivery',async()=>{
  const f=databaseFixture();try{
    const auth=createAuth(f.db);const result=await auth.register({...credentials,email:'  Person@example.test  '});
    assert.equal(result.user.email,'person@example.test');assert.equal(result.user.name,'Тестовый пользователь');
    assert.equal((await auth.resolve(result.token))?.userId,result.user.userId);
    assert.equal('password' in result.user,false);assert.equal('passwordHash' in result.user,false);
    assert.ok(result.token.length>=40);
  }finally{f.close();}
});
test('weak passwords, invalid email, duplicate normalized email and mismatched confirmation are rejected',async()=>{
  const f=databaseFixture();try{
    const auth=createAuth(f.db);
    await assert.rejects(auth.register({...credentials,password:'short'}),/пароль/i);
    await assert.rejects(auth.register({...credentials,email:'bad-address'}),/почт/i);
    await assert.rejects(auth.register({...credentials,confirmPassword:'another-password'}),/совпада/i);
    await auth.register(credentials);
    await assert.rejects(auth.register({...credentials,email:'PERSON@EXAMPLE.TEST'}),/зарегистрирован/i);
  }finally{f.close();}
});
test('login authenticates the password, rotates tokens and logout revokes the session',async()=>{
  const f=databaseFixture();try{
    const auth=createAuth(f.db);const registered=await auth.register(credentials);
    await assert.rejects(auth.login({...credentials,password:'wrong-password'}),/почта или пароль/i);
    const session=await auth.login({...credentials,email:'PERSON@EXAMPLE.TEST'});
    assert.notEqual(session.token,registered.token);assert.equal((await auth.resolve(session.token))?.email,'person@example.test');
    await auth.logout(session.token);assert.equal(await auth.resolve(session.token),null);
    assert.equal(await auth.resolve('invented-session'),null);
  }finally{f.close();}
});
test('expired sessions cannot be used and raw passwords and session tokens are never stored',async()=>{
  const f=databaseFixture();try{
    const auth=createAuth(f.db);const result=await auth.register(credentials);
    assert.equal(await auth.resolve(result.token,result.expiresAt+1),null);
    const user=f.sqlite.prepare('select password_hash from accounts').get();
    const session=f.sqlite.prepare('select token_hash from sessions').get();
    assert.ok(user);assert.ok(session);assert.notEqual(user.password_hash,credentials.password);assert.notEqual(session.token_hash,result.token);
  }finally{f.close();}
});
test('repeated bad passwords temporarily block login',async()=>{
  const f=databaseFixture();try{
    const auth=createAuth(f.db);await auth.register(credentials);
    for(let i=0;i<8;i++)await assert.rejects(auth.login({...credentials,password:'wrong-password'}));
    await assert.rejects(auth.login(credentials),/попыток/i);
  }finally{f.close();}
});
