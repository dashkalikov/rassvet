import SiteFrame from '../../components/SiteFrame';
import GuidesPage from '../../components/GuidesPage';
import {publicUser} from '../../lib/public-user';
export const dynamic='force-dynamic';
export const metadata={title:'Руководства — РАССВЕТ'};
export default async function Page(){return <SiteFrame user={await publicUser()}><GuidesPage/></SiteFrame>;}
