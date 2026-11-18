import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
import {Miniflare} from 'miniflare';
import {drizzle} from 'drizzle-orm/d1';
import * as schema from '../db/schema.ts';
import {seedDemoAccounts} from '../lib/demo-operations.ts';
process.chdir(fileURLToPath(new URL('../',import.meta.url)));
const config=JSON.parse(readFileSync('dist/server/wrangler.json','utf8'));
const binding=config.d1_databases.find(item=>item.binding==='DB');
const worker=new Miniflare({modules:true,script:'export default {fetch(){return new Response("local seed")}}',compatibilityDate:config.compatibility_date,d1Databases:{DB:binding.database_id},d1Persist:resolve('.wrangler/state/v3/d1')});
try{
 const db=await worker.getD1Database('DB');
 const result=await seedDemoAccounts(drizzle(db,{schema}));
 console.log(`Готово: ${result.customers} демонстрационных клиентов и один инженер. Существующие записи сохранены.`);
 console.log('Вход: anna.demo@example.test или engineer.demo@example.test. Пароль: Rassvet-Demo2026!');
}finally{await worker.dispose();}
