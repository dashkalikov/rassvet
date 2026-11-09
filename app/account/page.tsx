import { getCurrentUser } from '../../lib/session';
import { redirect } from 'next/navigation';
import Account from '../../components/Account';
export const dynamic = 'force-dynamic';
export default async function AccountPage() {
  const user = await getCurrentUser();
  if(!user)redirect('/auth?returnTo=%2Faccount');
  return <Account user={{ name: user.name, email: user.email, avatar: user.avatar }} />;
}
