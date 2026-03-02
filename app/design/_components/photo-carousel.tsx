'use client';

import Image from 'next/image';
import useEmblaCarousel from 'embla-carousel-react';
import { useCallback } from 'react';

const images = [
  '/images/extra-pages/design-slide-1.jpg',
  '/images/extra-pages/design-slide-2.jpg',
  '/images/extra-pages/design-slide-3.jpg',
  '/images/extra-pages/design-slide-2.jpg',
  '/images/extra-pages/design-slide-1.jpg',
];

export const PhotoCarousel = () => {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'start',
    containScroll: 'trimSnaps',
    slidesToScroll: 1,
    skipSnaps: false,
  });

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  return (
    <div className="mb-6 lg:mb-10">
      <div className="mx-auto w-full max-w-[1520px] px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 lg:mb-11 gap-4 px-4 lg:px-0">
          <div className="text-2xl lg:text-[32px] font-bold">
            Фото наших работ
          </div>
          <div className="flex items-center gap-3 lg:gap-4">
            <button
              onClick={scrollPrev}
              className="rounded-full bg-white w-12 h-12 lg:w-16 lg:h-16 flex items-center justify-center cursor-pointer shadow-sm"
            >
              <svg
                className="w-5 h-5 lg:w-6 lg:h-6 text-[#0036A5]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <button
              onClick={scrollNext}
              className="rounded-full bg-white w-12 h-12 lg:w-16 lg:h-16 flex items-center justify-center cursor-pointer shadow-sm"
            >
              <svg
                className="w-5 h-5 lg:w-6 lg:h-6 text-[#0036A5]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div className="embla overflow-hidden" ref={emblaRef}>
        <div className="embla__mx-auto w-full max-w-[1520px] px-4 sm:px-6 lg:px-8 flex gap-3 lg:gap-5 pl-4 lg:pl-[calc((100vw-1400px)/2)] pr-4 lg:pr-[calc((100vw-1400px)/2)]">
          {images.map((image, index) => (
            <div
              key={index}
              className="embla__slide flex-none bg-white p-4 lg:px-9 lg:py-[43px] rounded-[22px]"
            >
              <Image
                src={image}
                alt={`Design photo ${index + 1}`}
                width={448}
                height={624}
                className="rounded-lg object-cover w-[280px] h-[350px] lg:w-[448px] lg:h-[624px]"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
