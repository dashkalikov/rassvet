import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {loadTsx} from './tsx-loader.ts';

test('guests cannot navigate to sign-in from order confirmation before consent',()=>{
 const {default:Wizard}=loadTsx(new URL('../components/ConnectWizard.tsx',import.meta.url)) as {default:React.ComponentType<Record<string,unknown>>};
 const html=renderToStaticMarkup(React.createElement(Wizard,{user:null,initialStep:2,initialAddress:'Москва, Тверская улица, д. 13'}));
 assert.match(html,/<button[^>]*disabled=""[^>]*>Войти и продолжить/);
 assert.doesNotMatch(html,/<a[^>]+href="\/auth\?returnTo=/);
 assert.doesNotMatch(html,/учебн/i);
 assert.doesNotMatch(html,/Поставьте галочку|connection-consent-hint/);
});
test('confirmation and receipt show the same address, contact and subscription details',()=>{
 const {default:Summary}=loadTsx(new URL('../components/ConnectionSummary.tsx',import.meta.url)) as {default:React.ComponentType<Record<string,unknown>>};
 const props={planName:'РАССВЕТ Дом',billing:'monthly',address:'Москва, Тверская улица, д. 13',contact:{name:'Анна Смирнова',email:'anna@example.test',phone:'+79991234567'},firstPayment:27800};
 const html=renderToStaticMarkup(React.createElement(Summary,props));
 for(const value of ['РАССВЕТ Дом','Каждый месяц','Тверская улица','Анна Смирнова','anna@example.test','+79991234567'])assert.ok(html.includes(value),value);
 assert.match(html,/connection-review/);
});
test('order badges have distinct waiting, accepted and cancelled meanings',()=>{
 const {default:Badge}=loadTsx(new URL('../components/OrderStatusBadge.tsx',import.meta.url)) as {default:React.ComponentType<{status:string}>};
 for(const [status,tone,label]of [['new','waiting','В обработке'],['active','success','Принята'],['paused','waiting','Приостановлена'],['cancelled','danger','Отменена']]){
  const html=renderToStaticMarkup(React.createElement(Badge,{status}));assert.ok(html.includes('data-tone="'+tone+'"'));assert.ok(html.includes(label));
 }
 for(const status of ['unexpected','toString','constructor','__proto__']){
  const unknown=renderToStaticMarkup(React.createElement(Badge,{status}));assert.ok(unknown.includes('data-tone="neutral"'));
 }
});
