import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import React from 'react';
import {renderToString} from 'react-dom/server';
import {loadTsx} from './tsx-loader.ts';

function backgrounds(){
 const file=new URL('../lib/backgrounds.ts',import.meta.url);
 assert.ok(existsSync(file),'The background preference must be implemented');
 return loadTsx(file) as {
  BACKGROUNDS:ReadonlyArray<{id:string;name:string;image:string|null;preview:string|null}>;
  BACKGROUND_KEY:string;BACKGROUND_BOOTSTRAP:string;resolveBackground:(value:unknown)=>string;
 };
}

test('wallpaper restores independently of all four themes and rejects arbitrary stored URLs',()=>{
 const {BACKGROUNDS,BACKGROUND_BOOTSTRAP,resolveBackground}=backgrounds();
 for(const theme of ['light','dark','light-2026','dark-2026']){
  for(const choice of BACKGROUNDS){
   const dataset:Record<string,string>={appearance:theme};const properties:Record<string,string>={};
   runInNewContext(BACKGROUND_BOOTSTRAP,{document:{documentElement:{dataset,style:{setProperty:(k:string,v:string)=>properties[k]=v,removeProperty:(k:string)=>delete properties[k]}}},localStorage:{getItem:()=>choice.id}});
   assert.equal(dataset.appearance,theme);assert.equal(dataset.background,choice.id);
   assert.equal(properties['--app-wallpaper'],choice.image?`url("${choice.image}")`:undefined);
  }
 }
 for(const value of ['https://example.com/tracker.png','url(javascript:alert(1))','__proto__','constructor',null,{}])assert.equal(resolveBackground(value),'none');
});

test('storage denial or damaged preferences preserve the ordinary background',()=>{
 const {BACKGROUND_BOOTSTRAP}=backgrounds();
 for(const broken of [true,false]){
  const dataset:Record<string,string>={};const properties:Record<string,string>={'--app-wallpaper':'old-image'};
  runInNewContext(BACKGROUND_BOOTSTRAP,{document:{documentElement:{dataset,style:{setProperty:(k:string,v:string)=>properties[k]=v,removeProperty:(k:string)=>delete properties[k]}}},localStorage:{getItem:()=>{if(broken)throw new Error('blocked');return 'invalid';}}});
  assert.equal(dataset.background,'none');assert.equal(properties['--app-wallpaper'],undefined);
 }
});

test('settings render a stable accessible no-image choice and local wallpaper previews',()=>{
 const file=new URL('../components/BackgroundPicker.tsx',import.meta.url);
 assert.ok(existsSync(file),'Account settings must expose a background picker');
 const {default:Picker}=loadTsx(file) as {default:React.ComponentType};
 const html=renderToString(React.createElement(Picker));
 assert.equal(html,renderToString(React.createElement(Picker)));
 assert.match(html,/aria-label="Фон приложения"/);assert.match(html,/Без изображения/);
 assert.equal((html.match(/aria-pressed="true"/g)??[]).length,1);
 assert.equal((html.match(/<button /g)??[]).length,backgrounds().BACKGROUNDS.length);
 assert.equal((html.match(/<img /g)??[]).length,10);
 for(const choice of backgrounds().BACKGROUNDS){
  if(!choice.image)continue;
  assert.ok(existsSync(new URL('../public'+choice.image,import.meta.url)),choice.image);
  assert.ok(existsSync(new URL('../public'+choice.preview,import.meta.url)),String(choice.preview));
 }
});

test('changing a background persists it and storage events update other open tabs',()=>{
 const file=new URL('../lib/use-background.ts',import.meta.url);
 assert.ok(existsSync(file),'Background changes must be persisted');
 const {setBackground,subscribeBackground}=loadTsx(file) as {setBackground:(value:string)=>void;subscribeBackground:(notify:()=>void)=>()=>void};
 const {BACKGROUND_KEY}=backgrounds();
 const previous={window:globalThis.window,document:globalThis.document,localStorage:globalThis.localStorage};
 const events=new EventTarget(),stored=new Map<string,string>();const dataset:Record<string,string>={};const properties=new Map<string,string>();
 try{
  Object.assign(globalThis,{window:events,document:{documentElement:{dataset,style:{setProperty:(k:string,v:string)=>properties.set(k,v),removeProperty:(k:string)=>properties.delete(k)}}},localStorage:{setItem:(k:string,v:string)=>stored.set(k,v)}});
  let notifications=0;const unsubscribe=subscribeBackground(()=>notifications++);
  setBackground('earth');assert.equal(stored.get(BACKGROUND_KEY),'earth');assert.equal(dataset.background,'earth');assert.equal(notifications,1);
  setBackground('none');assert.equal(properties.has('--app-wallpaper'),false);
  const event=new Event('storage');Object.assign(event,{key:BACKGROUND_KEY,newValue:'forest'});events.dispatchEvent(event);
  assert.equal(dataset.background,'forest');assert.equal(notifications,3);
  const unrelated=new Event('storage');Object.assign(unrelated,{key:'unrelated',newValue:'earth'});events.dispatchEvent(unrelated);assert.equal(dataset.background,'forest');
  const clear=new Event('storage');Object.assign(clear,{key:null,newValue:null});events.dispatchEvent(clear);assert.equal(dataset.background,'none');
  unsubscribe();const before=notifications;events.dispatchEvent(event);assert.equal(notifications,before);
 }finally{Object.assign(globalThis,previous);}
});

test('the background initializes before paint and the account settings keep the theme picker',()=>{
 const layout=readFileSync(new URL('../app/layout.tsx',import.meta.url),'utf8');
 assert.match(layout,/BACKGROUND_BOOTSTRAP/);assert.match(layout,/<BackgroundLayer/);
 const settings=readFileSync(new URL('../components/AccountSettings.tsx',import.meta.url),'utf8');
 assert.match(settings,/<ThemePicker/);assert.match(settings,/<BackgroundPicker/);
});

test('the exact combined head script restores theme and background without an initial page error',()=>{
 const {BACKGROUND_BOOTSTRAP,BACKGROUND_KEY}=backgrounds();
 const {APPEARANCE_BOOTSTRAP}=loadTsx(new URL('../lib/appearance.ts',import.meta.url)) as {APPEARANCE_BOOTSTRAP:string};
 const layout=readFileSync(new URL('../app/layout.tsx',import.meta.url),'utf8');
 const expression=layout.match(/__html:([^}]+)\}/)![1];
 const script=runInNewContext(expression,{APPEARANCE_BOOTSTRAP,BACKGROUND_BOOTSTRAP});
 const dataset:Record<string,string>={};const properties:Record<string,string>={};
 assert.doesNotThrow(()=>runInNewContext(script,{document:{documentElement:{dataset,style:{setProperty:(k:string,v:string)=>properties[k]=v,removeProperty:(k:string)=>delete properties[k]}}},localStorage:{getItem:(key:string)=>key===BACKGROUND_KEY?'mountains':'light-2026'}}));
 assert.deepEqual(dataset,{theme:'light',appearance:'light-2026',background:'mountains'});
});
