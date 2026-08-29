import type { ImgHTMLAttributes } from 'react';
import { residentialImageAttributes, type ResponsiveMedia } from '@/services/new-buildings/media';

type Props = Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'srcSet' | 'sizes'> & {
  image: ResponsiveMedia; sizes: string; full?: boolean; priority?: boolean;
};

/** Native srcset keeps private and revocable media out of Next's public cache. */
export default function ResidentialImage({ image, sizes, full = false, priority = false, loading, alt, ...props }: Props) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img {...props} {...residentialImageAttributes(image, sizes, full)} alt={alt}
    width={props.width ?? image.width ?? undefined} height={props.height ?? image.height ?? undefined}
    loading={loading ?? (priority ? 'eager' : 'lazy')} fetchPriority={priority ? 'high' : 'auto'} decoding="async" referrerPolicy="no-referrer" />;
}
