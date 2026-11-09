import {redirect,notFound} from 'next/navigation';
import {getCurrentUser} from '../../../../lib/session';
import {getDb} from '../../../../db';
import {createRecords} from '../../../../lib/records';
import SiteFrame from '../../../../components/SiteFrame';
import OrderDetail from '../../../../components/OrderDetail';
export const dynamic='force-dynamic';
export const metadata={title:'Моя заявка — РАССВЕТ'};
export default async function Page({params}:{params:Promise<{id:string}>}){
 const {id}=await params,user=await getCurrentUser();
 if(!user)redirect('/auth?returnTo='+encodeURIComponent('/account/orders/'+id));
 const order=await createRecords(getDb(),user.userId).getOrder(id);if(!order)notFound();
 return <SiteFrame user={{name:user.name,email:user.email,avatar:user.avatar}}><OrderDetail initialOrder={order}/></SiteFrame>;
}
