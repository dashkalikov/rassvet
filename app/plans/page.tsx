import PlansPage from '../../components/PlansPage';
import SiteFrame from '../../components/SiteFrame';
import {publicUser} from '../../lib/public-user';
export const metadata={title:'Тарифы и сравнение — РАССВЕТ'};
export const dynamic='force-dynamic';
export default async function Page(){return <SiteFrame user={await publicUser()}><PlansPage/></SiteFrame>;}
