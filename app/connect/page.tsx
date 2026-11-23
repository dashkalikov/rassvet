import ConnectWizard from '../../components/ConnectWizard';
import SiteFrame from '../../components/SiteFrame';
import {getCurrentUser} from '../../lib/session';
import {getDb} from '../../db';
import {createRecords} from '../../lib/records';
import {PLANS,buildOrder,type PlanId,type Billing} from '../../lib/domain';
import {readEquipment,quoteEquipment} from '../../lib/equipment';
export const metadata={title:'Подключение — РАССВЕТ'};
export const dynamic='force-dynamic';
export default async function Page({searchParams}:{searchParams:Promise<Record<string,string|undefined>>}){
 const [p,session]=await Promise.all([searchParams,getCurrentUser()]);
 const user=session?{name:session.name,email:session.email,avatar:session.avatar??'',role:session.role}:null;
 const profile=session?await createRecords(getDb(),session.userId).getProfile():null;
 const contact=user?{name:profile?.name??user.name,email:user.email,phone:profile?.phone??''}:null;
 const plan:PlanId=PLANS.some(x=>x.id===p.plan)?p.plan as PlanId:'home',billing:Billing=p.billing==='yearly'?'yearly':'monthly';
 let equipment=readEquipment(typeof p.config==='string'?p.config:undefined);
 if(equipment){try{quoteEquipment(equipment,plan);}catch{equipment=null;}}
 const address=typeof p.address==='string'?p.address.slice(0,300):'';let step=0;
 if(p.step==='review'){try{buildOrder({plan,billing,address});step=2;}catch{step=1;}}
 return <SiteFrame user={user}><ConnectWizard user={user} contact={contact} initialPlan={plan} initialBilling={billing} initialAddress={address} initialStep={step} initialEquipment={equipment??undefined}/></SiteFrame>;
}
