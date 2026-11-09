import type {MaterialIconName} from './material-icons';
import {SCENARIO_IMAGES,type EditorialImageId} from './editorial-images.ts';
type Visual={icon:MaterialIconName;image?:string};
const photo=(image:EditorialImageId)=>`/assets/editorial/${image}-900.webp`;
export const SECTION_ICONS:Record<string,MaterialIconName>={home:'home',plans:'satellite_alt',equipment:'router',coverage:'public',speedtest:'speed',technology:'satellite_alt',support:'support_agent'};
const VISUALS:Record<string,Visual>={
 '/plans':{icon:'satellite_alt'},
 '/equipment':{icon:'router'},'/account':{icon:'person'},
 '/plans/home':{icon:'home',image:photo(SCENARIO_IMAGES.home)},
 '/plans/travel':{icon:'travel_explore',image:photo(SCENARIO_IMAGES.travel)},
 '/plans/business':{icon:'apartment',image:photo(SCENARIO_IMAGES.business)},
 '/plans#compare':{icon:'compare_arrows'},'/plans#calculator':{icon:'settings'},
 '/equipment/mini':{icon:'travel_explore',image:'/assets/equipment/mini.webp'},
 '/equipment/standard':{icon:'home',image:'/assets/equipment/standard.webp'},
 '/equipment/pro':{icon:'apartment',image:'/assets/equipment/pro.webp'},
 '/equipment/mobility':{icon:'travel_explore',image:'/assets/equipment/mobility.webp'},
 '/equipment/configure':{icon:'settings'},'/equipment/bundles':{icon:'inventory_2'},
 '/equipment/compare':{icon:'compare_arrows'},'/equipment/accessories':{icon:'router'},'/equipment/installation':{icon:'construction'},
 '/coverage':{icon:'location_on',image:photo('coverage-address')},'/coverage#regions':{icon:'public',image:photo('remote')},'/connect':{icon:'satellite_alt',image:photo('onboarding')},
 '/speedtest':{icon:'speed',image:photo('speed-live')},'/speedtest#compare':{icon:'compare_arrows',image:photo('speed-models')},'/speedtest#history':{icon:'description',image:photo('speed-history')},
 '/technology':{icon:'satellite_alt',image:photo('satellite')},'/orbit':{icon:'public'},'/guides':{icon:'book',image:photo('guides-desk')},'/privacy':{icon:'verified_user',image:photo('privacy')},
 '/support':{icon:'support_agent',image:photo('support')},'/support#contact':{icon:'mail',image:photo('contact')},'/account/support':{icon:'support_agent',image:photo('correspondence')},'/account/orders':{icon:'description',image:photo('orders')},
};
export function navigationVisual(href:string):Visual{return VISUALS[href]??{icon:'arrow_forward'};}
