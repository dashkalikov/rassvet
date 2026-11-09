import OrbitExplorer from '../../components/OrbitExplorer';
import '../orbit.css';
export const metadata={title:'Орбиты и спутники — РАССВЕТ',description:'Локальная орбитальная лаборатория: глобус, трассы спутников, элементы TLE и OMM, история орбит.'};
export const dynamic='force-dynamic';
export default function Page(){return <OrbitExplorer/>;}
