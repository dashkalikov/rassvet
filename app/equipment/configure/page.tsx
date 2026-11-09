import EquipmentFrame from '../../../components/EquipmentFrame';
import EquipmentConfigurator from '../../../components/EquipmentConfigurator';
import {EQUIPMENT_MODELS,defaultEquipment,readEquipment} from '../../../lib/equipment';
import type {PlanId} from '../../../lib/domain';
export const dynamic='force-dynamic';
export const metadata={title:'Конфигуратор оборудования — РАССВЕТ'};
export default async function Page({searchParams}:{searchParams:Promise<Record<string,string|undefined>>}){const p=await searchParams;const model=EQUIPMENT_MODELS.find(m=>m.id===p.model)??EQUIPMENT_MODELS.find(m=>m.id==='standard')!;const config=readEquipment(typeof p.config==='string'?p.config:undefined)??defaultEquipment(model.id);const selected=EQUIPMENT_MODELS.find(m=>m.id===config.model)!;const plan=selected.plans.includes(p.plan as PlanId)?p.plan as PlanId:selected.plans[0];return <EquipmentFrame><EquipmentConfigurator initialConfig={config} initialPlan={plan}/></EquipmentFrame>;}
