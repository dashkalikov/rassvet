import {splitOrbitSamples,type OrbitSample} from '../lib/orbits';
import FullscreenPanel from './FullscreenPanel';
export default function OrbitHistoryChart({samples}:{samples:OrbitSample[]}){
 if(samples.length<2)return <div className="orbit-history-empty"><strong>История начинается с одной эпохи</strong><p>Обновите каталог позже или импортируйте более ранние элементы этого аппарата. Здесь появится изменение большой полуоси, без вымышленных точек.</p></div>;
 const times=samples.map(p=>Date.parse(p.epoch)),ys=samples.map(p=>p.semiMajorAxisKm),minT=Math.min(...times),maxT=Math.max(...times),minY=Math.min(...ys)-.2,maxY=Math.max(...ys)+.2;
 const x=(p:OrbitSample)=>60+(Date.parse(p.epoch)-minT)/(maxT-minT||1)*620;
 const y=(p:OrbitSample)=>130-(p.semiMajorAxisKm-minY)/(maxY-minY)*100;
 return <FullscreenPanel title="Изменение большой полуоси" className="orbit-history-chart"><svg viewBox="0 0 720 170" role="img" aria-label={`Изменение большой полуоси по ${samples.length} уникальным эпохам`}><line x1="60" y1="130" x2="680" y2="130"/><line x1="60" y1="30" x2="680" y2="30"/><text x="4" y="34">{maxY.toFixed(1)}</text><text x="4" y="134">{minY.toFixed(1)}</text>{splitOrbitSamples(samples).map(segment=><path key={segment[0].epoch} d={segment.map((p,i)=>`${i?'L':'M'}${x(p)},${y(p)}`).join(' ')} className="orbit-history-line"/>)}{samples.map(p=><circle key={p.epoch} cx={x(p)} cy={y(p)} r="2"><title>{`${p.epoch} · ${p.semiMajorAxisKm.toFixed(2)} км`}</title></circle>)}<text x="60" y="160">{new Date(minT).toISOString().slice(0,10)}</text><text x="680" y="160" textAnchor="end">{new Date(maxT).toISOString().slice(0,10)}</text></svg><small>Большая полуось, км · даты UTC · {samples.length} уникальных эпох · архив findrassvet.ru, В. Булыбенко</small></FullscreenPanel>;
}
