import {CheckCircle2,Clock3,HelpCircle,PauseCircle,XCircle} from 'lucide-react';
const states={new:{label:'В обработке',tone:'waiting',Icon:Clock3},active:{label:'Принята',tone:'success',Icon:CheckCircle2},paused:{label:'Приостановлена',tone:'waiting',Icon:PauseCircle},cancelled:{label:'Отменена',tone:'danger',Icon:XCircle}} as const;
export default function OrderStatusBadge({status}:{status:string}){
 const state=Object.hasOwn(states,status)?states[status as keyof typeof states]:{label:'Статус уточняется',tone:'neutral',Icon:HelpCircle};
 const {Icon}=state;
 return <span className="status-badge order-status-badge" data-tone={state.tone} data-status={status}><Icon size={22} aria-hidden="true"/>{state.label}</span>;
}
