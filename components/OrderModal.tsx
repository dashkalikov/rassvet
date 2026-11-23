'use client';
import Link from 'next/link';
import ChoiceSelect from './ChoiceSelect';
import {useState,type FormEvent} from 'react';
import {ArrowRight,CheckCircle2,ShieldCheck,Satellite} from 'lucide-react';
import {PLANS,monthlyPrice,formatMoney,type Billing,type PlanId} from '../lib/domain';
import {Modal,api,type User} from './ui';
import AddressAutocomplete from './AddressAutocomplete';
import ConnectionSummary from './ConnectionSummary';
import OrderStatusBadge from './OrderStatusBadge';

export default function OrderModal({initialPlan='home',billing:initialBilling='monthly',initialAddress='',user,close}:{initialPlan?:PlanId;billing?:Billing;initialAddress?:string;user:User|null;close:()=>void}){
 const [planId,setPlanId]=useState(initialPlan),[billing,setBilling]=useState(initialBilling),[address,setAddress]=useState(initialAddress);
 const [pending,setPending]=useState(false),[error,setError]=useState(''),[success,setSuccess]=useState(''),[consent,setConsent]=useState(false);
 const plan=PLANS.find(item=>item.id===planId)!,monthly=monthlyPrice(plan.price,billing),firstPayment=monthly*(billing==='yearly'?12:1)+plan.equipment;
 async function submit(event:FormEvent){
  event.preventDefault();if(pending||!user||!consent)return;setError('');setPending(true);
  try{const data=await api<{order:{id:string}}>('/api/orders',{method:'POST',body:JSON.stringify({plan:planId,billing,address})});setSuccess(data.order.id);}
  catch(error){setError(error instanceof Error?error.message:'Не удалось отправить заявку');}finally{setPending(false);}
 }
 const returnTo='/connect?plan='+planId+'&billing='+billing+'&address='+encodeURIComponent(address)+'&step=review';
 return <Modal title={success?'Ваше подключение':'Ваш РАССВЕТ начинается здесь'} close={close} wide>
  {success?<section className="connection-success success-state"><div className="success-icon"><CheckCircle2 size={64}/></div><h3 className="connection-saved-title">Заявка сохранена</h3><p className="connection-saved-number">№ {success.slice(0,8).toUpperCase()}</p><OrderStatusBadge status="new"/><ConnectionSummary planName={plan.name} billing={billing} address={address} contact={user?{name:user.name,email:user.email}:null} firstPayment={firstPayment}/><Link href={'/account/orders/'+success} className="button primary">Открыть заявку <ArrowRight size={20}/></Link></section>:<div className="order-grid"><form onSubmit={submit} id="order-form"><p className="muted">Выберите тариф и укажите, где вам нужен интернет.</p>
   <label>Тариф<ChoiceSelect value={planId} onValueChange={value=>{setPlanId(value as PlanId);setConsent(false);}} options={PLANS.map(item=>({value:item.id,label:item.name}))}/></label>
   <label>Период оплаты<ChoiceSelect value={billing} onValueChange={value=>{setBilling(value as Billing);setConsent(false);}} options={[{value:'monthly',label:'Ежемесячно'},{value:'yearly',label:'Сразу за год · скидка 15%'}]}/></label>
   <AddressAutocomplete value={address} onChange={value=>{setAddress(value);setConsent(false);}}/>
   <label className={'checkbox connection-consent '+(consent?'is-confirmed':'')}><input type="checkbox" checked={consent} onChange={event=>setConsent(event.target.checked)} required/><span>Подтверждаю правильность данных и согласен на оформление заявки.</span></label>
   {error&&<p className="form-error" role="alert">{error}</p>}
   {user?<button className="button primary full continue-button" disabled={pending||!consent}>{pending?'Сохраняем…':'Отправить заявку'}<ArrowRight size={20}/></button>:<button type="button" className="button primary full continue-button" disabled={!consent||pending} onClick={()=>{if(consent)window.location.assign('/auth?returnTo='+encodeURIComponent(returnTo));}}>Войти и продолжить<ArrowRight size={20}/></button>}
   <p className="fineprint"><ShieldCheck size={18}/>Данные заявки сохранятся в вашем аккаунте.</p>
  </form><aside className="order-summary"><Satellite size={32}/><span className="eyebrow">ВАШЕ ПОДКЛЮЧЕНИЕ</span><h3>{plan.name}</h3><div className="summary-line"><span>Подписка</span><b>{formatMoney(monthly)} ₽ / мес.</b></div><div className="summary-line"><span>Оборудование</span><b>{formatMoney(plan.equipment)} ₽</b></div><div className="summary-total"><span>При подключении</span><strong>{formatMoney(firstPayment)} ₽</strong></div><p className="fineprint">{billing==='yearly'?'Подписка рассчитана за 12 месяцев со скидкой 15%.':'Подписка рассчитана за первый месяц.'} Оборудование включено в сумму.</p></aside></div>}
 </Modal>;
}
