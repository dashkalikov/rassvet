'use client';
import {useId,useState} from 'react';
import {Box,Image,Maximize2} from 'lucide-react';
import {EQUIPMENT_MODELS,type ModelId} from '../lib/equipment';
import EquipmentModelViewer from './EquipmentModelViewer';
import {Modal} from './ui';

export default function EquipmentMedia({modelId}:{modelId:ModelId}){
 const model=EQUIPMENT_MODELS.find(item=>item.id===modelId)!;
 const [mode,setMode]=useState<'photo'|'3d'>('photo'),[zoom,setZoom]=useState(false),id=useId();
 return <div className="equipment-media">
  <div className="equipment-media-tabs" role="tablist" aria-label="Вид модели" onKeyDown={event=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;event.preventDefault();const next=event.key==='Home'?'photo':event.key==='End'?'3d':mode==='photo'?'3d':'photo';setMode(next);event.currentTarget.querySelector<HTMLButtonElement>(`[data-view="${next}"]`)?.focus();}}>
   <button type="button" id={`${id}-photo`} data-view="photo" role="tab" tabIndex={mode==='photo'?0:-1} aria-selected={mode==='photo'} aria-controls={`${id}-panel`} onClick={()=>setMode('photo')}><Image size={20}/>Изображение</button>
   <button type="button" id={`${id}-3d`} data-view="3d" role="tab" tabIndex={mode==='3d'?0:-1} aria-selected={mode==='3d'} aria-controls={`${id}-panel`} onClick={()=>setMode('3d')}><Box size={20}/>3D-модель</button>
  </div>
  <div id={`${id}-panel`} role="tabpanel" aria-labelledby={`${id}-${mode}`}>
   {mode==='3d'?<EquipmentModelViewer key={modelId} modelId={modelId}/>:<div className="equipment-model-photo"><img src={model.image} alt={`Терминал ${model.name}: корпус и опора`} width={1500} height={1000}/><button type="button" className="icon-button" onClick={()=>setZoom(true)} aria-label="Увеличить изображение модели"><Maximize2 size={22}/></button></div>}
  </div>
  {zoom&&<Modal title={model.name} wide close={()=>setZoom(false)}><img className="zoomed-product" src={model.image} alt={`Увеличенное изображение ${model.name}`}/></Modal>}
 </div>;
}
