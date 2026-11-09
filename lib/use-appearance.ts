'use client';
import {useSyncExternalStore} from 'react';
import {APPEARANCE_EVENT,APPEARANCE_KEY,appearanceMode,resolveAppearance,type Appearance} from './appearance';

function applyToDocument(theme:Appearance){document.documentElement.dataset.theme=appearanceMode(theme);document.documentElement.dataset.appearance=theme;}
function currentAppearance():Appearance{return resolveAppearance(document.documentElement.dataset.appearance??document.documentElement.dataset.theme);}
function serverAppearance():Appearance{return 'dark';}
function prefersLight(){return window.matchMedia?.('(prefers-color-scheme: light)').matches??false;}
function subscribe(notify:()=>void){
 function syncStorage(event:StorageEvent){
  if(event.key!==APPEARANCE_KEY&&event.key!==null)return;
  applyToDocument(resolveAppearance(event.newValue,prefersLight()));notify();
 }
 window.addEventListener(APPEARANCE_EVENT,notify);window.addEventListener('storage',syncStorage);
 return()=>{window.removeEventListener(APPEARANCE_EVENT,notify);window.removeEventListener('storage',syncStorage);};
}
export function setAppearance(theme:Appearance){
 applyToDocument(theme);
 try{localStorage.setItem(APPEARANCE_KEY,theme);}catch{}
 window.dispatchEvent(new Event(APPEARANCE_EVENT));
}
export function useAppearance(){return useSyncExternalStore(subscribe,currentAppearance,serverAppearance);}
