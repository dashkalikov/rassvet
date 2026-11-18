import {ChevronDown,Layers3,Satellite,ShieldCheck,UserRound} from 'lucide-react';
import {PORTAL_PATHS,type Role} from '../lib/operations-policy';

const versions=[
  {id:'customer',label:'Клиент',description:'Личный кабинет и заявки',Icon:UserRound},
  {id:'engineer',label:'Инженер',description:'Орбиты и метрики сети',Icon:Satellite},
  {id:'admin',label:'Администратор',description:'Управление аккаунтами',Icon:ShieldCheck},
] as const;

export default function PortalSwitcher({current}:{current:Role}){
  return <details className="portal-switcher">
    <summary><Layers3 size={17} aria-hidden="true"/><span>Кабинеты</span><ChevronDown size={14} aria-hidden="true"/></summary>
    <div className="portal-switcher-options">
      {versions.map(({id,label,description,Icon})=><a key={id} href={PORTAL_PATHS[id]} aria-current={current===id?'location':undefined}>
        <Icon size={18} aria-hidden="true"/>
        <span><strong>{label}</strong><small>{description}</small></span>
      </a>)}
    </div>
  </details>;
}
