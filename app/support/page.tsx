import SupportPage from '../../components/SupportPage';
import SiteFrame from '../../components/SiteFrame';
import {publicUser} from '../../lib/public-user';
export const metadata={title:'Центр поддержки — РАССВЕТ'};
export const dynamic='force-dynamic';
export default async function Page({searchParams}:{searchParams:Promise<{category?:string}>}){const user=await publicUser(),params=await searchParams;return <SiteFrame user={user}><SupportPage user={user} initialCategory={typeof params.category==='string'?params.category:undefined}/></SiteFrame>;}
