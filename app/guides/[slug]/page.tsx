import {notFound} from 'next/navigation';
import SiteFrame from '../../../components/SiteFrame';
import {GuideArticle} from '../../../components/GuidesPage';
import {GUIDES} from '../../../lib/guides';
import {publicUser} from '../../../lib/public-user';
export const dynamic='force-dynamic';
export async function generateMetadata({params}:{params:Promise<{slug:string}>}){const {slug}=await params;return {title:(GUIDES.find(g=>g.slug===slug)?.title??'Руководство')+' — РАССВЕТ'};}
export default async function Page({params}:{params:Promise<{slug:string}>}){const {slug}=await params;if(!GUIDES.some(g=>g.slug===slug))notFound();return <SiteFrame user={await publicUser()}><GuideArticle slug={slug}/></SiteFrame>;}
