import assert from 'node:assert/strict';
import {readdirSync,readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {Miniflare} from 'miniflare';
const base='http://localhost';
const modulesRoot=resolve('dist/server');
const modules=['index.js',...readdirSync(modulesRoot,{recursive:true}).filter(file=>file!=='index.js'&&/\.m?js$/.test(file))].map(file=>({type:'ESModule',path:resolve(modulesRoot,file)}));
const mf=new Miniflare({modules,modulesRoot,compatibilityDate:'2026-05-15',compatibilityFlags:['nodejs_compat'],d1Databases:{DB:'isolated-http-verification'}});
async function request(path,status,{cookie,body,method,origin=base}={}){
 const headers={Origin:origin};if(cookie)headers.Cookie=cookie;if(body)headers['Content-Type']='application/json';
 const response=await mf.dispatchFetch(base+path,{headers,method:method??(body?'POST':'GET'),body:body&&JSON.stringify(body),redirect:'manual'});
 const text=await response.text();assert.equal(response.status,status,path+' '+text.slice(0,200));
 return {text,location:response.headers.get('location'),mode:response.headers.get('x-rassvet-data-mode'),cookie:response.headers.get('set-cookie')?.split(';')[0],json:()=>JSON.parse(text)};
}
const identity=name=>({name:'Проверка '+name,email:name+'@example.test',password:'S0lar-Orbit-2026'});
try{
 const db=await mf.getD1Database('DB');
 for(const file of readdirSync('drizzle').filter(name=>name.endsWith('.sql')).sort())await db.batch(readFileSync('drizzle/'+file,'utf8').split('--> statement-breakpoint').map(sql=>db.prepare(sql.trim())).filter(Boolean));
 const registered=await request('/api/auth/register',201,{body:identity('admin')});
 await db.prepare("INSERT INTO account_access(user_id,role) VALUES (?,'admin')").bind(registered.json().user.userId).run();
 const admin=await request('/api/auth/login',200,{body:{...identity('admin'),portal:'admin'}});
 const a={cookie:admin.cookie};
 const customer=await request('/api/auth/register',201,{body:identity('customer')});
 const c={cookie:customer.cookie};
 await request('/api/profile',200,{...c,method:'PUT',body:{name:'Анна Смирнова',phone:'+79991234567'}});
 const review='/connect?step=review&address='+encodeURIComponent('Москва, Тверская улица, д. 13');
 const confirmation=await request(review,200,c);
 for(const value of ['Анна Смирнова','customer@example.test','+79991234567','connection-review','continue-button'])assert.ok(confirmation.text.includes(value),value);
 assert.doesNotMatch(confirmation.text,/учебн/i);
 const guestReview=await request(review,200);assert.match(guestReview.text,/<button[^>]*disabled=""[^>]*>Войти и продолжить/);
 const cities=await request('/api/addresses?q='+encodeURIComponent('М'),200);assert.ok(cities.json().suggestions.some(item=>item.label==='Москва'));
 await request('/api/addresses?q='+('a'.repeat(301)),400);
 const deniedLookup=await mf.dispatchFetch(base+'/api/addresses?q=Москва',{headers:{'Sec-Fetch-Site':'cross-site'}});assert.equal(deniedLookup.status,403);await deniedLookup.text();
 await request('/api/operations/demo',403,{...c,body:{}});
 await request('/api/operations/demo',403,{...a,body:{},origin:'https://example.org'});
 await request('/api/operations/demo',200,{...a,body:{}});
 const count=await db.prepare("SELECT count(*) AS n FROM accounts WHERE id LIKE 'demo-rassvet-%'").first('n');assert.equal(count,25);
 await request('/api/operations/demo',200,{...a,body:{}});
 assert.equal(await db.prepare("SELECT count(*) AS n FROM accounts WHERE id LIKE 'demo-rassvet-%'").first('n'),25);
 const engineer=await request('/api/auth/login',200,{body:{email:'engineer.demo@example.test',password:'Rassvet-Demo2026!',portal:'engineer'}});
 const e={cookie:engineer.cookie};
 await request('/api/auth/login',403,{body:{email:'anna.demo@example.test',password:'Rassvet-Demo2026!',portal:'engineer'}});
 await request('/api/operations/diagnostics',403,c);
 const diagnostic=await request('/api/operations/diagnostics',200,e);assert.equal(diagnostic.json().satellites,30);
 const unauthenticated=await request('/operations/orbits/map',307);assert.match(unauthenticated.location,/portal=engineer/);
 await request('/admin',307,e);
 for(const [path,label] of [
  ['/operations','Инженерная панель'],['/operations?section=overview','Демонстрационная нагрузка API'],
  ['/operations?section=overview&demo=0','Измерения локального приложения'],['/operations?section=subscriptions','Анна Смирнова'],
  ['/operations/orbits/map','Орбиты всех аппаратов'],['/operations/orbits/globe','Аппараты'],
  ['/operations/orbits/map?norad=100098','Только избранные'],['/operations/orbits/globe?norad=100098','Зоны видимости'],
  ['/operations/orbits/history?norad=68360','findrassvet.ru'],['/operations/orbits/catalog?norad=100098','В избранное RASSVET-3 32'],
 ])assert.ok((await request(path,200,e)).text.includes(label),path);
 assert.equal((await request('/operations?section=satellites&norad=68360',307,e)).location,'/operations/orbits/catalog?norad=68360');
 await request('/operations/orbits/nope',404,e);
 const order=(await request('/api/orders',201,{...c,body:{plan:'travel',billing:'monthly',address:'Якутск, ул. Мира, 12'}})).json().order;
 await request('/api/orders/'+order.id+'/activate',409,{...a,body:{}});
 await request('/api/orders/'+order.id+'/activate',403,{...c,body:{},origin:'https://example.org'});
 assert.equal((await request('/api/orders/'+order.id+'/activate',200,{...c,body:{}})).json().order.status,'active');
 await request('/api/orders/'+order.id+'/activate',409,{...c,body:{}});
 assert.ok((await request('/speedtest',200,c)).text.includes('РАССВЕТ В пути'));
 const csv=await request('/api/operations/export?dataset=orbit&norad=68360',200,e);assert.ok(csv.text.split('\n').length>100);
 const json=await request('/api/operations/export?format=json&demo=1',200,e);assert.equal(json.json().dataMode,'demo');assert.equal(json.mode,'demo');
 const prom=await request('/api/operations/export?format=prom&demo=1',200,e);assert.match(prom.text,/rassvet_data_mode\{mode="demo"\} 1/);
 const measured=await request('/api/operations/export?format=json',200,e);assert.equal(measured.json().dataMode,'measured');
 await request('/api/operations/export?dataset=access',403,e);
 for(const dataset of ['accounts','orders']){
  const exported=await request('/api/operations/export?dataset='+dataset,200,a);
  assert.ok(exported.text.includes('customer@example.test'),dataset+' includes the local customer');
  if(dataset==='orders'){assert.ok(exported.text.includes(order.id));assert.match(exported.text,/"active"/);}
  await request('/api/operations/export?dataset='+dataset,403,e);
  await request('/api/operations/export?dataset='+dataset,403,c);
 }
 assert.ok((await request('/admin?section=accounts',200,a)).text.includes('dataset=accounts'));
 assert.ok((await request('/admin?section=subscriptions',200,a)).text.includes('dataset=orders'));
 for(const path of ['/','/account','/operations','/admin','/operations/orbits/catalog']){
  const page=await request(path,200,a);assert.match(page.text,/portal-switcher-options/);
  for(const portal of ['/account','/operations','/admin'])assert.ok(page.text.includes('href="'+portal+'"'),path+' '+portal);
 }
 console.log('HTTP smoke passed: isolated DB, demo identities, access and CSRF checks, local subscription activation, all-orbit views, archive curves, restricted admin CSV and CSV/JSON/Prometheus exports.');
}finally{await mf.dispose();}
