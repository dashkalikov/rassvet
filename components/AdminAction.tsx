'use client';
import {useState} from 'react';
import {useRouter} from 'next/navigation';
import {api} from '../lib/client-api';
import {Modal} from './ui';

export default function AdminAction({label,subject,action,danger=false}:{
  label:string;subject:string;action:Record<string,string|boolean>;danger?:boolean;
}){
  const router=useRouter();
  const [open,setOpen]=useState(false),[pending,setPending]=useState(false),[error,setError]=useState('');
  async function apply(){
    setPending(true);setError('');
    try{
      await api('/api/operations/admin',{method:'PATCH',body:JSON.stringify(action)});
      setOpen(false);
      router.refresh();
    }catch(e){setError(e instanceof Error?e.message:'Не удалось выполнить действие.');}
    finally{setPending(false);}
  }
  return <>
    <button className={danger?'ops-button ops-danger':'ops-button'} type="button" onClick={()=>{setOpen(true);setError('');}}>{label}</button>
    {open&&<Modal title={label+'?'} close={()=>{if(!pending)setOpen(false);}}>
      <p>{subject}</p>
      {action.action==='access'&&<p>Изменение доступа завершит текущие сеансы этого аккаунта.</p>}
      {error&&<p className="form-error" role="alert">{error}</p>}
      <div className="modal-actions">
        <button type="button" className="button outline" onClick={()=>setOpen(false)} disabled={pending}>Вернуться</button>
        <button type="button" className="button primary" onClick={apply} disabled={pending}>{pending?'Сохраняем…':'Подтвердить'}</button>
      </div>
    </Modal>}
  </>;
}
