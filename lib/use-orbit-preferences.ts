'use client';
import {useSyncExternalStore} from 'react';
import {notifySystem} from '../components/SystemNotices';
import {favoriteToggle} from './orbit-favorites';
const key='rassvet-engineering-orbits-v1',eventName='rassvet-orbit-preferences';
type Preferences={favorites:string[];onlyFavorites:boolean;labels:boolean;footprints:boolean;elevation:number;colorMode:'satellite'|'launch'};
const defaults:Preferences={favorites:[],onlyFavorites:false,labels:false,footprints:false,elevation:25,colorMode:'satellite'};
let current=defaults;
let initialized=false;
function read():Preferences{
 try{
  const value=JSON.parse(localStorage.getItem(key)??'null');
  if(!value||typeof value!=='object')return defaults;
  return {...defaults,favorites:Array.isArray(value.favorites)?[...new Set(value.favorites.filter((id:unknown)=>typeof id==='string'&&/^\d{1,9}$/.test(id)))].slice(0,200) as string[]:[],
   onlyFavorites:value.onlyFavorites===true,labels:value.labels===true,footprints:value.footprints===true,
   elevation:typeof value.elevation==='number'&&Number.isFinite(value.elevation)?Math.max(0,Math.min(90,value.elevation)):25,
   colorMode:value.colorMode==='launch'?'launch':'satellite'};
 }catch{return defaults;}
}
const snapshot=()=>current,serverSnapshot=()=>defaults;
function subscribe(listener:()=>void){
 if(!initialized){current=read();initialized=true;}
 const sync=(event:StorageEvent)=>{if(event.key===key||event.key===null){current=read();listener();}};
 window.addEventListener('storage',sync);window.addEventListener(eventName,listener);
 return()=>{window.removeEventListener('storage',sync);window.removeEventListener(eventName,listener);};
}
export function useOrbitPreferences(){
 const state=useSyncExternalStore(subscribe,snapshot,serverSnapshot);
 function update(patch:Partial<Preferences>){
  current={...current,...patch};
  try{localStorage.setItem(key,JSON.stringify(current));}
  catch{notifySystem('warning','Настройки работают в этой вкладке, но браузер не разрешил их сохранить.');}
  window.dispatchEvent(new Event(eventName));
 }
 function toggleFavorite(id:string){
  const included=current.favorites.includes(id);
  const next=favoriteToggle(current.favorites,current.onlyFavorites,id);
  update({favorites:next.favorites,onlyFavorites:next.onlyFavorites});
  notifySystem('success',included
   ?next.favorites.length?'Аппарат удалён из избранного.':'Избранное пустое — на карте и глобусе снова все аппараты.'
   :next.favorites.length===1?'Аппарат добавлен в избранное — на карте и глобусе показана избранная группа.':'Аппарат добавлен в избранное.');
 }
 return {...state,update,toggleFavorite};
}
export function satelliteColor(id:string,mode:'satellite'|'launch'='satellite'){
 if(mode==='launch')return Number(id)<100000?'#e29a35':'#58b89d';
 return `hsl(${(Number(id)*137.508)%360} 68% 56%)`;
}
