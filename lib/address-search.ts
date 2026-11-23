import {CONNECTION_CITIES} from './connection-cities.ts';
export type AddressSuggestion={id:string;label:string;kind:'city'|'street'|'house';city:string;street?:string;house?:string};
export type AddressSearchResult={suggestions:AddressSuggestion[];unavailable:boolean;source:'cities'|'osm'};
const normalize=(value:string)=>value.toLocaleLowerCase('ru').replaceAll('ё','е').trim();
const text=(value:unknown)=>typeof value==='string'?value.trim().slice(0,180):'';
export function citySuggestions(query:string):AddressSuggestion[]{
 const needle=normalize(query);
 const cities=needle?CONNECTION_CITIES.filter(city=>normalize(city).includes(needle)):['Москва','Санкт-Петербург','Казань','Екатеринбург','Новосибирск','Владивосток'];
 return cities.slice(0,8).map(city=>({id:'city:'+city,label:city,kind:'city',city}));
}
export function parseAddressResults(payload:unknown):AddressSuggestion[]{
 const features=payload&&typeof payload==='object'&&'features' in payload?(payload as {features:unknown}).features:null;
 if(!Array.isArray(features))return [];
 const items=new Map<string,AddressSuggestion>();
 for(const feature of features.slice(0,30)){
  if(!feature||typeof feature!=='object')continue;
  const props=(feature as {properties?:unknown}).properties;
  if(!props||typeof props!=='object')continue;
  const p=props as Record<string,unknown>;
  if(text(p.countrycode).toUpperCase()!=='RU')continue;
  const place=(p.osm_key==='place'&&['city','town','village','hamlet'].includes(text(p.osm_value)))||['city','locality'].includes(text(p.type));
  const city=text(p.city)||text(p.town)||text(p.village)||(place?text(p.name):'');
  const street=text(p.street)||(p.osm_key==='highway'?text(p.name):'');
  const house=street?text(p.housenumber):'';
  if(!city||(!street&&!place))continue;
  const kind=house?'house':street?'street':'city';
  const label=[city,street,house?'д. '+house:''].filter(Boolean).join(', ');
  const id=normalize(label);if(items.has(id))continue;
  items.set(id,{id,label,kind,city,...(street?{street}:{}),...(house?{house}:{})});
 }
 return [...items.values()].slice(0,8);
}
export function addressSelectionValue(item:AddressSuggestion){return item.kind==='city'?item.city+', ':item.kind==='street'?item.label+', д. ':item.label;}
export function createAddressSearch({fetcher=fetch,now=Date.now}:{fetcher?:typeof fetch;now?:()=>number}={}){
 const cache=new Map<string,{until:number;result:AddressSearchResult}>(),pending=new Map<string,Promise<AddressSearchResult>>();
 return async function search(input:string):Promise<AddressSearchResult>{
  const query=input.trim().replace(/\s+/g,' ');
  if(query.length>300)throw new Error('Введите адрес длиной до 300 символов');
  const local=citySuggestions(query);
  if(query.length<3)return {suggestions:local,source:'cities',unavailable:false};
  const key=normalize(query),saved=cache.get(key);if(saved&&saved.until>now())return saved.result;
  const active=pending.get(key);if(active)return active;
  const task=(async():Promise<AddressSearchResult>=>{
   let result:AddressSearchResult;
   try{
    const url=new URL('https://photon.komoot.io/api/');
    url.searchParams.set('q',query);url.searchParams.set('countrycode','RU');url.searchParams.set('limit','8');
    for(const layer of ['city','street','house'])url.searchParams.append('layer',layer);
    const response=await fetcher(url,{headers:{Accept:'application/json'},credentials:'omit',referrerPolicy:'no-referrer',signal:AbortSignal.timeout(5000)});
    if(!response.ok)throw new Error('Address source unavailable');
    const body=await response.text();if(body.length>300_000)throw new Error('Address response too large');
    const remote=parseAddressResults(JSON.parse(body));
    const combined=new Map<string,AddressSuggestion>();for(const item of [...remote,...local])combined.set(normalize(item.label),item);
    result={suggestions:[...combined.values()].slice(0,8),source:remote.length?'osm':'cities',unavailable:false};
   }catch{result={suggestions:local,source:'cities',unavailable:true};}
   if(cache.size>=100)cache.delete(cache.keys().next().value!);
   cache.set(key,{until:now()+(result.unavailable?15_000:300_000),result});return result;
  })();
  pending.set(key,task);try{return await task;}finally{pending.delete(key);}
 };
}
