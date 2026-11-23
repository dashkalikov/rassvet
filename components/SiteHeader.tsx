'use client';
import Link from 'next/link';
import {usePathname} from 'next/navigation';
import {useEffect,useRef,useState,type KeyboardEvent,type PointerEvent,type CSSProperties} from 'react';
import {Brand,Login,type User} from './ui';
import ThemeToggle from './ThemeToggle';
import PortalSwitcher from './PortalSwitcher';
import UserAvatar from './UserAvatar';
import MaterialIcon from './MaterialIcon';
import {SITE_NAVIGATION} from '../lib/site-navigation';
import {SECTION_ICONS,navigationVisual} from '../lib/navigation-presentation';
import {createHoverMenu} from '../lib/hover-menu';
import {createMenuPresence,MENU_FADE_MS,type MenuPresenceState} from '../lib/menu-presence';

export default function SiteHeader({user}:{user:User|null}){
 const pathname=usePathname();
 const [menu,setMenu]=useState(false),[open,setOpen]=useState<string|null>(null),[login,setLogin]=useState(false);
 const [panel,setPanel]=useState<MenuPresenceState>({id:null,phase:'open'});
 const [presence]=useState(()=>createMenuPresence(setPanel,()=>window.matchMedia('(prefers-reduced-motion: reduce)').matches?0:MENU_FADE_MS));
 const [hover]=useState(()=>createHoverMenu(id=>{setOpen(id);presence.set(id);}));
 const root=useRef<HTMLElement>(null),trigger=useRef<HTMLButtonElement|null>(null),focusFirst=useRef(false);
 const selected=SITE_NAVIGATION.find(item=>item.id===panel.id);
 const featured=selected?.items.filter(item=>navigationVisual(item.href).image)??[];
 const quick=selected?.items.filter(item=>!navigationVisual(item.href).image)??[];
 function close(){hover.hide();setMenu(false);focusFirst.current=false;}
 useEffect(()=>{const frame=requestAnimationFrame(close);return()=>cancelAnimationFrame(frame);},[pathname]);
 useEffect(()=>()=>{hover.dispose();presence.dispose();},[hover,presence]);
 useEffect(()=>{
  if(open&&panel.id===open&&panel.phase==='open'&&focusFirst.current){focusFirst.current=false;root.current?.querySelector<HTMLAnchorElement>('.mega-menu a')?.focus();}
 },[open,panel]);
 useEffect(()=>{
  const media=window.matchMedia('(min-width:761px)');
  const changed=()=>{hover.hide();presence.clear();setMenu(false);focusFirst.current=false;};
  media.addEventListener('change',changed);return()=>media.removeEventListener('change',changed);
 },[hover,presence]);
 useEffect(()=>{
  function outside(event:globalThis.PointerEvent){if(!root.current?.contains(event.target as Node)){hover.hide();setMenu(false);focusFirst.current=false;}}
  function escape(event:globalThis.KeyboardEvent){if(event.key==='Escape'){
   const mobile=root.current?.querySelector<HTMLButtonElement>('.mobile-menu-button[aria-expanded="true"]');
   if(!mobile&&!root.current?.classList.contains('has-submenu'))return;
   const target=mobile??trigger.current;hover.hide();setMenu(false);focusFirst.current=false;target?.focus();
  }}
  document.addEventListener('pointerdown',outside);document.addEventListener('keydown',escape);
  return()=>{document.removeEventListener('pointerdown',outside);document.removeEventListener('keydown',escape);};
 },[hover]);
 function enter(event:PointerEvent<HTMLDivElement>,id:string,hasChildren:boolean){
  if(event.pointerType!=='mouse'&&event.pointerType!=='pen')return;
  if(!window.matchMedia('(min-width:761px)').matches)return;
  if(!hasChildren){hover.hide();return;}
  trigger.current=event.currentTarget.querySelector('button');focusFirst.current=false;setMenu(false);hover.show(id);
 }
 function toggle(id:string,button:HTMLButtonElement){trigger.current=button;focusFirst.current=false;const shown=open===id&&(menu||(panel.id===id&&panel.phase==='open'));shown?hover.hide():hover.show(id);}
 function keyboard(event:KeyboardEvent<HTMLButtonElement>,id:string){
  if(event.key!=='ArrowDown')return;
  event.preventDefault();trigger.current=event.currentTarget;
  if(open===id&&panel.id===id&&panel.phase==='open')root.current?.querySelector<HTMLAnchorElement>('.mega-menu a')?.focus();
  else{focusFirst.current=true;hover.show(id);}
 }
 const active=(href:string)=>pathname===href||(href!=='/'&&pathname.startsWith(href+'/'));
 return <><a className="skip-link" href="#main">Перейти к содержимому</a>
  <header ref={root} className={`site-header navigation-header ${panel.id&&!menu?'has-submenu':''}`} onPointerEnter={()=>hover.hold()} onPointerLeave={event=>{if(event.pointerType==='mouse'&&!menu)hover.leave();}} onFocusCapture={()=>hover.hold()} onBlurCapture={event=>{if(!event.currentTarget.contains(event.relatedTarget as Node|null)&&(event.relatedTarget!==null||!event.currentTarget.matches(':hover')))close();}}>
   <div className="header-inner"><Brand/>
    <nav className="desktop-nav route-nav" aria-label="Основная навигация">
     {SITE_NAVIGATION.map(item=><div className="navigation-group" data-section={item.id} key={item.id} onPointerEnter={event=>enter(event,item.id,item.items.length>0)}>
      {item.items.length?<button className="desktop-section-trigger" type="button" aria-expanded={open===item.id} aria-controls={`submenu-${item.id}`} data-current={active(item.href)||undefined} onClick={event=>toggle(item.id,event.currentTarget)} onKeyDown={event=>keyboard(event,item.id)}>{item.title}<MaterialIcon name="expand_more" size={17}/></button>:<Link href={item.href} onClick={close} aria-current={active(item.href)?'page':undefined}>{item.title}</Link>}
     </div>)}
    </nav>
    <div className="header-actions"><ThemeToggle/>{user?.role==='admin'?<PortalSwitcher current="customer"/>:user?<Link className="account-link" href="/account" onClick={close}><UserAvatar name={user.name} src={user.avatar}/><span>Мой кабинет</span></Link>:<button className="account-link" onClick={()=>{close();setLogin(true);}}><MaterialIcon name="person" size={20}/><span>Войти</span></button>}<button type="button" className="mobile-menu-button" aria-label={menu?'Закрыть меню':'Открыть меню'} aria-expanded={menu} aria-controls="rassvet-mobile-menu" onClick={()=>{hover.hide();setMenu(value=>!value);}}><MaterialIcon name={menu?'close':'menu'} size={25}/></button></div>
   </div>
   {!menu&&selected&&<div className="nav-popover-bridge" data-state={panel.phase} style={{'--menu-fade-duration':`${MENU_FADE_MS}ms`} as CSSProperties} onPointerEnter={()=>{hover.hold();if(open===null&&panel.phase==='closing')hover.show(selected.id);}}><section className={`mega-menu nav-panel-${selected.id} ${selected.items.length<=3?'is-compact':''}`} key={selected.id} id={`submenu-${selected.id}`} aria-label={selected.title} aria-hidden={panel.phase==='closing'} inert={panel.phase==='closing'}>
    <div className="mega-menu-toolbar"><Link href={selected.href} onClick={close} className="mega-section-button" aria-label={selected.title+': открыть раздел'}><span className="mega-section-copy">{selected.description}</span><span className="mega-section-action">Открыть раздел <MaterialIcon name="arrow_forward" size={22}/></span></Link></div>
    <div className="mega-menu-inner"><div className="mega-content">
      {featured.length>0&&<nav className="mega-feature-grid" data-count={featured.length} aria-label={selected.title+': возможности'}>{featured.map(item=><Link className="mega-feature-card" key={item.href} href={item.href} onClick={close}><div className="mega-feature-photo"><img src={navigationVisual(item.href).image} alt="" loading="eager" width={600} height={375}/><span><MaterialIcon name="arrow_outward" size={18}/></span></div><div className="mega-feature-copy"><b>{item.title}</b><small>{item.description}</small></div></Link>)}</nav>}
      {quick.length>0&&<nav className="mega-links" data-count={quick.length} aria-label={selected.title+': разделы'}>{quick.map(item=><Link className="mega-link-card" key={item.href} href={item.href} onClick={close}><span className="nav-tile-icon"><MaterialIcon name={navigationVisual(item.href).icon} size={24}/></span><span><b>{item.title}</b><small>{item.description}</small></span><MaterialIcon name="arrow_outward" size={17}/></Link>)}</nav>}
    </div></div>
   </section></div>}
   {menu&&<nav id="rassvet-mobile-menu" className="mobile-nav grouped-mobile-nav" aria-label="Мобильная навигация">{SITE_NAVIGATION.map(item=><div className="mobile-navigation-group" key={item.id}><div><Link href={item.href} onClick={close} aria-current={active(item.href)?'page':undefined}><MaterialIcon name={SECTION_ICONS[item.id]??'home'} size={22}/>{item.title}</Link>{item.items.length>0&&<button type="button" aria-label={`Подразделы: ${item.title}`} aria-expanded={open===item.id} aria-controls={`mobile-submenu-${item.id}`} onClick={event=>toggle(item.id,event.currentTarget)}><MaterialIcon name="expand_more" size={21}/></button>}</div>{open===item.id&&<div className="mobile-submenu" id={`mobile-submenu-${item.id}`}>{item.items.map(child=><Link key={child.href} href={child.href} onClick={close}><span className="nav-mobile-icon"><MaterialIcon name={navigationVisual(child.href).icon} size={19}/></span><span>{child.title}</span><MaterialIcon name="arrow_outward" size={16}/></Link>)}</div>}</div>)}<Link className="button primary" href="/connect" onClick={close}>Подключиться <MaterialIcon name="arrow_outward" size={19}/></Link></nav>}
  </header>{login&&<Login close={()=>setLogin(false)}/>}
 </>;
}
