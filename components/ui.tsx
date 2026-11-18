'use client';
import Link from 'next/link';
import { useEffect, useRef, type ReactNode } from 'react';
import { X, ArrowUpRight, Menu, ArrowRight } from 'lucide-react';
import AuthForm from './AuthForm';
import BrandMark from './BrandMark';
export {api} from '../lib/client-api';
export type User = { name: string; email: string; avatar?: string; role?: import('../lib/operations-policy').Role };
export function Brand({ small = false }: { small?: boolean }) {
  return <Link href="/" className={`brand ${small ? 'small' : ''}`} aria-label="РАССВЕТ — главная"><BrandMark/><span>РАССВЕТ<span className="brand-caption">СПУТНИКОВАЯ СВЯЗЬ</span></span></Link>;
}
export function Modal({ title, children, close, wide = false }: { title: string; children: ReactNode; close: () => void; wide?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const el = ref.current; const previous = document.activeElement as HTMLElement | null;
    el?.showModal(); const before = document.body.style.overflow; document.body.style.overflow = 'hidden';
    return () => { el?.close(); document.body.style.overflow = before; previous?.focus(); };
  }, []);
  return <dialog ref={ref} className={`modal ${wide ? 'wide' : ''}`} aria-labelledby="modal-title" onCancel={e => { e.preventDefault(); close(); }} onClick={e => { if (e.target === e.currentTarget) { const r = e.currentTarget.getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) close(); } }}><button className="icon-button close-modal" onClick={close} aria-label="Закрыть окно"><X size={22} /></button><h2 id="modal-title">{title}</h2>{children}</dialog>;
}
export function ButtonArrow({ diagonal = false }: { diagonal?: boolean }) { return diagonal ? <ArrowUpRight size={19} /> : <ArrowRight size={19} />; }
export function Login({ close, returnTo = '/account' }: { close: () => void; returnTo?: string }) {
  return <Modal title="Ваш мир. В одном аккаунте." close={close}><AuthForm returnTo={returnTo}/></Modal>;
}
export function MobileMenuButton({ onClick, expanded }: { onClick: () => void; expanded: boolean }) { return <button className="icon-button mobile-menu-button" aria-label={expanded ? 'Закрыть меню' : 'Открыть меню'} aria-expanded={expanded} onClick={onClick}>{expanded ? <X /> : <Menu />}</button>; }
