export const ROLE_LABELS={customer:'Клиент',engineer:'Инженер',admin:'Администратор'} as const;
export type Role=keyof typeof ROLE_LABELS;

export function readRole(value:unknown):Role|undefined{
  return value==='customer'||value==='engineer'||value==='admin'?value:undefined;
}

export function canAccessPortal(role:Role,portal:Role):boolean{
  return role===portal||role==='admin';
}

export const PORTAL_PATHS={customer:'/account',engineer:'/operations',admin:'/admin'} as const;
export const SUBSCRIPTION_LABELS={new:'Новая заявка',active:'Активна',paused:'Приостановлена',cancelled:'Отменена'} as const;
export type SubscriptionStatus=keyof typeof SUBSCRIPTION_LABELS;
export const SUBSCRIPTION_TRANSITIONS:Record<SubscriptionStatus,readonly SubscriptionStatus[]>={
  new:['active','cancelled'],
  active:['paused','cancelled'],
  paused:['active','cancelled'],
  cancelled:[],
};
export function readSubscriptionStatus(value:unknown):SubscriptionStatus|undefined{
  return typeof value==='string'&&Object.hasOwn(SUBSCRIPTION_LABELS,value)?value as SubscriptionStatus:undefined;
}
export function subscriptionLabel(value:string){
  const status=readSubscriptionStatus(value);
  return status?SUBSCRIPTION_LABELS[status]:'Неизвестен';
}
