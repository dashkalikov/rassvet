import {getDb} from '../../../../db';
import {authorized,apiError} from '../../../../lib/api';
import {fetchOperationalCatalog} from '../../../../lib/operations-orbits';

export async function POST(request:Request){
  try {
    await authorized(['engineer','admin'],request);
    try {
      const result=await fetchOperationalCatalog(getDb());
      return Response.json({count:result.catalog.length,at:result.fetchedAt},{headers:{'Cache-Control':'no-store'}});
    } catch(error) {
      console.error('Operational orbit catalogue refresh failed',error);
      return Response.json({error:'Каталог временно недоступен. Сохранённые орбитальные данные доступны для просмотра.'},{status:502,headers:{'Cache-Control':'no-store'}});
    }
  }catch(error){return apiError(error);}
}
