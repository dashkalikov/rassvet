'use client';
import {useId,useState,type FormEvent} from 'react';
import {ArrowRight,Eye,EyeOff,LockKeyhole,Mail,UserRound,ShieldCheck,CheckCircle2,CircleX} from 'lucide-react';
import {api} from '../lib/client-api';
import {safeReturnPath} from '../lib/navigation';
import {assessPassword} from '../lib/password-policy';
import PasswordFeedback from './PasswordFeedback';
import type {Role} from '../lib/operations-policy';

const loginDescription:Record<Role,string>={
 customer:'С возвращением. Ваша связь с миром — здесь.',
 engineer:'Введите почту и пароль аккаунта с ролью «Инженер» или «Администратор». Роль инженера назначает администратор в профиле пользователя.',
 admin:'Введите почту и пароль аккаунта администратора.',
};

export default function AuthForm({returnTo='/account',initialMode='login',portal='customer'}:{returnTo?:string;initialMode?:'login'|'register';portal?:Role}){
 const [mode,setMode]=useState(initialMode),[name,setName]=useState(''),[email,setEmail]=useState(''),[password,setPassword]=useState(''),[confirmation,setConfirmation]=useState(''),[visible,setVisible]=useState(false),[remember,setRemember]=useState(true),[pending,setPending]=useState(false),[error,setError]=useState('');
 const feedbackId=useId(),confirmationId=useId(),assessment=assessPassword(password),matching=confirmation.length>0&&confirmation===password,staff=portal!=='customer',register=!staff&&mode==='register';
 async function submit(e:FormEvent){
  e.preventDefault();
  if(pending)return;
  setError('');
  if(register&&!assessment.valid){setError('Пароль должен соответствовать всем требованиям ниже.');return;}
  if(register&&!matching){setError('Пароли не совпадают');return;}
  setPending(true);
  try{
   await api(register?'/api/auth/register':'/api/auth/login',{method:'POST',body:JSON.stringify({
    name,email,password,portal,remember:!staff&&remember,...(register?{confirmPassword:confirmation}:{})
   })});
   window.location.assign(safeReturnPath(returnTo));
  }catch(e){setError(e instanceof Error?e.message:'Не удалось войти. Попробуйте ещё раз.');setPending(false);}
 }
 function changeMode(value:'login'|'register'){setMode(value);setError('');setPassword('');setConfirmation('');}
 return <div className="auth-form">{!staff&&<div className="auth-mode" aria-label="Вход или регистрация"><button type="button" aria-pressed={!register} onClick={()=>changeMode('login')}>Войти</button><button type="button" aria-pressed={register} onClick={()=>changeMode('register')}>Создать аккаунт</button></div>}<p className="auth-description">{register?'Ваша почта станет логином. Подтверждать её письмом не нужно.':loginDescription[portal]}</p><form onSubmit={submit}>{register&&<label>Ваше имя<div className="input-icon"><UserRound size={18}/><input value={name} onChange={e=>setName(e.target.value)} placeholder="Как к вам обращаться" minLength={2} maxLength={80} required autoComplete="name"/></div></label>}<label>Электронная почта<div className="input-icon"><Mail size={18}/><input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" maxLength={254} required autoComplete="username" autoCapitalize="none" spellCheck={false}/></div></label><label>Пароль<div className={`input-icon password-input ${register&&password.length>0?(assessment.valid?'field-valid':'field-invalid'):''}`}><LockKeyhole size={18}/><input type={visible?'text':'password'} value={password} onChange={e=>setPassword(e.target.value)} placeholder={register?'Придумайте пароль':'Введите пароль'} minLength={10} maxLength={128} required autoComplete={register?'new-password':'current-password'} aria-describedby={register?feedbackId:undefined} aria-invalid={register&&password.length>0&&!assessment.valid}/><button type="button" aria-label={visible?'Скрыть пароль':'Показать пароль'} aria-pressed={visible} onClick={()=>setVisible(v=>!v)}>{visible?<EyeOff size={18}/>:<Eye size={18}/>}</button></div></label>{register&&<><PasswordFeedback password={password} id={feedbackId}/><label>Повторите пароль<div className={`input-icon ${confirmation.length>0?(matching?'field-valid':'field-invalid'):''}`}><LockKeyhole size={18}/><input type={visible?'text':'password'} value={confirmation} onChange={e=>setConfirmation(e.target.value)} placeholder="Ещё раз, чтобы не ошибиться" minLength={10} maxLength={128} required autoComplete="new-password" aria-describedby={confirmationId} aria-invalid={confirmation.length>0&&!matching}/></div></label><p id={confirmationId} className={`confirmation-feedback ${confirmation.length>0?(matching?'matched':'mismatched'):''}`} role="status" aria-live="polite">{confirmation.length>0?(matching?<><CheckCircle2 size={15}/>Пароли совпадают</>:<><CircleX size={15}/>Пароли пока не совпадают</>):'Повторите пароль для подтверждения.'}</p></>}{!staff&&<label className="checkbox auth-remember"><input type="checkbox" checked={remember} onChange={e=>setRemember(e.target.checked)}/><span>Запомнить меня на этом устройстве</span></label>}{error&&<p className="form-error" role="alert">{error}</p>}<button className="button primary full" disabled={pending||(register&&(!assessment.valid||!matching))}>{pending?'Подождите…':register?'Создать аккаунт':staff?'Войти в кабинет':'Войти в профиль'}<ArrowRight size={19}/></button>{register&&!assessment.valid&&<p className="register-guidance">Кнопка станет доступна, когда пароль выполнит все требования и совпадёт с повтором.</p>}<p className="auth-note"><ShieldCheck size={15}/><span>Данные хранятся локально на этом компьютере. Письма не отправляются.</span></p></form>{!staff&&<a className="auth-staff-link" href="/auth?portal=engineer">Вход для сотрудников</a>}</div>;
}
