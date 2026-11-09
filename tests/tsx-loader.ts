import {createRequire} from 'node:module';
import {existsSync,readFileSync,statSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import ts from 'typescript';

/** Real component SSR, without a browser or application import aliases. */
export function loadTsx(file:URL):unknown{
 const cache=new Map<string,{exports:unknown}>();
 function load(target:URL):unknown{
  const key=target.href;if(cache.has(key))return cache.get(key)!.exports;
  const require=createRequire(target);
  if(target.pathname.endsWith('.json'))return require(fileURLToPath(target));
  const module={exports:{} as unknown};cache.set(key,module);
  const {outputText}=ts.transpileModule(readFileSync(target,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true,target:ts.ScriptTarget.ES2022}});
  const localRequire=(specifier:string)=>{
   if(!specifier.startsWith('.'))return require(specifier);
   const resolved=new URL(specifier,target),candidate=[resolved,new URL(resolved.href+'.ts'),new URL(resolved.href+'.tsx')].find(path=>existsSync(path)&&statSync(path).isFile());
   if(!candidate)throw new Error('Missing module '+specifier+' from '+key);
   return load(candidate);
  };
  new Function('require','module','exports',outputText)(localRequire,module,module.exports);return module.exports;
 }
 return load(file);
}
