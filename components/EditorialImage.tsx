import {EDITORIAL_IMAGES, type EditorialImageId} from '../lib/editorial-images';

export default function EditorialImage({image, className, alt, sizes = '(max-width: 760px) 100vw, 50vw', loading = 'lazy'}: {
  image: EditorialImageId;
  className?: string;
  alt?: string;
  sizes?: string;
  loading?: 'lazy' | 'eager';
}) {
  const base = `/assets/editorial/${image}`;
  return <img className={className} data-image-section={EDITORIAL_IMAGES[image].section} src={`${base}.webp`} srcSet={`${base}-900.webp 900w, ${base}.webp 1500w`} sizes={sizes} width={1500} height={1000} alt={alt ?? EDITORIAL_IMAGES[image].alt} loading={loading} decoding="async"/>;
}
