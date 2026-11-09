import {quoteEquipment} from './equipment.ts';
export const PLANS = [
  { id: 'home', name: 'РАССВЕТ Дом', short: 'Дом', description: 'Для жизни за городом без компромиссов', price: 2900, equipment: 24900, speed: 150, traffic: 'Безлимитный', icon: 'home', features: ['До 150 Мбит/с', 'Безлимитный трафик', 'Wi-Fi роутер в комплекте', 'Подключение своими силами'] },
  { id: 'travel', name: 'РАССВЕТ В пути', short: 'В пути', description: 'Свобода менять координаты', price: 4900, equipment: 24900, speed: 250, traffic: '100 ГБ приоритетного', icon: 'travel', features: ['До 250 Мбит/с', '100 ГБ приоритетного трафика', 'Работает на стоянках', 'Приостановка подписки'] },
  { id: 'business', name: 'РАССВЕТ Бизнес', short: 'Бизнес', description: 'Когда связь — часть вашего дела', price: 12900, equipment: 49900, speed: 250, traffic: '500 ГБ приоритетного', icon: 'business', features: ['До 250 Мбит/с', '500 ГБ приоритетного трафика', 'Выделенная поддержка', 'Статический IP-адрес'] },
] as const;
export type PlanId = typeof PLANS[number]['id'];
export type Billing = 'monthly' | 'yearly';
const object = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Некорректные данные');
  return value as Record<string, unknown>;
};
const text = (value: unknown) => typeof value === 'string' ? value.trim() : '';
export function monthlyPrice(price: number, billing: Billing) { return billing === 'yearly' ? Math.round(price * .85) : price; }
export function buildOrder(value: unknown) {
  const input = object(value);
  const plan = PLANS.find(p => p.id === input.plan);
  if (!plan) throw new Error('Выберите доступный тариф');
  if (input.billing !== 'monthly' && input.billing !== 'yearly') throw new Error('Выберите период оплаты');
  const address = text(input.address);
  if (address.length < 8 || address.length > 300) throw new Error('Укажите полный адрес: от 8 до 300 символов');
  const price = monthlyPrice(plan.price, input.billing);
  const hardware=input.equipment!==undefined?quoteEquipment(input.equipment,plan.id):null;
  const equipmentPrice=hardware?.total??plan.equipment;
  return { plan: plan.id, billing: input.billing, address, monthlyPrice: price, equipmentPrice, firstPayment: price * (input.billing === 'yearly' ? 12 : 1) + equipmentPrice,...(hardware?{equipmentConfig:JSON.stringify(hardware.config)}:{}) };
}
export function validateProfile(value: unknown) {
  const input = object(value); const name = text(input.name);
  if (name.length < 2 || name.length > 80) throw new Error('Укажите имя: от 2 до 80 символов');
  let phone = text(input.phone).replace(/[\s()\-]/g, '');
  if (/^8\d{10}$/.test(phone)) phone = '+7' + phone.slice(1);
  if (phone && !/^\+7\d{10}$/.test(phone)) throw new Error('Укажите телефон в формате +7 999 123-45-67');
  return { name, phone };
}
export function checkCoverage(value: string) {
  const address = text(value);
  if (address.length < 3 || address.length > 300) throw new Error('Введите адрес или название города');
  const normalized = address.toLocaleLowerCase('ru');
  if (['москва', 'московск', 'санкт-петербург', 'ленинградск', 'казань', 'татарстан', 'нижний новгород', 'екатеринбург', 'сочи', 'краснодар', 'новосибирск'].some(city => normalized.includes(city))) return { status: 'available' as const, title: 'Вы в зоне будущего подключения', description: 'В учебной карте этот регион доступен. Можно оформить демонстрационную заявку.' };
  if (['владивосток', 'камчат', 'якутск', 'сахалин', 'хабаровск', 'магадан', 'петропавловск'].some(city => normalized.includes(city))) return { status: 'planned' as const, title: 'Новая территория на горизонте', description: 'В учебной модели этот регион запланирован для следующего этапа. Оставьте заявку на уведомление.' };
  return { status: 'unknown' as const, title: 'Уточним возможность подключения', description: 'Этого адреса пока нет в учебной карте. Отправьте заявку — она сохранится в личном кабинете.' };
}
export function validateTicket(value: unknown) {
  const input = object(value); const subject = text(input.subject); const message = text(input.message);
  if (!['Подключение', 'Оборудование', 'Тариф и оплата', 'Другое'].includes(subject)) throw new Error('Выберите тему обращения');
  if (message.length < 10 || message.length > 4000) throw new Error('Введите сообщение: от 10 до 4000 символов');
  return { subject, message };
}
export const formatMoney = (value: number) => new Intl.NumberFormat('ru-RU').format(value);
