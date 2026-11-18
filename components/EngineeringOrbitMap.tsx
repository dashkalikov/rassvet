'use client';

import {useEffect,useMemo,useState} from 'react';
import {Clock3,Pause,Play,Satellite,Star} from 'lucide-react';
import {createOrbitModel,orbitPosition,orbitTrack,type OrbitSatellite} from '../lib/orbits';
import ChoiceSelect from './ChoiceSelect';
import OrbitMap from './OrbitMap';
import {satelliteColor,useOrbitPreferences} from '../lib/use-orbit-preferences';

const sevenDays=7*86_400_000;
const minute=60_000;
const speedOptions=[{value:'1',label:'×1'},{value:'10',label:'×10'},{value:'60',label:'×60'}];
const number=new Intl.NumberFormat('ru-RU',{maximumFractionDigits:2});
const utc=(value:number)=>new Date(value).toISOString().slice(0,19).replace('T',' ')+' UTC';

export default function EngineeringOrbitMap({catalog,initialId,view,asOf}:{
  catalog:OrbitSatellite[];initialId:string;view:'map'|'globe';asOf:number;
}){
  const models=useMemo(()=>catalog.map(createOrbitModel),[catalog]);
  const prefs=useOrbitPreferences();
  const [selectedId,setSelectedId]=useState(initialId);
  const selected=models.find(model=>model.satellite.id===selectedId)??models[0];
  const epoch=Date.parse(selected.satellite.epoch);
  const [anchor,setAnchor]=useState(()=>Math.abs(asOf-epoch)<=sevenDays?asOf:epoch);
  const [offset,setOffset]=useState(0);
  const [rate,setRate]=useState('10');
  const [playing,setPlaying]=useState(false);
  const running=playing&&offset<90;
  const time=anchor+offset*minute;
  const options=useMemo(()=>catalog.map(item=>({value:item.id,label:item.name+' · '+item.id})),[catalog]);
  const markers=useMemo(()=>{
    const calculationTime=new Date(time);
    return models.map(model=>({
      id:model.satellite.id,name:model.satellite.name,
      point:Math.abs(time-Date.parse(model.satellite.epoch))<=sevenDays
        ?orbitPosition(model,calculationTime):null,
    }));
  },[models,time]);
  const point=markers.find(marker=>marker.id===selectedId)?.point;
  const displayMarkers=markers.filter(marker=>!prefs.onlyFavorites||prefs.favorites.includes(marker.id)).map(marker=>({...marker,color:satelliteColor(marker.id,prefs.colorMode)}));
  const trackTime=Math.floor(time/10_000)*10_000;
  const track=useMemo(()=>Math.abs(trackTime-epoch)<=sevenDays?orbitTrack(selected,new Date(trackTime)):[],[selected,trackTime,epoch]);
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

  function choose(id:string){
    const satellite=catalog.find(item=>item.id===id);
    if(!satellite)return;
    setSelectedId(id);
    const nextEpoch=Date.parse(satellite.epoch);
    if(Math.abs(time-nextEpoch)>sevenDays)setTime(nextEpoch);
  }

  return <div className="engineering-orbit-layout orbit-app engineering-orbit-surface">
    <div className="engineering-orbit-main">
      <OrbitMap markers={displayMarkers} selectedId={selected.satellite.id} track={displayMarkers.some(marker=>marker.id===selectedId)?track:[]} onSelect={choose} fixedMode={view} showLabels={prefs.labels} showFootprints={prefs.footprints} elevation={prefs.elevation}/>
      <section className="ops-panel orbit-display-settings" aria-label="Слои и избранное">
        <div className="ops-panel-heading"><h2>Слои и отображение</h2><span>{displayMarkers.filter(marker=>marker.point).length} / {catalog.length} аппаратов</span></div>
        <div className="orbit-layer-options">
          <label className="ops-check"><input type="checkbox" checked={prefs.onlyFavorites} onChange={e=>prefs.update({onlyFavorites:e.target.checked})}/>Только избранные · {prefs.favorites.length}</label>
          <label className="ops-check"><input type="checkbox" checked={prefs.labels} onChange={e=>prefs.update({labels:e.target.checked})}/>Подписи аппаратов</label>
          <label className="ops-check"><input type="checkbox" checked={prefs.footprints} onChange={e=>prefs.update({footprints:e.target.checked})}/>Зоны видимости</label>
          <label>Расцветка<ChoiceSelect value={prefs.colorMode} onValueChange={value=>prefs.update({colorMode:value as 'satellite'|'launch'})} options={[{value:'satellite',label:'По спутникам'},{value:'launch',label:'По группам запуска'}]}/></label>
        </div>
        {prefs.footprints&&<label className="orbit-elevation">Минимальный угол над горизонтом: {prefs.elevation}°<input type="range" min={0} max={90} step={5} value={prefs.elevation} onChange={e=>prefs.update({elevation:Number(e.target.value)})}/><small>Геометрическая радиовидимость. Не учитывает рельеф, погоду и наземные станции.</small></label>}
        {prefs.onlyFavorites&&!prefs.favorites.length&&<p role="status">Отметьте аппараты звёздочкой в списке ниже или в каталоге.</p>}
        <div className="orbit-favorite-chips" aria-label="Выбор избранных спутников">{catalog.map(sat=><div key={sat.id}><button className="orbit-star-button" type="button" aria-label={(prefs.favorites.includes(sat.id)?'Убрать из избранного ':'В избранное ')+sat.name} aria-pressed={prefs.favorites.includes(sat.id)} onClick={()=>prefs.toggleFavorite(sat.id)}><Star size={16} fill={prefs.favorites.includes(sat.id)?'currentColor':'none'}/></button><button type="button" aria-pressed={selectedId===sat.id} onClick={()=>choose(sat.id)}><i style={{background:satelliteColor(sat.id,prefs.colorMode)}}/>{sat.name}</button></div>)}</div>
      </section>
      <section className="ops-panel engineering-timeline" aria-label="Управление временем">
        <div className="ops-panel-heading">
          <div><h2><Clock3 size={18} aria-hidden="true"/>Время расчёта</h2><p><time dateTime={new Date(time).toISOString()}>{utc(time)}</time></p></div>
          <div className="ops-actions">
            <button type="button" className="ops-button" onClick={()=>setTime(epoch)}>К эпохе</button>
            <button type="button" className="ops-button" onClick={()=>setTime(Date.now())} disabled={!canShowNow}>Сейчас</button>
          </div>
        </div>
        <div className="orbit-playback">
          <button type="button" className="ops-button" aria-label={running?'Приостановить расчёт':'Запустить движение'} onClick={()=>{
            if(offset>=90)setOffset(-90);
            setPlaying(!running);
          }}>{running?<Pause size={17}/>:<Play size={17}/>}</button>
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
    <aside className="ops-panel engineering-visual-details">
      <h2><Satellite size={20} aria-hidden="true"/>Выбранный аппарат</h2>
      <button className="ops-button" type="button" aria-pressed={prefs.favorites.includes(selected.satellite.id)} onClick={()=>prefs.toggleFavorite(selected.satellite.id)}><Star size={16} fill={prefs.favorites.includes(selected.satellite.id)?'currentColor':'none'}/>{prefs.favorites.includes(selected.satellite.id)?'В избранном':'В избранное'}</button>
      <ChoiceSelect value={selected.satellite.id} onValueChange={choose} options={options} aria-label="Выбранный аппарат"/>
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
    </aside>
  </div>;
}
