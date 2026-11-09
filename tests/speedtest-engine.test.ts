import test from 'node:test';
import assert from 'node:assert/strict';
import {runInternetSpeedtest} from '../lib/speedtest-engine.ts';

test('a complete internet measurement counts actual payloads and reports a finished upload',async()=>{
 let clock=0;const events:{progress:number;phase:string}[]=[];
 const fetcher:typeof fetch=async(input)=>{const url=new URL(String(input));const bytes=url.pathname==='/__up'?0:Number(url.searchParams.get('bytes')??0);return new Response(new Uint8Array(bytes));};
 const result=await runInternetSpeedtest(event=>events.push(event),new AbortController().signal,{fetcher,now:()=>clock+=100});
 assert.equal(result.bytesTransferred,26_250_000);
 assert.ok(result.download>0&&result.upload>0&&result.ping>0);
 assert.equal(result.downloadSamples.length,3);assert.equal(result.uploadSamples.length,3);
 assert.equal(events.at(-1)?.progress,1);assert.equal(events.at(-1)?.phase,'upload');
});
test('a server error is surfaced instead of generating a speed result',async()=>{
 await assert.rejects(runInternetSpeedtest(()=>{},new AbortController().signal,{fetcher:async()=>new Response('Unavailable',{status:503})}),/503/);
});
test('truncated downloads cannot inflate the measured connection speed',async()=>{
 await assert.rejects(runInternetSpeedtest(()=>{},new AbortController().signal,{fetcher:async()=>new Response(new Uint8Array(1)),now:(()=>{let time=0;return ()=>time+=10;})()}),/Неполный/);
});
test('a stopped run rejects with AbortError and cannot finish successfully',async()=>{
 const controller=new AbortController();controller.abort();
 await assert.rejects(runInternetSpeedtest(()=>{},controller.signal),error=>error instanceof Error&&error.name==='AbortError');
});
test('stopping while a download stream is pending cancels the stream and rejects the run',async()=>{
 const controller=new AbortController();let cancelled=false;
 const fetcher:typeof fetch=async(input)=>{
  const bytes=Number(new URL(String(input)).searchParams.get('bytes')??0);
  if(!bytes)return new Response(new Uint8Array(0));
  return new Response(new ReadableStream<Uint8Array>({
   start(stream){stream.enqueue(new Uint8Array(100));setTimeout(()=>controller.abort(),5);},
   cancel(){cancelled=true;},
  }));
 };
 await assert.rejects(runInternetSpeedtest(()=>{},controller.signal,{fetcher}),error=>error instanceof Error&&error.name==='AbortError');
 assert.equal(cancelled,true);
});
