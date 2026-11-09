import {PLANS,monthlyPrice,type Billing,type PlanId} from './domain.ts';
import {quoteEquipment} from './equipment.ts';
export function quotePlan(planId:PlanId,billing:Billing,configuration?:unknown) {
  const plan=PLANS.find(p=>p.id===planId);
  if(!plan)throw new Error('Выберите доступный тариф');
  if(billing!=='monthly'&&billing!=='yearly')throw new Error('Выберите период оплаты');
  const monthly=monthlyPrice(plan.price,billing),subscriptionDue=monthly*(billing==='yearly'?12:1);
  const equipment=configuration?quoteEquipment(configuration,planId).total:plan.equipment;
  return {monthly,subscriptionDue,equipment,firstPayment:subscriptionDue+equipment,firstYear:monthly*12+equipment,yearlySavings:(plan.price-monthly)*12};
}
