'use client';

import {useEffect,useMemo,useState} from 'react';
import {Clock3,Eye,Pause,Play,Satellite,Star} from 'lucide-react';
import {createOrbitModel,orbitPosition,orbitTrack,orbitTrackStep,type OrbitPoint,type OrbitSatellite} from '../lib/orbits';
import ChoiceSelect from './ChoiceSelect';
import OrbitMap from './OrbitMap';
import {satelliteColor,useOrbitPreferences} from '../lib/use-orbit-preferences';
import EngineeringSatelliteList from './EngineeringSatelliteList';

const sevenDays=7*86_400_000;
const minute=60_000;
const speedOptions=[{value:'1',label:'×1'},{value:'10',label:'×10'},{value:'60',label:'×60'}];
const number=new Intl.NumberFormat('ru-RU',{maximumFractionDigits:2});
const utc=(value:number)=>new Date(value).toISOString().slice(0,19).replace('T',' ')+' UTC';

export default function EngineeringOrbitMap({catalog,initialId,view,asOf}:{
  catalog:OrbitSatellite[];initialId?:string;view:'map'|'globe';asOf:number;
}){
  const models=useMemo(()=>catalog.map(createOrbitModel),[catalog]);
  const prefs=useOrbitPreferences();
  // Nothing is preselected unless the view was opened for a specific satellite (?norad=…):
  // then every satellite is shown equally, each with its own orbit.
  const [selectedId,setSelectedId]=useState<string|null>(initialId??null);
  const selected=models.find(model=>model.satellite.id===selectedId)??null;
  const referenceEpoch=useMemo(()=>Math.max(...models.map(model=>Date.parse(model.satellite.epoch))),[models]);
  const epoch=selected?Date.parse(selected.satellite.epoch):referenceEpoch;
  const [anchor,setAnchor]=useState(()=>Math.abs(asOf-epoch)<=sevenDays?asOf:epoch);
  const [offset,setOffset]=useState(0);
  const [rate,setRate]=useState('10');
  const [playing,setPlaying]=useState(false);
  const running=playing&&offset<90;
  const time=anchor+offset*minute;
  const markers=useMemo(()=>{
    const calculationTime=new Date(time);
    return models.map(model=>({
      id:model.satellite.id,name:model.satellite.name,
      point:Math.abs(time-Date.parse(model.satellite.epoch))<=sevenDays
        ?orbitPosition(model,calculationTime):null,
    }));
  },[models,time]);
  const point=markers.find(marker=>marker.id===selectedId)?.point;
  // The tracked satellite stays on screen even when the favorites filter is active.
  const displayMarkers=markers.filter(marker=>marker.id===selectedId||!prefs.onlyFavorites||prefs.favorites.includes(marker.id)).map(marker=>({...marker,color:satelliteColor(marker.id,prefs.colorMode)}));
  const trackTime=Math.floor(time/10_000)*10_000;
  const track=useMemo(()=>!selected?[]:Math.abs(trackTime-epoch)<=sevenDays?orbitTrack(selected,new Date(trackTime)):[],[selected,trackTime,epoch]);
  // While nothing is selected, every visible satellite keeps its own orbit on screen.
  // The id set is derived from the stable catalogue and filters, and the coarse sampling
  // (3 minutes) plus the 10-second quantum keep the SGP4 cost low.
  const visibleIds=useMemo(()=>new Set(models.filter(model=>!prefs.onlyFavorites||prefs.favorites.includes(model.satellite.id)).map(model=>model.satellite.id)),[models,prefs.onlyFavorites,prefs.favorites]);
  const allTracks=useMemo(()=>{
    if(selected)return{};
    const t=new Date(trackTime),result:Record<string,OrbitPoint[]>={};
    for(const model of models){
      if(!visibleIds.has(model.satellite.id))continue;
      if(Math.abs(trackTime-Date.parse(model.satellite.epoch))>sevenDays)continue;
      const points=orbitTrackStep(model,t,3);
      if(points.length>1)result[model.satellite.id]=points;
    }
    return result;
  },[selected,trackTime,visibleIds,models]);
  const canShowNow=Math.abs(asOf-epoch)<=sevenDays;

  useEffect(()=>{
    if(!running)return;
    let previous=performance.now();
    const timer=setInterval(()=>{
      const now=performance.now();
      const elapsed=Math.min(now-previous,2000);
      previous=now;
      if(!document.hidden)setOffset(value=>Math.min(90,value+elapsed*Number(rate)/minute));
    },1000);
    return ()=>clearInterval(timer);
  },[running,rate]);

  function setTime(value:number){
    setPlaying(false);
    setOffset(0);
    setAnchor(value);
  }

  // Picking the tracked satellite again stops tracking it and returns to the full constellation.
  function choose(id:string){
    if(id===selectedId){setSelectedId(null);return;}
    const satellite=catalog.find(item=>item.id===id);
    if(!satellite)return;
    setSelectedId(id);
    const nextEpoch=Date.parse(satellite.epoch);
    if(Math.abs(time-nextEpoch)>sevenDays)setTime(nextEpoch);
  }

  return <div className="engineering-orbit-layout orbit-app engineering-orbit-surface">
    <div className="engineering-orbit-main">
      <OrbitMap markers={displayMarkers} selectedId={selected?.satellite.id??''} track={selected&&displayMarkers.some(marker=>marker.id===selectedId)?track:[]} tracks={selected?undefined:allTracks} favorites={prefs.favorites} onSelect={choose} fixedMode={view} showLabels={prefs.labels} showFootprints={prefs.footprints} elevation={prefs.elevation}/>
      <section className="ops-panel orbit-display-settings" aria-label="Слои и избранное">
        <div className="ops-panel-heading"><h2>Слои и отображение</h2><span>{displayMarkers.filter(marker=>marker.point).length} / {catalog.length} аппаратов</span></div>
        <div className="orbit-layer-options">
          <label className="ops-check"><input type="checkbox" checked={prefs.onlyFavorites} onChange={e=>prefs.update({onlyFavorites:e.target.checked})}/>Только избранные · {prefs.favorites.length}</label>
          <label className="ops-check"><input type="checkbox" checked={prefs.labels} onChange={e=>prefs.update({labels:e.target.checked})}/>Подписи аппаратов</label>
          <label className="ops-check"><input type="checkbox" checked={prefs.footprints} onChange={e=>prefs.update({footprints:e.target.checked})}/>Зоны видимости</label>
          <label>Расцветка<ChoiceSelect value={prefs.colorMode} onValueChange={value=>prefs.update({colorMode:value as 'satellite'|'launch'})} options={[{value:'satellite',label:'По спутникам'},{value:'launch',label:'По группам запуска'}]}/></label>
        </div>
        {prefs.footprints&&<label className="orbit-elevation">Минимальный угол над горизонтом: {prefs.elevation}°<input type="range" min={0} max={90} step={5} value={prefs.elevation} onChange={e=>prefs.update({elevation:Number(e.target.value)})}/><small>Геометрическая радиовидимость. Не учитывает рельеф, погоду и наземные станции.</small></label>}
        {prefs.onlyFavorites&&!prefs.favorites.length&&<p role="status">Отметьте аппараты звёздочкой в списке справа или в каталоге.</p>}
      </section>
      <section className="ops-panel engineering-timeline" aria-label="Управление временем">
        <div className="ops-panel-heading">
          <div><h2><Clock3 size={20} aria-hidden="true"/>Время расчёта</h2><p><time dateTime={new Date(time).toISOString()}>{utc(time)}</time></p></div>
          <div className="ops-actions">
            <button type="button" className="ops-button" onClick={()=>setTime(epoch)}>К эпохе</button>
            <button type="button" className="ops-button" onClick={()=>setTime(Date.now())} disabled={!canShowNow}>Сейчас</button>
          </div>
        </div>
        <div className="orbit-playback">
          <button type="button" className="ops-button" aria-label={running?'Приостановить расчёт':'Запустить движение'} onClick={()=>{
            if(offset>=90)setOffset(-90);
            setPlaying(!running);
          }}>{running?<Pause size={20}/>:<Play size={20}/>}</button>
          <label>
            <span className="sr-only">Сдвиг времени в минутах</span>
            <input type="range" min={-90} max={90} step={.5} value={offset}
              onChange={event=>{setPlaying(false);setOffset(Number(event.target.value));}}/>
            <span>−90 мин <b>{number.format(offset)} мин</b> +90 мин</span>
          </label>
          <ChoiceSelect value={rate} onValueChange={setRate} options={speedOptions} aria-label="Скорость времени"/>
        </div>
        {!canShowNow&&<p>Элементы старше семи суток. Обновите каталог для расчёта на текущее время.</p>}
      </section>
    </div>
    <div className="engineering-orbit-side">
      <section className="ops-panel engineering-orbit-list" aria-label="Выбор аппарата">
        <div className="ops-panel-heading">
          <div className="engineering-orbit-list-title"><h2>Аппараты</h2><span>{catalog.length} в каталоге</span></div>
          <button type="button" className={`ops-button engineering-orbit-all${prefs.onlyFavorites?' is-favorites':''}`} aria-pressed={prefs.onlyFavorites}
            onClick={()=>{
              if(prefs.onlyFavorites){setSelectedId(null);prefs.update({onlyFavorites:false});return;}
              if(prefs.favorites.length)prefs.update({onlyFavorites:true});else setSelectedId(null);
            }} disabled={!prefs.onlyFavorites&&!prefs.favorites.length&&!selected}>
            {prefs.onlyFavorites||!prefs.favorites.length
              ?<><Eye size={20} aria-hidden="true"/>Все аппараты</>
              :<><Star size={20} aria-hidden="true"/>Избранное · {prefs.favorites.length}</>}
          </button>
        </div>
        <EngineeringSatelliteList models={models} selectedId={selected?.satellite.id??null} favorites={prefs.favorites} colorMode={prefs.colorMode} onPick={choose} onToggleFavorite={prefs.toggleFavorite}/>
      </section>
      <aside className="ops-panel engineering-visual-details">
      <h2><Satellite size={20} aria-hidden="true"/>Выбранный аппарат</h2>
      {selected?<>
      <button className="ops-button" type="button" aria-pressed={prefs.favorites.includes(selected.satellite.id)} onClick={()=>prefs.toggleFavorite(selected.satellite.id)}><Star size={20} fill={prefs.favorites.includes(selected.satellite.id)?'currentColor':'none'}/>{prefs.favorites.includes(selected.satellite.id)?'В избранном':'В избранное'}</button>
      <strong className="engineering-orbit-height">{point?number.format(point.altKm):'—'} <small>км над Землёй</small></strong>
      <dl className="ops-detail">
        <div><dt>NORAD</dt><dd>{selected.satellite.id}</dd></div>
        <div><dt>Эпоха элементов</dt><dd>{utc(epoch)}</dd></div>
        <div><dt>Скорость</dt><dd>{point?number.format(point.speedKms)+' км/с':'—'}</dd></div>
        <div><dt>Широта / долгота</dt><dd>{point?number.format(point.lat)+'° / '+number.format(point.lon)+'°':'—'}</dd></div>
        <div><dt>Период обращения</dt><dd>{number.format(selected.parameters.periodMin)} мин</dd></div>
      </dl>
      <div className="ops-actions">
        <a className="ops-button" href={'/operations/orbits/history?norad='+selected.satellite.id}>График аппарата</a>
        <a className="ops-button" href={'/operations/orbits/catalog?norad='+selected.satellite.id}>Карточка</a>
      </div>
      </>:<p className="engineering-orbit-none">
        {prefs.onlyFavorites&&prefs.favorites.length
          ?`Показана избранная группа из ${prefs.favorites.length} — у каждого аппарата своя орбита.`
          :'Все спутники показаны одинаково, каждый со своей орбитой.'}
        {' '}Кликните по аппарату в списке или на карте, чтобы отслеживать его.
      </p>}
      </aside>
    </div>
  </div>;
}
