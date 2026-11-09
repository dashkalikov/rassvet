import test from 'node:test';
import assert from 'node:assert/strict';
import {quoteEquipment,readEquipment} from '../lib/equipment.ts';
import {buildOrder} from '../lib/domain.ts';
import {createRecords} from '../lib/records.ts';
import {databaseFixture} from './sqlite.ts';
const config={model:'mini',mount:'wall',cable:'25',router:'mesh',backup:true,carryCase:true};
test('equipment quote prices every option from the catalog and ignores supplied totals',()=>{
 const result=quoteEquipment({...config,total:1,price:1},'travel');
 assert.equal(result.total,40400);assert.equal(result.items.length,6);assert.deepEqual(result.config,config);
 assert.equal(quoteEquipment({model:'standard'},'home').total,24900);
});
test('incompatible models, unsupported mounts and unknown options are rejected',()=>{
 assert.throws(()=>quoteEquipment(config,'business'),/тариф/i);
 assert.throws(()=>quoteEquipment({...config,mount:'roof'}),/креплен/i);
 assert.throws(()=>quoteEquipment({...config,router:'invented'}),/роутер/i);
 assert.throws(()=>quoteEquipment({...config,cable:'999'}),/кабел/i);
 assert.throws(()=>quoteEquipment({...config,backup:'true'}),/комплект/i);
});
test('shared configuration is parsed safely and returns no executable or unknown data',()=>{
 assert.deepEqual(readEquipment(JSON.stringify(config)),config);
 assert.equal(readEquipment('{broken'),null);assert.equal(readEquipment(JSON.stringify({model:'unknown'})),null);
});
test('connection orders use the configured hardware amount, not the default bundle',()=>{
 const order=buildOrder({plan:'travel',billing:'monthly',address:'Казань, учебная улица, 2',equipment:config,equipmentPrice:1});
 assert.equal(order.equipmentPrice,40400);assert.equal(order.firstPayment,45300);
 assert.deepEqual(JSON.parse(order.equipmentConfig!),config);
});
test('configuration survives saving and editing a request and stays private',async()=>{
 const f=databaseFixture();try{const alice=createRecords(f.db,'alice'),bob=createRecords(f.db,'bob');
 const order=await alice.addOrder({plan:'travel',billing:'monthly',address:'Казань, учебная улица, 2',equipment:config});
 const saved=await alice.getOrder(order.id);assert.ok(saved);assert.equal(saved.equipmentPrice,40400);assert.deepEqual(JSON.parse(saved.equipmentConfig!),config);
 assert.equal(await bob.getOrder(order.id),undefined);
 const edited=await alice.updateOrder(order.id,{plan:'travel',billing:'yearly',address:'Казань, учебная улица, 3'});
 assert.ok(edited);assert.equal(edited.firstPayment,90380);assert.deepEqual(JSON.parse(edited.equipmentConfig!),config);
 }finally{f.close();}
});
