export const BACKGROUNDS = [
 {id:'none',name:'Без изображения',description:'Чистый фон выбранной темы.',image:null,preview:null,category:'Классика'},
 {id:'earth',name:'Земля с орбиты',description:'Тихий рассвет над горизонтом планеты.',image:'/assets/backgrounds/earth.webp',preview:'/assets/backgrounds/earth-preview.webp',category:'Космос'},
 {id:'nebula',name:'Туманность',description:'Звёзды и мягкое свечение далёких облаков.',image:'/assets/backgrounds/nebula.webp',preview:'/assets/backgrounds/nebula-preview.webp',category:'Космос'},
 {id:'lunar',name:'Лунный горизонт',description:'Серебристые равнины под далёкой Землёй.',image:'/assets/backgrounds/lunar.webp',preview:'/assets/backgrounds/lunar-preview.webp',category:'Космос'},
 {id:'saturn',name:'Кольца Сатурна',description:'Мягкий свет планеты и тонкие линии колец.',image:'/assets/backgrounds/saturn.webp',preview:'/assets/backgrounds/saturn-preview.webp',category:'Космос'},
 {id:'milky-way',name:'Млечный Путь',description:'Звёздная река над спокойным горизонтом.',image:'/assets/backgrounds/milky-way.webp',preview:'/assets/backgrounds/milky-way-preview.webp',category:'Космос'},
 {id:'mountains',name:'Горное озеро',description:'Спокойная вода и вершины в утренней дымке.',image:'/assets/backgrounds/mountains.webp',preview:'/assets/backgrounds/mountains-preview.webp',category:'Природа'},
 {id:'forest',name:'Лес в тумане',description:'Хвойные холмы и мягкий утренний свет.',image:'/assets/backgrounds/forest.webp',preview:'/assets/backgrounds/forest-preview.webp',category:'Природа'},
 {id:'aurora',name:'Северное сияние',description:'Световые ленты над заснеженной долиной.',image:'/assets/backgrounds/aurora.webp',preview:'/assets/backgrounds/aurora-preview.webp',category:'Природа'},
 {id:'ocean',name:'Тихий океан',description:'Плавные волны и светлая линия горизонта.',image:'/assets/backgrounds/ocean.webp',preview:'/assets/backgrounds/ocean-preview.webp',category:'Природа'},
 {id:'dunes',name:'Песчаные дюны',description:'Мягкие изгибы песка и прохладные тени.',image:'/assets/backgrounds/dunes.webp',preview:'/assets/backgrounds/dunes-preview.webp',category:'Природа'},
] as const;

export type Background = typeof BACKGROUNDS[number]['id'];
export const BACKGROUND_KEY = 'rassvet-background-v1';
export const BACKGROUND_EVENT = 'rassvet-background-change';
export function resolveBackground(value:unknown):Background {
 return BACKGROUNDS.some(background=>background.id===value)?value as Background:'none';
}

// Restore only bundled, approved images, before the initial paint. Never use a stored URL.
const images=Object.fromEntries(BACKGROUNDS.map(background=>[background.id,background.image]));
export const BACKGROUND_BOOTSTRAP=`(()=>{var images=${JSON.stringify(images)},choice='none';try{var saved=localStorage.getItem(${JSON.stringify(BACKGROUND_KEY)});if(Object.prototype.hasOwnProperty.call(images,saved))choice=saved}catch(e){}var root=document.documentElement;root.dataset.background=choice;if(images[choice])root.style.setProperty('--app-wallpaper','url("'+images[choice]+'")');else root.style.removeProperty('--app-wallpaper')})()`;
