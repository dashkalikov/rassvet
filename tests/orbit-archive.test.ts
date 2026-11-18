import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {databaseFixture} from './sqlite.ts';
import {loadSatelliteHistory} from '../lib/operations-orbits.ts';
test('offline reference archive retains real UTC epochs with physical Kepler axes and provenance',async()=>{
 const archive=JSON.parse(readFileSync(new URL('../lib/data/findrassvet-history.json',import.meta.url),'utf8'));
 const source=JSON.parse(readFileSync(new URL('../lib/data/findrassvet-source.json',import.meta.url),'utf8'));
 assert.equal(Object.keys(archive).length,30);assert.equal(source.observations,12865);
 assert.equal(source.url,'https://findrassvet.ru/api/series');
 for(const samples of Object.values(archive) as {epoch:string;semiMajorAxisKm:number}[][]){
  for(let i=0;i<samples.length;i++){
   assert.ok(Number.isFinite(Date.parse(samples[i].epoch)));
   assert.ok(samples[i].semiMajorAxisKm>6500&&samples[i].semiMajorAxisKm<7500,'axis is measured from Earth centre, not surface');
   if(i)assert.ok(samples[i].epoch>samples[i-1].epoch);
  }
 }
 const f=databaseFixture();try{
  const series=await loadSatelliteHistory(f.db,'68360');
  assert.ok(series.samples.length>100,'a fresh local installation can display a curve without waiting for updates');
  assert.ok(series.samples.at(-1)!.epoch.startsWith('2026-11-17'));
 }finally{f.close();}
});
