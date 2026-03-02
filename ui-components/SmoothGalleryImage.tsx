'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';

type SmoothGalleryImageProps = {
  src: string;
  alt: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
  containerClassName?: string;
};

export default function SmoothGalleryImage({
  src,
  alt,
  className = 'object-cover',
  sizes = '100vw',
  priority = false,
  containerClassName = '',
}: SmoothGalleryImageProps) {
  const [currentSrc, setCurrentSrc] = useState(src);
  const [previousSrc, setPreviousSrc] = useState<string | null>(null);
  const [isFading, setIsFading] = useState(false);
  const timeoutRef = useRef<number | null>(null);
  const currentIsRemote = /^https?:\/\//i.test(currentSrc);
  const previousIsRemote = previousSrc ? /^https?:\/\//i.test(previousSrc) : false;

  useEffect(() => {
    if (src === currentSrc) return;

    setPreviousSrc(currentSrc);
    setCurrentSrc(src);
    setIsFading(true);

    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = window.setTimeout(() => {
      setPreviousSrc(null);
      setIsFading(false);
      timeoutRef.current = null;
    }, 320);
  }, [src, currentSrc]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <div className={`relative h-full w-full overflow-hidden ${containerClassName}`}>
      {previousSrc ? (
        <Image
          src={previousSrc}
          alt={alt}
          fill
          className={`${className} transition-opacity duration-300 ease-out ${isFading ? 'opacity-0' : 'opacity-100'}`}
          sizes={sizes}
          unoptimized={previousIsRemote}
        />
      ) : null}
      <Image
        src={currentSrc}
        alt={alt}
        fill
        className={`${className} transition-opacity duration-300 ease-out ${isFading ? 'opacity-100' : 'opacity-100'}`}
        sizes={sizes}
        priority={priority}
        unoptimized={currentIsRemote}
      />
    </div>
  );
}
