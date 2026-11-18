'use client';
import Link from 'next/link';
import { ArrowLeft,Satellite,ShieldCheck } from 'lucide-react';
import { Brand } from './ui';
import AuthForm from './AuthForm';
import ThemeToggle from './ThemeToggle';
import AuthOrbit from './AuthOrbit';
import {ROLE_LABELS,type Role} from '../lib/operations-policy';

export default function AuthScreen({returnTo,mode,portal}:{returnTo:string;mode:'login'|'register';portal:Role}){
 const staff=portal!=='customer';
 return <div className="auth-page">
  <header className="auth-header"><Brand/><div><ThemeToggle/><Link href="/" className="back-to-site"><ArrowLeft size={16}/>На главную</Link></div></header>
  <main className="auth-layout">
   <section className="auth-visual">
    <AuthOrbit/><div className="auth-visual-overlay"/>
    <div className="auth-visual-copy">
     <h1>{staff?'Служебные кабинеты':<>Ближе к миру.<br/>Ближе к вам.</>}</h1>
     <p>{staff?'Статистика сети и управление приложением.':'Подключение, профиль и поддержка.'}</p>
    </div>
    <div className="auth-visual-bottom"><Satellite size={24}/><span>РАССВЕТ · СПУТНИКОВЫЙ ИНТЕРНЕТ</span></div>
   </section>
   <section className="auth-card">
    <h2>{portal==='engineer'?'Вход для инженера':portal==='admin'?'Вход для администратора':'Личный кабинет'}</h2>
    <nav className="auth-portals" aria-label="Выберите кабинет">
     {(['customer','engineer','admin'] as const).map(role=><a key={role} href={role==='customer'?'/auth':'/auth?portal='+role} aria-current={role===portal?'page':undefined}>{ROLE_LABELS[role]}</a>)}
    </nav>
    <AuthForm key={portal} returnTo={returnTo} initialMode={mode} portal={portal}/>
   </section>
  </main>
  <footer className="auth-footer"><span>© 2026 РАССВЕТ. Учебный проект.</span><span><ShieldCheck size={14}/>Локальная версия</span></footer>
 </div>;
}
