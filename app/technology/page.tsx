import TechnologyPage from '../../components/TechnologyPage';
import SiteFrame from '../../components/SiteFrame';
import {publicUser} from '../../lib/public-user';
export const metadata={title:'Технология — РАССВЕТ'};
export const dynamic='force-dynamic';
export default async function Page(){return <SiteFrame user={await publicUser()}><TechnologyPage/></SiteFrame>;}
