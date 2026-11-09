import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {projectRussia} from '../lib/map-projection.ts';

// Run explicitly when updating map assets; the application never fetches data.
const input=process.argv[2];
if(!input)throw Error('Usage: node scripts/build-russia-map.mjs path/to/countries-50m.geojson');
const collection=JSON.parse(readFileSync(input,'utf8'));
const country=collection.features.find(feature=>feature.properties.ADM0_A3==='RUS');
if(!country||country.geometry.type!=='MultiPolygon')throw Error('Russia MultiPolygon was not found');
const projected=country.geometry.coordinates.flat(2).map(([lon,lat])=>projectRussia(lon,lat));
const xs=projected.map(point=>point[0]),ys=projected.map(point=>point[1]);
const minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys);
const scale=Math.min(860/(maxX-minX),360/(maxY-minY));
const frame={scale,translate:[60+(860-(maxX-minX)*scale)/2-minX*scale,75+(360-(maxY-minY)*scale)/2+maxY*scale]};
const round=value=>Math.round(value*100)/100;
const line=coordinates=>coordinates.map(([lon,lat],index)=>{
 const [x,y]=projectRussia(lon,lat,frame);
 return `${index?'L':'M'}${round(x)},${round(y)}`;
}).join('');
const outlines=country.geometry.coordinates.map(polygon=>polygon.map(ring=>line(ring)+'Z').join(''));
// Natural Earth splits Chukotka at ±180°. Keep the fills closed, but do not
// draw those artificial cut edges as national borders after unwrapping.
const borders=country.geometry.coordinates.map(polygon=>polygon.map(ring=>{
 let path='',drawing=false;
 for(let index=1;index<ring.length;index++){
  const previous=ring[index-1],next=ring[index];
  if(Math.abs(previous[0])===180&&Math.abs(next[0])===180){drawing=false;continue;}
  const start=projectRussia(...previous,frame),end=projectRussia(...next,frame);
  if(!drawing)path+=`M${round(start[0])},${round(start[1])}`;
  path+=`L${round(end[0])},${round(end[1])}`;
  drawing=true;
 }
 return path;
}).join(''));
const graticules=[...Array.from({length:5},(_,i)=>Array.from({length:171},(_,j)=>[20+j,40+i*10])),...Array.from({length:6},(_,i)=>Array.from({length:46},(_,j)=>[30+i*30,38+j]))].map(coordinates=>line(coordinates.map(([lon,lat])=>[lon>180?lon-360:lon,lat])));
mkdirSync('lib/data',{recursive:true});
mkdirSync('public/assets/maps',{recursive:true});
writeFileSync('public/assets/maps/russia-50m.geojson',JSON.stringify({type:'Feature',properties:{name:'Russia',source:'Natural Earth 1:50m admin-0 countries'},geometry:country.geometry}));
writeFileSync('lib/data/russia-map.json',JSON.stringify({width:1000,height:520,frame,outlines,borders,graticules}));
console.log(`Generated ${outlines.length} polygons from ${projected.length} geographic coordinates`);
