import test from 'node:test';
import assert from 'node:assert/strict';
import {setTimeout as wait} from 'node:timers/promises';
import {createMenuPresence} from '../lib/menu-presence.ts';

type State={id:string|null;phase:'open'|'closing'};
async function fixture(duration:number|(()=>number)=12) {
  const states:State[]=[];
  return {states,presence:createMenuPresence(state=>states.push(state),duration),last:()=>states.at(-1)};
}

test('a closing menu stays mounted but becomes non-interactive until its fade completes',async()=>{
  const f=await fixture();
  f.presence.set('plans');assert.deepEqual(f.last(),{id:'plans',phase:'open'});
  f.presence.set(null);assert.deepEqual(f.last(),{id:'plans',phase:'closing'});
  await wait(30);assert.deepEqual(f.last(),{id:null,phase:'open'});f.presence.dispose();
});

test('switching sections fades the old content before mounting the requested one',async()=>{
  const f=await fixture();
  f.presence.set('plans');f.presence.set('equipment');
  assert.deepEqual(f.last(),{id:'plans',phase:'closing'});
  await wait(30);assert.deepEqual(f.last(),{id:'equipment',phase:'open'});f.presence.dispose();
});

test('rapid pointer changes cannot reopen an obsolete section',async()=>{
  const f=await fixture(20);
  f.presence.set('plans');f.presence.set('equipment');await wait(5);f.presence.set('support');
  await wait(40);assert.deepEqual(f.last(),{id:'support',phase:'open'});
  assert.equal(f.states.some(state=>state.id==='equipment'&&state.phase==='open'),false);f.presence.dispose();
});

test('returning to the outgoing menu cancels its removal',async()=>{
  const f=await fixture();
  f.presence.set('plans');f.presence.set(null);f.presence.set('plans');
  assert.deepEqual(f.last(),{id:'plans',phase:'open'});
  await wait(30);assert.deepEqual(f.last(),{id:'plans',phase:'open'});f.presence.dispose();
});

test('breakpoint changes clear the panel immediately and unmount cancels pending callbacks',async()=>{
  const f=await fixture();
  f.presence.set('plans');f.presence.set('support');f.presence.clear();
  assert.deepEqual(f.last(),{id:null,phase:'open'});await wait(30);assert.deepEqual(f.last(),{id:null,phase:'open'});
  f.presence.set('equipment');f.presence.set(null);const count=f.states.length;f.presence.dispose();
  await wait(30);assert.equal(f.states.length,count);
});

test('reduced motion completes switches and closes without an animation delay',async()=>{
  const f=await fixture(()=>0);
  f.presence.set('plans');f.presence.set('equipment');assert.deepEqual(f.last(),{id:'equipment',phase:'open'});
  f.presence.set(null);assert.deepEqual(f.last(),{id:null,phase:'open'});
  assert.equal(f.states.some(state=>state.phase==='closing'),false);f.presence.dispose();
});
