'use client';
import {useId,type Ref} from 'react';
import Link from 'next/link';
import {ArrowRight,CheckCircle2} from 'lucide-react';
import ConnectionSummary,{type ConnectionContact} from './ConnectionSummary';
import OrderStatusBadge from './OrderStatusBadge';
import type {Billing} from '../lib/domain';

export default function ConnectionReceipt({id,planName,billing,address,contact,firstPayment,status,headingLevel=2,headingRef,onNavigate}:{
 id:string;planName:string;billing:Billing;address:string;contact:ConnectionContact|null;firstPayment:number;status:string;
 headingLevel?:1|2;headingRef?:Ref<HTMLHeadingElement>;onNavigate?:()=>void;
}) {
 const titleId=useId(),Heading=headingLevel===1?'h1':'h2';
 return <section className="connection-success" aria-labelledby={titleId}>
  <div className="connection-receipt-grid">
   <div className="connection-receipt-heading">
    <div className="success-icon"><CheckCircle2 size={56} aria-hidden="true"/></div>
    <Heading id={titleId} ref={headingRef} tabIndex={-1} className="connection-saved-title">Заявка сохранена</Heading>
    <p className="connection-saved-number">№ {id.slice(0,8).toUpperCase()}</p>
    <OrderStatusBadge status={status}/>
    <p className="connection-receipt-description">Все данные отправлены в личный кабинет. Там можно посмотреть заявку, отследить её статус и управлять подключением.</p>
   </div>
   <ConnectionSummary planName={planName} billing={billing} address={address} contact={contact} firstPayment={firstPayment}/>
  </div>
  <div className="card-actions"><Link href={'/account/orders/'+id} className="button primary" onClick={onNavigate}>Открыть заявку <ArrowRight size={22}/></Link><Link href="/" className="button outline" onClick={onNavigate}>На главную</Link></div>
 </section>;
}
