import {existsSync} from 'node:fs';
import {spawnSync,spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
process.chdir(fileURLToPath(new URL('../',import.meta.url)));
if(!existsSync('node_modules/vinext/dist/cli.js')){console.error('Dependencies are missing. Run npm ci first.');process.exit(1);}
function execute(args,{capture=false}={}){
  const result=spawnSync(process.execPath,args,{stdio:capture?'pipe':'inherit',encoding:'utf8',env:process.env});
  if(result.error||result.status!==0){if(capture)console.error(result.stderr||result.stdout);console.error('Local preparation failed. Your existing data has been kept.');process.exit(result.status||1);}
  return result.stdout??'';
}
execute(['scripts/run-framework.mjs','build']);
const wrangler=['--import','./scripts/sites-env.mjs','./node_modules/wrangler/bin/wrangler.js','d1','execute','DB','--local','--config','dist/server/wrangler.json','--persist-to','.wrangler/state'];
const result=JSON.parse(execute([...wrangler,'--command',"SELECT name FROM sqlite_master WHERE type = 'table'",'--json'],{capture:true}));
const tables=new Set(result.flatMap(entry=>(entry.results??[]).map(row=>row.name)));
const migrations=[
  {file:'drizzle/0000_black_gateway.sql',tables:['orders','profiles','tickets']},
  {file:'drizzle/0001_noisy_deathbird.sql',tables:['accounts','sessions','auth_attempts']},
];
for(const migration of migrations){
  if(migration.tables.every(table=>tables.has(table)))continue;
  if(migration.tables.some(table=>tables.has(table))){console.error(`Incomplete schema for ${migration.file}. Make a backup and inspect the database; no data was removed.`);process.exit(1);}
  execute([...wrangler,'--file',migration.file]);
}
const columnInfo=JSON.parse(execute([...wrangler,'--command','PRAGMA table_info(orders)','--json'],{capture:true}));
const columnNames=columnInfo.flatMap(entry=>(entry.results??[]).map(row=>row.name));
if(!columnNames.includes('equipment_config'))execute([...wrangler,'--file','drizzle/0002_flimsy_gamora.sql']);
const profileInfo=JSON.parse(execute([...wrangler,'--command','PRAGMA table_info(profiles)','--json'],{capture:true}));
if(!profileInfo.flatMap(entry=>(entry.results??[]).map(row=>row.name)).includes('avatar'))execute([...wrangler,'--file','drizzle/0003_complex_devos.sql']);
console.log('\nLocal database is ready. Accounts, orders and messages stay on this computer.');
if(process.argv.includes('--prepare-only'))process.exit(0);
const server=spawn(process.execPath,['scripts/run-framework.mjs','dev','--hostname','127.0.0.1'],{stdio:'inherit',env:process.env});
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>server.kill(signal));
server.on('exit',code=>process.exit(code??0));
