import test from 'node:test';
import assert from 'node:assert/strict';
import { buildOrder, validateProfile, checkCoverage, validateTicket } from '../lib/domain.ts';

test('order uses catalog price, ignoring client-supplied price and user id', () => {
  assert.deepEqual(buildOrder({ plan: 'home', billing: 'monthly', address: 'Москва, ул. Лесная, 7', price: 1, userId: 'other' }), {
    plan: 'home', billing: 'monthly', address: 'Москва, ул. Лесная, 7', monthlyPrice: 2900, equipmentPrice: 24900, firstPayment: 27800,
  });
});
test('annual subscription applies the published 15 percent discount', () => {
  assert.equal(buildOrder({ plan: 'travel', billing: 'yearly', address: 'Казань, ул. Лесная, 1' }).firstPayment, 74880);
});
test('unknown plans and blank delivery addresses cannot become orders', () => {
  assert.throws(() => buildOrder({ plan: 'free', billing: 'monthly', address: 'Москва, 12' }), /тариф/);
  assert.throws(() => buildOrder({ plan: 'home', billing: 'monthly', address: '   ' }), /адрес/);
});
test('demo subscriptions are available across Russian regions', () => {
  assert.equal(checkCoverage('Москва, Лесная, 7').status, 'available');
  for(const city of ['Владивосток','Якутск','Калининград','Улан-Удэ','Мурманск','Южно-Сахалинск'])assert.equal(checkCoverage(city).status,'available');
  assert.equal(checkCoverage('Неизвестный город, дом 2').status, 'unknown');
  assert.throws(() => checkCoverage(''), /адрес/);
});
test('profile saves normalized name and valid optional Russian phone', () => {
  assert.deepEqual(validateProfile({ name: '  Анна  ', phone: '+7 (999) 123-45-67' }), { name: 'Анна', phone: '+79991234567' });
  assert.throws(() => validateProfile({ name: '', phone: 'wrong' }), /имя/);
  assert.throws(() => validateProfile({ name: 'Анна', phone: '123' }), /телефон/);
});
test('support cannot accept an empty message or unbounded input', () => {
  assert.throws(() => validateTicket({ subject: 'Подключение', message: ' ' }), /сообщение/);
  assert.throws(() => validateTicket({ subject: 'Подключение', message: 'a'.repeat(4001) }), /сообщение/);
  assert.deepEqual(validateTicket({ subject: 'Подключение', message: '  Нужна помощь с установкой.  ' }), { subject: 'Подключение', message: 'Нужна помощь с установкой.' });
});
