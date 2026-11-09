import {HttpError} from './request.ts';

export const MAX_AVATAR_BYTES=256*1024;
export function avatarData(bytes:Uint8Array,mime:string):string {
  if(bytes.length>MAX_AVATAR_BYTES)throw new HttpError('Фото после обработки должно быть не больше 256 КБ',413);
  const starts=(signature:number[])=>signature.every((value,i)=>bytes[i]===value);
  const valid= mime==='image/png' ? starts([137,80,78,71,13,10,26,10]) :
    mime==='image/jpeg' ? starts([255,216,255]) :
    mime==='image/webp' ? starts([82,73,70,70])&&[87,69,66,80].every((value,i)=>bytes[i+8]===value) : false;
  if(bytes.length<16||!valid)throw new HttpError('Выберите изображение JPEG, PNG или WebP',415);
  let binary='';for(let i=0;i<bytes.length;i+=8192)binary+=String.fromCharCode(...bytes.subarray(i,i+8192));
  return `data:${mime};base64,${btoa(binary)}`;
}

export async function readAvatar(request:Request) {
  if(Number(request.headers.get('content-length'))>MAX_AVATAR_BYTES)throw new HttpError('Фото слишком большое',413);
  const reader=request.body?.getReader();if(!reader)throw new HttpError('Выберите фото',400);
  const chunks:Uint8Array[]=[];let size=0;
  try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>MAX_AVATAR_BYTES){await reader.cancel();throw new HttpError('Фото слишком большое',413);}chunks.push(value);}}finally{reader.releaseLock();}
  const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
  return {bytes,mime:(request.headers.get('content-type')??'').split(';')[0].trim()};
}
