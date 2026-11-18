'use client';

import {useMemo,useState} from 'react';
import {ArrowDown,ArrowUp,ChartNoAxesCombined,Globe2,Map,Search,Star} from 'lucide-react';
import type {loadSatelliteMetrics} from '../lib/operations-orbits';
import {ExportLink} from './OperationsActions';
import {satelliteColor,useOrbitPreferences} from '../lib/use-orbit-preferences';
import FullscreenPanel from './FullscreenPanel';

export type CatalogRow=Awaited<ReturnType<typeof loadSatelliteMetrics>>[number]&{climbKmDay:number|null;sampleCount:number};
const columns=[
  {id:'name',label:'Аппарат'},{id:'id',label:'NORAD'},{id:'altKm',label:'Высота, км'},
  {id:'perigeeKm',label:'Перигей, км'},{id:'apogeeKm',label:'Апогей, км'},
  {id:'inclinationDeg',label:'Наклон, °'},{id:'climbKmDay',label:'Темп, км/сут'},
  {id:'epoch',label:'Эпоха UTC'},
] as const;
type Column=typeof columns[number]['id'];
const number=new Intl.NumberFormat('ru-RU',{maximumFractionDigits:3});
const display=(value:number|null)=>value===null?'—':number.format(value);
const utc=(value:string)=>value.slice(0,16).replace('T',' ');
const collator=new Intl.Collator('ru',{numeric:true});

export default function EngineeringOrbitCatalog({rows,initialId}:{rows:CatalogRow[];initialId:string}){
  const [query,setQuery]=useState('');
  const prefs=useOrbitPreferences();
  const [order,setOrder]=useState<{column:Column;ascending:boolean}>({column:'id',ascending:true});
  const [selectedId,setSelectedId]=useState(initialId);
  const picked=rows.find(row=>row.id===selectedId)??rows[0];
  const visible=useMemo(()=>{
    const needle=query.trim().toLowerCase();
    return rows.filter(row=>(!prefs.onlyFavorites||prefs.favorites.includes(row.id))&&(row.name+' '+row.id).toLowerCase().includes(needle)).sort((a,b)=>{
      const first=a[order.column],second=b[order.column];
      if(first===null||second===null)return Number(first===null)-Number(second===null);
      const result=typeof first==='number'&&typeof second==='number'
        ?first-second:collator.compare(String(first),String(second));
      return order.ascending?result:-result;
    });
  },[rows,query,order,prefs.onlyFavorites,prefs.favorites]);
  const satelliteQuery='?norad='+picked.id;
  return <div className="engineering-orbit-layout">
    <FullscreenPanel title="Каталог спутников" className="ops-panel engineering-catalog">
      <div className="ops-panel-heading">
        <label className="engineering-search"><Search aria-hidden="true" size={17}/>
          <input type="search" aria-label="Поиск по каталогу" placeholder="Название или NORAD"
            value={query} onChange={event=>setQuery(event.target.value)}/></label>
        <ExportLink href="/api/operations/export?dataset=satellites">Каталог · CSV</ExportLink>
      </div>
      <label className="ops-check"><input type="checkbox" checked={prefs.onlyFavorites} onChange={e=>prefs.update({onlyFavorites:e.target.checked})}/>Только избранные · {prefs.favorites.length}</label>
      <div className="ops-table-wrap ops-satellite-table" tabIndex={0} role="region" aria-label="Таблица каталога">
        <table>
          <thead><tr><th scope="col"><span className="sr-only">Избранное</span><Star size={15}/></th>{columns.map(({id,label})=><th key={id} scope="col"
            aria-sort={id===order.column?(order.ascending?'ascending':'descending'):undefined}>
            <button type="button" onClick={()=>setOrder({column:id,ascending:id!==order.column||!order.ascending})}>
              {label}{id===order.column&&(order.ascending?<ArrowUp size={12}/>:<ArrowDown size={12}/>)}
            </button>
          </th>)}</tr></thead>
          <tbody>{visible.map(row=><tr key={row.id} data-active={row.id===picked.id}>
            <td><button className="orbit-star-button" type="button" aria-label={(prefs.favorites.includes(row.id)?'Убрать из избранного ':'В избранное ')+row.name} aria-pressed={prefs.favorites.includes(row.id)} onClick={()=>prefs.toggleFavorite(row.id)}><Star size={17} fill={prefs.favorites.includes(row.id)?'currentColor':'none'}/></button></td>
            <th scope="row"><button className="engineering-catalog-pick" type="button" onClick={()=>setSelectedId(row.id)}
              aria-pressed={row.id===picked.id}><i className="satellite-color-dot" style={{background:satelliteColor(row.id,prefs.colorMode)}}/>{row.name}</button></th>
            <td>{row.id}</td><td>{display(row.altKm)}</td><td>{display(row.perigeeKm)}</td>
            <td>{display(row.apogeeKm)}</td><td>{display(row.inclinationDeg)}</td><td>{display(row.climbKmDay)}</td>
            <td><time dateTime={row.epoch}>{utc(row.epoch)}</time></td>
          </tr>)}</tbody>
        </table>
      </div>
      {!visible.length&&<p>По вашему запросу аппараты не найдены.</p>}
    </FullscreenPanel>
    <aside className="ops-panel engineering-visual-details">
      <h2>{picked.name}</h2><p>NORAD {picked.id} · {picked.source}</p>
      <dl className="ops-detail">
        <div><dt>Большая полуось</dt><dd>{display(picked.semiMajorAxisKm)} км</dd></div>
        <div><dt>Эксцентриситет</dt><dd>{picked.eccentricity.toFixed(6)}</dd></div>
        <div><dt>Период обращения</dt><dd>{display(picked.periodMin)} мин</dd></div>
        <div><dt>Эпох в архиве</dt><dd>{picked.sampleCount}</dd></div>
        <div><dt>Скорость</dt><dd>{picked.speedKms===null?'—':display(picked.speedKms)+' км/с'}</dd></div>
        <div><dt>Широта / долгота</dt><dd>{picked.latitude===null||picked.longitude===null?'—':display(picked.latitude)+'° / '+display(picked.longitude)+'°'}</dd></div>
        <div><dt>Время расчёта UTC</dt><dd><time dateTime={picked.calculatedAt}>{utc(picked.calculatedAt)}</time></dd></div>
      </dl>
      <div className="ops-actions">
        <a className="ops-button" href={'/operations/orbits/map'+satelliteQuery}><Map size={15}/>Карта</a>
        <a className="ops-button" href={'/operations/orbits/globe'+satelliteQuery}><Globe2 size={15}/>Глобус</a>
        <a className="ops-button" href={'/operations/orbits/history'+satelliteQuery}><ChartNoAxesCombined size={15}/>График</a>
      </div>
    </aside>
  </div>;
}
