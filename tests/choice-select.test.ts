import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {createRequire} from 'node:module';
import ts from 'typescript';
import React from 'react';
import {renderToString} from 'react-dom/server';

type Props={id?:string;name?:string;value:string;disabled?:boolean;'aria-label'?:string;options:{value:string;label:string;disabled?:boolean}[];onValueChange:(value:string)=>void};
function component(){
  const file=new URL('../components/ChoiceSelect.tsx',import.meta.url);
  assert.ok(existsSync(file),'Custom choice controls must render a consistent accessible trigger');
  const require=createRequire(file),module={exports:{} as {default:React.ComponentType<Props>}};
  const {outputText}=ts.transpileModule(readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true,target:ts.ScriptTarget.ES2022}});
  new Function('require','module','exports',outputText)(require,module,module.exports);
  return module.exports.default;
}
const options=[{value:'home',label:'РАССВЕТ Дом · до 150 Мбит/с'},{value:'travel',label:'РАССВЕТ В пути · до 250 Мбит/с'}];

test('choice controls preserve the selected label, accessible name and stable server markup',()=>{
  const Select=component(),props={id:'plan',value:'home',options,onValueChange:()=>{},'aria-label':'Тариф для сравнения'};
  const first=renderToString(React.createElement(Select,props)),second=renderToString(React.createElement(Select,props));
  assert.match(first,/role="combobox"/);assert.match(first,/aria-haspopup="listbox"/);assert.match(first,/aria-expanded="false"/);
  assert.match(first,/aria-label="Тариф для сравнения"/);assert.match(first,/РАССВЕТ Дом · до 150 Мбит\/с/);
  assert.equal(first,second,'initial render must not depend on client measurements or random IDs');
});

test('a disabled choice remains disabled and keeps its label and form field name',()=>{
  const Select=component();
  const html=renderToString(React.createElement('form',null,React.createElement(Select,{value:'travel',options,name:'plan',disabled:true,onValueChange:()=>{}})));
  assert.match(html,/<button[^>]*disabled=""/);assert.match(html,/name="plan"/);assert.match(html,/РАССВЕТ В пути · до 250 Мбит\/с/);
});
