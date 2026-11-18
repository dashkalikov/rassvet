'use client';
import {useId,useState,type FormEvent} from 'react';
import {api} from '../lib/client-api';
import {assessPassword} from '../lib/password-policy';
import PasswordFeedback from './PasswordFeedback';

export default function AdminPasswordReset({accountId}:{accountId:string}){
  const feedbackId=useId(),matchId=useId();
  const [adminPassword,setAdminPassword]=useState('');
  const [newPassword,setNewPassword]=useState('');
  const [confirmPassword,setConfirmPassword]=useState('');
  const [pending,setPending]=useState(false);
  const [notice,setNotice]=useState<{kind:'success'|'error';text:string}|null>(null);
  const valid=Boolean(adminPassword)&&assessPassword(newPassword).valid&&newPassword===confirmPassword;
  const mismatch=confirmPassword!==''&&confirmPassword!==newPassword;

  async function submit(event:FormEvent<HTMLFormElement>){
    event.preventDefault();
    if(!valid||pending)return;
    setPending(true);setNotice(null);
    try {
      await api('/api/operations/admin',{method:'PATCH',body:JSON.stringify({
        action:'password_reset',id:accountId,adminPassword,newPassword,confirmPassword,
      })});
      setNewPassword('');setConfirmPassword('');
      setNotice({kind:'success',text:'Пароль сброшен. Пользователь может войти с новым паролем.'});
    } catch(error) {
      setNotice({kind:'error',text:error instanceof Error?error.message:'Не удалось сбросить пароль.'});
    } finally {
      setAdminPassword('');setPending(false);
    }
  }

  return <form className="ops-password-reset" method="post" onSubmit={submit} aria-busy={pending}>
    <label>Ваш пароль администратора
      <input type="password" autoComplete="current-password" maxLength={128} required disabled={pending}
        value={adminPassword} onChange={event=>{setAdminPassword(event.target.value);setNotice(null);}}/>
    </label>
    <label>Новый пароль пользователя
      <input type="password" autoComplete="new-password" minLength={10} maxLength={128}
        aria-describedby={feedbackId} required disabled={pending} value={newPassword} onChange={event=>setNewPassword(event.target.value)}/>
    </label>
    <PasswordFeedback password={newPassword} id={feedbackId}/>
    <label>Повторите новый пароль
      <input type="password" autoComplete="new-password" minLength={10} maxLength={128} required disabled={pending}
        aria-invalid={mismatch||undefined} aria-describedby={matchId} value={confirmPassword} onChange={event=>setConfirmPassword(event.target.value)}/>
    </label>
    <div id={matchId} aria-live="polite">{mismatch&&<p className="form-error">Пароли не совпадают.</p>}</div>
    {notice&&<p className={notice.kind==='error'?'form-error':'ops-reset-success'} role={notice.kind==='error'?'alert':'status'}>{notice.text}</p>}
    <button type="submit" className="ops-button ops-button-emphasis" disabled={!valid||pending}>{pending?'Сбрасываем…':'Сбросить пароль'}</button>
  </form>;
}
