import ConnectWizard from '../../components/ConnectWizard';
import SiteFrame from '../../components/SiteFrame';
import {publicUser} from '../../lib/public-user';
import {PLANS,buildOrder,type PlanId,type Billing} from '../../lib/domain';
import {readEquipment,quoteEquipment} from '../../lib/equipment';
export const metadata={title:'Подключение — РАССВЕТ'};
export const dynamic='force-dynamic';
export default async function Page({searchParams}:{searchParams:Promise<Record<string,string|undefined>>}){
 const p=await searchParams,user=await publicUser();
 const plan:PlanId=PLANS.some(x=>x.id===p.plan)?p.plan as PlanId:'home',billing:Billing=p.billing==='yearly'?'yearly':'monthly';
 let equipment=readEquipment(typeof p.config==='string'?p.config:undefined);
 if(equipment){try{quoteEquipment(equipment,plan);}catch{equipment=null;}}
 const address=typeof p.address==='string'?p.address.slice(0,300):'';let step=0;
 if(p.step==='review'){try{buildOrder({plan,billing,address});step=2;}catch{step=1;}}
 return <SiteFrame user={user}><ConnectWizard user={user} initialPlan={plan} initialBilling={billing} initialAddress={address} initialStep={step} initialEquipment={equipment??undefined}/></SiteFrame>;
}
