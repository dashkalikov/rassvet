'use client';
import Link from 'next/link';
import {useEffect,useMemo,useRef,useState} from 'react';
import {ArrowLeft,ArrowUpRight,Download,Globe2,Info,Pause,Play,RefreshCw,Satellite,Search,Star,Upload} from 'lucide-react';
import {Brand} from './ui';
import ThemeToggle from './ThemeToggle';
import ChoiceSelect from './ChoiceSelect';
import OrbitMap from './OrbitMap';
import OrbitHistoryChart from './OrbitHistoryChart';
import elements from '../lib/data/orbit-catalog.json';
import archive from '../lib/data/findrassvet-history.json';
import {climbRate,createOrbitModel,mergeOrbitHistory,orbitPosition,orbitTrack,parseOrbitCatalog,type OrbitHistory,type OrbitSatellite} from '../lib/orbits';

const STORAGE='rassvet-orbits-v1',BASE_INPUT=JSON.stringify(elements),BASE_CATALOG=parseOrbitCatalog(BASE_INPUT);
const BASE_TIME=Math.max(...BASE_CATALOG.map(s=>Date.parse(s.epoch))),BASE_SOURCE='Сохранённый каталог CelesTrak';
const SNAPSHOT_AT=Date.parse('2026-11-04T21:45:14Z'),CACHE_MS=7_200_000;
const fmt=(v:number,digits=1)=>v.toLocaleString('ru-RU',{maximumFractionDigits:digits,minimumFractionDigits:digits});
const utc=(value:number|string)=>new Date(value).toISOString().slice(0,19).replace('T',' ')+' UTC';
function exportText(text:string,name:string,type:string){const url=URL.createObjectURL(new Blob([text],{type}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}

export default function OrbitExplorer(){
 const [input,setInput]=useState(BASE_INPUT),[catalog,setCatalog]=useState<OrbitSatellite[]>(BASE_CATALOG),[selectedId,setSelectedId]=useState(BASE_CATALOG[0].id);
 const [history,setHistory]=useState<OrbitHistory>(()=>mergeOrbitHistory(archive,BASE_CATALOG.map(createOrbitModel)));
 const [source,setSource]=useState(BASE_SOURCE),[sourceAt,setSourceAt]=useState(SNAPSHOT_AT),[attemptAt,setAttemptAt]=useState(SNAPSHOT_AT);
 const [time,setTime]=useState(BASE_TIME),[anchor,setAnchor]=useState(BASE_TIME),[playing,setPlaying]=useState(false),[rate,setRate]=useState('1');
 const [query,setQuery]=useState(''),[favorites,setFavorites]=useState<string[]>([]),[onlyFavorites,setOnlyFavorites]=useState(false),[sort,setSort]=useState('name');
 const [message,setMessage]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false),[ready,setReady]=useState(false),[showData,setShowData]=useState(false);
 const [canRefresh,setCanRefresh]=useState(false);
 const fileInput=useRef<HTMLInputElement>(null),controller=useRef<AbortController|null>(null);
 const models=useMemo(()=>catalog.map(createOrbitModel),[catalog]);
 const selected=models.find(m=>m.satellite.id===selectedId)??models[0];
 const positions=useMemo(()=>models.map(m=>({id:m.satellite.id,name:m.satellite.name,point:orbitPosition(m,new Date(time))})),[models,time]);
 const current=positions.find(p=>p.id===selected.satellite.id)?.point;
 const trackTime=Math.floor(time/10_000)*10_000;
 const track=useMemo(()=>orbitTrack(selected,new Date(trackTime)),[selected,trackTime]);
 const samples=history[selected.satellite.id]??[],climb=climbRate(samples);
 const epochAge=Math.abs(time-Date.parse(selected.satellite.epoch))/86_400_000;
 const filtered=useMemo(()=>models.filter(m=>(!onlyFavorites||favorites.includes(m.satellite.id))&&`${m.satellite.name} ${m.satellite.id}`.toLowerCase().includes(query.toLowerCase())).sort((a,b)=>sort==='altitude'?a.parameters.semiMajorAxisKm-b.parameters.semiMajorAxisKm:sort==='id'?Number(a.satellite.id)-Number(b.satellite.id):a.satellite.name.localeCompare(b.satellite.name,'ru',{numeric:true})),[models,query,sort,onlyFavorites,favorites]);

 useEffect(()=>{
  const frame=requestAnimationFrame(()=>{
  try{
   const raw=localStorage.getItem(STORAGE);
   if(raw&&raw.length<3_000_000){
    const saved=JSON.parse(raw);const restored=parseOrbitCatalog(saved.input),restoredModels=restored.map(createOrbitModel);
    setInput(saved.input);setCatalog(restored);setSelectedId(restored.some(s=>s.id===saved.selectedId)?saved.selectedId:restored[0].id);
    // History is optional. Validate stored observations before plotting them.
    const safe:OrbitHistory={...archive};
    for(const sat of restored){const points=saved.history?.[sat.id];if(Array.isArray(points))safe[sat.id]=[...(archive[sat.id as keyof typeof archive]??[]),...points.slice(-500).filter(p=>p&&typeof p.epoch==='string'&&Number.isFinite(Date.parse(p.epoch))&&typeof p.semiMajorAxisKm==='number'&&p.semiMajorAxisKm>6378&&p.semiMajorAxisKm<1_000_000)];}
    setHistory(mergeOrbitHistory(safe,restoredModels));setFavorites(Array.isArray(saved.favorites)?saved.favorites.filter((id:unknown)=>typeof id==='string').slice(0,200):[]);
    setSource(typeof saved.source==='string'?saved.source:BASE_SOURCE);setSourceAt(Number.isFinite(saved.sourceAt)?saved.sourceAt:SNAPSHOT_AT);setAttemptAt(Number.isFinite(saved.attemptAt)?saved.attemptAt:SNAPSHOT_AT);
    const reference=Math.max(...restored.map(s=>Date.parse(s.epoch)));const start=Math.abs(Date.now()-reference)<7*86_400_000?Date.now():reference;
    setTime(start);setAnchor(start);
   }else{const start=Math.abs(Date.now()-BASE_TIME)<7*86_400_000?Date.now():BASE_TIME;setTime(start);setAnchor(start);}
  }catch{setMessage('Сохранённые настройки недоступны. Открыт встроенный каталог.');}
  setReady(true);
  });
  return()=>{cancelAnimationFrame(frame);controller.current?.abort();};
 },[]);
 useEffect(()=>{if(!ready)return;const frame=requestAnimationFrame(()=>{try{localStorage.setItem(STORAGE,JSON.stringify({version:1,input,selectedId,history,favorites,source,sourceAt,attemptAt}));}catch{setMessage('Браузер не смог сохранить настройки. Текущий просмотр продолжает работать.');}});return()=>cancelAnimationFrame(frame);},[ready,input,selectedId,history,favorites,source,sourceAt,attemptAt]);
 useEffect(()=>{if(!ready)return;let timer:ReturnType<typeof setTimeout>;const update=()=>{const remaining=attemptAt+CACHE_MS-Date.now();setCanRefresh(remaining<=0);if(remaining>0)timer=setTimeout(update,Math.min(remaining,2_147_483_647));};timer=setTimeout(update,0);return()=>clearTimeout(timer);},[ready,attemptAt]);
 useEffect(()=>{
  if(!playing)return;let previous=Date.now();
  const timer=setInterval(()=>{const now=Date.now(),elapsed=now-previous;previous=now;if(!document.hidden)setTime(t=>t+elapsed*Number(rate));},1000);
  return()=>clearInterval(timer);
 },[playing,rate]);

 function applyCatalog(text:string,label:string,at:number){
  const next=parseOrbitCatalog(text),nextModels=next.map(createOrbitModel);
  setInput(text);setCatalog(next);setHistory(h=>mergeOrbitHistory(h,nextModels));setSelectedId(id=>next.some(s=>s.id===id)?id:next[0].id);
  const epoch=Math.max(...next.map(s=>Date.parse(s.epoch)));setTime(epoch);setAnchor(epoch);setPlaying(false);setSource(label);setSourceAt(at);setQuery('');setOnlyFavorites(false);
 }
 async function refresh(){
  setError('');setMessage('');if(Date.now()-attemptAt<CACHE_MS){setMessage('Каталог обновляется не чаще одного раза в 2 часа. Можно импортировать файл.');return;}
  const now=Date.now();setAttemptAt(now);setBusy(true);controller.current=new AbortController();
  try{const response=await fetch('/api/orbits/catalog',{signal:controller.current.signal});const data=await response.json() as {error?:string;input?:string;fetchedAt?:string};if(!response.ok)throw new Error(data.error||'Источник временно недоступен.');if(typeof data.input!=='string'||!data.fetchedAt||!Number.isFinite(Date.parse(data.fetchedAt)))throw new Error('Источник вернул некорректные данные.');applyCatalog(data.input,'CelesTrak · обновлено',Date.parse(data.fetchedAt));setMessage('Каталог обновлён. Просмотр установлен на эпоху новых элементов.');}
  catch(cause){if(cause instanceof Error&&cause.name!=='AbortError')setError(cause.message+' Сохранённые данные остаются доступны.');}
  finally{setBusy(false);}
 }
 async function importFile(file?:File){
  if(!file)return;setError('');setMessage('');
  try{if(file.size>1_000_000)throw new Error('Размер файла не должен превышать 1 МБ.');const text=await file.text();applyCatalog(text,'Импорт: '+file.name,Date.now());setMessage('Файл открыт локально. Данные не отправляются на сервер.');}catch(cause){setError(cause instanceof Error?cause.message:'Не удалось прочитать файл.');}
 }
 function choose(id:string){setSelectedId(id);}
 function favorite(id:string){setFavorites(current=>current.includes(id)?current.filter(v=>v!==id):[...current,id]);}
 function reset(){applyCatalog(BASE_INPUT,BASE_SOURCE,SNAPSHOT_AT);setMessage('Открыт встроенный каталог РАССВЕТА.');}
 function csv(){const rows=[['Аппарат','NORAD','Эпоха UTC','Полуось км','Перигей км','Апогей км','Наклонение град','Период мин'],...filtered.map(m=>[m.satellite.name,m.satellite.id,m.satellite.epoch,m.parameters.semiMajorAxisKm.toFixed(2),m.parameters.perigeeKm.toFixed(2),m.parameters.apogeeKm.toFixed(2),m.parameters.inclinationDeg.toFixed(3),m.parameters.periodMin.toFixed(3)])];exportText('\ufeff'+rows.map(row=>row.map(value=>'"'+String(value).replace(/"/g,'""')+'"').join(';')).join('\r\n'),'rassvet-orbits.csv','text/csv;charset=utf-8');}
 return <div className="orbit-app">
  <header className="orbit-header"><div className="orbit-header-inner"><Brand/><span className="orbit-app-name"><Satellite size={18}/>Орбиты и спутники</span><div><Link href="/technology" className="orbit-back"><ArrowLeft size={16}/>На сайт</Link><ThemeToggle/></div></div></header>
  <main id="main" className="orbit-main">
   <div className="orbit-page-heading"><div><span className="eyebrow">РАССВЕТ / ОРБИТАЛЬНАЯ ЛАБОРАТОРИЯ</span><h1>Взгляд с орбиты.</h1><p>Выберите аппарат. Изучите его путь вокруг Земли.</p></div><div className="orbit-heading-actions"><button className="orbit-tool-button" onClick={()=>fileInput.current?.click()}><Upload size={16}/>Импорт TLE / OMM</button><button className="orbit-tool-button" onClick={()=>setShowData(v=>!v)} aria-expanded={showData}><Info size={17}/>О данных</button><input ref={fileInput} type="file" accept=".txt,.tle,.json" hidden onChange={e=>{void importFile(e.target.files?.[0]);e.target.value='';}}/></div></div>
   <div className="orbit-source-line"><span><i/>{catalog.length} аппаратов в каталоге</span><span>{source} · {utc(sourceAt)}</span><button onClick={refresh} disabled={busy||!canRefresh} title={canRefresh?'Загрузить открытые данные из интернета':'Следующее обновление: '+utc(attemptAt+CACHE_MS)}><RefreshCw size={14} className={busy?'is-spinning':''}/>{busy?'Загрузка…':'Обновить каталог'}</button></div>
   {showData?<aside className="orbit-data-note"><div><h2>Расчётная орбита, открытые данные.</h2><p>SGP4 вычисляет положение по орбитальным элементам CelesTrak или импортированному файлу. Это расчёт, а не телеметрия. Старые элементы и манёвры снижают точность прогноза. Спутник над регионом не означает доступность интернета.</p><p>Карта, расчёты, импорт и сохранённый каталог работают без интернета. Только кнопка обновления обращается к CelesTrak, не чаще раза в 2 часа. Каталог и избранное хранятся в этом браузере.</p><a href="https://celestrak.org/NORAD/documentation/gp-data-formats.php" target="_blank" rel="noreferrer">Источник и формат данных <ArrowUpRight size={14}/></a></div><button className="orbit-tool-button" onClick={reset}>Каталог РАССВЕТА</button></aside>:null}
   <div className="orbit-notifications" aria-live="polite">{message?<p role="status">{message}</p>:null}{error?<p role="alert">{error}</p>:null}</div>
   <div className="orbit-workspace">
    <aside className="orbit-catalog-panel"><div className="orbit-panel-title"><h2>Аппараты <span>{filtered.length}</span></h2><button className="orbit-icon-button" aria-pressed={onlyFavorites} aria-label="Показать избранное" title="Избранное" onClick={()=>setOnlyFavorites(v=>!v)}><Star size={17}/></button></div><label className="orbit-search"><Search size={16}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Название или NORAD" aria-label="Найти спутник"/></label><ChoiceSelect value={sort} onValueChange={setSort} aria-label="Сортировка аппаратов" options={[{value:'name',label:'По названию'},{value:'altitude',label:'По высоте орбиты'},{value:'id',label:'По номеру NORAD'}]}/><div className="orbit-satellite-list">{filtered.map(m=><div key={m.satellite.id} className={`orbit-satellite-row ${m.satellite.id===selected.satellite.id?'selected':''}`}><button onClick={()=>choose(m.satellite.id)} aria-pressed={m.satellite.id===selected.satellite.id}><span className="orbit-sat-symbol"><Satellite size={19}/></span><span><strong>{m.satellite.name}</strong><small>NORAD {m.satellite.id} · {fmt(m.parameters.semiMajorAxisKm-6378.137,0)} км</small></span></button><button className="orbit-favorite" title={favorites.includes(m.satellite.id)?'Убрать из избранного':'В избранное'} aria-label={`${favorites.includes(m.satellite.id)?'Убрать из избранного':'Добавить в избранное'} ${m.satellite.name}`} aria-pressed={favorites.includes(m.satellite.id)} onClick={()=>favorite(m.satellite.id)}><Star size={15}/></button></div>)}{!filtered.length?<p className="orbit-list-empty">Ничего не найдено. Измените поиск или отключите фильтр избранного.</p>:null}</div><div className="orbit-catalog-footer"><Globe2 size={15}/><span>Положение по модели SGP4<br/>Без картографических сервисов</span></div></aside>
    <div className="orbit-center"><OrbitMap markers={positions} selectedId={selected.satellite.id} track={track} favorites={favorites} onSelect={choose}/><section className="orbit-timeline" aria-label="Управление временем"><div className="orbit-time-top"><div><span>ВРЕМЯ РАСЧЁТА</span><time dateTime={new Date(time).toISOString()}>{utc(time)}</time></div><button className="orbit-tool-button" onClick={()=>{const now=Date.now();setTime(now);setAnchor(now);setPlaying(true);setRate('1');}}>Сейчас</button><button className="orbit-tool-button" onClick={()=>{const epoch=Date.parse(selected.satellite.epoch);setTime(epoch);setAnchor(epoch);setPlaying(false);}}>К эпохе</button></div><div className="orbit-playback"><button className="orbit-play" onClick={()=>setPlaying(v=>!v)} aria-label={playing?'Приостановить движение спутников':'Запустить движение спутников'}>{playing?<Pause size={18}/>:<Play size={18}/>}</button><label><span className="sr-only">Сдвиг времени в минутах</span><input type="range" min="-90" max="90" step=".5" value={Math.max(-90,Math.min(90,(time-anchor)/60_000))} onChange={e=>{setPlaying(false);setTime(anchor+Number(e.target.value)*60_000);}}/><span>−90 мин <b>{fmt((time-anchor)/60_000,1)} мин</b> +90 мин</span></label><ChoiceSelect value={rate} onValueChange={setRate} aria-label="Скорость времени" options={[{value:'1',label:'×1'},{value:'10',label:'×10'},{value:'60',label:'×60'}]}/></div></section></div>
    <aside className="orbit-detail"><div className="orbit-detail-heading"><span className="orbit-detail-icon"><Satellite size={24}/></span><span className="eyebrow">ВЫБРАННЫЙ АППАРАТ</span><h2>{selected.satellite.name}</h2><p>NORAD {selected.satellite.id}</p></div><div className="orbit-current-alt"><span>Высота над Землёй</span><strong>{current?fmt(current.altKm,1):'—'}<small>км</small></strong></div><dl className="orbit-metrics"><div><dt>Скорость</dt><dd>{current?fmt(current.speedKms,2)+' км/с':'—'}</dd></div><div><dt>Широта</dt><dd>{current?fmt(current.lat,2)+'°':'—'}</dd></div><div><dt>Долгота</dt><dd>{current?fmt(current.lon,2)+'°':'—'}</dd></div><div><dt>Период</dt><dd>{fmt(selected.parameters.periodMin,2)} мин</dd></div><div><dt>Наклонение</dt><dd>{fmt(selected.parameters.inclinationDeg,3)}°</dd></div><div><dt>Перигей / апогей</dt><dd>{fmt(selected.parameters.perigeeKm,0)} / {fmt(selected.parameters.apogeeKm,0)} км</dd></div><div><dt>Большая полуось</dt><dd>{fmt(selected.parameters.semiMajorAxisKm,2)} км</dd></div><div><dt>Темп изменения</dt><dd>{climb===null?'Недостаточно эпох':fmt(climb,3)+' км/сут'}</dd></div></dl><div className="orbit-epoch"><span>ЭПОХА ЭЛЕМЕНТОВ</span><time>{utc(selected.satellite.epoch)}</time><p>{epochAge>7?'Элементы удалены от времени просмотра более чем на 7 суток. Прогноз может быть неточным.':'Положение рассчитано по этим элементам, с учётом выбранного времени.'}</p>{!current?<p role="status">Для этого времени положение не рассчитано. Вернитесь к эпохе или импортируйте новые элементы.</p>:null}</div></aside>
   </div>
   <div className="orbit-bottom-grid"><section className="orbit-history-panel"><div className="orbit-panel-title"><div><span className="eyebrow">ИСТОРИЯ ОРБИТЫ</span><h2>Как меняется высота.</h2></div><span>{selected.satellite.name}</span></div><OrbitHistoryChart samples={samples}/></section><section className="orbit-observation-note"><span className="orbit-detail-icon"><Globe2 size={23}/></span><h2>Один оборот.<br/>Новая точка зрения.</h2><p>Выберите глобус для орбитального вида или карту, чтобы изучить трассу над поверхностью. Избранные аппараты сохранятся до следующего запуска.</p><Link href="/technology">Как устроена спутниковая связь <ArrowUpRight size={15}/></Link></section></div>
   <section className="orbit-table-panel"><div className="orbit-panel-title"><div><span className="eyebrow">КАТАЛОГ / ПАРАМЕТРЫ</span><h2>Орбиты в цифрах.</h2></div><button className="orbit-tool-button" onClick={csv}><Download size={16}/>Скачать CSV</button></div><div className="orbit-table-scroll"><table><thead><tr><th>Аппарат</th><th>NORAD</th><th>Перигей, км</th><th>Апогей, км</th><th>Наклонение, °</th><th>Период, мин</th><th>Эпоха UTC</th></tr></thead><tbody>{filtered.map(m=><tr key={m.satellite.id} className={m.satellite.id===selected.satellite.id?'selected':''}><th><button aria-pressed={m.satellite.id===selected.satellite.id} onClick={()=>choose(m.satellite.id)}>{m.satellite.name}</button></th><td>{m.satellite.id}</td><td>{fmt(m.parameters.perigeeKm,2)}</td><td>{fmt(m.parameters.apogeeKm,2)}</td><td>{fmt(m.parameters.inclinationDeg,3)}</td><td>{fmt(m.parameters.periodMin,3)}</td><td>{utc(m.satellite.epoch).replace(' UTC','')}</td></tr>)}</tbody></table></div></section>
   <footer className="orbit-footer"><span>РАССВЕТ · Орбитальная лаборатория · Локальное приложение</span><span>Карта Natural Earth · Расчёты Satellite.js · Данные CelesTrak / ваш файл</span></footer>
  </main>
 </div>;
}
