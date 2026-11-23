import { redirect } from 'next/navigation';
import { getCurrentUser } from '../../lib/session';
import { safeReturnPath } from '../../lib/navigation';
import AuthScreen from '../../components/AuthScreen';
import {canAccessPortal,PORTAL_PATHS,readRole} from '../../lib/operations-policy';
export const dynamic='force-dynamic';
export default async function AuthPage({searchParams}:{searchParams:Promise<{returnTo?:string;mode?:string;portal?:string}>}){
  const params=await searchParams;
  const portal=readRole(params.portal)??'customer';
  const returnTo=portal==='customer'?safeReturnPath(params.returnTo):PORTAL_PATHS[portal];
  const user=await getCurrentUser();
  if(user&&canAccessPortal(user.role,portal))redirect(returnTo);
  const mode=portal==='customer'&&params.mode==='register'?'register':'login';
  const restoreLogin=!params.portal&&(!params.returnTo||returnTo==='/account')&&mode==='login';
  return <AuthScreen key={`${portal}:${mode}:${restoreLogin}`} returnTo={returnTo} portal={portal} mode={mode} restoreLogin={restoreLogin}/>;
}
