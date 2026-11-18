'use client';
import {useEffect,useRef,useState} from 'react';
import {Maximize2,Minimize2} from 'lucide-react';

export default function FullscreenPanel({children,title,className=''}:{children:React.ReactNode;title:string;className?:string}){
 const root=useRef<HTMLDivElement>(null),button=useRef<HTMLButtonElement>(null);
 const [native,setNative]=useState(false),[fallback,setFallback]=useState(false);
 const expanded=native||fallback;
 useEffect(()=>{
  const changed=()=>setNative(document.fullscreenElement===root.current);
  document.addEventListener('fullscreenchange',changed);
  return()=>document.removeEventListener('fullscreenchange',changed);
 },[]);
 useEffect(()=>{
  if(!fallback)return;
  const overflow=document.body.style.overflow;document.body.style.overflow='hidden';
  const escape=(event:KeyboardEvent)=>{if(event.key==='Escape'){setFallback(false);button.current?.focus();}};
  document.addEventListener('keydown',escape);
  return()=>{document.body.style.overflow=overflow;document.removeEventListener('keydown',escape);};
 },[fallback]);
 async function toggle(){
  if(native){await document.exitFullscreen();button.current?.focus();return;}
  if(fallback){setFallback(false);button.current?.focus();return;}
  try{if(!root.current?.requestFullscreen)throw new Error();await root.current.requestFullscreen();}
  catch{setFallback(true);}
 }
 return <div ref={root} className={`visual-fullscreen ${className} ${expanded?'is-expanded':''} ${fallback?'fullscreen-fallback':''}`}>
  <div className="fullscreen-tools"><button ref={button} type="button" onClick={toggle} aria-pressed={expanded} aria-label={(expanded?'Свернуть: ':'На весь экран: ')+title} title={expanded?'Свернуть · Esc':'На весь экран'}>{expanded?<Minimize2 size={17}/>:<Maximize2 size={17}/>}<span>{expanded?'Свернуть':'На весь экран'}</span></button></div>
  {children}
 </div>;
}
