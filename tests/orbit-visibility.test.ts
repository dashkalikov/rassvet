import test from 'node:test';
import assert from 'node:assert/strict';
import {visibilityRadiusDeg} from '../lib/orbits.ts';
test('visibility footprint follows altitude and elevation with physical boundaries',()=>{
 assert.ok(Math.abs(visibilityRadiusDeg(550,0)-22.99)<.2);
 assert.ok(visibilityRadiusDeg(550,25)>0);
 assert.ok(visibilityRadiusDeg(550,25)<visibilityRadiusDeg(550,0));
 assert.ok(visibilityRadiusDeg(1200,25)>visibilityRadiusDeg(550,25));
 assert.equal(visibilityRadiusDeg(550,90),0);
 assert.equal(visibilityRadiusDeg(-1,25),0);
 assert.equal(visibilityRadiusDeg(NaN,25),0);
});
