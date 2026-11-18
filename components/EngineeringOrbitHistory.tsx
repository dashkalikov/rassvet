'use client';

import {useId,useMemo,useState} from 'react';
import {ChartNoAxesCombined,Plus,X} from 'lucide-react';
import {splitOrbitSamples,type OrbitSample} from '../lib/orbits';
import {ExportLink} from './OperationsActions';
import ChoiceSelect from './ChoiceSelect';
import FullscreenPanel from './FullscreenPanel';
import {satelliteColor,useOrbitPreferences} from '../lib/use-orbit-preferences';

export type HistorySeries={id:string;name:string;samples:OrbitSample[];climbKmDay:number|null};
const dashes=[undefined,'7 4','2 4','8 3 2 3'];
const number=new Intl.NumberFormat('ru-RU',{maximumFractionDigits:3});

function HistoryPlot({series,colorMode}:{series:HistorySeries[];colorMode:'satellite'|'launch'}){
  const titleId=useId(),descId=useId();
  const points=series.flatMap(item=>item.samples);
  if(!points.length)return <p>Для выбранных аппаратов в архиве пока нет эпох.</p>;

  const timestamps=points.map(sample=>Date.parse(sample.epoch));
  const values=points.map(sample=>sample.semiMajorAxisKm);
  const start=Math.min(...timestamps),end=Math.max(...timestamps);
  const timeLabel=(timestamp:number)=>{
    const iso=new Date(timestamp).toISOString();
    const date=iso.slice(0,10).split('-').slice(1).reverse().join('.');
    return end-start<2*86_400_000?date+' '+iso.slice(11,16):date;
  };
  const min=Math.min(...values),max=Math.max(...values),padding=Math.max(.2,(max-min)*.10);
  const low=min-padding,high=max+padding;
  const left=68,right=930,top=25,bottom=280;
  const x=(time:number)=>start===end?(left+right)/2:left+(time-start)/(end-start)*(right-left);
  const y=(value:number)=>bottom-(value-low)/(high-low)*(bottom-top);
  const timeTicks=start===end?[start]:Array.from({length:6},(_,index)=>start+(end-start)*index/5);
  const heightTicks=Array.from({length:6},(_,index)=>low+(high-low)*index/5);
  return <div className="engineering-history-scroll">
    <svg className="engineering-history-svg" viewBox="0 0 960 326" role="img" aria-labelledby={titleId+' '+descId}>
      <title id={titleId}>Большая полуось орбиты, км</title>
      <desc id={descId}>По горизонтали даты UTC, по вертикали большая полуось. Аппараты: {series.map(item=>item.name).join(', ')}.</desc>
      {heightTicks.map(tick=><g key={tick}><line x1={left} x2={right} y1={y(tick)} y2={y(tick)}/>
        <text x={left-10} y={y(tick)+4} textAnchor="end">{number.format(tick)}</text></g>)}
      {timeTicks.map(tick=><g key={tick}><line x1={x(tick)} x2={x(tick)} y1={top} y2={bottom}/>
        <text x={x(tick)} y={bottom+25} textAnchor="middle">{timeLabel(tick)}</text></g>)}
      {series.map((item,index)=><g key={item.id} style={{color:satelliteColor(item.id,colorMode)}}>
        {splitOrbitSamples(item.samples).map(segment=><polyline
          key={segment[0].epoch} fill="none" stroke="currentColor" strokeWidth={2.5} strokeDasharray={dashes[index]}
          points={segment.map(sample=>x(Date.parse(sample.epoch)).toFixed(2)+','+y(sample.semiMajorAxisKm).toFixed(2)).join(' ')}/>)}
        {item.samples.map(sample=><circle key={sample.epoch} cx={x(Date.parse(sample.epoch))}
          cy={y(sample.semiMajorAxisKm)} r={item.samples.length>120?2:4} fill="currentColor">
          <title>{item.name+' · '+sample.epoch.slice(0,16).replace('T',' ')+' UTC · '+number.format(sample.semiMajorAxisKm)+' км'}</title>
        </circle>)}
      </g>)}
    </svg>
  </div>;
}

export default function EngineeringOrbitHistory({series,initialId}:{series:HistorySeries[];initialId:string}){
  const initial=series.find(item=>item.id===initialId)??series[0];
  const [ids,setIds]=useState([initial.id]);
  const [candidate,setCandidate]=useState('');
  const prefs=useOrbitPreferences();
  const [period,setPeriod]=useState('90');
  const active=ids.flatMap(id=>series.find(item=>item.id===id)??[]);
  const latest=Math.max(...active.flatMap(item=>item.samples.map(sample=>Date.parse(sample.epoch))));
  const cutoff=period==='all'?-Infinity:latest-Number(period)*86_400_000;
  const displayed=active.map(item=>({...item,samples:item.samples.filter(sample=>Date.parse(sample.epoch)>=cutoff)}));
  const options=useMemo(()=>series.map(item=>({value:item.id,label:item.name+' · '+item.id,disabled:ids.includes(item.id)})),[series,ids]);

  return <FullscreenPanel title="История орбит" className="ops-panel engineering-history">
    <div className="ops-panel-heading">
      <div><h2><ChartNoAxesCombined size={21} aria-hidden="true"/>Большая полуось, км</h2>
        <p>Сравните до четырёх аппаратов. Точки соответствуют уникальным эпохам элементов.</p></div>
      <div className="engineering-compare">
        <ChoiceSelect value={candidate} onValueChange={setCandidate} options={options}
          placeholder="Выберите аппарат" aria-label="Аппарат для сравнения" disabled={ids.length>=4}/>
        <button className="ops-button" type="button" disabled={!candidate||ids.length>=4||ids.includes(candidate)} onClick={()=>{
          setIds([...ids,candidate]);
          setCandidate('');
        }}><Plus size={16}/>Добавить</button>
      </div>
    </div>
    <div className="ops-toolbar"><div className="orbit-history-period"><span>Период архива</span><ChoiceSelect value={period} onValueChange={setPeriod} options={[{value:'7',label:'7 дней'},{value:'30',label:'30 дней'},{value:'90',label:'90 дней'},{value:'all',label:'Весь архив'}]}/></div><button className="ops-button" type="button" disabled={!prefs.favorites.some(id=>series.some(item=>item.id===id))} onClick={()=>setIds(prefs.favorites.filter(id=>series.some(item=>item.id===id)).slice(0,4))}>Сравнить избранные · до 4</button></div>
    <HistoryPlot series={displayed} colorMode={prefs.colorMode}/>
    <p>Даты UTC. Если между эпохами больше двух суток, линия прерывается.</p>
    <ul className="engineering-series-list">
      {active.map(item=><li key={item.id}>
        <span className="engineering-series-color" aria-hidden="true" style={{background:satelliteColor(item.id,prefs.colorMode)}}/>
        <div><strong>{item.name}</strong><small>Эпох в архиве: {item.samples.length}
          {item.climbKmDay!==null?' · '+number.format(item.climbKmDay)+' км/сут':''}</small></div>
        <ExportLink href={'/api/operations/export?dataset=orbit&norad='+item.id}>CSV</ExportLink>
        {active.length>1&&<button className="ops-button" type="button" aria-label={'Убрать '+item.name}
          onClick={()=>setIds(ids.filter(id=>id!==item.id))}><X size={16}/></button>}
      </li>)}
    </ul>
  </FullscreenPanel>;
}
