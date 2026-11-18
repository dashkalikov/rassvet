import SpeedtestPage from '../../components/SpeedtestPage';
import SiteFrame from '../../components/SiteFrame';
import {getCurrentUser} from '../../lib/session';
import {getDb} from '../../db';
import {createRecords} from '../../lib/records';
import {pickSpeedtestPlan} from '../../lib/speedtest';
import {PLANS} from '../../lib/domain';
export const dynamic='force-dynamic';
export const metadata={title:'Проверка скорости — РАССВЕТ',description:'Проверка текущего интернет-соединения и демонстрационное сравнение спутниковых тарифов.'};
export default async function Page({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){
 const user=await getCurrentUser(),query=await searchParams;
 const accountPlan=user?pickSpeedtestPlan(await createRecords(getDb(),user.userId).getOrders()):null;
 const initialPlan=PLANS.find(plan=>plan.id===query.plan)?.id??accountPlan?.plan??'home';
 const publicUser=user?{name:user.name,email:user.email,avatar:user.avatar,role:user.role}:null;
 return <SiteFrame user={publicUser}><SpeedtestPage user={publicUser} accountPlan={accountPlan} initialPlan={initialPlan}/></SiteFrame>;
}
