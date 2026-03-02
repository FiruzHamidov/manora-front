'use client';

import {
  SyntheticEvent,
  useEffect,
  useMemo,
  useState,
} from 'react';
import Image, { ImageProps } from 'next/image';

type FallbackImageProps = ImageProps & {
  fallbackSrc?: string;
};

const DEFAULT_FALLBACK = '/images/no-image.png';

const normalizeSrc = (src: string): string =>
  src.replace('/storage/storage/', '/storage/');

const isRemoteSrc = (src: ImageProps['src']): src is string =>
  typeof src === 'string' && /^https?:\/\//i.test(src);

export default function FallbackImage({
  src,
  fallbackSrc = DEFAULT_FALLBACK,
  onError,
  ...props
}: FallbackImageProps) {
  const normalizedInitialSrc = useMemo(() => {
    if (typeof src !== 'string') return src;
    return normalizeSrc(src);
  }, [src]);

  const [currentSrc, setCurrentSrc] = useState<typeof src>(normalizedInitialSrc);

  useEffect(() => {
    setCurrentSrc(normalizedInitialSrc);
  }, [normalizedInitialSrc]);

  const handleError = (event: SyntheticEvent<HTMLImageElement, Event>) => {
    if (typeof currentSrc !== 'string' || currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc);
    }
    onError?.(event);
  };

  return (
    <Image
      {...props}
      src={currentSrc}
      unoptimized={isRemoteSrc(currentSrc) || props.unoptimized}
      onError={handleError}
    />
  );
}
