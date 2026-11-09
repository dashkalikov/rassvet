import { DatabaseSync, type SQLInputValue } from 'node:sqlite';
import { readdirSync, readFileSync } from 'node:fs';
import { drizzle } from 'drizzle-orm/d1';
import * as schema from '../db/schema.ts';
export function databaseFixture() {
  const sqlite = new DatabaseSync(':memory:');
  const directory = new URL('../drizzle/',import.meta.url);
  for (const file of readdirSync(directory).filter(f=>f.endsWith('.sql')).sort()) sqlite.exec(readFileSync(new URL(file,directory),'utf8'));
  const adapter = {
    async batch(statements:{all:()=>Promise<{results:unknown[]}>}[]) {
      sqlite.exec('BEGIN');
      try {const results=[];for(const statement of statements)results.push(await statement.all());sqlite.exec('COMMIT');return results;}
      catch(error){sqlite.exec('ROLLBACK');throw error;}
    },
    prepare(sql:string) {
    const stmt=sqlite.prepare(sql);
    return { bind(...params:SQLInputValue[]) { return {
      async run(){const r=stmt.run(...params);return {success:true,meta:{changes:Number(r.changes)},results:[]};},
      async all(){return {results:stmt.all(...params)};},
      async raw(){stmt.setReturnArrays(true);return stmt.all(...params);},
    };}};
  }};
  const db=drizzle(adapter as unknown as D1Database,{schema});
  return {db,sqlite,close:()=>sqlite.close()};
}
