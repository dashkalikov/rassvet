import {notFound} from 'next/navigation';
import SiteFrame from '../../../components/SiteFrame';
import ScenarioPage from '../../../components/ScenarioPage';
import {publicUser} from '../../../lib/public-user';
import {PLANS} from '../../../lib/domain';
export const dynamic='force-dynamic';
export async function generateMetadata({params}:{params:Promise<{scenario:string}>}){const {scenario}=await params;return {title:(PLANS.find(p=>p.id===scenario)?.name??'Тариф')+' — РАССВЕТ'};}
export default async function Page({params}:{params:Promise<{scenario:string}>}){const {scenario}=await params,plan=PLANS.find(p=>p.id===scenario);if(!plan)notFound();return <SiteFrame user={await publicUser()}><ScenarioPage scenario={plan.id}/></SiteFrame>;}
