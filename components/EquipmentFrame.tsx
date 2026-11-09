import type {ReactNode} from 'react';
import SiteFrame from './SiteFrame';
import SectionNav from './SectionNav';
import {publicUser} from '../lib/public-user';
export default async function EquipmentFrame({children}:{children:ReactNode}){return <SiteFrame user={await publicUser()}><SectionNav/>{children}</SiteFrame>;}
