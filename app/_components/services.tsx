'use client';

import { FC, useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import useEmblaCarousel from 'embla-carousel-react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ServiceItem {
  title: string;
  description?: string;
  imageUrl: string;
  altText: string;
  href: string;
}

const servicesData: ServiceItem[] = [
  {
    title: 'Срочный выкуп',
    imageUrl: '/images/extra-pages/buy-real-estate.png',
    altText: 'Illustration of a house real estat',
    href: '/buy-property',
  },
  {
    title: 'Ипотека',
    imageUrl: '/images/services/calculator.png',
    altText: 'Illustration of a calculator next to a house model',
    href: '/mortgage',
  },
  {
    title: 'Ремонт под ключ',
    imageUrl: '/images/services/renovation.png',
    altText: 'Illustration of a house being renovated',
    href: '/repair',
  },
  {
    title: 'Дизайнерские услуги',
    imageUrl: '/images/services/design.png',
    altText: 'Illustration of a modern living room interior design',
    href: '/design',
  },
  {
    title: 'Клининговые услуги',
    imageUrl: '/images/services/cleaning.png',
    altText: 'Illustration of cleaning supplies like mop and bucket',
    href: '/cleaning',
  },
  {
    title: 'Оформление документов',
    imageUrl: '/images/services/documents.png',
    altText: 'Illustration of document folders',
    href: '/document-registration',
  },

];

const Services: FC<{ variant?: 'grid' | 'carousel' }> = ({ variant = 'grid' }) => {
  const [emblaRef, emblaApi] = useEmblaCarousel({ align: 'start', loop: false });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([]);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    const snaps = emblaApi.scrollSnapList();
    const nextIndex = emblaApi.selectedScrollSnap();
    setScrollSnaps(snaps);
    setSelectedIndex(Math.min(nextIndex, Math.max(0, snaps.length - 1)));
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
    return () => {
      emblaApi.off('select', onSelect);
      emblaApi.off('reInit', onSelect);
    };
  }, [emblaApi, onSelect]);

  const cardClassName =
    'relative flex flex-col bg-[#EFF6FF] rounded-[22px] p-5 transition-all duration-300 ease-in-out md:hover:shadow-md md:hover:-translate-y-1';

  if (variant === 'carousel') {
    return (
      <div className="bg-white rounded-[22px] py-6 md:py-[55px]">
        <div className="px-4 md:px-10 mb-4 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => emblaApi?.scrollPrev()}
            disabled={!canScrollPrev}
            className="h-10 w-10 rounded-full border border-[#D7E3FF] bg-white text-[#0036A5] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center"
            aria-label="Предыдущие услуги"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => emblaApi?.scrollNext()}
            disabled={!canScrollNext}
            className="h-10 w-10 rounded-full border border-[#D7E3FF] bg-white text-[#0036A5] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center"
            aria-label="Следующие услуги"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-hidden px-4 md:px-10" ref={emblaRef}>
          <div className="flex -ml-4">
            {servicesData.map((service) => (
              <div
                key={service.href}
                className="pl-4 flex-[0_0_85%] sm:flex-[0_0_50%] lg:flex-[0_0_33.3333%] 2xl:flex-[0_0_25%]"
              >
                <Link href={service.href} className={`${cardClassName} h-[150px] md:h-[180px]`}>
                  <div className="max-w-[220px]">
                    <h3 className="text-[15px] md:text-[17px] md:leading-5 font-semibold text-[#020617]">
                      {service.title}
                    </h3>
                  </div>
                  <div className="absolute right-0 bottom-0 md:right-3 md:bottom-3">
                    <Image
                      width={120}
                      height={120}
                      src={service.imageUrl}
                      alt={service.altText}
                      className="w-[88px] h-[88px] md:w-[120px] md:h-[120px] object-contain"
                    />
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-5 flex items-center justify-center gap-2">
          {scrollSnaps.map((_, index) => (
            <button
              key={`service-dot-${index}`}
              type="button"
              onClick={() => emblaApi?.scrollTo(index)}
              className={`h-2.5 rounded-full transition-all ${
                index === selectedIndex ? 'w-6 bg-[#0036A5]' : 'w-2.5 bg-[#CBD5E1]'
              }`}
              aria-label={`Перейти к слайду ${index + 1}`}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[22px] py-6 md:py-[55px]">
      <div className="px-4 md:px-10">
        <div className="grid grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4 md:gap-8">
          {servicesData.map((service) => (
            <Link
              key={service.href}
              href={service.href}
              className={`${cardClassName} h-[140px] md:h-[180px]`}
            >
              <div className="max-w-[220px] md:max-w-[180px]">
                <h3 className="text-[13px] md:text-[17px] md:leading-5 font-semibold text-[#020617]">
                  {service.title}
                </h3>
              </div>

              <div className="absolute right-0 bottom-0 md:right-3 md:bottom-3">
                <Image
                  width={120}
                  height={120}
                  src={service.imageUrl}
                  alt={service.altText}
                  className="w-[78px] h-[78px] md:w-[120px] md:h-[120px] object-contain"
                />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Services;
