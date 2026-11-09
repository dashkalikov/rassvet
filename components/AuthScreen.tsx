'use client';
import { ArrowLeft,Satellite,ShieldCheck } from 'lucide-react';
import { Brand } from './ui';
import AuthForm from './AuthForm';
import ThemeToggle from './ThemeToggle';
import AuthOrbit from './AuthOrbit';
export default function AuthScreen({returnTo,mode}:{returnTo:string;mode:'login'|'register'}){
 return <div className="auth-page"><header className="auth-header"><Brand/><div><ThemeToggle/><a href="/" className="back-to-site"><ArrowLeft size={16}/>На главную</a></div></header><main className="auth-layout"><section className="auth-visual"><AuthOrbit/><div className="auth-visual-overlay"/><div className="auth-visual-copy"><span className="eyebrow"><i/>ВАША ЛИЧНАЯ ОРБИТА</span><h1>Ближе к миру.<br/>Ближе к вам.</h1><p>Подключение, профиль и поддержка.<br/>Всё важное — в одном аккаунте.</p></div><div className="auth-visual-bottom"><Satellite size={24}/><span>Одна почта. Ваши возможности.<small>РАССВЕТ · СПУТНИКОВЫЙ ИНТЕРНЕТ</small></span></div></section><section className="auth-card"><span className="eyebrow">ДОБРО ПОЖАЛОВАТЬ В РАССВЕТ</span><h2>Ваш мир.<br/>В одном аккаунте.</h2><AuthForm returnTo={returnTo} initialMode={mode}/></section></main><footer className="auth-footer"><span>© 2026 РАССВЕТ. Учебный проект.</span><span><ShieldCheck size={14}/>Локальная версия</span></footer></div>;
}
