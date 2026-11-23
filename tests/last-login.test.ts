import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import React from 'react';
import {renderToString} from 'react-dom/server';
import {loadTsx} from './tsx-loader.ts';

type Hint={email:string;portal:'customer'|'engineer'|'admin';remember:boolean};
type Store={getItem:(key:string)=>string|null;setItem:(key:string,value:string)=>void;removeItem:(key:string)=>void};
function module(){
 const file=new URL('../lib/last-login.ts',import.meta.url);
 assert.ok(existsSync(file),'The last successful login must be remembered');
 return loadTsx(file) as {LAST_LOGIN_KEY:string;readLastLogin:(storage?:Store)=>Hint|null;rememberLastLogin:(value:Hint,storage?:Store)=>void;forgetLastLogin:(storage?:Store)=>void};
}
function storage(){const values=new Map<string,string>();return {values,getItem:(key:string)=>values.get(key)??null,setItem:(key:string,value:string)=>{values.set(key,value);},removeItem:(key:string)=>{values.delete(key);}};}

test('the last successful identity and its portal replace the previous login without storing secrets',()=>{
 const api=module(),store=storage();
 api.rememberLastLogin({email:'  OLEG@Example.test ',portal:'customer',remember:true,password:'must-not-be-stored',token:'private-session'} as Hint,store);
 assert.deepEqual(api.readLastLogin(store),{email:'oleg@example.test',portal:'customer',remember:true});
 const raw=store.getItem(api.LAST_LOGIN_KEY)!;
 assert.ok(!raw.includes('must-not-be-stored')&&!raw.includes('private-session'));
 api.rememberLastLogin({email:'engineer@example.test',portal:'engineer',remember:false},store);
 assert.deepEqual(api.readLastLogin(store),{email:'engineer@example.test',portal:'engineer',remember:false});
 api.rememberLastLogin({email:'admin@example.test',portal:'admin',remember:false},store);
 assert.equal(api.readLastLogin(store)?.portal,'admin');
});

test('damaged saved identities and unavailable browser storage leave login usable',()=>{
 const api=module(),store=storage();
 for(const raw of ['broken JSON','null','[]',JSON.stringify({email:'bad',portal:'admin'}),JSON.stringify({email:'oleg@example.test',portal:'__proto__'}),JSON.stringify({email:'x'.repeat(255)+'@example.test',portal:'customer'})]){
  store.setItem(api.LAST_LOGIN_KEY,raw);assert.equal(api.readLastLogin(store),null);
 }
 const blocked={getItem:()=>{throw new Error('blocked');},setItem:()=>{throw new Error('blocked');},removeItem:()=>{throw new Error('blocked');}};
 assert.equal(api.readLastLogin(blocked),null);
 assert.doesNotThrow(()=>api.rememberLastLogin({email:'oleg@example.test',portal:'customer',remember:true},blocked));
 assert.doesNotThrow(()=>api.forgetLastLogin(blocked));
});

test('forgetting the last identity removes only the login hint and preserves appearance preferences',()=>{
 const api=module(),store=storage();
 store.setItem('rassvet-theme','light-2026');store.setItem('rassvet-background-v1','aurora');
 api.rememberLastLogin({email:'oleg@example.test',portal:'customer',remember:true},store);
 api.forgetLastLogin(store);assert.equal(api.readLastLogin(store),null);
 assert.equal(store.getItem('rassvet-theme'),'light-2026');assert.equal(store.getItem('rassvet-background-v1'),'aurora');
});

test('authentication hydrates with stable blank credentials and browser password-manager hints',()=>{
 const {default:Form}=loadTsx(new URL('../components/AuthForm.tsx',import.meta.url)) as {default:React.ComponentType<{initialMode?:'login'|'register'}>};
 const login=renderToString(React.createElement(Form));
 assert.equal(login,renderToString(React.createElement(Form)));
 assert.match(login,/name="username"/);assert.match(login,/name="password"/);
 assert.match(login,/autoComplete="current-password"/);assert.doesNotMatch(login,/value="must-not-be-stored"/);
 const register=renderToString(React.createElement(Form,{initialMode:'register'}));
 assert.equal((register.match(/autoComplete="new-password"/g)??[]).length,2);
 assert.match(register,/Требования к паролю/);assert.match(register,/Повторите пароль/);
});
