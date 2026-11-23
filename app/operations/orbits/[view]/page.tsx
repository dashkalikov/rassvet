import {ChartNoAxesCombined,Globe2,Map as MapIcon,Table2} from 'lucide-react';
import {notFound,redirect} from 'next/navigation';
import {getDb} from '../../../../db';
import {getCurrentUser} from '../../../../lib/session';
import {loadOperationalElements,loadOrbitalArchive,loadSatelliteMetrics} from '../../../../lib/operations-orbits';
import OperationsFrame from '../../../../components/OperationsFrame';
import {RefreshSatellites} from '../../../../components/OperationsActions';
import EngineeringOrbitMap from '../../../../components/EngineeringOrbitMap';
import EngineeringOrbitHistory from '../../../../components/EngineeringOrbitHistory';
import EngineeringOrbitCatalog from '../../../../components/EngineeringOrbitCatalog';
import '../../../orbit.css';

export const dynamic='force-dynamic';
export const metadata={title:'Орбитальный трекер — Инженерный портал РАССВЕТ'};

const views={
  map:{label:'Карта',heading:'Карта спутников',copy:'Подспутниковые точки и трасса выбранного аппарата за 45 минут до и после времени расчёта.',Icon:MapIcon},
  globe:{label:'Глобус',heading:'Орбиты вокруг Земли',copy:'Вращайте глобус и выбирайте аппараты, чтобы увидеть их положение и орбитальные трассы.',Icon:Globe2},
  history:{label:'График',heading:'История орбит',copy:'Сравните изменение большой полуоси по сохранённым наблюдениям.',Icon:ChartNoAxesCombined},
  catalog:{label:'Каталог',heading:'Каталог спутников',copy:'Найдите аппарат по названию или NORAD. Нажмите на заголовок столбца, чтобы отсортировать.',Icon:Table2},
};
type View=keyof typeof views;

async function loadView(view:View,requestedId:string){
  const db=getDb();
  const asOf=Date.now();
  if(view==='catalog'){
    const metrics=await loadSatelliteMetrics(db,new Date(asOf));
    const archive=await loadOrbitalArchive(db,metrics.map(row=>row.id));
    const historyById=new Map(archive.map(item=>[item.id,item]));
    const rows=metrics.map(row=>({
      ...row,climbKmDay:historyById.get(row.id)?.climbKmDay??null,
      sampleCount:historyById.get(row.id)?.samples.length??0,
    }));
    return rows.length?<EngineeringOrbitCatalog key={requestedId} rows={rows} initialId={requestedId||rows[0].id}/>:null;
  }

  const catalog=(await loadOperationalElements(db)).map(({satellite})=>satellite);
  if(!catalog.length)return null;
  const selected=catalog.find(satellite=>satellite.id===requestedId);
  if(view==='map'||view==='globe'){
    // Open with every satellite visible; a specific pick arrives via ?norad=…
    return <EngineeringOrbitMap key={view+':'+(selected?.id??'all')+':'+asOf} catalog={catalog} initialId={selected?.id} view={view} asOf={asOf}/>;
  }
  const archive=await loadOrbitalArchive(db,catalog.map(satellite=>satellite.id));
  const names=new Map(catalog.map(satellite=>[satellite.id,satellite.name]));
  const series=archive.map(item=>({...item,name:names.get(item.id)??item.id}));
  const initialId=selected?.id??series.find(item=>item.samples.length>1)?.id??catalog[0].id;
  return <EngineeringOrbitHistory key={initialId} series={series} initialId={initialId}/>;
}

export default async function OrbitViewPage({params,searchParams}:{
  params:Promise<{view:string}>;searchParams:Promise<{norad?:string}>;
}){
  const [user,{view},query]=await Promise.all([getCurrentUser(),params,searchParams]);
  if(!user||user.role==='customer')redirect('/auth?portal=engineer');
  if(!Object.hasOwn(views,view))notFound();
  const selected=view as View;
  const {heading,copy}=views[selected];
  const id=typeof query.norad==='string'&&/^\d{1,9}$/.test(query.norad)?query.norad:'';
  const content=await loadView(selected,id);
  return <OperationsFrame user={user} active="operations" section="orbits">
    <div className="ops-title engineering-page-title">
      <div><h1>{heading}</h1><p>{copy}</p></div>
      <RefreshSatellites/>
    </div>
    <nav className="engineering-orbit-nav" aria-label="Представления орбит">
      {(Object.keys(views) as View[]).map(key=>{
        const {Icon,label}=views[key];
        return <a key={key} href={'/operations/orbits/'+key+(id?'?norad='+id:'')} aria-current={key===selected?'page':undefined}>
          <Icon size={18} aria-hidden="true"/>{label}
        </a>;
      })}
    </nav>
    {content??<p className="ops-panel">Каталог пуст. Обновите его из CelesTrak.</p>}
    {selected==='history'&&<p className="ops-footnote">Архив: <a href="https://findrassvet.ru/" target="_blank" rel="noreferrer">findrassvet.ru, В. Булыбенко</a> · снимок 18.11.2026 · 12 865 наблюдений для 30 аппаратов. Полуось по Кеплеру, от центра Земли. Новые эпохи сохраняются при обновлении из CelesTrak.</p>}
    <details className="ops-panel engineering-method">
      <summary>О данных и расчётах</summary>
      <p>Положение вычисляется по SGP4 на основе открытых орбитальных элементов CelesTrak. При давности элементов более семи суток карта открывается на эпохе выбранного аппарата.</p>
      <p>График строится по локальному архиву и сохранённым обновлениям каталога. Идея четырёх представлений взята из вашего satellite-tracker и проекта <a href="https://findrassvet.ru/" target="_blank" rel="noreferrer">«Где Рассветы»</a>.</p>
    </details>
  </OperationsFrame>;
}
