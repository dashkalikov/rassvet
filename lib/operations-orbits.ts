import {desc,eq,sql} from 'drizzle-orm';
import type {DrizzleD1Database} from 'drizzle-orm/d1';
import * as schema from '../db/schema.ts';
import catalog from './data/orbit-catalog.json' with {type:'json'};
import archive from './data/orbit-history.json' with {type:'json'};
import referenceArchive from './data/findrassvet-history.json' with {type:'json'};
import {createOrbitCatalogService,type OrbitCatalogResult} from './orbit-catalog.ts';
import {climbRate,createOrbitModel,mergeOrbitHistory,orbitPosition,parseOrbitCatalog,type OrbitSatellite} from './orbits.ts';

type Database=DrizzleD1Database<typeof schema>;
const table=schema.orbitObservations;
const builtIn=parseOrbitCatalog(JSON.stringify(catalog));
const service=createOrbitCatalogService();
const builtInById=new Map(builtIn.map(satellite=>[satellite.id,satellite]));

export async function saveOrbitObservations(db:Database,result:OrbitCatalogResult){
  const queries=result.catalog.map(sat=>db.insert(table).values({
    norad:sat.id,epoch:sat.epoch,observedAt:result.fetchedAt,elements:JSON.stringify(sat),
  }).onConflictDoNothing());
  if(queries.length)await db.batch([queries[0],...queries.slice(1)]);
}

export async function fetchOperationalCatalog(db:Database){
  const result=await service.load();
  await saveOrbitObservations(db,result);
  return result;
}

export async function loadOperationalElements(db:Database){
  const stored=await db.select().from(table).where(sql`rowid IN (
    SELECT rowid FROM orbit_observations GROUP BY norad HAVING epoch=max(epoch)
  )`).all();
  const latest=new Map(builtIn.map(sat=>[sat.id,{satellite:sat,source:'Снимок CelesTrak',observedAt:'2026-11-04T21:45:14Z'}]));
  for(const row of stored){
    const old=latest.get(row.norad);
    if(!old||old.satellite.epoch<=row.epoch)latest.set(row.norad,{
      satellite:JSON.parse(row.elements) as OrbitSatellite,source:'Обновление CelesTrak',observedAt:row.observedAt,
    });
  }
  return [...latest.values()].sort((a,b)=>Number(a.satellite.id)-Number(b.satellite.id));
}

export async function loadSatelliteMetrics(db:Database,now=new Date()){
  const latest=await loadOperationalElements(db);
  return latest.map(({satellite,source,observedAt})=>{
    const model=createOrbitModel(satellite);
    const ageHours=(now.getTime()-Date.parse(satellite.epoch))/3_600_000;
    const time=Math.abs(ageHours)<=168?now:new Date(satellite.epoch);
    const point=orbitPosition(model,time);
    return {id:satellite.id,name:satellite.name,epoch:satellite.epoch,source,observedAt,ageHours,calculatedAt:time.toISOString(),
      ...model.parameters,altKm:point?.altKm??null,speedKms:point?.speedKms??null,latitude:point?.lat??null,longitude:point?.lon??null};
  });
}

function orbitSeries(id:string,rows:ReadonlyArray<{elements:string}>){
  const seed=builtInById.get(id);
  const models=seed?[createOrbitModel(seed)]:[];
  for(const row of rows)models.push(createOrbitModel(JSON.parse(row.elements) as OrbitSatellite));
  const baseline=new Map<string,{epoch:string;semiMajorAxisKm:number}>();
  for(const sample of [...((archive as Record<string,{epoch:string;semiMajorAxisKm:number}[]>)[id]??[]),...((referenceArchive as Record<string,{epoch:string;semiMajorAxisKm:number}[]>)[id]??[])])baseline.set(sample.epoch,sample);
  const samples=mergeOrbitHistory({[id]:[...baseline.values()]},models)[id]??[];
  return {id,samples,climbKmDay:climbRate(samples)};
}

export async function loadSatelliteHistory(db:Database,id:string){
  const rows=await db.select({elements:table.elements}).from(table).where(eq(table.norad,id)).orderBy(desc(table.epoch)).limit(500);
  return orbitSeries(id,rows);
}

export async function loadOrbitalArchive(db:Database,ids:string[]){
  const rows=await db.all<{norad:string;elements:string}>(sql`
    SELECT norad,elements FROM (
      SELECT norad,elements,row_number() OVER (PARTITION BY norad ORDER BY epoch DESC) AS rank
      FROM orbit_observations
    ) WHERE rank<=500`);
  const grouped=new Map<string,{elements:string}[]>();
  for(const row of rows){
    const entries=grouped.get(row.norad)??[];
    entries.push(row);
    grouped.set(row.norad,entries);
  }
  return ids.map(id=>orbitSeries(id,grouped.get(id)??[]));
}
