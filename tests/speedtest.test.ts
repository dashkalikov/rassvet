import test from 'node:test';
import assert from 'node:assert/strict';
import {transferMbps,latencyMetrics,pickSpeedtestPlan,demoMetrics} from '../lib/speedtest.ts';
import {PLANS} from '../lib/domain.ts';
import {createRecords} from '../lib/records.ts';
import {databaseFixture} from './sqlite.ts';

test('throughput weights transferred bytes and elapsed time rather than averaging rates',()=>{
 assert.equal(transferMbps([{bytes:1_000_000,durationMs:1000},{bytes:9_000_000,durationMs:3000}]),20);
 assert.equal(transferMbps([{bytes:10_000_000,durationMs:100}]),800);
});
test('invalid transfer measurements cannot become zero or infinite speed results',()=>{
 for(const samples of [[],[{bytes:1,durationMs:0}],[{bytes:NaN,durationMs:20}],[{bytes:-1,durationMs:1}],[{bytes:1,durationMs:Infinity}]])assert.throws(()=>transferMbps(samples));
});
test('ping is the median and jitter is the mean difference of consecutive probes',()=>{
 assert.deepEqual(latencyMetrics([10,14,20]),{ping:14,jitter:5});
 assert.deepEqual(latencyMetrics([10,14,20,100]),{ping:17,jitter:30});
 assert.throws(()=>latencyMetrics([NaN]));
 assert.throws(()=>latencyMetrics([]));
});
test('account default skips cancelled and unknown plans and chooses the newest valid request',()=>{
 const orders=[
  {id:'old',plan:'home',status:'new',createdAt:'2026-11-01T12:00:00Z'},
  {id:'recent',plan:'travel',status:'new',createdAt:'2026-11-03T12:00:00Z'},
  {id:'cancelled',plan:'business',status:'cancelled',createdAt:'2026-11-04T12:00:00Z'},
  {id:'invalid',plan:'unknown',status:'new',createdAt:'2026-11-05T12:00:00Z'},
 ];
 assert.deepEqual(pickSpeedtestPlan(orders),{plan:'travel',orderId:'recent'});
 assert.deepEqual(orders.map(order=>order.id),['old','recent','cancelled','invalid']);
 assert.equal(pickSpeedtestPlan(orders.filter(order=>order.status==='cancelled')),null);
});
test('automatic tariff choice stays inside the authenticated account records',async()=>{
 const fixture=databaseFixture();try{
  const alice=createRecords(fixture.db,'alice'),bob=createRecords(fixture.db,'bob');
  const aliceOrder=await alice.addOrder({plan:'home',billing:'monthly',address:'Москва, учебная улица, 1'});
  await bob.addOrder({plan:'business',billing:'yearly',address:'Казань, учебная улица, 2'});
  assert.deepEqual(pickSpeedtestPlan(await alice.getOrders()),{plan:'home',orderId:aliceOrder.id});
  await alice.cancelOrder(aliceOrder.id);
  assert.equal(pickSpeedtestPlan(await alice.getOrders()),null);
 }finally{fixture.close();}
});
test('tariff simulation is explicitly labelled and stays below the catalog download ceiling',()=>{
 for(const plan of PLANS)for(const condition of ['clear','busy','obstructed'] as const){
  const result=demoMetrics(plan.id,condition);
  assert.equal(result.mode,'demo');
  assert.ok(result.download>0&&result.download<=plan.speed);
  assert.ok(result.upload>0&&result.ping>0&&result.jitter>=0);
 }
 assert.ok(demoMetrics('home','busy').download<demoMetrics('home','clear').download);
 assert.ok(demoMetrics('business','busy').download/250>demoMetrics('home','busy').download/150);
 assert.throws(()=>demoMetrics('unknown' as 'home','clear'));
});
