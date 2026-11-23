'use client';
import {useState} from 'react';
import {useRouter} from 'next/navigation';
import {Database,HeartPulse,Users} from 'lucide-react';
import {api} from '../lib/client-api';
import {notifySystem} from './SystemNotices';
import {DEMO_PASSWORD} from '../lib/demo-credentials';
type Diagnostic={database:boolean;milliseconds:number;satellites:number;stale:number;asOf:string};
export default function EngineeringDiagnostics(){
 const router=useRouter(),[busy,setBusy]=useState(''),[result,setResult]=useState<Diagnostic|null>(null);
 async function seed(){
  setBusy('seed');try{await api('/api/operations/demo',{method:'POST'});notifySystem('success','Тестовые аккаунты готовы: 24 клиента и инженер. Уже существующие записи сохранены.');router.refresh();}
  catch(error){notifySystem('error',error instanceof Error?error.message:'Не удалось создать тестовые аккаунты.');}finally{setBusy('');}
 }
 async function check(){
  setBusy('check');try{const data=await api<Diagnostic>('/api/operations/diagnostics');setResult(data);notifySystem(data.stale?'warning':'success',data.stale?'База отвечает. У части орбитальных элементов истёк рекомендуемый срок: обновите каталог.':'Диагностика завершена: база отвечает, элементы орбит актуальны.');}
  catch(error){notifySystem('error',error instanceof Error?error.message:'Диагностика не выполнена.');}finally{setBusy('');}
 }
 return <section className="ops-panel engineering-diagnostics"><div className="ops-panel-heading"><div><h2><HeartPulse size={20}/>Диагностика и тестовые аккаунты</h2><p>Проверьте локальную систему или подготовьте данные для демонстрации подписок.</p></div><div className="ops-actions"><button className="ops-button" disabled={!!busy} onClick={check}><HeartPulse size={20}/>{busy==='check'?'Проверяем…':'Проверить систему'}</button><button className="ops-button" disabled={!!busy} onClick={seed}><Users size={20}/>{busy==='seed'?'Подготовка…':'Добавить демоаккаунты'}</button></div></div>
 {result&&<div className="diagnostic-results" role="status"><span><Database size={20}/>База доступна · {result.milliseconds} мс</span><span>Аппаратов: {result.satellites}</span><span>Элементов старше 7 суток: {result.stale}</span><small>Проверено {result.asOf.slice(11,19)} UTC</small></div>}
 <details><summary>Как войти в тестовые аккаунты</summary><p>Клиент: <code>anna.demo@example.test</code> · Анна Смирнова<br/>Инженер: <code>engineer.demo@example.test</code> · Алексей Соколов</p><p>Общий тестовый пароль: <code>{DEMO_PASSWORD}</code>. Сначала нажмите «Добавить демоаккаунты». Затем выйдите и выберите нужный способ входа.</p><p>Все 25 записей вымышленные и отмечены префиксом demo. Демонстрационные аккаунты можно изменять через администратора.</p></details></section>;
}
