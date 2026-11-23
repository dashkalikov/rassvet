'use client';
import Link from 'next/link';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { X, ArrowUpRight, Menu, ArrowRight } from 'lucide-react';
import AuthForm from './AuthForm';
import BrandMark from './BrandMark';
import {readLastLogin} from '../lib/last-login';
import {PORTAL_PATHS,type Role} from '../lib/operations-policy';
export {api} from '../lib/client-api';
export type User = { name: string; email: string; avatar?: string; role?: import('../lib/operations-policy').Role };
export function Brand({ small = false }: { small?: boolean }) {
  return <Link href="/" className={`brand ${small ? 'small' : ''}`} aria-label="РАССВЕТ — главная"><BrandMark/><span>РАССВЕТ<span className="brand-caption">СПУТНИКОВАЯ СВЯЗЬ</span></span></Link>;
}
export function Modal({ title, children, close, wide = false, className = '' }: { title: string; children: ReactNode; close: () => void; wide?: boolean; className?: string }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const el = ref.current; const previous = document.activeElement as HTMLElement | null;
    el?.showModal(); const before = document.body.style.overflow; document.body.style.overflow = 'hidden';
    return () => { el?.close(); document.body.style.overflow = before; previous?.focus(); };
  }, []);
  return <dialog ref={ref} className={`modal ${wide ? 'wide' : ''} ${className}`} aria-labelledby="modal-title" onCancel={e => { e.preventDefault(); close(); }} onClick={e => { if (e.target === e.currentTarget) { const r = e.currentTarget.getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) close(); } }}><button className="icon-button close-modal" onClick={close} aria-label="Закрыть окно"><X size={22} /></button><h2 id="modal-title">{title}</h2>{children}</dialog>;
}
export function ButtonArrow({ diagonal = false }: { diagonal?: boolean }) { return diagonal ? <ArrowUpRight size={19} /> : <ArrowRight size={19} />; }
export function Login({ close, returnTo = '/account' }: { close: () => void; returnTo?: string }) {
  const [mode,setMode]=useState<'login'|'register'>('login');
  const [portal,setPortal]=useState<Role>('customer');
  useEffect(()=>{if(returnTo==='/account'){const saved=readLastLogin();if(saved)setPortal(saved.portal);}},[returnTo]);
  const title=mode==='register'?'Создайте свой аккаунт':portal==='engineer'?'Вход для инженера':portal==='admin'?'Вход для администратора':'Ваш мир. В одном аккаунте.';
  return <Modal title={title} close={close} wide={mode==='register'} className={`auth-dialog ${mode==='register'?'is-register':''}`}><AuthForm key={portal} portal={portal} returnTo={portal==='customer'?returnTo:PORTAL_PATHS[portal]} onModeChange={setMode}/></Modal>;
}
export function MobileMenuButton({ onClick, expanded }: { onClick: () => void; expanded: boolean }) { return <button className="icon-button mobile-menu-button" aria-label={expanded ? 'Закрыть меню' : 'Открыть меню'} aria-expanded={expanded} onClick={onClick}>{expanded ? <X /> : <Menu />}</button>; }
