import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {loadTsx} from './tsx-loader.ts';

test('the shared saved application view preserves contact details and account navigation',()=>{
 const file=new URL('../components/ConnectionReceipt.tsx',import.meta.url);
 assert.ok(existsSync(file),'The saved application needs a shared receipt view');
 const {default:Receipt}=loadTsx(file) as {default:React.ComponentType<Record<string,unknown>>};
 const props={id:'1b6a7d23-order',planName:'РАССВЕТ Дом',billing:'monthly',address:'Санкт-Петербург, Лиговский проспект, д. 50',contact:{name:'Олег',email:'oleg@example.test',phone:'+79991234567'},firstPayment:27800,status:'new',headingLevel:1};
 const html=renderToStaticMarkup(React.createElement(Receipt,props));
 for(const value of ['Заявка сохранена','1B6A7D23','В обработке','РАССВЕТ Дом','Каждый месяц','Лиговский проспект','Олег','oleg@example.test','+79991234567'])assert.ok(html.includes(value),value);
 assert.match(html,/<h1[^>]*>Заявка сохранена<\/h1>/);
 assert.match(html,/href="\/account\/orders\/1b6a7d23-order"/);
 assert.match(html,/href="\/"/);
 assert.match(html,/aria-label="Данные заявки"/);
});
