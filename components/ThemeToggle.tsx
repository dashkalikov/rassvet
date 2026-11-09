'use client';
import MaterialIcon from './MaterialIcon';
import {appearanceMode,oppositeAppearance} from '../lib/appearance';
import {setAppearance,useAppearance} from '../lib/use-appearance';
export default function ThemeToggle(){
  const theme=useAppearance(),dark=appearanceMode(theme)==='dark';
  return <button type="button" className="theme-toggle icon-button" onClick={()=>setAppearance(oppositeAppearance(theme))} aria-label={dark?'Включить светлую тему':'Включить тёмную тему'} title={dark?'Светлая тема':'Тёмная тема'}><MaterialIcon name="light_mode" className="theme-sun" size={19}/><MaterialIcon name="dark_mode" className="theme-moon" size={19}/></button>;
}
