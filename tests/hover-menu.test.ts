import test from 'node:test';
import assert from 'node:assert/strict';
import {setTimeout as wait} from 'node:timers/promises';
import {createHoverMenu} from '../lib/hover-menu.ts';

test('hover opens a section immediately and closes after leaving the whole panel',async()=>{
 let selected:string|null=null;
 const hover=createHoverMenu(id=>{selected=id;},10);
 hover.show('plans');assert.equal(selected,'plans');
 hover.leave();assert.equal(selected,'plans');
 await wait(25);assert.equal(selected,null);hover.dispose();
});
test('moving to another heading cancels the previous pending close',async()=>{
 let selected:string|null=null;
 const hover=createHoverMenu(id=>{selected=id;},10);
 hover.show('plans');hover.leave();hover.show('equipment');
 await wait(25);assert.equal(selected,'equipment');
 hover.hide();assert.equal(selected,null);hover.dispose();
});
test('entering the panel keeps it open and unmount cancels pending work',async()=>{
 let selected:string|null=null;
 const hover=createHoverMenu(id=>{selected=id;},10);
 hover.show('support');hover.leave();hover.hold();
 await wait(25);assert.equal(selected,'support');
 hover.leave();hover.dispose();await wait(25);assert.equal(selected,'support');
});
