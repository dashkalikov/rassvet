'use client';
import {Check,Palette} from 'lucide-react';
import {APPEARANCES} from '../lib/appearance';
import {setAppearance,useAppearance} from '../lib/use-appearance';

export default function ThemePicker(){
 const selected=useAppearance();
 return <section className="account-panel theme-settings-panel"><div className="settings-panel-heading"><Palette size={25}/><div><h2>Ваше оформление</h2><p>Выберите настроение приложения. Тема применяется сразу.</p></div></div><div className="theme-options" role="group" aria-label="Тема приложения">{APPEARANCES.map(theme=><button key={theme.id} type="button" aria-pressed={selected===theme.id} onClick={()=>setAppearance(theme.id)}><span className="theme-preview" data-preview={theme.id} aria-hidden="true"><span className="theme-mini-header"><i/><i/></span><span className="theme-mini-sidebar"><i/><i/><i/></span><span className="theme-mini-content"><b/><i/><i/><span/></span></span><span className="theme-option-heading">{theme.name}<span>{selected===theme.id?<Check size={20}/>:theme.family}</span></span><span className="theme-option-description">{theme.description}</span></button>)}</div><p className="theme-settings-note">Матовые темы вдохновлены Light 2026 и Dark 2026 в VS Code. Выбор сохраняется в этом браузере и действует на всём сайте, включая орбитальную лабораторию.</p></section>;
}
