import test from 'node:test';
import assert from 'node:assert/strict';
import {citySuggestions,parseAddressResults,addressSelectionValue,createAddressSearch} from '../lib/address-search.ts';
const result={features:[
 {properties:{osm_type:'W',osm_id:1,countrycode:'RU',city:'Москва',street:'Тверская улица',housenumber:'13'}},
 {properties:{osm_type:'W',osm_id:2,countrycode:'RU',city:'Москва',name:'Тверская улица',osm_key:'highway'}},
 {properties:{osm_type:'N',osm_id:3,countrycode:'RU',name:'Москва',osm_key:'place',osm_value:'city'}},
 {properties:{osm_type:'W',osm_id:4,countrycode:'RU',city:'Москва',street:'Тверская улица',housenumber:'13'}},
 {properties:{countrycode:'DE',city:'Berlin',street:'Test',housenumber:'1'}},
 {properties:{countrycode:'RU',name:'Магазин без адреса',osm_key:'shop'}},
]};
test('address hints retain Russian streets and real house numbers, deduplicate and reject non-address POIs',()=>{
 const items=parseAddressResults(result);
 assert.equal(items.length,3);
 const house=items.find(item=>item.kind==='house')!;
 assert.equal(house.label,'Москва, Тверская улица, д. 13');
 assert.equal(addressSelectionValue(house),house.label);
 assert.equal(addressSelectionValue(items.find(item=>item.kind==='city')!),'Москва, ');
 assert.equal(addressSelectionValue(items.find(item=>item.kind==='street')!),'Москва, Тверская улица, д. ');
 assert.deepEqual(parseAddressResults({features:[{},null]}),[]);
});
test('city hints work offline and are not repeated for a fully typed street',()=>{
 assert.ok(citySuggestions('каз').some(item=>item.label==='Казань'));
 assert.ok(citySuggestions('моск').some(item=>item.label==='Москва'));
 assert.equal(citySuggestions('Москва, Тверская, д. 13').length,0);
});
test('address lookup is bounded, caches repeated queries and never sends account data',async()=>{
 let calls=0;
 const search=createAddressSearch({fetcher:async(url,init)=>{
  calls++;const target=new URL(String(url));
  assert.equal(target.hostname,'photon.komoot.io');assert.equal(target.searchParams.get('countrycode'),'RU');
  assert.equal(target.searchParams.has('lang'),false,'the public instance returns Russian local names without an unsupported ru language parameter');
  assert.equal(init?.credentials,'omit');assert.ok(!JSON.stringify(init?.headers??{}).includes('Cookie'));
  return new Response(JSON.stringify(result),{headers:{'Content-Type':'application/json'}});
 }});
 const [a,b]=await Promise.all([search('Москва Тверская 13'),search('Москва Тверская 13')]);
 assert.equal(calls,1);assert.deepEqual(a,b);assert.ok(a.suggestions.some(item=>item.kind==='house'));
 await search('Москва Тверская 13');assert.equal(calls,1);
 await assert.rejects(search('a'.repeat(301)),/адрес/);
});
test('an unavailable address source keeps manual entry and local city hints available',async()=>{
 const search=createAddressSearch({fetcher:async()=>{throw new Error('offline');}});
 const result=await search('Моск');assert.equal(result.unavailable,true);
 assert.ok(result.suggestions.some(item=>item.label==='Москва'));
 assert.ok(result.suggestions.every(item=>item.kind==='city'));
});
