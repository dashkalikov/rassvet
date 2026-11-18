'use client';
import ChoiceSelect from './ChoiceSelect';
import {CONNECTION_CITIES} from '../lib/connection-cities';
const options=[...CONNECTION_CITIES].sort((a,b)=>a.localeCompare(b,'ru')).map(city=>({value:city,label:city}));
export default function CityAddressPicker({address,onChange}:{address:string;onChange:(value:string)=>void}){
 const city=CONNECTION_CITIES.find(city=>address.toLowerCase().startsWith(city.toLowerCase()))??'';
 return <label className="connection-city-picker">Город · {CONNECTION_CITIES.length} вариантов<ChoiceSelect value={city} onValueChange={value=>onChange(value+(address.includes(',')?address.slice(address.indexOf(',')):', '))} options={options} placeholder="Выберите город или укажите адрес ниже" aria-label="Город подключения"/></label>;
}
