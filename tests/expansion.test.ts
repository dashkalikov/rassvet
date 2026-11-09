import test from 'node:test';
import assert from 'node:assert/strict';
import {quotePlan} from '../lib/quote.ts';
import {createRecords} from '../lib/records.ts';
import {databaseFixture} from './sqlite.ts';
test('connection calculator includes hardware and distinguishes upfront and annual cost',()=>{
  assert.deepEqual(quotePlan('home','monthly'),{monthly:2900,subscriptionDue:2900,equipment:24900,firstPayment:27800,firstYear:59700,yearlySavings:0});
  assert.deepEqual(quotePlan('travel','yearly'),{monthly:4165,subscriptionDue:49980,equipment:24900,firstPayment:74880,firstYear:74880,yearlySavings:8820});
});
test('order detail and edit cannot cross account ownership',async()=>{
  const f=databaseFixture();try{
    const alice=createRecords(f.db,'alice'),bob=createRecords(f.db,'bob');
    const order=await alice.addOrder({plan:'home',billing:'monthly',address:'Москва, учебная улица, 1'});
    assert.equal((await alice.getOrder(order.id))?.id,order.id);
    assert.equal(await bob.getOrder(order.id),undefined);
    assert.equal(await bob.updateOrder(order.id,{plan:'business',billing:'yearly',address:'Казань, учебная улица, 2'}),null);
    assert.equal((await alice.getOrder(order.id))?.plan,'home');
  }finally{f.close();}
});
test('editing an application recalculates its price and preserves its identity',async()=>{
  const f=databaseFixture();try{
    const records=createRecords(f.db,'alice');
    const before=await records.addOrder({plan:'home',billing:'monthly',address:'Москва, учебная улица, 1'});
    const edited=await records.updateOrder(before.id,{plan:'travel',billing:'yearly',address:'Казань, учебная улица, 2',firstPayment:1,userId:'bob'});
    assert.ok(edited);assert.equal(edited.id,before.id);assert.equal(edited.createdAt,before.createdAt);
    assert.equal(edited.firstPayment,74880);assert.equal(edited.userId,'alice');
    await records.cancelOrder(before.id);
    assert.equal(await records.updateOrder(before.id,{plan:'home',billing:'monthly',address:'Москва, учебная улица, 1'}),null);
    assert.equal((await records.getOrder(before.id))?.status,'cancelled');
  }finally{f.close();}
});
