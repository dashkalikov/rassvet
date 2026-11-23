'use client';
import {useEffect,useState} from 'react';
import {createPortal} from 'react-dom';
import {CheckCircle2,Info,TriangleAlert,X,XCircle} from 'lucide-react';
type Kind='success'|'info'|'warning'|'error';
type Notice={id:number;kind:Kind;message:string};
const eventName='rassvet-system-notice';
export function notifySystem(kind:Kind,message:string){window.dispatchEvent(new CustomEvent(eventName,{detail:{kind,message}}));}
const icons={success:CheckCircle2,info:Info,warning:TriangleAlert,error:XCircle};
export default function SystemNotices(){
 const [items,setItems]=useState<Notice[]>([]);
 const [container,setContainer]=useState<Element|null>(null);
 useEffect(()=>{const changed=()=>setContainer(document.fullscreenElement);document.addEventListener('fullscreenchange',changed);return()=>document.removeEventListener('fullscreenchange',changed);},[]);
 useEffect(()=>{
  let sequence=0;const timers=new Set<ReturnType<typeof setTimeout>>();
  const listener=(event:Event)=>{
   const detail=(event as CustomEvent<{kind:Kind;message:string}>).detail;
   const item={...detail,id:++sequence};
   setItems(current=>[...current.slice(-3),item]);
   if(item.kind!=='error'){
    const timer=setTimeout(()=>{setItems(current=>current.filter(n=>n.id!==item.id));timers.delete(timer);},6500);timers.add(timer);
   }
  };
  window.addEventListener(eventName,listener);
  return()=>{window.removeEventListener(eventName,listener);timers.forEach(clearTimeout);};
 },[]);
 const notices=<aside className="system-notices" aria-label="Сообщения системы">{items.map(item=>{
  const Icon=icons[item.kind];return <div key={item.id} className={'system-notice '+item.kind} role={item.kind==='error'?'alert':'status'}><Icon size={21}/><p>{item.message}</p><button type="button" aria-label="Закрыть уведомление" onClick={()=>setItems(items.filter(n=>n.id!==item.id))}><X size={20}/></button></div>;
 })}</aside>;
 return container?createPortal(notices,container):notices;
}
