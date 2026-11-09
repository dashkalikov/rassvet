'use client';
import Link from 'next/link';
import {usePathname} from 'next/navigation';
import {EQUIPMENT_LINKS} from '../lib/site-navigation';
export default function SectionNav(){const pathname=usePathname();return <nav className="section-navigation" aria-label="Разделы оборудования"><div className="container">{EQUIPMENT_LINKS.map(link=><Link key={link.href} href={link.href} aria-current={pathname===link.href?'page':undefined}>{link.title}</Link>)}</div></nav>;}
