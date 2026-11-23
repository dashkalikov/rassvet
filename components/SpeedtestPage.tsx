'use client';
import ChoiceSelect from './ChoiceSelect';
import StepNumber from './StepNumber';
import Link from 'next/link';
import EditorialImage from './EditorialImage';
import {useEffect,useId,useRef,useState} from 'react';
import {Check,CheckCircle2,Activity,ArrowDown,ArrowUp,ArrowUpRight,Download,Gauge,Globe2,Play,Radio,Satellite,Square,Timer,Trash2,UserRound,Waves} from 'lucide-react';
import {PLANS,formatMoney,type PlanId} from '../lib/domain';
import {demoMetrics,SPEED_CONDITIONS,type SpeedCondition,type SpeedMeasurement,type SpeedPhase,type SpeedProgress} from '../lib/speedtest';
import {runInternetSpeedtest} from '../lib/speedtest-engine';
import type {User} from './ui';

type Mode='internet'|'demo';
type Stage=SpeedPhase|'idle'|'done'|'cancelled'|'error';
type Result=SpeedMeasurement&{id:string;mode:Mode;plan:PlanId;condition:SpeedCondition;timestamp:string};
type Values={download?:number;upload?:number;ping?:number;jitter?:number};
const stages=[{id:'latency',label:'Задержка'},{id:'download',label:'Загрузка'},{id:'upload',label:'Отправка'}] as const;
const number=(value:number|undefined)=>value===undefined?'—':new Intl.NumberFormat('ru-RU',{maximumFractionDigits:value<10?2:1}).format(value);
const date=(value:string)=>new Intl.DateTimeFormat('ru-RU',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit',timeZone:'Europe/Moscow'}).format(new Date(value));

function pause(milliseconds:number,signal:AbortSignal){return new Promise<void>((resolve,reject)=>{
 signal.throwIfAborted();
 const stop=()=>{clearTimeout(timer);signal.removeEventListener('abort',stop);reject(signal.reason);};
 const timer=setTimeout(()=>{signal.removeEventListener('abort',stop);resolve();},milliseconds);
 signal.addEventListener('abort',stop,{once:true});
});}
async function simulate(plan:PlanId,condition:SpeedCondition,report:(event:SpeedProgress)=>void,signal:AbortSignal):Promise<SpeedMeasurement>{
 const result=demoMetrics(plan,condition),downloadSamples:number[]=[],uploadSamples:number[]=[];
 for(let index=0;index<6;index++){await pause(160,signal);report({phase:'latency',progress:(index+1)/6*.2,value:result.ping});}
 for(const phase of ['download','upload'] as const)for(let index=0;index<8;index++){
  await pause(240,signal);const value=result[phase]*(.3+.7*index/7);
  (phase==='download'?downloadSamples:uploadSamples).push(value);
  report({phase,progress:(phase==='download'?.2:.65)+(index+1)/8*(phase==='download'?.45:.35),value});
 }
 return {...result,bytesTransferred:0,downloadSamples,uploadSamples};
}
function Plot({down,up,model}:{down:number[];up:number[];model:boolean}){
 const maximum=Math.max(1,...down,...up),fillId=useId().replace(/[^a-zA-Z0-9_-]/g,'');
 const path=(values:number[])=>{
  const points=values.map((value,index)=>({x:20+index/Math.max(1,values.length-1)*560,y:135-value/maximum*105}));
  return points.map((point,index)=>{if(!index)return `M${point.x},${point.y}`;const previous=points[index-1],middle=(previous.x+point.x)/2;return `C${middle},${previous.y} ${middle},${point.y} ${point.x},${point.y}`;}).join(' ');
 };
 const downPath=path(down);
 return <div className="speed-plot"><div><div><span className="speed-caption">{model?'ДАННЫЕ МОДЕЛИ':'ДАННЫЕ ИЗМЕРЕНИЯ'}</span><h3>Скорость во времени</h3></div><span className="speed-plot-legend"><i/>Загрузка <i/>Отправка</span></div><svg viewBox="0 0 600 170" role="img" aria-label={model?'График демонстрационных показателей тарифа':'График скорости передачи тестовых данных'}><defs><linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="var(--accent-strong)" stopOpacity=".2"/><stop offset="1" stopColor="var(--accent-strong)" stopOpacity="0"/></linearGradient></defs><path className="speed-grid" d="M20 30H580M20 65H580M20 100H580M20 135H580"/><text x="20" y="17">{number(maximum)} Мбит/с</text><text x="20" y="158">Начало</text><text x="580" y="158" textAnchor="end">{down.length||up.length?'Сейчас':'Ожидание'}</text>{down.length>1&&<path fill={`url(#${fillId})`} d={downPath+' L580,135 L20,135 Z'}/>} {down.length>0&&<path className="speed-down-line" d={downPath}/>} {up.length>0&&<path className="speed-up-line" d={path(up)}/>}</svg>{!down.length&&!up.length&&<p><Activity size={20}/>График появится во время проверки</p>}</div>;
}
export default function SpeedtestPage({user,accountPlan,initialPlan}:{user:User|null;accountPlan:{plan:PlanId;orderId:string}|null;initialPlan:PlanId}){
 const [mode,setMode]=useState<Mode>('internet'),[plan,setPlan]=useState(initialPlan),[condition,setCondition]=useState<SpeedCondition>('clear');
 const [running,setRunning]=useState(false),[stage,setStage]=useState<Stage>('idle'),[progress,setProgress]=useState(0),[value,setValue]=useState(0);
 const [values,setValues]=useState<Values>({}),[result,setResult]=useState<Result|null>(null),[history,setHistory]=useState<Result[]>([]),[error,setError]=useState('');
 const [chart,setChart]=useState<{down:number[];up:number[]}>({down:[],up:[]});
 const controller=useRef<AbortController|null>(null),lastUpdate=useRef({time:0,phase:''});
 useEffect(()=>()=>{controller.current?.abort();controller.current=null;},[]);
 const gaugeId=useId().replace(/[^a-zA-Z0-9_-]/g,'');
 const tariff=PLANS.find(tariff=>tariff.id===plan)!;
 const phaseIndex=stages.findIndex(item=>item.id===stage);
 const metric=stage==='upload'?'upload':stage==='latency'?'ping':'download';
 const gaugeValue=stage==='done'?(result?.download??0):value;
 const maximum=metric==='ping'?150:metric==='upload'?mode==='internet'?500:60:mode==='internet'?1000:tariff.speed;
 const fraction=Math.min(1,Math.max(0,gaugeValue/maximum));
 function reset(){setResult(null);setValues({});setStage('idle');setProgress(0);setValue(0);setError('');setChart({down:[],up:[]});}
 function chooseMode(next:Mode){if(running)return;setMode(next);reset();}
 function choosePlan(next:PlanId){if(running)return;setPlan(next);reset();}
 async function start(){
  if(controller.current)return;
  const current=new AbortController();controller.current=current;lastUpdate.current={time:0,phase:''};
  reset();setRunning(true);setStage('latency');
  const report=(event:SpeedProgress)=>{
   if(controller.current!==current||current.signal.aborted)return;
   const time=performance.now();
   if(event.phase===lastUpdate.current.phase&&time-lastUpdate.current.time<80&&event.progress<1)return;
   lastUpdate.current={time,phase:event.phase};
   setStage(event.phase);setProgress(event.progress);setValue(event.value);
   setValues(previous=>({...previous,[event.phase==='latency'?'ping':event.phase]:event.value}));
   if(event.phase!=='latency'&&event.value>0)setChart(previous=>event.phase==='download'?{...previous,down:[...previous.down,event.value].slice(-48)}:{...previous,up:[...previous.up,event.value].slice(-48)});
  };
  try{
   const measured=mode==='internet'?await runInternetSpeedtest(report,current.signal):await simulate(plan,condition,report,current.signal);
   if(controller.current!==current||current.signal.aborted)return;
   const completed:Result={...measured,id:crypto.randomUUID(),mode,plan,condition,timestamp:new Date().toISOString()};
   setResult(completed);setValues(completed);setValue(completed.download);setStage('done');setProgress(1);
   setChart({down:completed.downloadSamples,up:completed.uploadSamples});
   setHistory(previous=>[completed,...previous].slice(0,6));
  }catch(caught){
   if(controller.current!==current)return;
   if(current.signal.aborted){setStage('cancelled');setError('');}
   else{setStage('error');setError(caught instanceof Error&&caught.name==='TimeoutError'?'Сервер не ответил за 20 секунд. Проверьте соединение и повторите.':caught instanceof Error&&/Тестовый|Неполный/.test(caught.message)?caught.message:'Не удалось связаться с тестовым сервером Cloudflare. Проверьте интернет или откройте модель тарифов.');}
  }finally{if(controller.current===current){controller.current=null;setRunning(false);}}
 }
 function download(){
  if(!result)return;
  const text=['РАССВЕТ / ПРОВЕРКА СКОРОСТИ',result.mode==='internet'?'РЕАЛЬНЫЙ ЗАМЕР ТЕКУЩЕГО ИНТЕРНЕТ-СОЕДИНЕНИЯ':'ДЕМОНСТРАЦИОННАЯ МОДЕЛЬ — НЕ ЗАМЕР',`Дата: ${result.timestamp}`,`Тариф для сравнения: ${PLANS.find(plan=>plan.id===result.plan)!.name}`,`Загрузка: ${number(result.download)} Мбит/с`,`Отправка: ${number(result.upload)} Мбит/с`,`Задержка HTTP: ${number(result.ping)} мс`,`Джиттер: ${number(result.jitter)} мс`,result.mode==='internet'?`Тестовый сервер: speed.cloudflare.com. Передано: ${result.bytesTransferred} байт. Выбор тарифа не ограничивает и не изменяет результат.`:`Условия модели: ${SPEED_CONDITIONS.find(item=>item.id===result.condition)!.name}. Показатели иллюстративны.`].join('\n');
  const url=URL.createObjectURL(new Blob(['\uFEFF'+text],{type:'text/plain;charset=utf-8'})),anchor=document.createElement('a');anchor.href=url;anchor.download=`rassvet-proverka-skorosti-${result.mode}-${result.id.slice(0,8)}.txt`;anchor.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
 }
 function show(previous:Result){if(running)return;setMode(previous.mode);setPlan(previous.plan);setCondition(previous.condition);setResult(previous);setValues(previous);setStage('done');setProgress(1);setValue(previous.download);setError('');setChart({down:previous.downloadSamples,up:previous.uploadSamples});}
 const status=stage==='idle'?'Готов к проверке':stage==='done'?'Проверка завершена':stage==='cancelled'?'Проверка остановлена':stage==='error'?'Проверка не завершена':`${mode==='demo'?'Моделирование':'Измерение'}: ${stages.find(item=>item.id===stage)?.label.toLocaleLowerCase('ru')}`;
 return <><section className="speed-page-intro container"><nav className="breadcrumbs" aria-label="Хлебные крошки"><Link href="/">Главная</Link><span>/</span><span>Проверка скорости</span></nav><div className="speed-intro-body"><div><span className="eyebrow"><i/>ДИАГНОСТИКА СОЕДИНЕНИЯ</span><h1>Проверка<br/><span>скорости.</span></h1></div><div className="speed-intro-copy"><p>Узнайте, на что способен ваш интернет. Загрузка, отправка и стабильность соединения — в одной проверке.</p><div className="speed-intro-tags"><span><Globe2 size={20}/>Текущий интернет</span><span><Satellite size={20}/>Модели подписок</span></div></div></div></section>
 <div className="container page-content speedtest-page">
  <div className="speed-mode-selector" aria-label="Режим проверки скорости">
   <button disabled={running} aria-pressed={mode==='internet'} onClick={()=>chooseMode('internet')}><span className="speed-mode-icon"><Globe2 size={23}/></span><span><b>Мой интернет</b><small>Реальный замер через Cloudflare</small></span><span className="speed-mode-mark" aria-hidden="true">{mode==='internet'?<Check size={20}/>:<ArrowUpRight size={20}/>}</span></button>
   <button disabled={running} aria-pressed={mode==='demo'} onClick={()=>chooseMode('demo')}><span className="speed-mode-icon"><Satellite size={23}/></span><span><b>Модель тарифов</b><small>Сравнение скоростей подписок</small></span><span className="speed-mode-mark" aria-hidden="true">{mode==='demo'?<Check size={20}/>:<ArrowUpRight size={20}/>}</span></button>
  </div>
  <div className="speed-workspace" id="speed-console">
   <aside className="speed-controls" id="speed-settings">
    <span className="eyebrow"><Radio size={20}/>ВАШ СЦЕНАРИЙ</span><h2>{mode==='internet'?'Проверьте связь сейчас.':'Выберите свою орбиту.'}</h2>
    <label htmlFor="speed-plan">{mode==='internet'?'Тариф для сравнения':'Подписка РАССВЕТ'}<ChoiceSelect id="speed-plan" disabled={running} value={plan} onValueChange={value=>choosePlan(value as PlanId)} options={PLANS.map(p=>({value:p.id,label:p.name+' · до '+p.speed+' Мбит/с'}))}/></label>
    {mode==='demo'?<><label htmlFor="speed-condition">Условия приёма<ChoiceSelect id="speed-condition" disabled={running} value={condition} onValueChange={value=>{setCondition(value as SpeedCondition);reset();}} options={SPEED_CONDITIONS.map(item=>({value:item.id,label:item.name}))}/></label><p className="speed-context">{SPEED_CONDITIONS.find(item=>item.id===condition)!.description}. Все цифры в этом режиме иллюстративны.</p></>:<p className="speed-context">Результат относится к вашему текущему провайдеру. Выбор тарифа РАССВЕТ служит ориентиром для сравнения и не меняет измеренную скорость.</p>}
    <div className="speed-account"><UserRound size={20}/><div>{!user?<><h3>Проверка доступна всем</h3><p>Войдите, чтобы выбрать тариф из своей заявки.</p><Link href="/auth?returnTo=%2Fspeedtest" className="text-link">Войти <ArrowUpRight size={20}/></Link></>:accountPlan?<><h3>Тариф в вашем аккаунте</h3><p>{PLANS.find(plan=>plan.id===accountPlan.plan)!.name}<br/>По последней неотменённой заявке.</p><button className="text-link" disabled={running} onClick={()=>choosePlan(accountPlan.plan)}>Выбрать мой тариф <ArrowUpRight size={20}/></button><Link className="speed-order-link" href={`/account/orders/${accountPlan.orderId}`}>Открыть заявку</Link></>:<><h3>Тариф пока не выбран</h3><p>В аккаунте нет действующих заявок. Можно проверить интернет и сравнить любые подписки.</p><Link href="/connect" className="text-link">Выбрать подключение <ArrowUpRight size={20}/></Link></>}</div></div>
    <div className={`speed-mode-note ${mode==='demo'?'model':''}`}><span className="eyebrow">{mode==='demo'?'ДЕМОНСТРАЦИЯ':'РЕАЛЬНОЕ СОЕДИНЕНИЕ'}</span><p>{mode==='demo'?'Это симуляция, а не реальная скорость спутникового тарифа. Реальные показатели доступны только при замере действующего подключения.':'По кнопке браузер передаст до 27 МБ тестовых данных серверу Cloudflare. Аккаунт и заявки не отправляются; сервис получает IP вашего соединения.'}</p>{mode==='internet'&&<a href="https://www.cloudflare.com/privacypolicy/" target="_blank" rel="noreferrer">О данных Cloudflare <ArrowUpRight size={20}/></a>}</div>
    <EditorialImage image={mode==='internet'?'speed-live':'speed-models'} className="speed-scenario-photo" sizes="(max-width: 900px) 100vw, 350px"/>
   </aside>
   <section className={`speed-console ${running?'is-running':''}`} aria-label="Проверка скорости">
    <div className="speed-console-top"><div><span className={`speed-badge ${mode==='demo'?'model':''}`}><i/>{mode==='demo'?'ДЕМОНСТРАЦИЯ ТАРИФА':'РЕАЛЬНЫЙ ЗАМЕР'}</span><h2>{mode==='demo'?'Модель вашей подписки':'Ваше соединение'}</h2></div><a className="speed-reference" href="#speed-settings" aria-label="Настроить тариф для проверки"><Satellite size={20}/><span>{mode==='internet'?'Сравнение: ':''}{tariff.short}<small>до {tariff.speed} Мбит/с</small></span><ArrowUpRight size={20}/></a></div>
    <div className="speed-meter-surface"><div className="speed-gauge"><svg viewBox="0 0 300 260" aria-hidden="true"><defs><linearGradient id={gaugeId} x1="0" y1="1" x2="1" y2="0"><stop offset="0" stopColor="#315ddc"/><stop offset="1" stopColor="#61c0db"/></linearGradient></defs><g className="speed-gauge-ticks">{Array.from({length:25},(_,index)=><line key={index} className={index/24<=fraction&&stage!=='idle'?'lit':''} x1="150" y1="24" x2="150" y2={index%4?29:33} transform={`rotate(${-135+index/24*270} 150 145)`}/>)}</g><circle className="speed-gauge-orbit" cx="150" cy="145" r="87"/><circle className="speed-gauge-track" cx="150" cy="145" r="106" pathLength="100" strokeDasharray="75 100" transform="rotate(135 150 145)"/><circle className="speed-gauge-fill" stroke={`url(#${gaugeId})`} cx="150" cy="145" r="106" pathLength="100" strokeDasharray={`${fraction*75} 100`} transform="rotate(135 150 145)"/><circle className="speed-gauge-dot" cx="150" cy="39" r="4" style={{transform:`rotate(${-135+fraction*270}deg)`}}/><text x="35" y="249">0</text><text x="265" y="249" textAnchor="end">{maximum}</text></svg><div className="speed-gauge-value"><span>{stage==='latency'?'ЗАДЕРЖКА':stage==='upload'?'ОТПРАВКА':'ЗАГРУЗКА'}</span><strong>{stage==='idle'||stage==='cancelled'||stage==='error'?'—':number(gaugeValue)}</strong><small>{metric==='ping'?'мс':'Мбит/с'}</small></div></div></div>
    <p className="speed-status" role="status" aria-live="polite">{status}</p>
    <div className="speed-start">{running?<button className="button outline" onClick={()=>controller.current?.abort()}><Square size={20}/>Остановить</button>:<button className="button primary" onClick={()=>void start()}><Play size={20}/>{stage==='done'?'Повторить проверку':mode==='demo'?'Запустить модель':'Начать измерение'}</button>}</div>
    <ol className="speed-stages" aria-label="Этапы проверки">{stages.map((item,index)=><li key={item.id} className={stage==='done'||index<phaseIndex?'done':index===phaseIndex?'active':''}><span>{stage==='done'||index<phaseIndex?<Check size={20}/>:<StepNumber value={index+1}/>}</span>{item.label}</li>)}</ol>
    <div className="speed-progress-caption"><span>{running?'Проверяем соединение':stage==='done'?'Результат готов':'Готовность проверки'}</span><b>{Math.round(progress*100)}%</b></div><progress className="speed-progress" max={1} value={progress} aria-label="Ход проверки скорости"/>
    {error&&<div className="form-error" role="alert">{error}</div>}
    <div className="speed-metrics">{[{id:'download',label:'Загрузка',unit:'Мбит/с',icon:ArrowDown},{id:'upload',label:'Отправка',unit:'Мбит/с',icon:ArrowUp},{id:'ping',label:'Задержка',unit:'мс',icon:Timer},{id:'jitter',label:'Джиттер',unit:'мс',icon:Waves}].map(item=><article key={item.id} data-metric={item.id}><span><i><item.icon size={16}/></i>{item.label}</span><strong>{number(values[item.id as keyof Values])}</strong><small>{item.unit}</small></article>)}</div>
    <Plot down={chart.down} up={chart.up} model={mode==='demo'}/>
    {result&&<div className="speed-result-note"><span className="speed-result-icon"><CheckCircle2 size={22}/></span><div><b>{result.mode==='demo'?'Сохранён демонстрационный результат':'Замер текущего соединения завершён'}</b><p>{date(result.timestamp)} · {result.mode==='internet'?`${number(result.bytesTransferred/1_000_000)} МБ тестовых данных`:'Модель не подтверждает фактическую скорость тарифа'}</p></div><button className="button outline" onClick={download}><Download size={20}/>Скачать отчёт</button></div>}
   </section>
  </div>
  <section className="speed-history" id="history" aria-label="История проверок"><div className="tool-heading"><div><span className="eyebrow"><Activity size={20}/>ВАШИ ПРОВЕРКИ</span><h2>История проверок.</h2></div>{history.length>0&&<button className="text-link" onClick={()=>setHistory([])}><Trash2 size={20}/>Очистить историю</button>}</div>{history.length?<div className="table-scroll"><table className="comparison-table speed-history-table"><caption className="sr-only">Последние шесть проверок на текущей странице</caption><thead><tr><th>Время и режим</th><th>Тариф</th><th>Загрузка</th><th>Отправка</th><th>Задержка</th><th>Результат</th></tr></thead><tbody>{history.map(previous=><tr key={previous.id}><td>{date(previous.timestamp)}<small>{previous.mode==='demo'?'Демонстрация':'Реальный замер'}</small></td><td>{PLANS.find(plan=>plan.id===previous.plan)!.short}</td><td>{number(previous.download)} Мбит/с</td><td>{number(previous.upload)} Мбит/с</td><td>{number(previous.ping)} мс</td><td><button className="text-link" disabled={running} onClick={()=>show(previous)}>Открыть <ArrowUpRight size={20}/></button></td></tr>)}</tbody></table></div>:<div className="speed-empty"><EditorialImage image="speed-history" className="speed-history-photo" sizes="240px"/><p>Начните проверку — здесь появятся последние результаты. История хранится до обновления страницы.</p></div>}</section>
  <p className="speed-history-caption">Последние 6 проверок на этой странице. Отчёт можно сохранить перед обновлением.</p><section className="speed-compare" id="compare"><div className="tool-heading"><div><span className="eyebrow"><Satellite size={20}/>СРАВНЕНИЕ ПОДПИСОК</span><h2>Связь под ваши задачи.</h2></div></div><div className="speed-plan-grid">{PLANS.map(item=><article className={plan===item.id?'selected':''} key={item.id}><span className="eyebrow">{item.short}</span><h3>{item.name}</h3><strong>до {item.speed}<small>Мбит/с · проектная загрузка</small></strong><p>{item.traffic}<br/>{formatMoney(item.price)} ₽/мес.</p><button className="button outline full" disabled={running} onClick={()=>{setMode('demo');choosePlan(item.id);document.getElementById('speed-console')?.scrollIntoView({behavior:'smooth',block:'start'});}}>Посмотреть модель <ArrowUpRight size={20}/></button></article>)}</div><p className="fineprint speed-footnote">Предельная скорость указана в каталоге тарифов. У «В пути» и «Бизнес» одинаковый предел загрузки; различаются пакет трафика и условия. Модель отправки, задержки и влияния нагрузки создана для демонстрации.</p></section>
  <details className="speed-method"><summary>Как читать результат и что измеряется?</summary><p>Реальный режим передаёт тестовые данные между браузером и сервером Cloudflare. Скорость рассчитана по объёму и времени передачи, Задержка — по HTTP-запросам, джиттер — по изменению задержки. Короткий замер зависит от Wi-Fi, устройства, маршрута и нагрузки; он не гарантирует максимальную скорость линии.</p><p>Выбранная подписка не меняет текущего провайдера и не ограничивает реальные результаты. Для фактического сравнения разных подключений проведите отдельный замер на каждом из них. В режиме сравнения показатели и графики рассчитываются по модели тарифов.</p><p>Тариф аккаунта выбирается по последней неотменённой заявке. Реальной активации спутниковой услуги в этом проекте нет. Историю можно сохранить текстовым отчётом.</p></details>
 </div></>;
}
