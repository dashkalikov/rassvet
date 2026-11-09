import test from 'node:test';
import assert from 'node:assert/strict';
import {projectRussia} from '../lib/map-projection.ts';

test('Russia projection keeps Chukotka continuous across the 180th meridian',()=>{
 const west=projectRussia(179,65),east=projectRussia(-179,65);
 assert.ok(Math.hypot(east[0]-west[0],east[1]-west[1])<.03);
 assert.ok(east[0]>west[0]);
 const a=projectRussia(180,65),b=projectRussia(-180,65);
 assert.deepEqual(a,b);
});
test('Russia projection places the central meridian and city coordinates in one frame',()=>{
 assert.deepEqual(projectRussia(100,60),[0,0]);
 const frame={scale:100,translate:[500,260] as [number,number]};
 assert.deepEqual(projectRussia(100,60,frame),[500,260]);
 assert.ok(projectRussia(100,75,frame)[1]<260);
 assert.ok(projectRussia(100,45,frame)[1]>260);
 assert.ok(projectRussia(37.6173,55.7558,frame)[0]<500);
 assert.ok(projectRussia(131.8855,43.1155,frame)[0]>500);
});
test('invalid geographic coordinates cannot produce broken SVG geometry',()=>{
 for(const [lon,lat] of [[NaN,60],[100,Infinity],[181,60],[-181,60],[100,90],[100,-90]]){
  assert.throws(()=>projectRussia(lon,lat),/координаты/);
 }
});
