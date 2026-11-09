import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToString} from 'react-dom/server';
import {loadTsx} from './tsx-loader.ts';

test('orbit application renders its saved catalogue offline with stable hydration markup',()=>{
 const {default:Explorer}=loadTsx(new URL('../components/OrbitExplorer.tsx',import.meta.url)) as {default:React.ComponentType};
 const warnings:unknown[][]=[],original=console.error;let first='',second='';
 try{console.error=(...args:unknown[])=>warnings.push(args);first=renderToString(React.createElement(Explorer));second=renderToString(React.createElement(Explorer));}
 finally{console.error=original;}
 assert.equal(first,second,'No clock, network or browser storage may change the initial markup.');
 assert.match(first.replace(/<!--.*?-->/g,''),/30 аппаратов в каталоге/);
 assert.match(first,/RASSVET-3 32/);assert.match(first,/100098/);
 assert.match(first,/<title>RASSVET-3 \d+ · \d+ км<\/title>/);
 assert.match(first,/href="\/technology"/);
 assert.ok(!/NaN|undefined|Infinity/.test(first));
 assert.deepEqual(warnings,[]);
});
