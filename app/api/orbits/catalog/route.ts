import {createOrbitCatalogService} from '../../../../lib/orbit-catalog';
const service=createOrbitCatalogService();
export async function GET(){
 try{const result=await service.load();return Response.json(result,{headers:{'Cache-Control':'public, max-age=7200'}});}
 catch(error){return Response.json({error:error instanceof Error?error.message:'Источник данных недоступен. Используйте сохранённый каталог или импорт файла.'},{status:502,headers:{'Cache-Control':'no-store'}});}
}
