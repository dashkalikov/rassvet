'use client';
import {CartesianGrid,Line,LineChart,ResponsiveContainer,Tooltip,XAxis,YAxis} from 'recharts';
import FullscreenPanel from './FullscreenPanel';

export type Series={key:string;name:string;color:string;dash?:string};
type Point={label:string;[key:string]:number|string|null};

export default function OperationsChart({title,detail,data,series,unit='',integer=false}:{
  title:string;detail:string;data:Point[];series:Series[];unit?:string;integer?:boolean;
}){
  const hasData=data.some(point=>series.some(item=>typeof point[item.key]==='number'));
  return <FullscreenPanel title={title} className="ops-panel ops-chart">
    <h2>{title}</h2><p>{detail}</p>
    {hasData?<div className="ops-chart-plot">
      <ResponsiveContainer width="100%" height="100%" minWidth={0} initialDimension={{width:520,height:230}}>
        <LineChart data={data} margin={{top:10,right:12,bottom:2,left:0}}>
          <CartesianGrid vertical={false} stroke="var(--line)" strokeDasharray="3 4"/>
          <XAxis dataKey="label" minTickGap={32} tickLine={false} tick={{fill:'var(--text)',fontSize:11}} axisLine={{stroke:'var(--line)'}}/>
          <YAxis allowDecimals={!integer} tickLine={false} tick={{fill:'var(--text)',fontSize:11}} axisLine={false} width={43} unit={unit}/>
          <Tooltip contentStyle={{background:'var(--surface)',border:'1px solid var(--line)',borderRadius:10,color:'var(--text)'}}
            itemStyle={{color:'var(--text)'}} labelStyle={{color:'var(--text)'}}/>
          {series.map(item=><Line key={item.key} dataKey={item.key} name={item.name}
            stroke={item.color} strokeDasharray={item.dash} strokeWidth={2} dot={data.length<8} isAnimationActive={false}/>)}
        </LineChart>
      </ResponsiveContainer>
    </div>:<p className="ops-no-data">За этот период ещё нет измерений.</p>}
    <ul className="ops-legend" aria-label={title}>{series.map(item=><li key={item.key}><i style={{borderColor:item.color,borderTopStyle:item.dash?'dashed':'solid'}}/>{item.name}</li>)}</ul>
  </FullscreenPanel>;
}
