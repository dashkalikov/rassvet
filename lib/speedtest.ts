import {PLANS,type PlanId} from './domain.ts';
export type TransferSample={bytes:number;durationMs:number};
export type SpeedCondition='clear'|'busy'|'obstructed';
export type PlanOrder={id:string;plan:string;status:string;createdAt:string};
export type SpeedMetrics={download:number;upload:number;ping:number;jitter:number};
export type SpeedPhase='latency'|'download'|'upload';
export type SpeedProgress={phase:SpeedPhase;progress:number;value:number};
export type SpeedMeasurement=SpeedMetrics&{bytesTransferred:number;downloadSamples:number[];uploadSamples:number[]};
export function transferMbps(samples:readonly TransferSample[]):number{
 if(!samples.length||samples.some(sample=>!Number.isSafeInteger(sample.bytes)||sample.bytes<=0||!Number.isFinite(sample.durationMs)||sample.durationMs<=0))throw new Error('Некорректные данные измерения скорости');
 const bytes=samples.reduce((sum,sample)=>sum+sample.bytes,0),duration=samples.reduce((sum,sample)=>sum+sample.durationMs,0);
 const speed=bytes*8/duration/1000;
 if(!Number.isFinite(speed)||speed<=0)throw new Error('Некорректные данные измерения скорости');
 return speed;
}
export function latencyMetrics(samples:readonly number[]):{ping:number;jitter:number}{
 if(!samples.length||samples.some(value=>!Number.isFinite(value)||value<0))throw new Error('Некорректные данные задержки');
 const ordered=[...samples].sort((a,b)=>a-b),middle=Math.floor(ordered.length/2);
 const ping=ordered.length%2?ordered[middle]:(ordered[middle-1]+ordered[middle])/2;
 const jitter=samples.length<2?0:samples.slice(1).reduce((sum,value,index)=>sum+Math.abs(value-samples[index]),0)/(samples.length-1);
 return {ping,jitter};
}
export function pickSpeedtestPlan(orders:readonly PlanOrder[]):{plan:PlanId;orderId:string}|null{
 const order=orders.filter(order=>order.status==='new'&&PLANS.some(plan=>plan.id===order.plan)&&Number.isFinite(Date.parse(order.createdAt))).toSorted((a,b)=>Date.parse(b.createdAt)-Date.parse(a.createdAt))[0];
 return order?{plan:order.plan as PlanId,orderId:order.id}:null;
}
export const SPEED_CONDITIONS=[{id:'clear',name:'Открытое небо',description:'Спокойная нагрузка и свободный обзор'},{id:'busy',name:'Вечерняя нагрузка',description:'Больше одновременных подключений'},{id:'obstructed',name:'Помехи и препятствия',description:'Условное ухудшение приёма'}] as const;
export function demoMetrics(plan:PlanId,condition:SpeedCondition):SpeedMetrics&{mode:'demo'}{
 const tariff=PLANS.find(tariff=>tariff.id===plan);
 if(!tariff||!SPEED_CONDITIONS.some(item=>item.id===condition))throw new Error('Выберите тариф и условия моделирования');
 const profile={home:{upload:20,ping:35,jitter:4},travel:{upload:30,ping:45,jitter:6},business:{upload:40,ping:30,jitter:3}}[plan];
 const factor=condition==='clear'?.86:condition==='obstructed'?.32:plan==='business'?.67:.48;
 return {mode:'demo',download:tariff.speed*factor,upload:profile.upload*factor,ping:profile.ping+(condition==='clear'?0:condition==='busy'?22:65),jitter:profile.jitter+(condition==='clear'?0:condition==='busy'?7:18)};
}
