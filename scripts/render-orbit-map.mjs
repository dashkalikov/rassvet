// Static SVG geometry review. This is not a browser or interaction test.
import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import sharp from 'sharp';
import {loadTsx} from '../tests/tsx-loader.ts';
import {createOrbitModel,orbitPosition,orbitTrack,parseOrbitCatalog} from '../lib/orbits.ts';
const {default:Map}=loadTsx(new URL('../components/OrbitMap.tsx',import.meta.url));
const catalog=parseOrbitCatalog(fs.readFileSync(new URL('../lib/data/orbit-catalog.json',import.meta.url),'utf8'));
const models=catalog.map(createOrbitModel),time=new Date(models[0].satellite.epoch);
const html=renderToStaticMarkup(React.createElement(Map,{markers:models.map(m=>({id:m.satellite.id,name:m.satellite.name,point:orbitPosition(m,time)})),selectedId:catalog[0].id,track:orbitTrack(models[0],time),onSelect:()=>{}}));
const svg=html.match(/<svg class="orbit-earth"[\s\S]*?<\/svg>/)[0];
const css=fs.readFileSync(new URL('../app/orbit.css',import.meta.url),'utf8');
const geometryCss=css.match(/\.orbit-star\{[\s\S]*?\.orbit-map-tools\{/)[0].replace(/\.orbit-map-tools\{$/,'');
for(const theme of ['dark','light']){
 const colors=theme==='dark'?{'--orbit-panel':'#111b29','--orbit-muted':'#b3c2d5','--orbit-sea-light':'#173a63','--orbit-sea':'#0c1c33','--orbit-land':'#335b7b','--orbit-land-line':'#7badd155','--orbit-trace':'#91bbff','--accent':'#5d8cff','--text':'#ffffff'}:{'--orbit-panel':'#ffffff','--orbit-muted':'#34465d','--orbit-sea-light':'#f0f7ff','--orbit-sea':'#dce9fa','--orbit-land':'#8fb3dd','--orbit-land-line':'#5379a7','--orbit-trace':'#1749b9','--accent':'#2563eb','--text':'#000000'};
 const output=svg.replace('<svg ','<svg xmlns="http://www.w3.org/2000/svg" width="1290" height="840" ').replace(/(<svg[^>]*>)/,`$1<style>${geometryCss}</style>`).replace(/var\((--[a-z-]+)\)/g,(_,key)=>colors[key]??'#ffffff');
 await sharp(Buffer.from(output)).flatten({background:colors['--orbit-panel']}).png().toFile(fileURLToPath(new URL(`../design/orbit-map-${theme}-preview.png`,import.meta.url)));
}
console.log('Rendered the real map SVG in both themes for static geometry review.');
