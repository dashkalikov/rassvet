'use client';
import {memo,useEffect,useId,useMemo,useRef,useState} from 'react';
import {geoCircle,geoDistance,geoEquirectangular,geoGraticule10,geoOrthographic,geoPath} from 'd3-geo';
import type {GeoPermissibleObjects} from 'd3-geo';
import {Crosshair,Minus,Plus,RotateCcw} from 'lucide-react';
import land from '../lib/data/orbit-world-land.json';
import {visibilityRadiusDeg,type OrbitPoint} from '../lib/orbits';
import FullscreenPanel from './FullscreenPanel';

type Marker={id:string;name:string;point:OrbitPoint|null;color?:string};
export default memo(function OrbitMap({markers,selectedId,track,onSelect,fixedMode,showLabels=false,showFootprints=false,elevation=25}:{markers:Marker[];selectedId:string;track:OrbitPoint[];onSelect:(id:string)=>void;fixedMode?:'map'|'globe';showLabels?:boolean;showFootprints?:boolean;elevation?:number}){
 const selected=markers.find(m=>m.id===selectedId);
 const id=useId().replace(/:/g,''),[preferredMode,setMode]=useState<'globe'|'map'>('globe'),[rotation,setRotation]=useState<[number,number]>(()=>selected?.point?[-selected.point.lon,-selected.point.lat]:[-65,-25]),[zoom,setZoom]=useState(1);
 const mode=fixedMode??preferredMode;
 const lastSelected=useRef(selectedId);
 useEffect(()=>{if(lastSelected.current===selectedId)return;lastSelected.current=selectedId;const point=markers.find(m=>m.id===selectedId)?.point;if(point&&mode==='globe')setRotation([-point.lon,-point.lat]);},[selectedId,markers,mode]);
 const drag=useRef<{x:number;y:number;rotation:[number,number]}|null>(null);
 const projection=useMemo(()=>mode==='globe'?geoOrthographic().rotate(rotation).translate([430,280]).scale(223*zoom).clipAngle(90):geoEquirectangular().translate([430,280]).scale(125*zoom),[mode,rotation,zoom]);
 const path=useMemo(()=>geoPath(projection),[projection]);
 const grid=useMemo(()=>geoGraticule10(),[]);
 function visible(p:OrbitPoint){return mode==='map'||geoDistance([p.lon,p.lat],[-rotation[0],-rotation[1]])<Math.PI/2;}
 function orbitalPoint(p:OrbitPoint):[number,number]|null{
  const xy=projection([p.lon,p.lat]);if(!xy)return null;
  if(mode==='map')return xy;
  const factor=1+p.altKm/6378.137,x=430+(xy[0]-430)*factor,y=280+(xy[1]-280)*factor;
  if(!visible(p)&&Math.hypot(x-430,y-280)<223*zoom)return null;
  return [x,y];
 }
 function trail(points:OrbitPoint[]){
  if(mode==='map')return path({type:'LineString',coordinates:points.map(p=>[p.lon,p.lat])})??'';
  let d='',pen=false;for(const p of points){const xy=orbitalPoint(p);if(!xy){pen=false;continue;}d+=`${pen?'L':'M'}${xy[0].toFixed(2)},${xy[1].toFixed(2)}`;pen=true;}return d;
 }
 const middle=Math.floor(track.length/2);
 function center(){if(selected?.point){setRotation([-selected.point.lon,-selected.point.lat]);setMode('globe');}}
 return <FullscreenPanel title={mode==='globe'?'Глобус спутников':'Карта спутников'} className="orbit-fullscreen"><section className="orbit-map-panel" aria-label="Визуализация орбит">
  <div className="orbit-map-toolbar">{!fixedMode&&<div className="orbit-segment" aria-label="Вид карты"><button aria-pressed={mode==='globe'} onClick={()=>{setMode('globe');setZoom(1);}}>Глобус</button><button aria-pressed={mode==='map'} onClick={()=>{setMode('map');setZoom(1);}}>Карта</button></div>}<span className="orbit-map-label">ЗЕМЛЯ / {mode==='globe'?'ОРБИТАЛЬНЫЙ ВИД':'ТРАССА ПО ПОВЕРХНОСТИ'}</span></div>
  <svg className="orbit-earth" viewBox="0 0 860 560" role="group" aria-label="Схема Земли с рассчитанными положениями спутников. Выберите аппарат в списке."
   tabIndex={0} onKeyDown={e=>{if(mode!=='globe')return;const delta:Record<string,[number,number]>={ArrowLeft:[-10,0],ArrowRight:[10,0],ArrowUp:[0,10],ArrowDown:[0,-10]};if(delta[e.key]){e.preventDefault();setRotation(([lon,lat])=>[lon+delta[e.key][0],Math.max(-85,Math.min(85,lat+delta[e.key][1]))]);}}}
   onPointerDown={e=>{if(mode!=='globe'||(e.target as Element).closest('[data-marker]'))return;drag.current={x:e.clientX,y:e.clientY,rotation};e.currentTarget.setPointerCapture(e.pointerId);}}
   onPointerMove={e=>{const d=drag.current;if(d)setRotation([d.rotation[0]+(e.clientX-d.x)*.3,Math.max(-85,Math.min(85,d.rotation[1]-(e.clientY-d.y)*.3))]);}}
   onPointerUp={()=>{drag.current=null;}} onPointerCancel={()=>{drag.current=null;}}>
   <defs><radialGradient id={`${id}-sea`} cx="32%" cy="28%"><stop stopColor="var(--orbit-sea-light)"/><stop offset="1" stopColor="var(--orbit-sea)"/></radialGradient><radialGradient id={`${id}-halo`}><stop offset=".81" stopColor="var(--accent)" stopOpacity="0"/><stop offset=".92" stopColor="var(--accent)" stopOpacity=".16"/><stop offset="1" stopColor="var(--accent)" stopOpacity="0"/></radialGradient></defs>
   {mode==='globe'?<g aria-hidden="true">{Array.from({length:55},(_,i)=><circle key={i} cx={(i*137+31)%860} cy={(i*79+17)%560} r={i%3===0?1.2:.65} className="orbit-star"/>)}<circle cx="430" cy="280" r={267*zoom} fill={`url(#${id}-halo)`}/></g>:null}
   <path d={path({type:'Sphere'})??''} fill={`url(#${id}-sea)`} className="orbit-ocean"/>
   <path d={path(grid)??''} className="orbit-graticule"/>
   <path d={path(land as GeoPermissibleObjects)??''} className="orbit-land"/>
   {showFootprints&&<g className="orbit-footprints" aria-label="Зоны радиовидимости">{markers.map(marker=>marker.point?<path key={marker.id} d={path(geoCircle().center([marker.point.lon,marker.point.lat]).radius(visibilityRadiusDeg(marker.point.altKm,elevation)).precision(3)())??''} fill={marker.color??'var(--accent)'} stroke={marker.color??'var(--accent)'} fillOpacity={marker.id===selectedId ? .16 : .045} strokeOpacity={marker.id===selectedId ? .85 : .3} strokeWidth={marker.id===selectedId?1.5:.7}><title>{marker.name+' · радиовидимость при угле от '+elevation+'°'}</title></path>:null)}</g>}
   <path d={trail(track.slice(0,middle+1))} className="orbit-trail orbit-trail-past"/>
   <path d={trail(track.slice(middle))} className="orbit-trail orbit-trail-future"/>
   {markers.map(m=>{if(!m.point)return null;const xy=orbitalPoint(m.point);if(!xy)return null;const active=m.id===selectedId;return <g key={m.id} data-marker="true" className={`orbit-marker ${active?'selected':''}`} transform={`translate(${xy[0]},${xy[1]})`} role="button" tabIndex={0} aria-label={`Выбрать ${m.name}`} onClick={()=>onSelect(m.id)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();onSelect(m.id);}}}><title>{`${m.name} · ${m.point.altKm.toFixed(0)} км`}</title>{active?<circle r="13" className="orbit-marker-halo"/>:null}<circle r={active?5:3.5} style={m.color?{fill:m.color,stroke:'var(--surface)'}:undefined}/><circle r="12" fill="transparent" stroke="none"/>{active||showLabels?<text x="12" y="-12">{m.name}</text>:null}</g>;})}
  </svg>
  <div className="orbit-map-tools"><button title="Увеличить" aria-label="Увеличить карту" disabled={zoom>=1.8} onClick={()=>setZoom(z=>Math.min(1.8,z+.2))}><Plus size={18}/></button><button title="Уменьшить" aria-label="Уменьшить карту" disabled={zoom<=.8} onClick={()=>setZoom(z=>Math.max(.8,z-.2))}><Minus size={18}/></button>{fixedMode!=='map'&&<button title="Показать выбранный спутник" aria-label="Центрировать выбранный спутник" disabled={!selected?.point} onClick={center}><Crosshair size={18}/></button>}<button title="Сбросить вид" aria-label="Сбросить вид карты" onClick={()=>{setRotation([-65,-25]);setZoom(1);}}><RotateCcw size={17}/></button></div>
  <div className="orbit-map-legend"><span><i/>Прошедшие 45 минут</span><span><i/>Следующие 45 минут</span><small>{mode==='globe'?'Вращайте мышью или стрелками клавиатуры':'Контуры: Natural Earth · без загрузки тайлов'}</small></div>
 </section></FullscreenPanel>;
});
