import { getCurrentUser } from '../../lib/session';
import { redirect } from 'next/navigation';
import Account from '../../components/Account';
import {canAccessPortal,PORTAL_PATHS} from '../../lib/operations-policy';
export const dynamic = 'force-dynamic';
export default async function AccountPage() {
  const user = await getCurrentUser();
  if(!user)redirect('/auth?returnTo=%2Faccount');
  if(!canAccessPortal(user.role,'customer'))redirect(PORTAL_PATHS[user.role]);
  return <Account user={{ name: user.name, email: user.email, avatar: user.avatar }} canManage={user.role==='admin'}/>;
}
