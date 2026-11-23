'use client';
import {useEffect,useId,useRef,useState,type KeyboardEvent} from 'react';
import {Building2,Home,LoaderCircle,MapPin,Search} from 'lucide-react';
import {addressSelectionValue,citySuggestions,type AddressSearchResult,type AddressSuggestion} from '../lib/address-search';

export default function AddressAutocomplete({value,onChange,id,label='Адрес подключения',required=true,minLength=8,autoFocus=false}:{value:string;onChange:(value:string)=>void;id?:string;label?:string;required?:boolean;minLength?:number;autoFocus?:boolean}){
 const uid=useId().replaceAll(':',''),inputId=id??'address-'+uid,listId=inputId+'-options',hintId=inputId+'-hint';
 const field=useRef<HTMLInputElement>(null);
 const [open,setOpen]=useState(false),[query,setQuery]=useState(value),[result,setResult]=useState<AddressSearchResult>({suggestions:[],source:'cities',unavailable:false}),[busy,setBusy]=useState(false),[active,setActive]=useState(-1);
 const local=citySuggestions(value);
 const suggestions=query===value&&result.suggestions.length?result.suggestions:local;
 useEffect(()=>{
  if(!open||value.trim().length<3)return;
  const controller=new AbortController();
  const timer=setTimeout(async()=>{
   setBusy(true);
   try{
    const response=await fetch('/api/addresses?q='+encodeURIComponent(value),{signal:controller.signal,credentials:'same-origin',cache:'no-store'});
    if(!response.ok)throw new Error();
    const data=await response.json() as AddressSearchResult;
    if(!controller.signal.aborted){setQuery(value);setResult(data);setActive(-1);}
   }catch{if(!controller.signal.aborted){setQuery(value);setResult({suggestions:citySuggestions(value),source:'cities',unavailable:true});}}
   finally{if(!controller.signal.aborted)setBusy(false);}
  },650);
  return()=>{clearTimeout(timer);controller.abort();};
 },[value,open]);
 function choose(item:AddressSuggestion){
  onChange(addressSelectionValue(item));setActive(-1);setBusy(false);setOpen(item.kind!=='house');field.current?.focus();
 }
 function keyboard(event:KeyboardEvent<HTMLInputElement>){
  if(event.key==='Escape'){setOpen(false);return;}
  if(event.key==='ArrowDown'||event.key==='ArrowUp'){
   event.preventDefault();setOpen(true);if(!suggestions.length)return;
   const direction=event.key==='ArrowDown'?1:-1;setActive(index=>index<0?(direction>0?0:suggestions.length-1):(index+direction+suggestions.length)%suggestions.length);
  }
  if(event.key==='Enter'&&open&&active>=0&&suggestions[active]){event.preventDefault();choose(suggestions[active]);}
 }
 return <div className="address-autocomplete" onBlur={event=>{if(!event.currentTarget.contains(event.relatedTarget as Node|null)){setOpen(false);setBusy(false);}}}>
  <label htmlFor={inputId}>{label}</label>
  <div className="address-autocomplete-field"><MapPin size={22} aria-hidden="true"/><input ref={field} id={inputId} value={value} onChange={event=>{onChange(event.target.value);setActive(-1);setBusy(false);setOpen(true);}} onFocus={()=>setOpen(true)} onKeyDown={keyboard} role="combobox" aria-autocomplete="list" aria-expanded={open} aria-controls={listId} aria-activedescendant={active>=0&&open?listId+'-'+active:undefined} aria-describedby={hintId} autoComplete="off" required={required} minLength={minLength} maxLength={300} placeholder="Начните вводить город, улицу и дом" autoFocus={autoFocus}/>{busy?<LoaderCircle size={20} className="address-spinner" aria-label="Поиск адресов"/>:<Search size={20} aria-hidden="true"/>}</div>
  <p className="address-field-hint" id={hintId}>Город, улица и номер дома — в одном поле. Адрес можно ввести вручную.</p>
  <span className="sr-only" role="status" aria-live="polite">{open?(busy?'Ищем адреса…':suggestions.length?'Вариантов адреса: '+suggestions.length:'Укажите адрес вручную или продолжайте ввод.'):''}</span>
  {open&&<div className="address-options-panel"><ul id={listId} role="listbox" aria-label="Подсказки адресов">{suggestions.map((item,index)=>{
   const Icon=item.kind==='house'?Home:item.kind==='street'?MapPin:Building2;
   return <li key={item.id} id={listId+'-'+index} role="option" aria-selected={active===index} onPointerDown={event=>{event.preventDefault();choose(item);}} className={active===index?'active':''}><Icon size={20} aria-hidden="true"/><span><strong>{item.label}</strong><small>{item.kind==='city'?'Выбрать город и указать улицу':item.kind==='street'?'Выбрать улицу и указать дом':'Выбрать адрес'}</small></span></li>;
  })}</ul>{!suggestions.length&&<p role="status">{busy?'Ищем подходящие адреса…':'Продолжайте ввод или укажите полный адрес вручную.'}</p>}{result.unavailable&&query===value&&<p className="address-source-notice" role="status">Подсказки улиц временно недоступны. Вы можете заполнить адрес самостоятельно.</p>}{result.source==='osm'&&query===value&&<p className="address-attribution">Адреса: <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a></p>}</div>}
 </div>;
}
