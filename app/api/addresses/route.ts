import {createAddressSearch} from '../../../lib/address-search';
const search=createAddressSearch();
export async function GET(request:Request){
 try{
  const site=request.headers.get('sec-fetch-site');
  if(site==='cross-site')return Response.json({error:'Запрос с другого сайта отклонён'},{status:403});
  const result=await search(new URL(request.url).searchParams.get('q')??'');
  return Response.json(result,{headers:{'Cache-Control':'private, no-store'}});
 }catch{return Response.json({error:'Введите адрес длиной до 300 символов'},{status:400});}
}
