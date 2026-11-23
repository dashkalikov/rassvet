'use client';
import {useSyncExternalStore} from 'react';
import {BACKGROUNDS,BACKGROUND_EVENT,BACKGROUND_KEY,resolveBackground,type Background} from './backgrounds';

function applyToDocument(choice:Background) {
 const image=BACKGROUNDS.find(background=>background.id===choice)?.image;
 const root=document.documentElement;
 root.dataset.background=choice;
 if(image)root.style.setProperty('--app-wallpaper',`url("${image}")`);
 else root.style.removeProperty('--app-wallpaper');
}
function currentBackground():Background {return resolveBackground(document.documentElement.dataset.background);}
function serverBackground():Background {return 'none';}
export function subscribeBackground(notify:()=>void) {
 function syncStorage(event:StorageEvent) {
  if(event.key!==BACKGROUND_KEY&&event.key!==null)return;
  applyToDocument(resolveBackground(event.newValue));notify();
 }
 window.addEventListener(BACKGROUND_EVENT,notify);window.addEventListener('storage',syncStorage);
 return()=>{window.removeEventListener(BACKGROUND_EVENT,notify);window.removeEventListener('storage',syncStorage);};
}
export function setBackground(value:Background) {
 const choice=resolveBackground(value);
 applyToDocument(choice);
 try{localStorage.setItem(BACKGROUND_KEY,choice);}catch{}
 window.dispatchEvent(new Event(BACKGROUND_EVENT));
}
export function useBackground() {return useSyncExternalStore(subscribeBackground,currentBackground,serverBackground);}
