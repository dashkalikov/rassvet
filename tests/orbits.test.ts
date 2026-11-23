import test from 'node:test';
import assert from 'node:assert/strict';
import {parseOrbitCatalog,createOrbitModel,orbitPosition,orbitTrack,orbitTrackStep,mergeOrbitHistory,climbRate,splitOrbitSamples} from '../lib/orbits.ts';

test('an orbit chart breaks its line across gaps longer than two days',()=>{
 const samples=['2026-10-18','2026-10-20','2026-11-03'].map((date,i)=>({
  epoch:date+'T12:00:00.000Z',semiMajorAxisKm:6878+i,
 }));
 assert.deepEqual(splitOrbitSamples(samples),[samples.slice(0,2),samples.slice(2)]);
 assert.deepEqual(splitOrbitSamples([]),[]);
});

// Vallado SGP4 verification satellite 00005, at its element epoch.
const tle=`VANGUARD 1
1 00005U 58002B   00179.78495062  .00000023  00000-0  28098-4 0  4753
2 00005  34.2682 348.7242 1859667 331.7664  19.3264 10.82419157413667`;
const omm={OBJECT_NAME:'RASSVET-3 32',OBJECT_ID:'2026-165R',NORAD_CAT_ID:100098,EPOCH:'2026-11-03T22:13:08.141088',MEAN_MOTION:15.18892175,ECCENTRICITY:.00018553,INCLINATION:82.2944,RA_OF_ASC_NODE:115.9344,ARG_OF_PERICENTER:112.843,MEAN_ANOMALY:247.3,BSTAR:.000077007048,MEAN_MOTION_DOT:.00001636,MEAN_MOTION_DDOT:0,REV_AT_EPOCH:1662,EPHEMERIS_TYPE:0,CLASSIFICATION_TYPE:'U',ELEMENT_SET_NO:999};

test('OMM import keeps six-digit catalogue numbers and interprets an unzoned epoch as UTC',()=>{
 const [sat]=parseOrbitCatalog(JSON.stringify([omm]));
 assert.equal(sat.id,'100098');assert.equal(sat.epoch,'2026-11-03T22:13:08.141Z');
 const model=createOrbitModel(sat);
 assert.ok(model.parameters.periodMin>94&&model.parameters.periodMin<96);
 assert.ok(model.parameters.perigeeKm>500&&model.parameters.perigeeKm<600);
 assert.ok(orbitPosition(model,new Date(sat.epoch)));
});

test('TLE propagation matches the published Vallado verification vector at epoch',()=>{
 const [sat]=parseOrbitCatalog(tle),model=createOrbitModel(sat);
 const position=orbitPosition(model,new Date(sat.epoch));assert.ok(position);
 assert.ok(Math.abs(position.eci.x-7022.4653)<.1);
 assert.ok(Math.abs(position.eci.y+1400.083)<.1);
 assert.ok(Math.abs(position.eci.z-.03995)<.1);
 const track=orbitTrack(model,new Date(sat.epoch));
 assert.equal(track.length,91);
 assert.equal(track[0].time,new Date(Date.parse(sat.epoch)-45*60_000).toISOString());
 assert.equal(track.at(-1)?.time,new Date(Date.parse(sat.epoch)+45*60_000).toISOString());
 assert.ok(track.every(p=>Number.isFinite(p.lat)&&p.lon>=-180&&p.lon<=180));
});

test('catalogue import rejects malformed or oversized data instead of drawing invalid points',()=>{
 for(const input of ['', '<html>error</html>',JSON.stringify([{...omm,MEAN_MOTION:0}]),JSON.stringify([{...omm,EPOCH:'bad'}]),JSON.stringify([{...omm,INCLINATION:181}]),JSON.stringify([{...omm,CENTER_NAME:'MARS'}]),JSON.stringify([{...omm,TIME_SYSTEM:'TAI'}]),tle.replace('4753','4754')]) assert.throws(()=>parseOrbitCatalog(input));
 assert.throws(()=>parseOrbitCatalog('x'.repeat(1_000_001)));
});

test('duplicate records keep the newest elements and do not inflate the history',()=>{
 const [sat]=parseOrbitCatalog(JSON.stringify([omm,{...omm,EPOCH:'2026-11-02T00:00:00'}]));
 assert.equal(sat.epoch,'2026-11-03T22:13:08.141Z');
 const m=createOrbitModel(sat),history=mergeOrbitHistory({},[m]);
 assert.deepEqual(mergeOrbitHistory(history,[m]),history);
 assert.equal(climbRate(history[sat.id]),null);
 assert.equal(climbRate([{epoch:'2026-11-01T00:00:00Z',semiMajorAxisKm:6800},{epoch:'2026-11-02T00:00:00Z',semiMajorAxisKm:6802},{epoch:'2026-11-03T00:00:00Z',semiMajorAxisKm:6804}]),2);
 assert.equal(climbRate([{epoch:'bad',semiMajorAxisKm:6800}]),null);
});
test('a sparsely sampled ground track keeps the same ends and covers the same window',()=>{
  const [sat]=parseOrbitCatalog(JSON.stringify([omm]));
  const model=createOrbitModel(sat),at=new Date(sat.epoch);
  const dense=orbitTrack(model,at),sparse=orbitTrackStep(model,at,3);
  assert.equal(dense.length,91);
  assert.equal(sparse.length,31);
  assert.deepEqual(sparse[0],dense[0]);
  assert.deepEqual(sparse.at(-1),dense.at(-1));
});
