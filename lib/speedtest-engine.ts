import {transferMbps,latencyMetrics,type TransferSample,type SpeedMeasurement,type SpeedProgress} from './speedtest.ts';
type Dependencies={fetcher?:typeof fetch;now?:()=>number};
const DOWNLOAD_BYTES=[1_000_000,4_000_000,16_000_000] as const;
const UPLOAD_BYTES=[250_000,1_000_000,4_000_000] as const;
export async function runInternetSpeedtest(report:(event:SpeedProgress)=>void,signal:AbortSignal,dependencies:Dependencies={}):Promise<SpeedMeasurement>{
 signal.throwIfAborted();
 const fetcher=dependencies.fetcher??fetch,now=dependencies.now??(()=>performance.now());
 let transferred=0;
 async function exchange(bytes:number,upload=false,onChunk?:(bytes:number,milliseconds:number)=>void):Promise<TransferSample>{
  signal.throwIfAborted();
  let payload:Uint8Array<ArrayBuffer>|undefined;
  if(upload){payload=new Uint8Array(bytes);for(let offset=0;offset<bytes;offset+=65536)crypto.getRandomValues(payload.subarray(offset,Math.min(bytes,offset+65536)));}
  const controller=new AbortController(),cancel=()=>controller.abort(signal.reason);
  signal.addEventListener('abort',cancel,{once:true});
  const timeout=setTimeout(()=>controller.abort(new DOMException('Сервер не ответил за 20 секунд','TimeoutError')),20_000);
  try{
   signal.throwIfAborted();
   const url=new URL(upload?'https://speed.cloudflare.com/__up':'https://speed.cloudflare.com/__down');
   if(!upload)url.searchParams.set('bytes',String(bytes));
   url.searchParams.set('r',crypto.randomUUID());
   const started=now();
   const response=await fetcher(url,{method:upload?'POST':'GET',body:payload?.buffer,headers:upload?{'content-type':'text/plain'}:undefined,cache:'no-store',credentials:'omit',referrerPolicy:'no-referrer',mode:'cors',signal:controller.signal});
   if(!response.ok)throw new Error(`Тестовый сервер вернул ошибку ${response.status}. Попробуйте позднее.`);
   let received=0;
   if(response.body){
    const reader=response.body.getReader(),stop=()=>{void reader.cancel().catch(()=>{});};
    controller.signal.addEventListener('abort',stop,{once:true});
    try{while(true){controller.signal.throwIfAborted();const chunk=await reader.read();if(chunk.done)break;received+=chunk.value.byteLength;if(!upload&&bytes>0)onChunk?.(received,Math.max(.01,now()-started));}}
    finally{controller.signal.removeEventListener('abort',stop);reader.releaseLock();}
   }
   controller.signal.throwIfAborted();
   const durationMs=Math.max(.01,now()-started);
   if(!upload&&received!==bytes)throw new Error('Неполный ответ тестового сервера. Результат не сохранён.');
   transferred+=upload?bytes:received;
   return {bytes:upload?bytes:received,durationMs};
  }finally{clearTimeout(timeout);signal.removeEventListener('abort',cancel);}
 }
 const probes:number[]=[];
 // Warm up DNS/TLS once; the five subsequent request timings form the latency sample.
 await exchange(0);
 for(let index=0;index<5;index++){const probe=await exchange(0);probes.push(probe.durationMs);report({phase:'latency',progress:(index+1)/5*.2,value:latencyMetrics(probes).ping});}
 const down:TransferSample[]=[],up:TransferSample[]=[];
 for(let index=0;index<DOWNLOAD_BYTES.length;index++){
  const bytes=DOWNLOAD_BYTES[index];
  const sample=await exchange(bytes,false,(received,durationMs)=>report({phase:'download',progress:.2+(index+received/bytes)/3*.45,value:transferMbps([{bytes:received,durationMs}])}));
  down.push(sample);report({phase:'download',progress:.2+(index+1)/3*.45,value:transferMbps(down)});
 }
 for(let index=0;index<UPLOAD_BYTES.length;index++){
  report({phase:'upload',progress:.65+index/3*.35,value:up.length?transferMbps(up):0});
  const sample=await exchange(UPLOAD_BYTES[index],true);up.push(sample);
  report({phase:'upload',progress:.65+(index+1)/3*.35,value:transferMbps(up)});
 }
 signal.throwIfAborted();
 return {...latencyMetrics(probes),download:transferMbps(down),upload:transferMbps(up),bytesTransferred:transferred,downloadSamples:down.map(sample=>transferMbps([sample])),uploadSamples:up.map(sample=>transferMbps([sample]))};
}
