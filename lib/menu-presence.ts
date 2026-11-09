export const MENU_FADE_MS=180;
export type MenuPresenceState={id:string|null;phase:'open'|'closing'};

export function createMenuPresence(change:(state:MenuPresenceState)=>void,duration:number|(()=>number)=MENU_FADE_MS) {
  let shown:string|null=null,timer:ReturnType<typeof setTimeout>|undefined;
  function stop(){if(timer!==undefined){clearTimeout(timer);timer=undefined;}}
  function commit(id:string|null){shown=id;change({id,phase:'open'});}
  return {
    set(id:string|null) {
      stop();
      if(shown===null||shown===id){commit(id);return;}
      const delay=typeof duration==='function'?duration():duration;
      if(delay<=0){commit(id);return;}
      change({id:shown,phase:'closing'});
      timer=setTimeout(()=>{timer=undefined;commit(id);},delay);
    },
    clear(){stop();commit(null);},
    dispose:stop,
  };
}
