import test from 'node:test';
import assert from 'node:assert/strict';
import {runInNewContext} from 'node:vm';
import {resolveAppearance,appearanceMode,oppositeAppearance,APPEARANCE_BOOTSTRAP} from '../lib/appearance.ts';

test('existing preferences remain valid and the header toggle preserves the matte pair',()=>{
 assert.equal(resolveAppearance('light'),'light');assert.equal(resolveAppearance('dark'),'dark');
 assert.equal(appearanceMode(resolveAppearance('light-2026')),'light');
 assert.equal(appearanceMode(resolveAppearance('dark-2026')),'dark');
 assert.equal(oppositeAppearance('light-2026'),'dark-2026');
 assert.equal(oppositeAppearance('dark-2026'),'light-2026');
 assert.equal(oppositeAppearance('light'),'dark');assert.equal(oppositeAppearance('dark'),'light');
 assert.equal(resolveAppearance('__proto__',true),'light');assert.equal(resolveAppearance('unknown',false),'dark');
});

test('the real pre-hydration script restores all four preferences before the page renders',()=>{
 for(const [saved,mode,variant] of [['light','light','light'],['dark','dark','dark'],['light-2026','light','light-2026'],['dark-2026','dark','dark-2026']]){
  const dataset:Record<string,string>={};
  runInNewContext(APPEARANCE_BOOTSTRAP,{document:{documentElement:{dataset}},localStorage:{getItem:()=>saved},matchMedia:()=>({matches:false})});
  assert.deepEqual(dataset,{theme:mode,appearance:variant});
 }
});

test('blocked storage and unknown saved themes safely follow the system appearance',()=>{
 for(const broken of [true,false]){
  const dataset:Record<string,string>={};
  runInNewContext(APPEARANCE_BOOTSTRAP,{document:{documentElement:{dataset}},localStorage:{getItem:()=>{if(broken)throw new Error('blocked');return 'constructor';}},matchMedia:()=>({matches:true})});
  assert.deepEqual(dataset,{theme:'light',appearance:'light'});
 }
 const dataset:Record<string,string>={};
 runInNewContext(APPEARANCE_BOOTSTRAP,{document:{documentElement:{dataset}}});
 assert.deepEqual(dataset,{theme:'dark',appearance:'dark'});
});
