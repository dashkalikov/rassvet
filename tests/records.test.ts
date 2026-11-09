import {databaseFixture} from './sqlite.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRecords } from '../lib/records.ts';

function fixture() { const f=databaseFixture(); return {...f,alice:createRecords(f.db,'alice'),bob:createRecords(f.db,'bob')}; }
test('saved orders keep canonical price and never appear in another account', async () => {
  const f = fixture(); try {
    const order = await f.alice.addOrder({plan:'home',billing:'monthly',address:'Москва, учебная улица, 1',price:1,userId:'bob'});
    const own = await f.alice.getOrders();
    assert.equal(own.length,1); assert.equal(own[0].firstPayment,27800); assert.equal(own[0].id,order.id);
    assert.equal((await f.bob.getOrders()).length,0);
  } finally { f.close(); }
});
test('only the owner can cancel an open order and its history remains', async () => {
  const f = fixture(); try {
    const order = await f.alice.addOrder({plan:'home',billing:'monthly',address:'Москва, учебная улица, 1'});
    assert.equal(await f.bob.cancelOrder(order.id),false);
    assert.equal(await f.alice.cancelOrder(order.id),true);
    assert.equal(await f.alice.cancelOrder(order.id),false);
    assert.equal((await f.alice.getOrders())[0].status,'cancelled');
  } finally { f.close(); }
});
test('profiles update rather than duplicate and stay private', async () => {
  const f = fixture(); try {
    await f.alice.saveProfile({name:'Анна',phone:''});
    await f.alice.saveProfile({name:'Анна Петрова',phone:'+7 (999) 123-45-67'});
    const saved = await f.alice.getProfile();
    assert.ok(saved);
    assert.equal(saved.name,'Анна Петрова');
    assert.equal(saved.phone,'+79991234567');
    assert.equal(await f.bob.getProfile(),undefined);
  } finally { f.close(); }
});
test('support history is persisted for the sender only', async () => {
  const f = fixture(); try {
    await f.alice.addTicket({subject:'Подключение',message:'Нужна помощь с терминалом.'});
    assert.equal((await f.alice.getTickets())[0].message,'Нужна помощь с терминалом.');
    assert.equal((await f.bob.getTickets()).length,0);
  } finally { f.close(); }
});
test('record access rejects an absent identity', () => {
  const f = fixture(); try { assert.throws(() => createRecords(f.db,''),/авторизац/); } finally { f.close(); }
});
