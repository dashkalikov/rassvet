import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToString} from 'react-dom/server';
import {loadTsx} from './tsx-loader.ts';

type OrbitPoint={time:string;lat:number;lon:number;altKm:number;speedKms:number;eci:{x:number;y:number;z:number}};
type OrbitMapProps={
  markers:Array<{id:string;name:string;point:OrbitPoint|null;color?:string}>;
  selectedId:string;track:OrbitPoint[];tracks?:Record<string,OrbitPoint[]>;favorites?:string[];
  onSelect:(id:string)=>void;fixedMode?:'map'|'globe';showLabels?:boolean;showFootprints?:boolean;elevation?:number;
};
const point=(lat:number,lon:number,altKm=550):OrbitPoint=>({time:'2026-11-18T00:00:00.000Z',lat,lon,altKm,speedKms:7.6,eci:{x:0,y:0,z:6378+altKm}});
const markers:OrbitMapProps['markers']=[
  {id:'1',name:'ALPHA-1',point:point(30,40),color:'#a8ff65'},
  {id:'2',name:'BRAVO-2',point:point(45,60),color:'#6ce7e2'},
];
const orbit=(lat:number,lon:number)=>[point(lat,lon),point(lat+1,lon+2),point(lat-1,lon-2)];
const component=()=>loadTsx(new URL('../components/OrbitMap.tsx',import.meta.url)) as {default:React.ComponentType<OrbitMapProps>};
const count=(html:string,pattern:RegExp)=>(html.match(pattern)??[]).length;

test('the globe dims non-selected satellites and draws coverage cones from each satellite',()=>{
  const {default:OrbitMap}=component();
  const html=renderToString(React.createElement(OrbitMap,{
    markers,selectedId:'1',track:[],onSelect:()=>{},fixedMode:'globe',showFootprints:true,elevation:25,
  }));
  assert.match(html,/class="orbit-marker selected"/);
  assert.match(html,/class="orbit-marker dimmed"/);
  // The cone base lies on the surface: ring outline plus a fan converging at the satellite.
  assert.match(html,/orbit-footprint-ring/);
  assert.match(html,/class="orbit-cone"/);
  assert.match(html,/orbit-cone-rays/);
  assert.doesNotMatch(html,/orbit-footprint-circle/);
  assert.ok(!/NaN|undefined|Infinity/.test(html));
});

test('the surface map keeps flat footprint circles and stays selection-aware',()=>{
  const {default:OrbitMap}=component();
  const html=renderToString(React.createElement(OrbitMap,{
    markers,selectedId:'2',track:[],onSelect:()=>{},fixedMode:'map',showFootprints:true,elevation:25,
  }));
  assert.match(html,/orbit-footprint-circle/);
  assert.doesNotMatch(html,/orbit-cone/);
  // The selected marker is highlighted, the other stays visible but dimmed.
  assert.equal(count(html,/class="orbit-marker selected"/g),1);
  assert.equal(count(html,/class="orbit-marker dimmed"/g),1);
});

test('without a selection the whole constellation stays fully visible with every orbit',()=>{
  const {default:OrbitMap}=component();
  const html=renderToString(React.createElement(OrbitMap,{
    markers,selectedId:'',track:[],tracks:{'1':orbit(30,40),'2':orbit(45,60)},onSelect:()=>{},fixedMode:'globe',showFootprints:true,elevation:25,
  }));
  // Nothing is dimmed and nothing carries the selected highlight.
  assert.equal(count(html,/orbit-marker dimmed/g),0);
  assert.equal(count(html,/class="orbit-marker selected"/g),0);
  // Each visible satellite draws its own orbit, and the legend names the mode.
  assert.equal(count(html,/orbit-trail-other/g),2);
  assert.match(html,/Орбиты всех аппаратов/);
  assert.doesNotMatch(html,/Прошедшие 45 минут/);
  assert.ok(!/NaN|undefined|Infinity/.test(html));
});

test('favorites remain fully visible while a different satellite is selected',()=>{
  const {default:OrbitMap}=component();
  const html=renderToString(React.createElement(OrbitMap,{
    markers,selectedId:'1',track:[],favorites:['2'],onSelect:()=>{},fixedMode:'globe',
  }));
  assert.equal(count(html,/class="orbit-marker selected"/g),1);
  assert.equal(count(html,/orbit-marker dimmed/g),0);
});
