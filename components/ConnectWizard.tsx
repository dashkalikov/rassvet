'use client';
import ChoiceSelect from './ChoiceSelect';
import Link from 'next/link';
import {useEffect,useRef,useState,type FormEvent} from 'react';
import {ArrowRight,ArrowLeft,Check,MapPin,Satellite,ShieldCheck} from 'lucide-react';
import {PLANS,buildOrder,checkCoverage,formatMoney,type PlanId,type Billing} from '../lib/domain';
import {quotePlan} from '../lib/quote';
import EquipmentOptions from './EquipmentOptions';
import {EQUIPMENT_MODELS,defaultEquipment,type EquipmentConfig} from '../lib/equipment';
import {PageIntro} from './SiteFrame';
import EditorialImage from './EditorialImage';
import AddressAutocomplete from './AddressAutocomplete';
import ConnectionSummary,{type ConnectionContact} from './ConnectionSummary';
import ConnectionReceipt from './ConnectionReceipt';
import StepNumber from './StepNumber';
import {api,type User} from './ui';

type SavedOrder={id:string;plan:PlanId;billing:Billing;address:string;firstPayment:number;status:string};
export default function ConnectWizard({user,contact,initialPlan='home',initialBilling='monthly',initialAddress='',initialStep=0,initialEquipment}:{user:User|null;contact?:ConnectionContact|null;initialPlan?:PlanId;initialBilling?:Billing;initialAddress?:string;initialStep?:number;initialEquipment?:EquipmentConfig}){
 const [plan,setPlan]=useState(initialPlan),[billing,setBilling]=useState(initialBilling),[address,setAddress]=useState(initialAddress);
 const [step,setStep]=useState(initialStep),[error,setError]=useState(''),[pending,setPending]=useState(false),[consent,setConsent]=useState(false),[saved,setSaved]=useState<SavedOrder|null>(null);
 const [equipment,setEquipment]=useState<EquipmentConfig>(initialEquipment??defaultEquipment(initialPlan==='business'?'pro':'standard'));
 const lock=useRef(false),successHeading=useRef<HTMLHeadingElement>(null);
 const quote=quotePlan(plan,billing,equipment),selected=PLANS.find(p=>p.id===plan)!;
 const account=contact??(user?{name:user.name,email:user.email}:null);
 let coverage:ReturnType<typeof checkCoverage>|null=null;
 try{if(address.trim().length>=3)coverage=checkCoverage(address);}catch{}
 useEffect(()=>{
  if(!saved)return;
  const frame=requestAnimationFrame(()=>{successHeading.current?.focus({preventScroll:true});successHeading.current?.closest('.connection-success')?.scrollIntoView({block:'start',behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});});
  return()=>cancelAnimationFrame(frame);
 },[saved]);
 function changePlan(id:PlanId){setPlan(id);setConsent(false);if(!EQUIPMENT_MODELS.find(m=>m.id===equipment.model)!.plans.includes(id))setEquipment(defaultEquipment(id==='business'?'pro':'standard'));}
 function next(event:FormEvent){
  event.preventDefault();setError('');
  try{if(step===1){buildOrder({plan,billing,address,equipment});setConsent(false);}setStep(value=>Math.min(2,value+1));}
  catch(error){setError(error instanceof Error?error.message:'Проверьте данные');}
 }
 async function submit(event:FormEvent){
  event.preventDefault();if(!user||!consent||lock.current)return;
  lock.current=true;setPending(true);setError('');
  try{const result=await api<{order:SavedOrder}>('/api/orders',{method:'POST',body:JSON.stringify({plan,billing,address,equipment})});setSaved(result.order);}
  catch(error){setError(error instanceof Error?error.message:'Не удалось сохранить заявку');}
  finally{lock.current=false;setPending(false);}
 }
 const returnTo=`/connect?plan=${plan}&billing=${billing}&address=${encodeURIComponent(address)}&config=${encodeURIComponent(JSON.stringify(equipment))}&step=review`;
 return <>
  {!saved&&<PageIntro eyebrow="ПОДКЛЮЧЕНИЕ" title="Три шага к вашему РАССВЕТУ." description="Выберите тариф, укажите адрес и проверьте данные перед отправкой заявки."/>}
  <div className={`container page-content ${saved?'connection-complete-page':''}`}>
   {saved?<ConnectionReceipt id={saved.id} planName={PLANS.find(item=>item.id===saved.plan)?.name??selected.name} billing={saved.billing} address={saved.address} contact={account} firstPayment={saved.firstPayment} status={saved.status} headingLevel={1} headingRef={successHeading}/>:<>
    <ol className="wizard-steps" aria-label="Шаги подключения">{['Тариф','Адрес','Подтверждение'].map((name,index)=><li className={index===step?'active':index<step?'done':''} key={name} aria-current={index===step?'step':undefined}><span>{index<step?<Check size={20}/>:<StepNumber value={index+1}/>}</span><b>{name}</b></li>)}</ol>
    <div className="wizard-layout"><section className="wizard-panel">
     {step===0&&<form onSubmit={next}>
      <span className="eyebrow">ШАГ 01</span><h2>Выберите свою связь.</h2>
      <div className="plan-choice-list">{PLANS.map(item=><label className={`plan-choice ${plan===item.id?'selected':''}`} key={item.id}><input type="radio" name="plan" value={item.id} checked={plan===item.id} onChange={()=>changePlan(item.id)}/><span><b>{item.name}</b><small>{item.description}</small></span><strong>{formatMoney(item.price)} ₽<small>/мес. без скидки</small></strong></label>)}</div>
      <label>Период оплаты<ChoiceSelect value={billing} onValueChange={value=>{setBilling(value as Billing);setConsent(false);}} options={[{value:'monthly',label:'Каждый месяц'},{value:'yearly',label:'Сразу за год · скидка 15%'}]}/></label>
      <details className="wizard-equipment"><summary><span>Оборудование и состав комплекта</span><b>{EQUIPMENT_MODELS.find(item=>item.id===equipment.model)!.short} · {formatMoney(quote.equipment)} ₽</b></summary><EquipmentOptions value={equipment} onChange={setEquipment} plan={plan} compact/></details>
      <div className="wizard-actions"><Link href="/plans" className="text-link">Сравнить подробнее</Link><button className="button primary">Далее <ArrowRight size={20}/></button></div>
     </form>}
     {step===1&&<form onSubmit={next}>
      <span className="eyebrow">ШАГ 02</span><h2>Где начнётся ваш РАССВЕТ?</h2><p>Начните вводить адрес и выберите подходящий город, улицу и дом из подсказок.</p>
      <AddressAutocomplete value={address} onChange={value=>{setAddress(value);setConsent(false);}}/>
      {coverage&&<div className={'wizard-coverage '+coverage.status} role="status"><MapPin size={22}/><div><h3>{coverage.title}</h3><p>{coverage.description}</p></div></div>}
      {error&&<p className="form-error" role="alert">{error}</p>}
      <div className="wizard-actions"><button type="button" className="button outline" onClick={()=>setStep(0)}><ArrowLeft size={20}/>Назад</button><button className="button primary">Проверить условия <ArrowRight size={20}/></button></div>
     </form>}
     {step===2&&<form onSubmit={submit}>
      <span className="eyebrow">ШАГ 03</span><h2>Всё ли верно?</h2><p className="connection-review-intro">Проверьте подключение и ваши контактные данные.</p>
      <ConnectionSummary planName={selected.name} billing={billing} address={address} contact={account} firstPayment={quote.firstPayment}/>
      <label className={'checkbox connection-consent '+(consent?'is-confirmed':'')}><input type="checkbox" checked={consent} onChange={event=>setConsent(event.target.checked)} required/><span>Подтверждаю правильность данных и согласен на оформление заявки.</span></label>
      {error&&<p className="form-error" role="alert">{error}</p>}
      <div className="wizard-actions"><button type="button" className="button outline" disabled={pending} onClick={()=>{setError('');setConsent(false);setStep(1);}}><ArrowLeft size={20}/>Назад</button>
       {user?<button className="button primary continue-button" disabled={pending||!consent}>{pending?'Сохраняем…':'Отправить заявку'}<ArrowRight size={20}/></button>:<button type="button" className="button primary continue-button" disabled={!consent||pending} onClick={()=>{if(consent)window.location.assign('/auth?returnTo='+encodeURIComponent(returnTo));}}>Войти и продолжить<ArrowRight size={20}/></button>}
      </div>
      {!user&&<p className="fineprint">После входа выбранный тариф и адрес сохранятся. Ваши контакты появятся в сводке заявки.</p>}
     </form>}
    </section><aside className="wizard-summary">
     <Satellite size={34}/><span className="eyebrow">ВАШЕ ПОДКЛЮЧЕНИЕ</span><h2>{selected.name}</h2>
     <div><span>Подписка {billing==='yearly'?'за год':'за месяц'}</span><b>{formatMoney(quote.subscriptionDue)} ₽</b></div>
     <div><span>Комплект {EQUIPMENT_MODELS.find(item=>item.id===equipment.model)!.short}</span><b>{formatMoney(quote.equipment)} ₽</b></div>
     <div className="wizard-total"><span>При подключении</span><strong>{formatMoney(quote.firstPayment)} ₽</strong></div>
     {quote.yearlySavings>0&&<p className="savings-label">Экономия на подписке — {formatMoney(quote.yearlySavings)} ₽ за год</p>}
     <button type="button" disabled={pending} className="text-link" onClick={()=>{setConsent(false);setStep(0);}}>Изменить состав комплекта <ArrowRight size={20}/></button>
     <p className="fineprint"><ShieldCheck size={20}/>Оформление заявки без списаний. Банковская карта не требуется.</p>
     <figure className="connection-photo"><EditorialImage image="onboarding" sizes="(max-width: 900px) 100vw, 360px"/><figcaption><b>Подготовьте место для связи.</b>Терминалу нужны открытый обзор неба и устойчивое основание.<Link className="text-link" href="/equipment/installation">Чек-лист установки <ArrowRight size={20}/></Link></figcaption></figure>
    </aside></div>
   </>}
  </div>
 </>;
}
