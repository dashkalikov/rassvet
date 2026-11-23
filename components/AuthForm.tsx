'use client';
import {useEffect,useId,useState,type FormEvent} from 'react';
import {ArrowRight,Eye,EyeOff,LockKeyhole,Mail,UserRound,ShieldCheck,CheckCircle2,CircleX} from 'lucide-react';
import {api} from '../lib/client-api';
import {safeReturnPath} from '../lib/navigation';
import {assessPassword} from '../lib/password-policy';
import {forgetLastLogin,readLastLogin,rememberLastLogin,type LastLogin} from '../lib/last-login';
import PasswordFeedback from './PasswordFeedback';
import {ROLE_LABELS,type Role} from '../lib/operations-policy';

const loginDescription:Record<Role,string>={
 customer:'С возвращением. Ваша связь с миром — здесь.',
 engineer:'Войдите с аккаунтом инженера или администратора. Доступ назначает администратор.',
 admin:'Введите почту и пароль аккаунта администратора.',
};

export default function AuthForm({returnTo='/account',initialMode='login',portal='customer',onModeChange}:{
 returnTo?:string;initialMode?:'login'|'register';portal?:Role;onModeChange?:(mode:'login'|'register')=>void;
}){
 const [mode,setMode]=useState(initialMode),[name,setName]=useState(''),[email,setEmail]=useState(''),[password,setPassword]=useState(''),[confirmation,setConfirmation]=useState(''),[visible,setVisible]=useState(false),[remember,setRemember]=useState(true),[pending,setPending]=useState(false),[error,setError]=useState('');
 const [lastLogin,setLastLogin]=useState<LastLogin|null>(null);
 const feedbackId=useId(),confirmationId=useId(),assessment=assessPassword(password),matching=confirmation.length>0&&confirmation===password,staff=portal!=='customer',register=!staff&&mode==='register';
 useEffect(()=>{
  if(mode!=='login')return;
  const saved=readLastLogin();
  setLastLogin(saved);
  if(saved){setEmail(saved.email);setRemember(saved.remember);}
 },[mode]);

 async function submit(e:FormEvent){
  e.preventDefault();if(pending)return;setError('');
  if(register&&!assessment.valid){setError('Пароль должен соответствовать всем требованиям ниже.');return;}
  if(register&&!matching){setError('Пароли не совпадают');return;}
  setPending(true);
  try{
   await api(register?'/api/auth/register':'/api/auth/login',{method:'POST',body:JSON.stringify({
    name,email,password,portal,remember:!staff&&remember,...(register?{confirmPassword:confirmation}:{})
   })});
   rememberLastLogin({email,portal,remember});
   window.location.assign(safeReturnPath(returnTo));
  }catch(e){setError(e instanceof Error?e.message:'Не удалось войти. Попробуйте ещё раз.');setPending(false);}
 }
 function changeMode(value:'login'|'register'){
  setMode(value);setError('');setPassword('');setConfirmation('');setVisible(false);if(value==='register')setEmail('');onModeChange?.(value);
 }
 function forget(){
  forgetLastLogin();setLastLogin(null);setEmail('');setPassword('');setConfirmation('');setError('');
 }
 return <div className={`auth-form${register?' is-register':''}`}>
  {!staff&&<div className="auth-mode" aria-label="Вход или регистрация"><button type="button" aria-pressed={!register} onClick={()=>changeMode('login')}>Войти</button><button type="button" aria-pressed={register} onClick={()=>changeMode('register')}>Создать аккаунт</button></div>}
  <p className="auth-description">{register?'Ваша почта станет логином. Подтверждение письмом не требуется.':loginDescription[portal]}</p>
  {!register&&lastLogin&&<div className="last-login-hint"><span>Последний вход: <strong>{lastLogin.email}</strong> · {ROLE_LABELS[lastLogin.portal]}</span><button type="button" onClick={forget} disabled={pending}>Не вы?</button></div>}
  <form onSubmit={submit} method="post" autoComplete="on">
   <div className="auth-fields">
    {register&&<label>Ваше имя<div className="input-icon"><UserRound size={18}/><input name="name" value={name} onChange={e=>setName(e.target.value)} placeholder="Как к вам обращаться" minLength={2} maxLength={80} required autoComplete="name"/></div></label>}
    <label>Электронная почта<div className="input-icon"><Mail size={18}/><input name="username" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" maxLength={254} required autoComplete="username" autoCapitalize="none" spellCheck={false}/></div></label>
    <label>Пароль<div className={`input-icon password-input ${register&&password.length>0?(assessment.valid?'field-valid':'field-invalid'):''}`}><LockKeyhole size={18}/><input name="password" type={visible?'text':'password'} value={password} onChange={e=>setPassword(e.target.value)} placeholder={register?'Придумайте пароль':'Введите пароль'} minLength={10} maxLength={128} required autoComplete={register?'new-password':'current-password'} aria-describedby={register?feedbackId:undefined} aria-invalid={register&&password.length>0&&!assessment.valid}/><button type="button" aria-label={visible?'Скрыть пароль':'Показать пароль'} aria-pressed={visible} onClick={()=>setVisible(v=>!v)}>{visible?<EyeOff size={18}/>:<Eye size={18}/>}</button></div></label>
    {register&&<label>Повторите пароль<div className={`input-icon ${confirmation.length>0?(matching?'field-valid':'field-invalid'):''}`}><LockKeyhole size={18}/><input name="confirmPassword" type={visible?'text':'password'} value={confirmation} onChange={e=>setConfirmation(e.target.value)} placeholder="Повторите пароль" minLength={10} maxLength={128} required autoComplete="new-password" aria-describedby={confirmationId} aria-invalid={confirmation.length>0&&!matching}/></div></label>}
   </div>
   {register&&<><PasswordFeedback password={password} id={feedbackId}/><p id={confirmationId} className={`confirmation-feedback ${confirmation.length>0?(matching?'matched':'mismatched'):''}`} role="status" aria-live="polite">{confirmation.length>0?(matching?<><CheckCircle2 size={15}/>Пароли совпадают</>:<><CircleX size={15}/>Пароли пока не совпадают</>):'Повторите пароль для подтверждения.'}</p></>}
   {!staff&&<label className="checkbox auth-remember"><input type="checkbox" checked={remember} onChange={e=>setRemember(e.target.checked)}/><span>Оставаться в аккаунте на этом устройстве</span></label>}
   {error&&<p className="form-error" role="alert">{error}</p>}
   <button className="button primary full" disabled={pending||(register&&(!assessment.valid||!matching))}>{pending?'Подождите…':register?'Создать аккаунт':staff?'Войти в кабинет':'Войти в профиль'}<ArrowRight size={19}/></button>
   <p className="auth-note"><ShieldCheck size={15}/><span>Данные хранятся локально. Письма не отправляются.</span></p>
  </form>
  {!register&&<a className="auth-staff-link" href={staff?'/auth?portal=customer':'/auth?portal=engineer'}>{staff?'Другой кабинет':'Вход для сотрудников'}</a>}
 </div>;
}
