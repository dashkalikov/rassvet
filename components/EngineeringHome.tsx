import Link from 'next/link';
import {Activity,ArrowRight,ArrowUpRight,ChartNoAxesCombined,Globe2,Map,Radio,Satellite,Table2,Users} from 'lucide-react';

const tools=[
  {href:'/operations/orbits/map',label:'Карта',description:'Положение и трасса спутников',Icon:Map},
  {href:'/operations/orbits/globe',label:'Глобус',description:'Вращаемая модель Земли',Icon:Globe2},
  {href:'/operations/orbits/history',label:'График',description:'История большой полуоси',Icon:ChartNoAxesCombined},
  {href:'/operations/orbits/catalog',label:'Каталог',description:'Параметры аппаратов и NORAD',Icon:Table2},
];

const sections=[
  {href:'/operations?section=overview',label:'Метрики сети',description:'Запросы API, задержка и ошибки приложения.',image:'ground-station.webp',Icon:Activity},
  {href:'/operations?section=subscriptions',label:'Клиенты и подписки',description:'Динамика регистраций и история подключений.',image:'subscriber-terminal.webp',Icon:Users},
];

export default function EngineeringHome(){
  return <>
    <section className="engineering-hero">
      <img className="engineering-hero-image" src="/assets/engineering/orbit-hero.webp" alt="" width={1440} height={960} fetchPriority="high"/>
      <div className="engineering-hero-content">
        <p className="engineering-kicker"><Radio size={20} aria-hidden="true"/>РАССВЕТ / ИНЖЕНЕРНЫЙ ПОРТАЛ</p>
        <h1>Инженерная панель</h1>
        <p>Следите за орбитами спутников, проверяйте работу сети и анализируйте подписки.</p>
        <div className="engineering-hero-actions">
          <Link className="engineering-hero-primary" href="/operations/orbits/map">Открыть карту <ArrowRight size={20}/></Link>
          <Link className="engineering-hero-secondary" href="/operations/orbits/history">График орбит <ArrowUpRight size={20}/></Link>
        </div>
      </div>
    </section>
    <section className="engineering-section" aria-labelledby="engineering-tools">
      <div className="engineering-section-label"><Satellite size={22} aria-hidden="true"/><h2 id="engineering-tools">Орбитальный трекер</h2></div>
      <div className="engineering-tool-grid">
        {tools.map(({href,label,description,Icon})=><a key={href} className="engineering-tool-card" href={href}>
          <Icon size={22} aria-hidden="true"/><ArrowUpRight size={20} aria-hidden="true"/>
          <strong>{label}</strong><small>{description}</small>
        </a>)}
      </div>
    </section>
    <section className="engineering-section" aria-labelledby="engineering-analytics">
      <div className="engineering-section-label"><Activity size={22} aria-hidden="true"/><h2 id="engineering-analytics">Аналитика</h2></div>
      <div className="engineering-feature-grid">
        {sections.map(({href,label,description,image,Icon})=><a key={href} className="engineering-feature-card" href={href}>
          <img src={'/assets/engineering/'+image} alt="" width={720} height={480} loading="lazy"/>
          <div><Icon size={21} aria-hidden="true"/><h3>{label}</h3><p>{description}</p></div>
          <ArrowUpRight size={20} aria-hidden="true"/>
        </a>)}
      </div>
    </section>
  </>;
}
