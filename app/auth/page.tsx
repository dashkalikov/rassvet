import { redirect } from 'next/navigation';
import { getCurrentUser } from '../../lib/session';
import { safeReturnPath } from '../../lib/navigation';
import AuthScreen from '../../components/AuthScreen';
export const dynamic='force-dynamic';
export default async function AuthPage({searchParams}:{searchParams:Promise<{returnTo?:string;mode?:string}>}){
  const params=await searchParams;const returnTo=safeReturnPath(params.returnTo);
  if(await getCurrentUser())redirect(returnTo);
  return <AuthScreen returnTo={returnTo} mode={params.mode==='register'?'register':'login'}/>;
}
