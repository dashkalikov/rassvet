import {redirect} from 'next/navigation';
import {Activity,Users,Wifi} from 'lucide-react';
import {getDb} from '../../db';
import {getCurrentUser} from '../../lib/session';
import {loadCustomerHistory,loadOperations,readPeriod} from '../../lib/operations';
import {subscriptionLabel} from '../../lib/operations-policy';
import {PLANS} from '../../lib/domain';
import OperationsFrame from '../../components/OperationsFrame';
import OperationsChart from '../../components/OperationsChart';
import {ExportLink,OperationsRefresh} from '../../components/OperationsActions';
import EngineeringHome from '../../components/EngineeringHome';
import EngineeringDiagnostics from '../../components/EngineeringDiagnostics';

export const dynamic='force-dynamic';
export const metadata={title:'Инженерная панель — РАССВЕТ'};
const date=(value:string)=>value.slice(0,16).replace('T',' ')+' UTC';
const format=new Intl.NumberFormat('ru-RU',{maximumFractionDigits:2});
const count=(value:number|null)=>value===null?'—':format.format(value);

export default async function OperationsPage({searchParams}:{searchParams:Promise<{section?:string;period?:string;norad?:string;demo?:string}>}){
  const [user,params]=await Promise.all([getCurrentUser(),searchParams]);
  if(!user||user.role==='customer')redirect('/auth?portal=engineer');
  if(params.section==='satellites'){
    const norad=typeof params.norad==='string'&&/^\d{1,9}$/.test(params.norad)?'?norad='+params.norad:'';
    redirect('/operations/orbits/catalog'+norad);
  }
  if(params.section!=='overview'&&params.section!=='subscriptions'){
    return <OperationsFrame user={user} active="operations"><EngineeringHome/></OperationsFrame>;
  }
  const section=params.section;
  const period=readPeriod(params.period),db=getDb();
  const demo=params.demo!=='0';
  const snapshot=await loadOperations(db,period,new Date(),demo);
  const customers=section==='subscriptions'?await loadCustomerHistory(db,snapshot.days[0].day,50):[];
  const route=(days:number)=>'/operations?section='+section+'&period='+days+'&demo='+(demo?'1':'0');
  const exportUrl=(dataset:string,fmt='csv',suffix='')=>'/api/operations/export?format='+fmt+'&dataset='+dataset+'&period='+period+'&demo='+(demo?'1':'0')+suffix;
  const byDay=snapshot.days.map(point=>({...point,label:point.day.slice(8,10)+'.'+point.day.slice(5,7)}));
  const planName=(id:string)=>PLANS.find(plan=>plan.id===id)?.name??id;
  return <OperationsFrame user={user} active="operations" section={section==='overview'?'network':'subscriptions'}>
    <div className="ops-title engineering-page-title">
      <div><h1>{section==='overview'?'Метрики сети':'Клиенты и подписки'}</h1>
        <p>{section==='overview'?'Доступность, время ответа и ошибки API.':'Регистрации, тарифы и изменения статусов подписок.'}</p></div>
      <OperationsRefresh/>
    </div>
    <div className="ops-toolbar">
      <nav className="ops-period" aria-label="Отчётный период">{[7,30,90].map(days=><a aria-current={days===period?'page':undefined} key={days} href={route(days)}>{days} дней</a>)}</nav>
      <div className="ops-actions"><ExportLink href={exportUrl('all','json')}>JSON</ExportLink><ExportLink href={exportUrl('all','prom')}>Prometheus</ExportLink></div>
    </div>
    <div className="ops-panel ops-data-mode"><div><strong>{demo?'Демонстрационная нагрузка API':'Измерения локального приложения'}</strong><p>{demo?'Графики запросов и задержек используют тестовую нагрузку. Клиенты и подписки берутся из локальной базы.':'Запросы и задержки измеряются при использовании приложения.'}</p></div><nav className="ops-period" aria-label="Источник метрик"><a href={'/operations?section='+section+'&period='+period+'&demo=1'} aria-current={demo?'page':undefined}>Демонстрация</a><a href={'/operations?section='+section+'&period='+period+'&demo=0'} aria-current={!demo?'page':undefined}>Измерения</a></nav></div>
    <EngineeringDiagnostics/>
    {section==='overview'&&<>
      <div className="ops-cards">
        <article><Users size={18}/><span>Клиенты</span><strong>{snapshot.totals.customers}</strong><small>Зарегистрированные аккаунты клиентов</small></article>
        <article><Wifi size={18}/><span>Активные подписки</span><strong>{snapshot.totals.active}</strong><small>{snapshot.totals.new} заявок в ожидании</small></article>
        <article><Activity size={18}/><span>Сеансы</span><strong>{snapshot.totals.activeSessions}</strong><small>Сеансы с действующим сроком</small></article>
        <article><Activity size={18}/><span>Запросы API</span><strong>{count(byDay.reduce((sum,row)=>sum+row.requests,0))}</strong><small>За выбранный период</small></article>
      </div>
      <div className="ops-grid">
        <OperationsChart title="Запросы и ошибки API" detail={(demo?'Тестовая нагрузка · ':'Измерения · ')+'по дням UTC'} data={byDay} integer
          series={[{key:'requests',name:'Запросы',color:'var(--ops-series-1)'},{key:'clientErrors',name:'4xx',color:'var(--ops-series-2)',dash:'5 3'},{key:'serverErrors',name:'5xx',color:'var(--ops-series-3)',dash:'2 4'}]}/>
        <OperationsChart title="Время ответа" detail={demo?'Демонстрационные задержки, включая пример всплеска':'Измеряется на сервере до формирования ответа'} data={byDay} unit=" мс"
          series={[{key:'averageMs',name:'Среднее',color:'var(--ops-series-1)'},{key:'maxMs',name:'Максимум',color:'var(--ops-series-2)',dash:'5 3'}]}/>
      </div>
      <div className="ops-panel ops-panel-heading"><div><h2>Метрики API</h2><p>Сбор начинается после обновления приложения. Поддержка содержит {snapshot.totals.tickets} обращений.</p></div>
        <div className="ops-actions"><ExportLink href={exportUrl('daily')}>По дням · CSV</ExportLink><ExportLink href={exportUrl('hourly')}>По часам · CSV</ExportLink></div></div>
    </>}
    {section==='subscriptions'&&<>
      <div className="ops-cards">
        <article><span>Новые заявки</span><strong>{snapshot.totals.new}</strong></article>
        <article><span>Активные</span><strong>{snapshot.totals.active}</strong></article>
        <article><span>Приостановленные</span><strong>{snapshot.totals.paused}</strong></article>
        <article><span>Отменённые</span><strong>{snapshot.totals.cancelled}</strong></article>
      </div>
      <div className="ops-grid">
        <OperationsChart title="Регистрации" detail="Создание аккаунтов по дням UTC" data={byDay} integer
          series={[{key:'registrations',name:'Новые аккаунты',color:'var(--ops-series-1)'}]}/>
        <OperationsChart title="События подписок" detail="Создание заявки и изменения статуса по дням UTC" data={byDay} integer
          series={[{key:'opened',name:'Заявки',color:'var(--ops-series-1)'},{key:'activations',name:'Активации',color:'var(--ops-series-2)',dash:'5 3'},{key:'paused',name:'Паузы',color:'var(--ops-series-3)',dash:'2 4'},{key:'cancelled',name:'Отмены',color:'var(--text)',dash:'8 4 2 4'}]}/>
      </div>
      <section className="ops-panel"><div className="ops-panel-heading"><h2>Подписки по тарифам</h2><ExportLink href={exportUrl('plans')}>CSV</ExportLink></div>
        {snapshot.plans.length?<div className="ops-table-wrap"><table><thead><tr><th>Тариф</th><th>Статус</th><th>Количество</th></tr></thead>
          <tbody>{snapshot.plans.map(row=><tr key={row.plan+row.status}><td>{planName(row.plan)}</td><td>{subscriptionLabel(row.status)}</td><td>{row.count}</td></tr>)}</tbody></table></div>:<p>В базе пока нет заявок.</p>}
      </section>
      <section className="ops-panel"><div className="ops-panel-heading"><div><h2>История подписок</h2><p>До 100 последних событий за период. Полная выборка доступна в CSV.</p></div><ExportLink href={exportUrl('subscriptions')}>CSV</ExportLink></div>
        {snapshot.subscriptionEvents.length?<div className="ops-table-wrap"><table><thead><tr><th>Время</th><th>Заявка</th><th>Тариф</th><th>Переход</th></tr></thead><tbody>
          {snapshot.subscriptionEvents.map((event,i)=><tr key={event.orderId+event.at+i}><td>{date(event.at)}</td><td>{event.orderId.slice(0,8)}</td><td>{planName(event.plan)}</td><td>{event.previous?subscriptionLabel(event.previous)+' → ':''}{subscriptionLabel(event.status)}</td></tr>)}</tbody></table></div>:<p>За этот период событий нет.</p>}
      </section>
      <section className="ops-panel"><div className="ops-panel-heading"><div><h2>История клиентов</h2><p>До 50 регистраций за период и текущие статусы их подписок.</p></div><ExportLink href={exportUrl('customers')}>CSV</ExportLink></div>
        {customers.length?<div className="ops-table-wrap"><table><thead><tr><th>ID клиента</th><th>Регистрация</th><th>Доступ</th><th>Новые</th><th>Активные</th><th>На паузе</th><th>Отменённые</th></tr></thead><tbody>
          {customers.map(customer=><tr key={customer.customer}><th>{customer.name}<small className="ops-customer-id">{customer.demo?'Демо · ':''}{customer.customer.slice(0,18)}</small></th><td>{date(customer.createdAt)}</td><td>{customer.blocked?'Закрыт':'Открыт'}</td><td>{customer.pending}</td>
            <td>{customer.active}</td><td>{customer.paused}</td><td>{customer.cancelled}</td></tr>)}</tbody></table></div>:<p>За этот период клиентов не зарегистрировано.</p>}
      </section>
    </>}
    <p className="ops-footnote">Снимок данных · {date(snapshot.generatedAt)}</p>
  </OperationsFrame>;
}
