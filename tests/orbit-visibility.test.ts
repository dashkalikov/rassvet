import test from 'node:test';
import assert from 'node:assert/strict';
import {visibilityRadiusDeg,visibilityRingPoints} from '../lib/orbits.ts';
function angularDistanceDeg(a:[number,number],b:[number,number]){
  const toRad=(value:number)=>value*Math.PI/180;
  const [latA,lonA]=a,[latB,lonB]=b;
  const phi1=toRad(latA),lam1=toRad(lonA),phi2=toRad(latB),lam2=toRad(lonB);
  return Math.acos(Math.sin(phi1)*Math.sin(phi2)+Math.cos(phi1)*Math.cos(phi2)*Math.cos(lam2-lam1))*180/Math.PI;
}
test('visibility footprint follows altitude and elevation with physical boundaries',()=>{
  assert.ok(Math.abs(visibilityRadiusDeg(550,0)-22.99)<.2);
  assert.ok(visibilityRadiusDeg(550,25)>0);
  assert.ok(visibilityRadiusDeg(550,25)<visibilityRadiusDeg(550,0));
  assert.ok(visibilityRadiusDeg(1200,25)>visibilityRadiusDeg(550,25));
  assert.equal(visibilityRadiusDeg(550,90),0);
  assert.equal(visibilityRadiusDeg(-1,25),0);
  assert.equal(visibilityRadiusDeg(NaN,25),0);
});
test('the footprint ring is an even great-circle discretisation around the sub-satellite point',()=>{
  const ring=visibilityRingPoints(20,50,30);
  assert.equal(ring.length,72);
  for(const [lon,lat] of ring){
    assert.ok(Number.isFinite(lon)&&Number.isFinite(lat));
    assert.ok(Math.abs(lon)<=180&&Math.abs(lat)<=90);
    assert.ok(Math.abs(angularDistanceDeg([20,50],[lat,lon])-30)<1e-6);
  }
  // The first and last step are adjacent points of the same closed ring.
  const first=ring[0],last=ring.at(-1)!;
  const asLatLon=([lon,lat]:[number,number]):[number,number]=>[lat,lon];
  assert.ok(angularDistanceDeg(asLatLon(first),asLatLon(last))<360/72*1.000001);
});
test('the footprint ring degrades safely on invalid input',()=>{
  assert.deepEqual(visibilityRingPoints(0,0,0),[]);
  assert.deepEqual(visibilityRingPoints(NaN,0,30),[]);
  assert.deepEqual(visibilityRingPoints(0,0,30,2),[]);
});
