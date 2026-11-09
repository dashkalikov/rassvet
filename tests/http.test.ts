import test from 'node:test';
import assert from 'node:assert/strict';
import {assertSameOrigin,readJson} from '../lib/request.ts';
import {sessionCookie} from '../lib/cookies.ts';
import {safeReturnPath} from '../lib/navigation.ts';
test('cross-site login and profile writes are rejected even with cookies',()=>{
  assert.throws(()=>assertSameOrigin(new Request('http://127.0.0.1:5173/api/auth/login',{method:'POST',headers:{origin:'https://another.test'}})));
  assert.throws(()=>assertSameOrigin(new Request('http://127.0.0.1:5173/api/auth/login',{method:'POST'})));
  assert.doesNotThrow(()=>assertSameOrigin(new Request('http://127.0.0.1:5173/api/auth/login',{method:'POST',headers:{origin:'http://127.0.0.1:5173'}})));
});
test('non-object and oversized request bodies cannot reach account handlers',async()=>{
  for(const body of ['null','[]','"text"','{broken',JSON.stringify({value:'x'.repeat(13000)})])await assert.rejects(readJson(new Request('http://local/api',{method:'POST',headers:{'content-type':'application/json'},body})));
  assert.deepEqual(await readJson(new Request('http://local/api',{method:'POST',headers:{'content-type':'application/json'},body:'{"name":"Анна"}'})),{name:'Анна'});
});
test('session cookies protect JavaScript access and expire on logout',()=>{
  const local=sessionCookie('token',new Request('http://127.0.0.1:5173'),Date.now()+86400000);
  assert.match(local,/HttpOnly/);assert.match(local,/SameSite=Lax/);assert.doesNotMatch(local,/; Secure/);
  assert.match(sessionCookie('token',new Request('https://example.test'),Date.now()+86400000),/; Secure/);
  assert.match(sessionCookie('',new Request('http://127.0.0.1:5173'),0),/Max-Age=0/);
});
test('login redirects stay within the local app and preserve a pending order',()=>{
  for(const path of ['https://evil.test','//evil.test','/\\evil.test','/api/orders','/auth'])assert.equal(safeReturnPath(path),'/account');
  assert.equal(safeReturnPath('/?order=1&plan=home'), '/?order=1&plan=home');
});
