import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import ts from 'typescript';
import React from 'react';
import {renderToString} from 'react-dom/server';

// Render the real TSX component on the server without starting a browser or
// changing application imports. Node 24 loads its JSON / TS data dependencies.
function loadMap(){
 const file=new URL('../components/CoverageMap.tsx',import.meta.url),require=createRequire(file);
 const {outputText}=ts.transpileModule(readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true,target:ts.ScriptTarget.ES2022}});
 const module={exports:{} as {default:React.ComponentType<{select:(city:string)=>void}>}};
 const localRequire=(specifier:string)=>{
  if(!specifier.startsWith('.'))return require(specifier);
  const target=fileURLToPath(new URL(specifier,file));
  return require([target,target+'.ts'].find(candidate=>existsSync(candidate))??target);
 };
 new Function('require','module','exports',outputText)(localRequire,module,module.exports);
 return module.exports.default;
}

test('server-rendered map titles preserve city text instead of producing empty hydration nodes',()=>{
 const Map=loadMap(),warnings:unknown[][]=[];
 const original=console.error;let html='';
 try{console.error=(...args:unknown[])=>{warnings.push(args);};html=renderToString(React.createElement(Map,{select:()=>{}}));}
 finally{console.error=original;}
 assert.ok(html.includes('<title>Санкт-Петербург · Первая очередь</title>'),'server output must contain the full Saint Petersburg tooltip');
 assert.ok(html.includes('<title>Москва · Первая очередь</title>'));
 assert.ok(html.includes('<title>Владивосток · Следующий этап</title>'));
 assert.equal(warnings.length,0,'rendering map titles must not emit React SSR warnings');
});
