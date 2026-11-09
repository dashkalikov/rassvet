import Link from 'next/link';
import {ArrowLeft,ArrowUpRight,Compass} from 'lucide-react';
export default function NotFound(){return <main id="main" className="not-found"><Compass size={50}/><span className="eyebrow">404 / ВНЕ МАРШРУТА</span><h1>Здесь пока нет сигнала.</h1><p>Страница не найдена или заявка недоступна вашему аккаунту.</p><div className="card-actions"><Link href="/" className="button primary"><ArrowLeft size={18}/>На главную</Link><Link href="/account/orders" className="button outline">Мои заявки <ArrowUpRight size={18}/></Link></div></main>;}
