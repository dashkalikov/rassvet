import Link from 'next/link';
import {notFound,redirect} from 'next/navigation';
import {ArrowLeft} from 'lucide-react';
import {getDb} from '../../../../db';
import {getCurrentUser} from '../../../../lib/session';
import {loadAdminAccount} from '../../../../lib/operations';
import {ROLE_LABELS} from '../../../../lib/operations-policy';
import AdminAction from '../../../../components/AdminAction';
import AdminPasswordReset from '../../../../components/AdminPasswordReset';
import OperationsFrame from '../../../../components/OperationsFrame';

export const dynamic='force-dynamic';
export const metadata={title:'Профиль пользователя — РАССВЕТ'};

export default async function AdminAccountPage({params}:{params:Promise<{id:string}>}){
  const [user,{id}]=await Promise.all([getCurrentUser(),params]);
  if(!user||user.role!=='admin')redirect('/auth?portal=admin');
  const account=await loadAdminAccount(getDb(),id);
  if(!account)notFound();
  const protectedAccount=account.role==='admin';
  const otherRole=account.role==='engineer'?'customer':'engineer';

  return <OperationsFrame user={user} active="admin">
    <Link className="ops-button ops-account-back" href="/admin?section=accounts"><ArrowLeft size={15} aria-hidden="true"/>К списку аккаунтов</Link>
    <div className="ops-title"><div><h1>{account.name}</h1><p>{account.email}</p></div>
      <span className="ops-status" data-blocked={Boolean(account.blocked)}>{account.blocked?'Заблокирован':'Доступ открыт'}</span>
    </div>
    <div className="ops-grid">
      <div className="ops-account-stack">
        <section className="ops-panel">
          <h2>Данные аккаунта</h2>
          <dl className="ops-detail ops-account-detail">
            <div><dt>ID</dt><dd>{account.id}</dd></div>
            <div><dt>Создан</dt><dd><time dateTime={account.createdAt}>{account.createdAt.slice(0,16).replace('T',' ')} UTC</time></dd></div>
            <div><dt>Активные и приостановленные подписки</dt><dd>{account.subscriptions}</dd></div>
          </dl>
        </section>
        <section className="ops-panel">
          <h2>Роль и доступ</h2>
          <p>Текущая роль: <strong>{ROLE_LABELS[account.role]}</strong></p>
          {protectedAccount
            ? <p>Права администратора защищены. Пароль своего аккаунта можно изменить в <Link className="ops-inline-link" href="/account/profile">настройках профиля</Link>.</p>
            : <>
              <p>Роль инженера открывает доступ к статистике и орбитальному каталогу. После смены роли пользователю нужно войти снова.</p>
              <div className="ops-actions ops-account-actions">
                <AdminAction label={'Сменить роль на «'+ROLE_LABELS[otherRole]+'»'} subject={account.email}
                  action={{action:'access',id,role:otherRole}}/>
                <AdminAction label={account.blocked?'Разблокировать':'Заблокировать'} subject={account.email}
                  action={{action:'access',id,blocked:!account.blocked}} danger={!account.blocked}/>
              </div>
            </>}
        </section>
      </div>
      {!protectedAccount&&<section className="ops-panel">
        <h2>Сброс пароля</h2>
        <p>Задайте новый пароль для этого аккаунта. После сброса все его сеансы будут завершены.</p>
        <AdminPasswordReset accountId={id}/>
      </section>}
    </div>
  </OperationsFrame>;
}
