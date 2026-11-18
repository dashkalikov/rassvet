import Link from 'next/link';
import type {AppUser} from '../lib/auth-core';
import {ROLE_LABELS} from '../lib/operations-policy';
import {Brand} from './ui';
import ThemeToggle from './ThemeToggle';
import {OperationsLogout} from './OperationsActions';
import PortalSwitcher from './PortalSwitcher';
import SystemNotices from './SystemNotices';

export default function OperationsFrame({user,active,section='overview',children}:{
  user:AppUser;active:'operations'|'admin';section?:'overview'|'orbits'|'network'|'subscriptions';children:React.ReactNode;
}){
  const engineering=active==='operations';
  return <div className={engineering?'ops-app engineering-app':'ops-app'}>
    <a className="skip-link" href="#main">Перейти к содержимому</a>
    <header className="ops-header">
      <div className="ops-shell ops-header-inner">
        <Brand/>
        {engineering&&<nav className="engineering-nav" aria-label="Инженерный портал">
          <Link href="/operations" aria-current={section==='overview'?'page':undefined}>Обзор</Link>
          <Link href="/operations/orbits/map" aria-current={section==='orbits'?'location':undefined}>Орбиты</Link>
          <Link href="/operations?section=overview" aria-current={section==='network'?'page':undefined}>Сеть</Link>
          <Link href="/operations?section=subscriptions" aria-current={section==='subscriptions'?'page':undefined}>Подписки</Link>
        </nav>}
        <div className="ops-header-actions">
          <span>{ROLE_LABELS[user.role]}</span>
          {user.role==='admin'&&<PortalSwitcher current={engineering?'engineer':'admin'}/>}
          <ThemeToggle/>
          <OperationsLogout/>
        </div>
      </div>
    </header>
    <main id="main" className="ops-shell ops-main">{children}</main>
    <SystemNotices/>
  </div>;
}
