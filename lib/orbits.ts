import {twoline2satrec,json2satrec,propagate,eciToGeodetic,gstime,degreesLat,degreesLong,type SatRec,type OMMJsonObject} from 'satellite.js';

export type OrbitSatellite={id:string;name:string;epoch:string;omm?:OMMJsonObject;tle?:[string,string]};
export type OrbitParameters={semiMajorAxisKm:number;perigeeKm:number;apogeeKm:number;periodMin:number;inclinationDeg:number;eccentricity:number};
export type OrbitModel={satellite:OrbitSatellite;record:SatRec;parameters:OrbitParameters};
export type OrbitPoint={time:string;lat:number;lon:number;altKm:number;speedKms:number;eci:{x:number;y:number;z:number}};
export type OrbitSample={epoch:string;semiMajorAxisKm:number};
export type OrbitHistory=Record<string,OrbitSample[]>;
const DAY=86_400_000,RE=6378.137,MU=398600.4418;

function utcDate(value:string){return new Date(/[zZ]|[+-]\d\d:\d\d$/.test(value)?value:value+'Z');}
function checksum(line:string){
 if(line.length!==69||!/^\d$/.test(line[68]))return false;
 let sum=0;for(const c of line.slice(0,68)){if(/\d/.test(c))sum+=Number(c);else if(c==='-')sum++;}
 return sum%10===Number(line[68]);
}

/** Accepts CelesTrak OMM JSON (including 6+ digit IDs), 2LE and named 3LE. */
export function parseOrbitCatalog(text:string):OrbitSatellite[]{
 if(!text.trim()||text.length>1_000_000)throw new Error('Выберите файл TLE или OMM JSON размером до 1 МБ.');
 const result:OrbitSatellite[]=[];
 if(text.trimStart().startsWith('[')||text.trimStart().startsWith('{')){
  let raw:unknown;try{raw=JSON.parse(text);}catch{throw new Error('Не удалось прочитать JSON с орбитальными данными.');}
  const items=Array.isArray(raw)?raw:[raw];
  if(!items.length||items.length>200)throw new Error('В одном каталоге должно быть от 1 до 200 аппаратов.');
  for(const item of items){
   if(!item||typeof item!=='object')throw new Error('Некорректная запись OMM.');
   const v=item as Record<string,unknown>;
   for(const [field,value] of [['CENTER_NAME','EARTH'],['REF_FRAME','TEME'],['TIME_SYSTEM','UTC'],['MEAN_ELEMENT_THEORY','SGP4']])if(v[field]!==undefined&&v[field]!==value)throw new Error('Поддерживаются орбиты вокруг Земли: TEME, UTC, SGP4.');
   const finite=(key:string,min:number,max:number)=>typeof v[key]==='number'&&Number.isFinite(v[key])&&Number(v[key])>=min&&Number(v[key])<=max;
   const epoch=typeof v.EPOCH==='string'?utcDate(v.EPOCH):new Date(NaN);
   if(!finite('NORAD_CAT_ID',1,999_999_999)||!Number.isInteger(v.NORAD_CAT_ID)||!finite('MEAN_MOTION',.01,20)||!finite('ECCENTRICITY',0,.999999)||!finite('INCLINATION',0,180)||!['RA_OF_ASC_NODE','ARG_OF_PERICENTER','MEAN_ANOMALY'].every(k=>finite(k,0,360))||!Number.isFinite(epoch.getTime()))throw new Error('OMM: проверьте номер аппарата, эпоху и элементы орбиты.');
   for(const key of ['BSTAR','MEAN_MOTION_DOT','MEAN_MOTION_DDOT'])if(v[key]!==undefined&&(typeof v[key]!=='number'||!Number.isFinite(v[key])))throw new Error('OMM содержит некорректные числовые поля.');
   const id=String(v.NORAD_CAT_ID),name=String(v.OBJECT_NAME||'NORAD '+id).slice(0,100);
   const omm={...v,OBJECT_NAME:name,EPOCH:epoch.toISOString().replace('Z',''),BSTAR:v.BSTAR??0,MEAN_MOTION_DOT:v.MEAN_MOTION_DOT??0,MEAN_MOTION_DDOT:v.MEAN_MOTION_DDOT??0} as OMMJsonObject;
   result.push({id,name,epoch:epoch.toISOString(),omm});
  }
 }else{
  const lines=text.split(/\r?\n/).map(l=>l.trim()).filter(Boolean);let index=0;
  while(index<lines.length){
   const name=lines[index].startsWith('1 ')?'':lines[index++].replace(/^0 /,'');
   const l1=lines[index++],l2=lines[index++];
   if(!l1?.startsWith('1 ')||!l2?.startsWith('2 ')||l1.slice(2,7)!==l2.slice(2,7)||!checksum(l1)||!checksum(l2))throw new Error('TLE: нужны две строки одного аппарата с верными контрольными суммами.');
   const record=twoline2satrec(l1,l2),epoch=new Date((record.jdsatepoch-2440587.5)*DAY);
   if(!Number.isFinite(record.no)||record.no<=0||!Number.isFinite(epoch.getTime())||record.ecco<0||record.ecco>=1)throw new Error('TLE содержит некорректную орбиту.');
   result.push({id:record.satnum,name:name.slice(0,100)||'NORAD '+record.satnum,epoch:epoch.toISOString(),tle:[l1,l2]});
   if(result.length>200)throw new Error('Можно импортировать до 200 аппаратов.');
  }
 }
 const unique=new Map<string,OrbitSatellite>();
 for(const sat of result){const previous=unique.get(sat.id);if(!previous||sat.epoch>previous.epoch)unique.set(sat.id,sat);}
 return [...unique.values()];
}

