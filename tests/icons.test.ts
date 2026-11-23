import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToString} from 'react-dom/server';
import {MATERIAL_ICONS} from '../lib/material-icons.ts';
import {loadTsx} from './tsx-loader.ts';

test('every navigation icon renders its own scalable outline geometry without an external sprite',()=>{
 const {default:Icon}=loadTsx(new URL('../components/MaterialIcon.tsx',import.meta.url)) as {default:React.ComponentType<{name:typeof MATERIAL_ICONS[number];size?:number;className?:string}>};
 for(const name of MATERIAL_ICONS){
  const html=renderToString(React.createElement(Icon,{name}));
  assert.match(html,/viewBox="0 0 24 24"/,name);
  assert.match(html,/stroke="currentColor"/,name);
  assert.match(html,/<(?:path|circle|line|rect|polygon|polyline|ellipse)\b/,name);
  assert.doesNotMatch(html,/<(?:use|image|text)\b/,name);
  assert.match(html,/aria-hidden="true"/,name);
  assert.match(html,/focusable="false"/,name);
 }
});

test('inline icons preserve requested dimensions and styling hooks with stable server markup',()=>{
 const {default:Icon}=loadTsx(new URL('../components/MaterialIcon.tsx',import.meta.url)) as {default:React.ComponentType<{name:'light_mode';size:number;className:string}>};
 const props={name:'light_mode' as const,size:22,className:'theme-sun'};
 const html=renderToString(React.createElement(Icon,props));
 assert.equal(html,renderToString(React.createElement(Icon,props)));
 assert.match(html,/width="22"/);assert.match(html,/height="22"/);
 assert.match(html,/material-icon/);assert.match(html,/theme-sun/);
});
