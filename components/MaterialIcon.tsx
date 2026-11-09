import type {MaterialIconName} from '../lib/material-icons';
export default function MaterialIcon({name,size=24,className=''}:{name:MaterialIconName;size?:number;className?:string}){
 return <svg className={`material-icon ${className}`} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" focusable="false"><use href={`/assets/icons/material-symbols.svg#${name}`} width="24" height="24"/></svg>;
}
