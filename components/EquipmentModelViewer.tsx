'use client';
import {useEffect,useRef,useState} from 'react';
import {Box,LoaderCircle,Minus,Move,Plus,RotateCcw} from 'lucide-react';
import FullscreenPanel from './FullscreenPanel';
import {EQUIPMENT_MODELS,type ModelId} from '../lib/equipment';
import type {EquipmentViewerHandle} from '../lib/equipment-viewer';

export default function EquipmentModelViewer({modelId}:{modelId:ModelId}){
 const model=EQUIPMENT_MODELS.find(item=>item.id===modelId)!;
 const host=useRef<HTMLDivElement>(null),runtime=useRef<EquipmentViewerHandle|null>(null);
 const [state,setState]=useState<'loading'|'ready'|'error'>('loading'),[attempt,setAttempt]=useState(0);
 useEffect(()=>{
  let active=true;setState('loading');
  const failed=()=>{if(active){runtime.current?.destroy();runtime.current=null;setState('error');}};
  import('../lib/equipment-viewer').then(({mountEquipmentViewer})=>{
   if(!active||!host.current)return;
   try{runtime.current=mountEquipmentViewer(host.current,modelId,failed);setState('ready');}catch{failed();}
  }).catch(failed);
  return()=>{active=false;runtime.current?.destroy();runtime.current=null;};
 },[modelId,attempt]);
 return <FullscreenPanel title={`3D-модель ${model.name}`} className="equipment-3d-panel">
  <div className="equipment-3d-heading"><span><Box size={22}/><b>{model.short}</b></span><span>Обзор 360°</span></div>
  <div className="equipment-3d-stage">
   <div className="equipment-3d-canvas" ref={host} hidden={state==='error'}/>
   {state==='loading'&&<div className="equipment-3d-message" role="status"><LoaderCircle className="equipment-loading" size={30}/><span>Готовим 3D-модель…</span></div>}
   {state==='error'&&<><img className="equipment-3d-fallback" src={model.image} alt={model.name}/><div className="equipment-3d-error" role="status"><b>3D-просмотр недоступен в этом браузере</b><span>Вы можете рассмотреть модель на изображении.</span><button className="button outline" type="button" onClick={()=>setAttempt(value=>value+1)}>Повторить загрузку</button></div></>}
  </div>
  <div className="equipment-3d-footer">
   <p><Move size={20}/>Вращайте модель мышью или касанием. Колесо или два пальца — масштаб.</p>
   <div className="equipment-3d-controls" role="group" aria-label="Управление 3D-моделью">
    <button type="button" disabled={state!=='ready'} onClick={()=>runtime.current?.zoom(1.25)} aria-label="Отдалить модель" title="Отдалить"><Minus size={22}/></button>
    <button type="button" disabled={state!=='ready'} onClick={()=>runtime.current?.reset()} aria-label="Вернуть исходный ракурс" title="Исходный ракурс"><RotateCcw size={22}/></button>
    <button type="button" disabled={state!=='ready'} onClick={()=>runtime.current?.zoom(.8)} aria-label="Приблизить модель" title="Приблизить"><Plus size={22}/></button>
   </div>
  </div>
  <p className="equipment-3d-note">Объёмная визуализация корпуса и опоры. Состав комплекта указан в характеристиках.</p>
 </FullscreenPanel>;
}
