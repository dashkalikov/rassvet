import test from 'node:test';
import assert from 'node:assert/strict';
import {assessPassword} from '../lib/password-policy.ts';
import {createAuth,hashPassword} from '../lib/auth-core.ts';
import {databaseFixture} from './sqlite.ts';
import {accounts} from '../db/schema.ts';
test('password feedback identifies exactly which requirements are missing',()=>{
 const value=assessPassword('lowercaseonly');
 assert.equal(value.valid,false);
 assert.equal(value.rules.find(r=>r.id==='lowercase')?.passed,true);
 assert.equal(value.rules.find(r=>r.id==='uppercase')?.passed,false);
 assert.equal(value.rules.find(r=>r.id==='digit')?.passed,false);
 assert.equal(value.rules.find(r=>r.id==='special')?.passed,false);
});
test('a valid password meets every rule and spaces and oversized input are rejected',()=>{
 assert.equal(assessPassword('Orbit-2026!').valid,true);
 assert.equal(assessPassword('Orbit-2026!').passed,6);
 assert.equal(assessPassword('Orbit 2026!').valid,false);
 assert.equal(assessPassword('Ab1!').valid,false);
 assert.equal(assessPassword('Ab1!'+ 'x'.repeat(125)).valid,false);
 assert.equal(assessPassword('ПАРОЛЬпароль123').rules.find(r=>r.id==='special')?.passed,false);
});
test('server registration enforces the same character requirements as the form',async()=>{
 const f=databaseFixture();try{const auth=createAuth(f.db);
 for(const password of ['lowercase123!','UPPERCASE123!','NoNumbersHere!','MissingSpecial123','Has Space123!']){
  await assert.rejects(auth.register({name:'Тест',email:'rules@example.test',password}),/парол/i);
 }
 const result=await auth.register({name:'Тест',email:'rules@example.test',password:'Orbit-2026!'});
 assert.equal(result.user.email,'rules@example.test');
 }finally{f.close();}
});
test('existing accounts can still log in with a password made under the earlier rules',async()=>{
 const f=databaseFixture();try{await f.db.insert(accounts).values({id:'legacy',name:'Тест',email:'legacy@example.test',passwordHash:await hashPassword('legacyletters'),createdAt:new Date().toISOString()});
 const result=await createAuth(f.db).login({email:'legacy@example.test',password:'legacyletters'});
 assert.equal(result.user.userId,'legacy');
 }finally{f.close();}
});
