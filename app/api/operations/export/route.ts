import {getDb} from '../../../../db';
import {authorized,apiError,HttpError} from '../../../../lib/api';
import {loadAllAccessEvents,loadCustomerHistory,loadHourlyMetrics,loadOperations,loadSubscriptionEvents,readPeriod} from '../../../../lib/operations';
import {loadOrbitalArchive,loadSatelliteHistory,loadSatelliteMetrics} from '../../../../lib/operations-orbits';
import {metricCsv,prometheusMetrics} from '../../../../lib/metric-formats';

const columns={
  daily:['day','registrations','opened','activations','paused','cancelled','requests','clientErrors','serverErrors','averageMs','maxMs'],
  hourly:['hour','requests','clientErrors','serverErrors','totalMs','maxMs'],
  customers:['customer','name','demo','createdAt','blocked','active','paused','pending','cancelled'],
  subscriptions:['orderId','plan','previous','status','at'],
  plans:['plan','status','count'],
  satellites:['id','name','epoch','source','observedAt','ageHours','calculatedAt','semiMajorAxisKm','perigeeKm','apogeeKm','periodMin','inclinationDeg','eccentricity','altKm','speedKms','latitude','longitude'],
  orbit:['id','epoch','semiMajorAxisKm'],
  access:['id','userId','actorId','action','oldRole','role','oldBlocked','blocked','at'],
} as const;
type Dataset=keyof typeof columns;

export async function GET(request:Request){
  try {
    const params=new URL(request.url).searchParams;
    const format=params.get('format')??'csv',dataset=params.get('dataset')??'daily';
    if(!['csv','json','prom'].includes(format)||(format==='csv'&&!Object.hasOwn(columns,dataset)))throw new HttpError('Неизвестный формат или набор данных.',400);
    await authorized(format==='csv'&&dataset==='access'?['admin']:['admin','engineer']);
    const norad=params.get('norad')??'';
    if(format==='csv'&&dataset==='orbit'&&!/^[0-9]{1,9}$/.test(norad))throw new HttpError('Укажите номер NORAD.',400);
    const db=getDb();
    const period=readPeriod(params.get('period'));
    const demo=params.get('demo')==='1';
    const snapshot=await loadOperations(db,period,new Date(),demo);
    const since=snapshot.days[0].day;
    const headers={'Cache-Control':'private, no-store','X-Rassvet-Data-Mode':snapshot.dataMode,'Content-Disposition':`attachment; filename="rassvet-${demo?'demo-':''}${format==='csv'?dataset:'metrics'}.${format==='prom'?'prom':format}"`};
    const loadHours=()=>demo?Promise.resolve(snapshot.days.map(day=>({hour:day.day+'T12:00:00.000Z',requests:day.requests,clientErrors:day.clientErrors,serverErrors:day.serverErrors,totalMs:Math.round(day.requests*(day.averageMs??0)),maxMs:day.maxMs??0}))):loadHourlyMetrics(db,since);
    if(format==='json'||format==='prom'){
      const [hourly,satellites]=await Promise.all([loadHours(),loadSatelliteMetrics(db)]);
      if(format==='prom')return new Response(prometheusMetrics(snapshot,satellites,hourly),{headers:{...headers,'Content-Type':'text/plain; version=0.0.4; charset=utf-8'}});
      const [subscriptionEvents,customers,orbitHistory]=await Promise.all([
        loadSubscriptionEvents(db,since),loadCustomerHistory(db,since),loadOrbitalArchive(db,satellites.map(sat=>sat.id)),
      ]);
      return Response.json({...snapshot,subscriptionEvents,customers,hourly,satellites,orbitHistory},{headers});
    }
    const key=dataset as Dataset;
    const sources={
      daily:async()=>snapshot.days,
      hourly:loadHours,
      customers:()=>loadCustomerHistory(db,since),
      subscriptions:()=>loadSubscriptionEvents(db,since),
      plans:async()=>snapshot.plans,
      satellites:()=>loadSatelliteMetrics(db),
      orbit:async()=>(await loadSatelliteHistory(db,norad)).samples.map(point=>({id:norad,...point})),
      access:()=>loadAllAccessEvents(db),
    };
    return new Response(metricCsv(await sources[key](),columns[key]),{headers:{...headers,'Content-Type':'text/csv; charset=utf-8'}});
  }catch(error){return apiError(error);}
}