export function createOrbitModel(satellite:OrbitSatellite):OrbitModel{
 const record=satellite.omm?json2satrec(satellite.omm):twoline2satrec(...satellite.tle!);
 // Match the original Python tracker: Keplerian parameters from mean motion.
 const meanMotion=satellite.omm?Number(satellite.omm.MEAN_MOTION)*Math.PI*2/86400:Number(satellite.tle![1].slice(52,63))*Math.PI*2/86400;
 const a=Math.cbrt(MU/(meanMotion*meanMotion)),e=record.ecco;
 return {satellite,record,parameters:{semiMajorAxisKm:a,perigeeKm:a*(1-e)-RE,apogeeKm:a*(1+e)-RE,periodMin:2*Math.PI/meanMotion/60,inclinationDeg:record.inclo*180/Math.PI,eccentricity:e}};
}

export function orbitPosition(model:OrbitModel,time:Date):OrbitPoint|null{
 if(!Number.isFinite(time.getTime()))return null;
 try{
  const state=propagate(model.record,time);if(!state)return null;
  const geo=eciToGeodetic(state.position,gstime(time));
  const speedKms=Math.hypot(state.velocity.x,state.velocity.y,state.velocity.z);
  const lat=degreesLat(geo.latitude),lon=degreesLong(geo.longitude);
  if(![lat,lon,geo.height,speedKms].every(Number.isFinite)||geo.height<0)return null;
  return {time:time.toISOString(),lat,lon,altKm:geo.height,speedKms,eci:state.position};
 }catch{return null;}
}

export function orbitTrack(model:OrbitModel,time:Date):OrbitPoint[]{
 const points:OrbitPoint[]=[];
 for(let minute=-45;minute<=45;minute++){const p=orbitPosition(model,new Date(time.getTime()+minute*60_000));if(p)points.push(p);}
 return points;
}

/** One observation per element epoch, never one per timer tick or refresh. */
export function mergeOrbitHistory(history:OrbitHistory,models:OrbitModel[]):OrbitHistory{
 const next:OrbitHistory={...history};
 for(const m of models){
  const observations=new Map<string,OrbitSample>();
  for(const p of history[m.satellite.id]??[]){const date=utcDate(p.epoch);if(Number.isFinite(date.getTime())&&Number.isFinite(p.semiMajorAxisKm)&&p.semiMajorAxisKm>RE)observations.set(date.toISOString(),{epoch:date.toISOString(),semiMajorAxisKm:p.semiMajorAxisKm});}
  observations.set(m.satellite.epoch,{epoch:m.satellite.epoch,semiMajorAxisKm:m.parameters.semiMajorAxisKm});
  next[m.satellite.id]=[...observations.values()].sort((a,b)=>a.epoch.localeCompare(b.epoch)).slice(-500);
 }
 return next;
}

export function climbRate(samples:OrbitSample[]):number|null{
 const valid=samples.filter(p=>Number.isFinite(Date.parse(p.epoch))&&Number.isFinite(p.semiMajorAxisKm)).slice(-10);
 if(valid.length<3)return null;
 const start=Date.parse(valid[0].epoch),xs=valid.map(p=>(Date.parse(p.epoch)-start)/DAY),ys=valid.map(p=>p.semiMajorAxisKm);
 const mx=xs.reduce((a,b)=>a+b,0)/xs.length,my=ys.reduce((a,b)=>a+b,0)/ys.length;
 const den=xs.reduce((s,x)=>s+(x-mx)**2,0);if(!den)return null;
 return Math.round(xs.reduce((s,x,i)=>s+(x-mx)*(ys[i]-my),0)/den*1000)/1000;
}

/** The input is sorted by element epoch. An empty span in the archive stays empty on the chart. */
export function splitOrbitSamples(samples:readonly OrbitSample[]):OrbitSample[][]{
 const segments:OrbitSample[][]=[];
 for(const sample of samples){
  const current=segments.at(-1);
  const previous=current?.at(-1);
  if(current&&previous&&Date.parse(sample.epoch)-Date.parse(previous.epoch)<=2*DAY)current.push(sample);
  else segments.push([sample]);
 }
 return segments;
}

/** Surface visibility cone for a spherical Earth; elevation is measured above the horizon. */
export function visibilityRadiusDeg(altKm:number,elevationDeg:number):number{
 if(!Number.isFinite(altKm)||!Number.isFinite(elevationDeg)||altKm<=0)return 0;
 const elevation=Math.max(0,Math.min(90,elevationDeg))*Math.PI/180;
 return Math.max(0,(Math.acos(RE/(RE+altKm)*Math.cos(elevation))-elevation)*180/Math.PI);
}
