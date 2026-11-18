import test from 'node:test';
import assert from 'node:assert/strict';
import {loadTsx} from './tsx-loader.ts';
import React from 'react';
import {renderToString} from 'react-dom/server';

test('server-rendered map titles preserve city text instead of producing empty hydration nodes',()=>{
 const Map=(loadTsx(new URL('../components/CoverageMap.tsx',import.meta.url)) as {default:React.ComponentType<{select:(city:string)=>void}>}).default,warnings:unknown[][]=[];
 const original=console.error;let html='';
 try{console.error=(...args:unknown[])=>{warnings.push(args);};html=renderToString(React.createElement(Map,{select:()=>{}}));}
 finally{console.error=original;}
 assert.ok(html.includes('<title>Санкт-Петербург · Учебная подписка доступна</title>'),'server output must contain the full Saint Petersburg tooltip');
 assert.ok(html.includes('<title>Москва · Учебная подписка доступна</title>'));
 assert.ok(html.includes('<title>Владивосток · Учебная подписка доступна</title>'));
 assert.equal(warnings.length,0,'rendering map titles must not emit React SSR warnings');
});
