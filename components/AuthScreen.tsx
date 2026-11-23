'use client';
import Link from 'next/link';
import {useEffect,useState} from 'react';
import { ArrowLeft,Satellite,ShieldCheck } from 'lucide-react';
import { Brand } from './ui';
import AuthForm from './AuthForm';
import ThemeToggle from './ThemeToggle';
import AuthOrbit from './AuthOrbit';
import {PORTAL_PATHS,ROLE_LABELS,type Role} from '../lib/operations-policy';
import {readLastLogin} from '../lib/last-login';

export default function AuthScreen({returnTo,mode,portal,restoreLogin=false}:{returnTo:string;mode:'login'|'register';portal:Role;restoreLogin?:boolean}){
 const [selectedPortal,setSelectedPortal]=useState(portal),[formMode,setFormMode]=useState(mode);
 useEffect(()=>{if(restoreLogin){const saved=readLastLogin();if(saved)setSelectedPortal(saved.portal);}},[restoreLogin]);
 const staff=selectedPortal!=='customer';
 return <div className="auth-page" data-auth-mode={formMode}>
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
    <h2>{selectedPortal==='engineer'?'Вход для инженера':selectedPortal==='admin'?'Вход для администратора':formMode==='register'?'Создайте свой аккаунт':'Личный кабинет'}</h2>
    <nav className="auth-portals" aria-label="Выберите кабинет">
     {(['customer','engineer','admin'] as const).map(role=><a key={role} href={'/auth?portal='+role} aria-current={role===selectedPortal?'page':undefined}>{ROLE_LABELS[role]}</a>)}
    </nav>
    <AuthForm key={selectedPortal} returnTo={staff?PORTAL_PATHS[selectedPortal]:returnTo} initialMode={mode} portal={selectedPortal} onModeChange={setFormMode}/>
   </section>
  </main>
  <footer className="auth-footer"><span>© 2026 РАССВЕТ. Спутниковая связь.</span><span><ShieldCheck size={14}/>Локальная версия</span></footer>
 </div>;
}
