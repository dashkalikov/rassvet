'use client';
import {Check,ImageOff,Images,SunMoon} from 'lucide-react';
import {BACKGROUNDS} from '../lib/backgrounds';
import {setBackground,useBackground} from '../lib/use-background';

export default function BackgroundPicker() {
 const selected=useBackground();
 const current=BACKGROUNDS.find(background=>background.id===selected)!;
 return <section className="account-panel background-settings-panel">
  <div className="settings-panel-heading"><Images size={25}/><div><h2>Фон приложения</h2><p>Космос, природа или привычное оформление без изображения.</p></div></div>
  <div className="background-options" role="group" aria-label="Фон приложения">
   {BACKGROUNDS.map(background=><button key={background.id} type="button" aria-pressed={selected===background.id} onClick={()=>setBackground(background.id)}>
    <span className={`background-preview${background.image?'':' background-preview-plain'}`} aria-hidden="true">
     {background.preview?<img src={background.preview} alt="" width={480} height={270} loading="lazy" decoding="async"/>:<ImageOff size={32}/>}
     <span className="background-choice-mark">{selected===background.id&&<Check size={20}/>}</span>
    </span>
    <span className="background-option-name">{background.name}</span>
    <span className="background-option-description">{background.description}</span>
    <span className="background-option-category">{background.category}</span>
   </button>)}
  </div>
  <p className="background-selection-status" role="status" aria-live="polite"><Check size={20}/>Выбрано: {current.name}</p>
  <p className="background-settings-note"><SunMoon size={21}/><span>Яркость фона подстраивается под светлую и тёмную тему. Панели сохраняют контраст, а фотографии разделов остаются на своих местах. Выбор сохраняется в этом браузере.</span></p>
 </section>;
}
