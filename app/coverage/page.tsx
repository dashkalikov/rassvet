import CoveragePage from '../../components/CoveragePage';
import SiteFrame from '../../components/SiteFrame';
import {publicUser} from '../../lib/public-user';
export const metadata={title:'Карта покрытия — РАССВЕТ'};
export const dynamic='force-dynamic';
export default async function Page(){return <SiteFrame user={await publicUser()}><CoveragePage/></SiteFrame>;}
