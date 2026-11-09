export function createHoverMenu(change:(id:string|null)=>void,delay=200){
 let timer:ReturnType<typeof setTimeout>|undefined;
 function hold(){if(timer!==undefined){clearTimeout(timer);timer=undefined;}}
 return {
  show(id:string){hold();change(id);},
  hold,
  leave(){hold();timer=setTimeout(()=>{timer=undefined;change(null);},delay);},
  hide(){hold();change(null);},
  dispose:hold,
 };
}
