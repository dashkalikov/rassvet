export class HttpError extends Error { status:number;constructor(message:string,status:number){super(message);this.status=status;} }
export function assertSameOrigin(request:Request) {
  const origin=request.headers.get('origin');
  if(!origin||origin!==new URL(request.url).origin||request.headers.get('sec-fetch-site')==='cross-site')throw new HttpError('Запрос с другого сайта отклонён',403);
}
export async function readJson(request:Request){
  if(!request.headers.get('content-type')?.includes('application/json'))throw new HttpError('Ожидается JSON',415);
  const reader=request.body?.getReader(),decoder=new TextDecoder();
  let body='',bytes=0;
  if(reader){
    try{
      while(true){
        const {done,value}=await reader.read();
        if(done)break;
        bytes+=value.byteLength;
        if(bytes>48_000){
          await reader.cancel().catch(()=>{});
          throw new HttpError('Слишком большой запрос',413);
        }
        body+=decoder.decode(value,{stream:true});
      }
      body+=decoder.decode();
    }finally{reader.releaseLock();}
  }
  if(body.length>12000)throw new HttpError('Слишком большой запрос',413);
  try{const data=JSON.parse(body);if(!data||typeof data!=='object'||Array.isArray(data))throw new Error();return data as Record<string,unknown>;}catch{throw new HttpError('Некорректный JSON',400);}
}
