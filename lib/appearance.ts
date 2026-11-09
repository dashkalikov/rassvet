export const APPEARANCES=[
 {id:'light',mode:'light',name:'Светлая',description:'Светлый фон и голубые акценты.',family:'Классическая'},
 {id:'dark',mode:'dark',name:'Тёмная',description:'Глубокие синие оттенки.',family:'Классическая'},
 {id:'light-2026',mode:'light',name:'Светлая 2026',description:'Матовая белая и мягкие серые панели.',family:'Матовая'},
 {id:'dark-2026',mode:'dark',name:'Тёмная 2026',description:'Матовая чёрная и спокойный графит.',family:'Матовая'},
] as const;
export type Appearance=typeof APPEARANCES[number]['id'];
export const APPEARANCE_KEY='rassvet-theme';
export const APPEARANCE_EVENT='rassvet-theme-change';
export function resolveAppearance(value:unknown,prefersLight=false):Appearance{
 return APPEARANCES.some(theme=>theme.id===value)?value as Appearance:prefersLight?'light':'dark';
}
export function appearanceMode(value:Appearance):'light'|'dark'{return value==='light'||value==='light-2026'?'light':'dark';}
export function oppositeAppearance(value:Appearance):Appearance{
 return value==='light-2026'?'dark-2026':value==='dark-2026'?'light-2026':value==='light'?'dark':'light';
}

// Keep data-theme as the base mode for existing photo, icon and form styles.
// Resolve the variant before first paint, from the same registry as the picker.
const modes=Object.fromEntries(APPEARANCES.map(theme=>[theme.id,theme.mode]));
export const APPEARANCE_BOOTSTRAP=`(()=>{var modes=${JSON.stringify(modes)},theme;try{theme=localStorage.getItem(${JSON.stringify(APPEARANCE_KEY)})}catch(e){}if(!Object.prototype.hasOwnProperty.call(modes,theme)){var light=false;try{light=matchMedia('(prefers-color-scheme: light)').matches}catch(e){}theme=light?'light':'dark'}document.documentElement.dataset.theme=modes[theme];document.documentElement.dataset.appearance=theme})()`;
