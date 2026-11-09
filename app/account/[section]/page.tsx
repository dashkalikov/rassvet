import {redirect,notFound} from 'next/navigation';
import {getCurrentUser} from '../../../lib/session';
import Account from '../../../components/Account';
export const dynamic='force-dynamic';
export default async function Page({params}:{params:Promise<{section:string}>}){
 const {section}=await params;if(section!=='orders'&&section!=='support'&&section!=='profile')notFound();
 const user=await getCurrentUser();if(!user)redirect('/auth?returnTo='+encodeURIComponent('/account/'+section));
 return <Account user={{name:user.name,email:user.email,avatar:user.avatar}} initialTab={section}/>;
}
