import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToString} from 'react-dom/server';
import {loadTsx} from './tsx-loader.ts';
import {readFileSync} from 'node:fs';

test('the settings picker exposes four themes with stable server markup and one active choice',()=>{
 const {default:Picker}=loadTsx(new URL('../components/ThemePicker.tsx',import.meta.url)) as {default:React.ComponentType};
 const first=renderToString(React.createElement(Picker)),second=renderToString(React.createElement(Picker));
 assert.equal(first,second);
 assert.equal((first.match(/<button /g)??[]).length,4);
 assert.equal((first.match(/aria-pressed="true"/g)??[]).length,1);
 assert.ok(first.includes('Светлая 2026'));assert.ok(first.includes('Тёмная 2026'));
 assert.ok(first.includes('aria-label="Тема приложения"'));
});

function luminance(hex:string){const channels=hex.replace('#','').match(/../g)!.slice(0,3).map(c=>parseInt(c,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return channels[0]*.2126+channels[1]*.7152+channels[2]*.0722;}
function contrast(a:string,b:string){const x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);}
test('matte theme text stays readable on panels, selected rows and primary buttons',()=>{
 const css=readFileSync(new URL('../app/matte-themes.css',import.meta.url),'utf8');
 for(const variant of ['light-2026','dark-2026']){
  const block=css.match(new RegExp(`:root\\[data-appearance=${variant}\\],[^{]+\\{([^}]+)\\}`))![1];
  const tokens=Object.fromEntries([...block.matchAll(/(--[a-z-]+):\s*(#[0-9a-f]{6})(?=[;\s])/g)].map(m=>[m[1],m[2]]));
  for(const background of ['--bg','--surface','--surface-raised','--input','--selection-surface','--action-surface']) assert.ok(contrast(tokens['--text'],tokens[background])>=4.5,`${variant}: text on ${background} must meet AA contrast`);
  for(const background of ['--bg','--surface','--selection-surface'])assert.ok(contrast(tokens['--muted'],tokens[background])>=4.5,`${variant}: secondary text on ${background} must remain readable`);
 }
});
