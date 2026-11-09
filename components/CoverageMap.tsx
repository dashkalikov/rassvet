'use client';
import {useId,useState} from 'react';
import {Plus,Minus,Crosshair,MapPin} from 'lucide-react';
import map from '../lib/data/russia-map.json';
import {MAP_CITIES} from '../lib/map-cities';
import {projectRussia,type MapFrame} from '../lib/map-projection';

const frame=map.frame as MapFrame;
const cities=MAP_CITIES.map(city=>{const [x,y]=projectRussia(city.longitude,city.latitude,frame);return {...city,x,y};});
export default function CoverageMap({select}:{select:(city:string)=>void}){
 const [zoom,setZoom]=useState(1),[layer,setLayer]=useState<'all'|'live'|'soon'>('all');
 const clipId=`russia-map-${useId().replace(/[^a-zA-Z0-9_-]/g,'')}`;
 const visible=cities.filter(city=>layer==='all'||(layer==='live'?city.live:!city.live));
 return <div className="coverage-map">
  <div className="map-coordinate">60° 00′ N &nbsp; 100° 00′ E <span>КАРТА РОССИИ</span></div>
  <div className="map-viewport">
   <svg viewBox={`0 0 ${map.width} ${map.height}`} role="group" aria-label="Карта России с географическими границами и городами учебной сети">
    <defs><clipPath id={clipId}><rect width={map.width} height={map.height}/></clipPath></defs>
    <g clipPath={`url(#${clipId})`}>
     <g className="map-zoom-layer" style={{transform:`translate(500px,260px) scale(${zoom}) translate(-500px,-260px)`}}>
      <g className="map-graticule" aria-hidden="true">{map.graticules.map((d,index)=><path d={d} key={index}/>)}</g>
      <g className="map-country" aria-hidden="true">{map.outlines.map((d,index)=><path d={d} key={index}/>)}</g>
      <g className="map-borders" aria-hidden="true">{map.borders.map((d,index)=><path d={d} key={index}/>)}</g>
      {visible.map(city=><g className={`map-city ${city.live?'live':'planned'}`} key={city.name} role="button" tabIndex={0} aria-label={`Проверить ${city.name}`} onClick={()=>select(city.name)} onKeyDown={event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();select(city.name);}}}>
       <title>{`${city.name} · ${city.live?'Первая очередь':'Следующий этап'}`}</title>
       <circle cx={city.x} cy={city.y} r="17" fill="transparent"/>
       <circle className="map-pin-halo" cx={city.x} cy={city.y} r="10"/>
       <circle className="map-pin" cx={city.x} cy={city.y} r="4"/>
       <text x={city.x+city.dx} y={city.y+city.dy} textAnchor={city.dx<0?'end':'start'}>{city.name}</text>
      </g>)}
     </g>
    </g>
   </svg>
   <div className="map-controls">
    <button aria-label="Увеличить карту" disabled={zoom>=1.8} onClick={()=>setZoom(value=>Math.min(1.8,Math.round((value+.2)*10)/10))}><Plus size={17}/></button>
    <button aria-label="Уменьшить карту" disabled={zoom<=.8} onClick={()=>setZoom(value=>Math.max(.8,Math.round((value-.2)*10)/10))}><Minus size={17}/></button>
    <button aria-label="Сбросить масштаб" onClick={()=>setZoom(1)}><Crosshair size={17}/></button>
   </div>
  </div>
  <div className="map-footer"><div className="map-legend">
   <button aria-pressed={layer==='live'} className={layer==='live'?'active':''} onClick={()=>setLayer(value=>value==='live'?'all':'live')}><i className="live"/>Первая очередь</button>
   <button aria-pressed={layer==='soon'} className={layer==='soon'?'active':''} onClick={()=>setLayer(value=>value==='soon'?'all':'soon')}><i/>Следующий этап</button>
  </div><span className="map-hint"><MapPin size={12}/>Выберите город</span></div>
  <div className="map-city-shortcuts" aria-label="Города на карте">{visible.map(city=><button key={city.name} onClick={()=>select(city.name)}>{city.name}</button>)}</div>
  <p className="map-attribution">География: <a href="https://www.naturalearthdata.com/downloads/50m-cultural-vectors/" target="_blank" rel="noreferrer">Natural Earth</a> · учебное покрытие</p>
 </div>;
}
