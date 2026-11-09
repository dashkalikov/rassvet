import test from 'node:test';
import assert from 'node:assert/strict';
import {createOrbitCatalogService} from '../lib/orbit-catalog.ts';
import {readFileSync} from 'node:fs';
const input=readFileSync(new URL('../design/orbit-rassvet-celestrak.json',import.meta.url),'utf8');

test('concurrent catalogue requests share one fetch and a two-hour cache',async()=>{
 let calls=0,clock=0;
 const service=createOrbitCatalogService(async url=>{assert.equal(String(url),'https://celestrak.org/NORAD/elements/gp.php?NAME=RASSVET&FORMAT=JSON');calls++;return new Response(input);},()=>clock);
 const [a,b]=await Promise.all([service.load(),service.load()]);
 assert.equal(a,b);assert.equal(a.catalog.length,30);assert.equal(calls,1);
 clock=7_199_999;await service.load();assert.equal(calls,1);
 clock=7_200_001;await service.load();assert.equal(calls,2);
});

test('a remote error stops requests and never replaces valid elements with an error page',async()=>{
 let calls=0;
 const service=createOrbitCatalogService(async()=>{calls++;return new Response('blocked',{status:403});},()=>0);
 await assert.rejects(service.load(),/403/);
 await assert.rejects(service.load(),/403/);
 assert.equal(calls,1);
 const malformed=createOrbitCatalogService(async()=>new Response('<html>not elements</html>'));
 await assert.rejects(malformed.load());
});
