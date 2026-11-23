import {redirect} from 'next/navigation';
import {getDb} from '../../db';
import {getCurrentUser} from '../../lib/session';
import {loadAdmin} from '../../lib/operations';
import {ROLE_LABELS,SUBSCRIPTION_TRANSITIONS,subscriptionLabel} from '../../lib/operations-policy';
import {PLANS} from '../../lib/domain';
import OperationsFrame from '../../components/OperationsFrame';
import AdminAction from '../../components/AdminAction';
import {ExportLink} from '../../components/OperationsActions';

export const dynamic='force-dynamic';
export const metadata={title:'Администрирование — РАССВЕТ'};
const actionLabels={new:'Вернуть в заявки',active:'Активировать',paused:'Приостановить',cancelled:'Отменить'};
const sectionNames={accounts:'Аккаунты',subscriptions:'Подписки',audit:'Журнал доступа'} as const;
type Section=keyof typeof sectionNames;
const date=(value:string)=>value.slice(0,16).replace('T',' ')+' UTC';

export default async function AdminPage({searchParams}:{searchParams:Promise<{section?:string;page?:string;q?:string}>}){
  const [user,params]=await Promise.all([getCurrentUser(),searchParams]);
  if(!user||user.role!=='admin')redirect('/auth?portal=admin');
  const section:Section=params.section&&Object.hasOwn(sectionNames,params.section)?params.section as Section:'accounts';
  const page=typeof params.page==='string'&&/^\d{1,6}$/.test(params.page)?Math.max(1,Number(params.page)):1;
  const query=typeof params.q==='string'?params.q.trim().slice(0,100):'';
  const data=await loadAdmin(getDb(),page,query.toLowerCase());
  const next=section==='accounts'?data.nextAccounts:data.nextOrders;
  const pageLink=(index:number)=>'/admin?section='+section+'&page='+index+(query?'&q='+encodeURIComponent(query):'');
  return <OperationsFrame user={user} active="admin">
    <div className="ops-title"><div><h1>Управление</h1><p>Настройка доступа, статусы подписок и журнал изменений.</p></div></div>
    <nav className="ops-tabs" aria-label="Разделы управления">{(Object.keys(sectionNames) as Section[]).map(tab=><a key={tab} href={'/admin?section='+tab} aria-current={tab===section?'page':undefined}>{sectionNames[tab]}</a>)}</nav>
    {section==='accounts'&&<section className="ops-panel">
      <div className="ops-panel-heading">
        <div><h2>Аккаунты</h2><p>Откройте профиль, чтобы сменить роль, сбросить пароль или настроить доступ.</p></div>
        <div className="ops-row-actions">
          <form action="/admin" className="ops-search">
            <input type="search" name="q" defaultValue={query} placeholder="Имя, почта или ID" aria-label="Найти аккаунт" maxLength={100}/>
            <button className="ops-button">Найти</button>
          </form>
          <ExportLink href="/api/operations/export?dataset=accounts">Аккаунты · CSV</ExportLink>
        </div>
      </div>
      {data.accounts.length?<div className="ops-table-wrap"><table><thead><tr><th>Имя и почта</th><th>Роль</th><th>Доступ</th><th>Подписки</th><th>Создан</th><th>Действия</th></tr></thead><tbody>
        {data.accounts.map(account=><tr key={account.id}>
          <th><strong>{account.name}</strong><small>{account.email}</small></th><td>{ROLE_LABELS[account.role]}</td>
          <td><span className="ops-status" data-blocked={Boolean(account.blocked)}>{account.blocked?'Заблокирован':'Открыт'}</span></td>
          <td>{account.subscriptions}</td><td>{date(account.createdAt)}</td>
          <td><div className="ops-row-actions">
            <a className="ops-button" href={'/admin/accounts/'+account.id} aria-label={'Открыть профиль: '+account.email}>Открыть профиль</a>
            {account.role!=='admin'&&<AdminAction label={account.blocked?'Разблокировать':'Заблокировать'} subject={account.email}
              action={{action:'access',id:account.id,blocked:!account.blocked}} danger={!account.blocked}/>}
          </div></td>
        </tr>)}
      </tbody></table></div>:<p>Подходящих аккаунтов нет.</p>}
    </section>}
    {section==='subscriptions'&&<section className="ops-panel">
      <div className="ops-panel-heading"><div><h2>Заявки и подписки</h2><p>Меняйте статус учебной подписки. Клиент увидит его в личном кабинете.</p></div>
        <ExportLink href="/api/operations/export?dataset=orders">Заявки · CSV</ExportLink></div>
      {data.orders.length?<div className="ops-table-wrap"><table><thead><tr><th>Заявка</th><th>Клиент</th><th>Тариф</th><th>Статус</th><th>Действия</th></tr></thead><tbody>
        {data.orders.map(order=><tr key={order.id}><th>{order.id.slice(0,8)}<small>{date(order.createdAt)}</small></th>
          <td>{order.name??'—'}</td><td>{PLANS.find(p=>p.id===order.plan)?.name??order.plan}</td><td>{subscriptionLabel(order.status)}</td>
          <td><div className="ops-row-actions">{SUBSCRIPTION_TRANSITIONS[order.status]?.map(status=><AdminAction key={status}
            label={actionLabels[status]} subject={'Заявка '+order.id.slice(0,8)} danger={status==='cancelled'}
            action={{action:'subscription',id:order.id,previous:order.status,status}}/>)}</div></td></tr>)}
      </tbody></table></div>:<p>В базе пока нет заявок.</p>}
    </section>}
    {section==='audit'&&<section className="ops-panel">
      <div className="ops-panel-heading"><div><h2>Журнал доступа</h2><p>До 50 последних изменений ролей, блокировок и сбросов пароля.</p></div>
        <ExportLink href="/api/operations/export?dataset=access">Журнал · CSV</ExportLink></div>
      {data.events.length?<div className="ops-table-wrap"><table><thead><tr><th>Время</th><th>Аккаунт</th><th>Кто изменил</th><th>Действие</th><th>Роль</th><th>Доступ</th></tr></thead><tbody>
        {data.events.map(event=><tr key={event.id}><td>{date(event.at)}</td><td><a href={'/admin/accounts/'+event.userId}>{event.userId.slice(0,8)}</a></td>
          <td>{event.actorId?<a href={'/admin/accounts/'+event.actorId}>{event.actorId.slice(0,8)}</a>:'Локальная настройка'}</td>
          <td>{event.action==='password_reset'?'Сброс пароля':'Изменение доступа'}</td>
          <td>{event.oldRole!==event.role?ROLE_LABELS[event.oldRole]+' → ':''}{ROLE_LABELS[event.role]}</td>
          <td>{event.oldBlocked!==event.blocked?(event.oldBlocked?'Закрыт → ':'Открыт → '):''}{event.blocked?'Закрыт':'Открыт'}</td></tr>)}
      </tbody></table></div>:<p>Изменений доступа пока нет.</p>}
    </section>}
    {section!=='audit'&&(page>1||next)&&<nav className="ops-pagination" aria-label="Страницы таблицы">
      {page>1&&<a className="ops-button" href={pageLink(page-1)}>Назад</a>}<span>Страница {page}</span>
      {next&&<a className="ops-button" href={pageLink(page+1)}>Далее</a>}
    </nav>}
  </OperationsFrame>;
}
