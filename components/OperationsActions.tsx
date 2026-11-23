'use client';
import {useEffect,useState} from 'react';
import {useRouter} from 'next/navigation';
import {Download,LogOut,RefreshCw} from 'lucide-react';
import {api} from '../lib/client-api';
import {notifySystem} from './SystemNotices';

export function OperationsLogout(){
  const [error,setError]=useState(''),[busy,setBusy]=useState(false);
  async function signOut(){
    setBusy(true);
    try{await api('/api/auth/logout',{method:'POST',body:'{}'});window.location.assign('/auth');}
    catch{setError('Не удалось завершить сеанс.');setBusy(false);}
  }
  return <><button type="button" className="ops-button logout-button" onClick={signOut} disabled={busy}><LogOut size={20}/>Выйти</button>
    {error&&<span className="ops-action-error" role="alert">{error}</span>}</>;
}

export function OperationsRefresh(){
  const router=useRouter();
  const [auto,setAuto]=useState(false);
  useEffect(()=>{
    if(!auto)return;
    const timer=window.setInterval(()=>{if(!document.hidden)router.refresh();},60_000);
    return()=>window.clearInterval(timer);
  },[auto,router]);
  return <div className="ops-actions">
    <button type="button" className="ops-button" onClick={()=>router.refresh()}><RefreshCw size={20}/>Обновить</button>
    <label className="ops-check"><input type="checkbox" checked={auto} onChange={event=>setAuto(event.target.checked)}/>Каждую минуту</label>
  </div>;
}

export function RefreshSatellites(){
  const router=useRouter();
  const [busy,setBusy]=useState(false),[notice,setNotice]=useState(''),[error,setError]=useState('');
  async function refresh(){
    setBusy(true);setNotice('');setError('');
    try{
      const result=await api<{count:number}>('/api/operations/catalog',{method:'POST'});
      setNotice('В каталоге получено записей: '+result.count);notifySystem('success','Каталог обновлён. Получено аппаратов: '+result.count);
      router.refresh();
    }catch(e){const message=e instanceof Error?e.message:'Не удалось обновить каталог.';setError(message);notifySystem('error',message);}
    finally{setBusy(false);}
  }
  return <div className="ops-satellite-refresh">
    <button type="button" className="ops-button" onClick={refresh} disabled={busy}><RefreshCw size={20}/>{busy?'Загрузка…':'Обновить из CelesTrak'}</button>
    {notice&&<span role="status">{notice}</span>}{error&&<span className="ops-action-error" role="alert">{error}</span>}
  </div>;
}

export function ExportLink({href,children}:{href:string;children:React.ReactNode}){
  return <a href={href} className="ops-button" download><Download size={20}/>{children}</a>;
}
