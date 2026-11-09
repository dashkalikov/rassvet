import {useId} from 'react';
import {BRAND_VIEWBOX,BRAND_RAYS,BRAND_GRADIENT} from '../lib/brand-mark';

export default function BrandMark() {
  const gradientId=`rassvet-rays-${useId().replace(/[^a-zA-Z0-9_-]/g,'')}`;
  return <svg className="brand-mark" viewBox={BRAND_VIEWBOX} fill="none" aria-hidden="true">
    <defs><linearGradient id={gradientId} x1="35" y1="440" x2="420" y2="40" gradientUnits="userSpaceOnUse">{BRAND_GRADIENT.map(stop=><stop key={stop.offset} offset={stop.offset} stopColor={stop.color}/>)}</linearGradient></defs>
    <g fill={`url(#${gradientId})`}>{BRAND_RAYS.map(path=><path key={path} d={path}/>)}</g>
  </svg>;
}
