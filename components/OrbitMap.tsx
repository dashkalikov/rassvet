'use client';
import {memo,useEffect,useId,useMemo,useRef,useState} from 'react';
import {geoCircle,geoDistance,geoEquirectangular,geoGraticule10,geoOrthographic,geoPath} from 'd3-geo';
import type {GeoPermissibleObjects} from 'd3-geo';
import {Crosshair,Minus,Plus,RotateCcw} from 'lucide-react';
import land from '../lib/data/orbit-world-land.json';
import {visibilityRadiusDeg,visibilityRingPoints,type OrbitPoint} from '../lib/orbits';
import FullscreenPanel from './FullscreenPanel';

type Marker={id:string;name:string;point:OrbitPoint|null;color?:string};
/** One footprint drawing: the surface ring and, on the globe, the cone converging at the satellite. */
type Footprint={id:string;name:string;color:string;title:string;circle?:string;ring?:string;cone?:string;rays?:string};
export default memo(function OrbitMap({markers,selectedId,track,tracks,onSelect,fixedMode,showLabels=false,showFootprints=false,elevation=25,favorites=[]}:{markers:Marker[];selectedId:string;track:OrbitPoint[];tracks?:Record<string,OrbitPoint[]>;onSelect:(id:string)=>void;fixedMode?:'map'|'globe';showLabels?:boolean;showFootprints?:boolean;elevation?:number;favorites?:string[]}){
  const selected=markers.find(m=>m.id===selectedId);
  const favoriteSet=useMemo(()=>new Set(favorites),[favorites]);
  // Highlight tiers: the picked satellite stands out; favorites stay fully visible;
  // everything else is dimmed only while a satellite is actually selected.
  const tier=(id:string)=>id===selectedId?'active':(selectedId&&!favoriteSet.has(id)?'dimmed':'normal');
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
  // Coverage: on the surface map the footprint stays a flat circle; on the globe it is a cone —
  // its apex is the satellite and its base is the visibility ring projected onto the Earth.
  const footprints=useMemo(()=>{
   if(!showFootprints)return[];
   const list:Footprint[]=[];
   for(const marker of markers){
    const point=marker.point;
    if(!point)continue;
    const radius=visibilityRadiusDeg(point.altKm,elevation);
    if(!radius)continue;
    const color=marker.color??'var(--accent)',title=marker.name+' · радиовидимость при угле от '+elevation+'°';
    if(mode==='map'){
     const d=path(geoCircle().center([point.lon,point.lat]).radius(Math.min(radius,179)).precision(3)())??'';
     if(d)list.push({id:marker.id,name:marker.name,color,title,circle:d});
     continue;
    }
    const apex=orbitalPoint(point);
    if(!apex)continue;
    const ring=visibilityRingPoints(point.lat,point.lon,Math.min(radius,179)).map(([lon,lat])=>projection([lon,lat]));
    // The ring can cross the limb: keep only visible pieces, joining the wrap-around at index 0.
    const runs:[number,number][][]=[];
    let piece:[number,number][]=[];
    for(const p of ring){if(p)piece.push(p);else if(piece.length){runs.push(piece);piece=[];}}
    if(piece.length)runs.push(piece);
    if(runs.length>1)runs[0]=[...runs.pop()!,...runs[0]];
    const segment=(pts:[number,number][])=>`M${pts[0][0].toFixed(2)},${pts[0][1].toFixed(2)}`+pts.slice(1).map(p=>`L${p[0].toFixed(2)},${p[1].toFixed(2)}`).join('');
    const ringPath=runs.filter(pts=>pts.length>=2).map(segment).join('');
    const conePath=runs.filter(pts=>pts.length>=2).map(pts=>`M${apex[0].toFixed(2)},${apex[1].toFixed(2)}`+pts.map(p=>`L${p[0].toFixed(2)},${p[1].toFixed(2)}`).join('')+'Z').join('');
    // A few narrow rays make the cone readable without filling the globe with spokes.
    const rays:Array<string>=[];
    for(let ray=0;ray<8;ray+=1){const p=ring[Math.floor(ray*(ring.length-1)/8)];if(p)rays.push(`M${apex[0].toFixed(2)},${apex[1].toFixed(2)}L${p[0].toFixed(2)},${p[1].toFixed(2)}`);}
    if(ringPath)list.push({id:marker.id,name:marker.name,color,title,ring:ringPath,cone:conePath,rays:rays.join('')});
   }
   return list;
  },[markers,mode,rotation,zoom,elevation,showFootprints]);
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
    {showFootprints&&<g className="orbit-footprints" aria-label="Зоны радиовидимости">{footprints.map(footprint=>{const t=tier(footprint.id);return <g key={footprint.id} className={`orbit-footprint ${t==='dimmed'?'dimmed':''}`}>{footprint.cone?<path className="orbit-cone" d={footprint.cone} fill={footprint.color} fillOpacity={t==='active'?.12:t==='dimmed'?.02:.07}/>:null}{footprint.circle?<path className="orbit-footprint-circle" d={footprint.circle} fill={footprint.color} stroke={footprint.color} fillOpacity={t==='active'?.16:t==='dimmed'?.03:.09} strokeOpacity={t==='active'?.85:t==='dimmed'?.15:.5} strokeWidth={t==='active'?1.5:.7}><title>{footprint.title}</title></path>:null}{footprint.ring?<path className="orbit-footprint-ring" d={footprint.ring} fill="none" stroke={footprint.color} strokeOpacity={t==='active'?.9:t==='dimmed'?.14:.45} strokeWidth={t==='active'?1.4:.7}><title>{footprint.title}</title></path>:null}{footprint.rays?<path className="orbit-cone-rays" d={footprint.rays} fill="none" stroke={footprint.color} strokeOpacity={t==='active'?.25:t==='dimmed'?.05:.14} strokeWidth={1}/>:null}</g>;})}</g>}
    {tracks&&<g className="orbit-tracks" aria-hidden="true">{markers.map(m=>{if(!m.point)return null;const points=tracks[m.id];if(!points||points.length<2)return null;const t=tier(m.id);return <path key={m.id} d={trail(points)} className="orbit-trail orbit-trail-other" style={m.color?{stroke:m.color}:{}} opacity={selectedId?(t==='active'?.85:t==='dimmed'?.15:.45):.55}/>})}</g>}
    <path d={trail(track.slice(0,middle+1))} className="orbit-trail orbit-trail-past"/>
    <path d={trail(track.slice(middle))} className="orbit-trail orbit-trail-future"/>
    {markers.map(m=>{if(!m.point)return null;const xy=orbitalPoint(m.point);if(!xy)return null;const active=m.id===selectedId;return <g key={m.id} data-marker="true" className={`orbit-marker ${active?'selected':selectedId&&!favoriteSet.has(m.id)?'dimmed':''}`} transform={`translate(${xy[0]},${xy[1]})`} role="button" tabIndex={0} aria-label={`Выбрать ${m.name}`} onClick={()=>onSelect(m.id)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();onSelect(m.id);}}}><title>{`${m.name} · ${m.point.altKm.toFixed(0)} км`}</title>{active?<circle r="13" className="orbit-marker-halo"/>:null}<circle r={active?5:3.5} style={m.color?{fill:m.color,stroke:'var(--surface)'}:undefined}/><circle r="12" fill="transparent" stroke="none"/>{active||showLabels?<text x="12" y="-12">{m.name}</text>:null}</g>;})}
   </svg>
   <div className="orbit-map-tools"><button title="Увеличить" aria-label="Увеличить карту" disabled={zoom>=1.8} onClick={()=>setZoom(z=>Math.min(1.8,z+.2))}><Plus size={18}/></button><button title="Уменьшить" aria-label="Уменьшить карту" disabled={zoom<=.8} onClick={()=>setZoom(z=>Math.max(.8,z-.2))}><Minus size={18}/></button>{fixedMode!=='map'&&<button title="Показать выбранный спутник" aria-label="Центрировать выбранный спутник" disabled={!selected?.point} onClick={center}><Crosshair size={18}/></button>}<button title="Сбросить вид" aria-label="Сбросить вид карты" onClick={()=>{setRotation([-65,-25]);setZoom(1);}}><RotateCcw size={17}/></button></div>
   <div className="orbit-map-legend">{track.length?<><span className="orbit-legend-line"><i/>Прошедшие 45 минут</span><span className="orbit-legend-line orbit-legend-dashed"><i/>Следующие 45 минут</span></>:null}{tracks&&Object.keys(tracks).length>0&&<span className="orbit-legend-line orbit-legend-all"><i/>Орбиты всех аппаратов</span>}{showFootprints&&<span className="orbit-legend-line"><i/>Зона видимости</span>}<small>{mode==='globe'?'Вращайте мышью или стрелками клавиатуры':'Контуры: Natural Earth · без загрузки тайлов'}</small></div>
  </section></FullscreenPanel>;
 });
