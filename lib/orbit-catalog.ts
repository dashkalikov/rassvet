import {parseOrbitCatalog,type OrbitSatellite} from './orbits.ts';
export const ORBIT_SOURCE='https://celestrak.org/NORAD/elements/gp.php?NAME=RASSVET&FORMAT=JSON';
export const ORBIT_CACHE_MS=2*60*60*1000;
export type OrbitCatalogResult={input:string;catalog:OrbitSatellite[];fetchedAt:string;source:string};

/** Public catalogue only. Coalesces requests; no retry after a source error. */
export function createOrbitCatalogService(fetcher:typeof fetch=fetch,now:()=>number=Date.now){
 let cached:OrbitCatalogResult|null=null,error:Error|null=null,attemptedAt:number|null=null,pending:Promise<OrbitCatalogResult>|null=null;
 return {load():Promise<OrbitCatalogResult>{
  if(pending)return pending;
  if(attemptedAt!==null&&now()-attemptedAt<ORBIT_CACHE_MS){if(error)return Promise.reject(error);if(cached)return Promise.resolve(cached);}
  attemptedAt=now();
  pending=(async()=>{
   try{
    const response=await fetcher(ORBIT_SOURCE,{redirect:'error',signal:AbortSignal.timeout(15_000),headers:{Accept:'application/json'}});
    if(response.status!==200)throw new Error('CelesTrak вернул код '+response.status+'. Повторное обновление доступно через 2 часа. Сохранённый каталог продолжает работать.');
    if(Number(response.headers.get('content-length'))>1_000_000)throw new Error('Каталог превышает допустимый размер.');
    const input=await response.text(),catalog=parseOrbitCatalog(input);
    cached={input,catalog,fetchedAt:new Date(now()).toISOString(),source:ORBIT_SOURCE};error=null;return cached;
   }catch(cause){error=cause instanceof Error?cause:new Error('Не удалось получить каталог.');throw error;}
   finally{pending=null;}
  })();
  return pending;
 }};
}
