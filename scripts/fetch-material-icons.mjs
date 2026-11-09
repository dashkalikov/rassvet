import {mkdirSync,readFileSync,writeFileSync,existsSync} from 'node:fs';
const names=['apartment','arrow_forward','arrow_outward','bolt','book','check','chevron_right','close','compare_arrows','construction','dark_mode','description','expand_more','home','inventory_2','light_mode','location_on','mail','menu','person','public','router','satellite_alt','search','settings','speed','support_agent','travel_explore','verified_user','wifi'];
const directory='public/assets/icons/material',root='https://raw.githubusercontent.com/google/material-design-icons/master';
mkdirSync(directory,{recursive:true});
async function download(url,path){if(existsSync(path))return;const response=await fetch(url,{signal:AbortSignal.timeout(20_000)});if(!response.ok)throw Error(`${response.status}: ${url}`);const text=await response.text();writeFileSync(path,text);}
for(let offset=0;offset<names.length;offset+=4)await Promise.all(names.slice(offset,offset+4).map(name=>download(`${root}/symbols/web/${name}/materialsymbolsrounded/${name}_24px.svg`,`${directory}/${name}.svg`)));
await download(`${root}/LICENSE`,`${directory}/LICENSE.txt`);
const symbols=names.map(name=>{
 const svg=readFileSync(`${directory}/${name}.svg`,'utf8');
 const viewBox=svg.match(/viewBox="([^"]+)"/)?.[1];
 if(!viewBox||/<script|<foreignObject|onload=|href=/i.test(svg))throw Error('Unexpected SVG content: '+name);
 const content=svg.replace(/^[\s\S]*?<svg\b[^>]*>/,'').replace(/<\/svg>[\s\S]*$/,'').replace(/fill="(?!none)[^"]*"/g,'fill="currentColor"');
 return `<symbol id="${name}" viewBox="${viewBox}" fill="currentColor">${content}</symbol>`;
});
writeFileSync('public/assets/icons/material-symbols.svg',`<!-- Google Material Symbols Rounded, Apache-2.0. Modified: individual SVGs combined into symbols with inherited currentColor. -->\n<svg xmlns="http://www.w3.org/2000/svg">${symbols.join('')}</svg>`);
writeFileSync(`${directory}/SOURCES.json`,JSON.stringify({style:'Material Symbols Rounded, 24px',license:'Apache-2.0',source:'https://github.com/google/material-design-icons',icons:names},null,2));
console.log(`Saved ${names.length} local Google Material Symbols and license.`);
