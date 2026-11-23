import {formatMoney,type Billing} from '../lib/domain';
export type ConnectionContact={name:string;email:string;phone?:string};
export default function ConnectionSummary({planName,billing,address,contact,firstPayment}:{planName:string;billing:Billing;address:string;contact:ConnectionContact|null;firstPayment?:number}){
 const rows=[['Тариф',planName],['Период оплаты',billing==='yearly'?'Один раз в год':'Каждый месяц'],['Адрес подключения',address],['Имя',contact?.name??'Будет указано после входа'],['Электронная почта',contact?.email??'Нужно войти в аккаунт'],...(contact?.phone?[['Телефон',contact.phone]]:[]),...(firstPayment!==undefined?[['При подключении',formatMoney(firstPayment)+' ₽']]:[])];
 return <dl className="connection-review" aria-label="Данные заявки">{rows.map(([title,value])=><div key={title}><dt>{title}</dt><dd>{value}</dd></div>)}</dl>;
}
