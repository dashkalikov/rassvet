import {notFound} from 'next/navigation';
import EquipmentFrame from '../../../components/EquipmentFrame';
import EquipmentProduct from '../../../components/EquipmentProduct';
import {EQUIPMENT_MODELS} from '../../../lib/equipment';
export const dynamic='force-dynamic';
export async function generateMetadata({params}:{params:Promise<{model:string}>}){const {model}=await params;return {title:(EQUIPMENT_MODELS.find(m=>m.id===model)?.name??'Модель не найдена')+' — РАССВЕТ'};}
export default async function Page({params}:{params:Promise<{model:string}>}){const {model}=await params,item=EQUIPMENT_MODELS.find(m=>m.id===model);if(!item)notFound();return <EquipmentFrame><EquipmentProduct modelId={item.id}/></EquipmentFrame>;}
