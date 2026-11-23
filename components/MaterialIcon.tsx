import type {MaterialIconName} from '../lib/material-icons';
import {ArrowLeftRight,ArrowRight,ArrowUpRight,BookOpen,Building2,Check,ChevronDown,ChevronRight,Compass,FileText,Gauge,Globe2,Headset,House,Mail,MapPin,Menu,Moon,Package,Router,Satellite,Search,Settings,ShieldCheck,Sun,UserRound,Wifi,Wrench,X,Zap,type LucideIcon} from 'lucide-react';

// Keep existing semantic names while rendering one consistent inline SVG family.
const icons:Record<MaterialIconName,LucideIcon>={
 apartment:Building2,arrow_forward:ArrowRight,arrow_outward:ArrowUpRight,bolt:Zap,book:BookOpen,
 check:Check,chevron_right:ChevronRight,close:X,compare_arrows:ArrowLeftRight,construction:Wrench,
 dark_mode:Moon,description:FileText,expand_more:ChevronDown,home:House,inventory_2:Package,
 light_mode:Sun,location_on:MapPin,mail:Mail,menu:Menu,person:UserRound,public:Globe2,
 router:Router,satellite_alt:Satellite,search:Search,settings:Settings,speed:Gauge,
 support_agent:Headset,travel_explore:Compass,verified_user:ShieldCheck,wifi:Wifi,
};
export default function MaterialIcon({name,size=24,className=''}:{name:MaterialIconName;size?:number;className?:string}){
 const Icon=icons[name];
 return <Icon className={`material-icon ${className}`} size={size} strokeWidth={2} aria-hidden="true" focusable="false"/>;
}
