'use client';

import {useMemo,useState} from 'react';
import {Search,Star} from 'lucide-react';
import type {OrbitModel} from '../lib/orbits';
import ChoiceSelect from './ChoiceSelect';
import {satelliteColor} from '../lib/use-orbit-preferences';

const number=new Intl.NumberFormat('ru-RU',{maximumFractionDigits:0});
const sortOptions=[{value:'name',label:'По названию'},{value:'altitude',label:'По высоте орбиты'},{value:'id',label:'По номеру NORAD'}];

/** Scrollable, always-ordered satellite picker for the engineering map and globe views. */
export default function EngineeringSatelliteList({models,selectedId,favorites,colorMode,onPick,onToggleFavorite}:{
  models:OrbitModel[];selectedId:string|null;favorites:readonly string[];colorMode:'satellite'|'launch';
  onPick:(id:string)=>void;onToggleFavorite:(id:string)=>void;
}){
  const [query,setQuery]=useState('');
  const [sort,setSort]=useState('name');
  const visible=useMemo(()=>{
    const needle=query.trim().toLowerCase();
    return models
      .filter(model=>!needle||`${model.satellite.name} ${model.satellite.id}`.toLowerCase().includes(needle))
      .sort((a,b)=>sort==='altitude'
        ?a.parameters.semiMajorAxisKm-b.parameters.semiMajorAxisKm
        :sort==='id'?Number(a.satellite.id)-Number(b.satellite.id)
        :a.satellite.name.localeCompare(b.satellite.name,'ru',{numeric:true}));
  },[models,query,sort]);
  return <div className="engineering-satellite-picker">
    <label className="engineering-search orbit-list-search"><Search size={20} aria-hidden="true"/>
      <input type="search" aria-label="Найти аппарат" placeholder="Название или NORAD" value={query} onChange={event=>setQuery(event.target.value)}/></label>
    <div className="orbit-list-toolbar"><span aria-hidden="true">{visible.length}</span>
      <ChoiceSelect value={sort} onValueChange={setSort} options={sortOptions} aria-label="Сортировка аппаратов"/></div>
    <div className="engineering-satellite-list" aria-label="Список аппаратов для выбора">
      {visible.map(model=>{
        const active=model.satellite.id===selectedId,favorite=favorites.includes(model.satellite.id);
        return <div key={model.satellite.id} className={`engineering-satellite-row ${active?'selected':''}`}>
          <button type="button" aria-pressed={active} onClick={()=>onPick(model.satellite.id)}>
            <i className="satellite-color-dot" style={{background:satelliteColor(model.satellite.id,colorMode)}}/>
            <span><strong>{model.satellite.name}</strong><small>NORAD {model.satellite.id} · {number.format(model.parameters.semiMajorAxisKm-6378.137)} км</small></span>
          </button>
          <button className="orbit-star-button" type="button" aria-label={(favorite?'Убрать из избранного ':'В избранное ')+model.satellite.name}
            aria-pressed={favorite} onClick={()=>onToggleFavorite(model.satellite.id)}>
            <Star size={20} fill={favorite?'currentColor':'none'}/>
          </button>
        </div>;
      })}
      {!visible.length&&<p className="orbit-list-empty">Ничего не найдено. Измените поиск.</p>}
    </div>
  </div>;
}
