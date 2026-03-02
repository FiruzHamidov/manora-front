'use client';

import {
  FC,
  MouseEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import Link from 'next/link';
import useEmblaCarousel from 'embla-carousel-react';
import { Phone } from 'lucide-react';
import VerifiedIcon from '@/icons/Verified';
import { resolveMediaUrl } from '@/constants/base-url';
import { NewBuildingCardProps } from './types';
import FallbackImage from '@/app/_components/FallbackImage';
import FavoriteButton from '@/ui-components/favorite-button/favorite-button';

const NewBuildingCard: FC<NewBuildingCardProps> = ({
  id,
  slug,
  source = 'local',
  title,
  image,
  apartmentOptions,
  location,
  developer,
  hasInstallmentOption = false,
  stageName,
  className = '',
  onClick,
  photos = [],
}) => {
  const href = slug ? `/new-buildings/${slug}` : `/new-buildings/${id}`;

  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const [selectedIndex, setSelectedIndex] = useState(0);

  const hoverCooldownRef = useRef<number>(0);
  const hoverDwellRef = useRef<number | null>(null);
  const hoverLockedRef = useRef<boolean>(false);

  const HOVER_COOLDOWN_MS = 220;
  const HOVER_DWELL_MS = 90;

  const scrollTo = useCallback(
    (index: number) => emblaApi && emblaApi.scrollTo(index),
    [emblaApi]
  );

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
    hoverLockedRef.current = false;
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on('select', onSelect);
    window.requestAnimationFrame(onSelect);
    return () => {
      emblaApi.off('select', onSelect);
    };
  }, [emblaApi, onSelect]);

  const handleHoverMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!emblaApi || displayImages.length <= 1) return;
    if (hoverLockedRef.current) return;

    const el = e.currentTarget as HTMLDivElement;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;

    const zones = displayImages.length;
    const zoneWidth = rect.width / Math.max(1, zones);
    let zoneIndex = Math.floor(x / zoneWidth);
    if (zoneIndex < 0) zoneIndex = 0;
    if (zoneIndex > zones - 1) zoneIndex = zones - 1;

    if (zoneIndex === selectedIndex) {
      if (hoverDwellRef.current) {
        window.clearTimeout(hoverDwellRef.current);
        hoverDwellRef.current = null;
      }
      return;
    }

    const direction = zoneIndex > selectedIndex ? 1 : -1;
    const targetIndex = selectedIndex + direction;
    if (targetIndex < 0 || targetIndex > displayImages.length - 1) return;

    const now = Date.now();
    if (now - hoverCooldownRef.current >= HOVER_COOLDOWN_MS) {
      hoverLockedRef.current = true;
      scrollTo(targetIndex);
      hoverCooldownRef.current = now;
      if (hoverDwellRef.current) {
        window.clearTimeout(hoverDwellRef.current);
        hoverDwellRef.current = null;
      }
      return;
    }

    if (hoverDwellRef.current) return;
    hoverLockedRef.current = true;
    hoverDwellRef.current = window.setTimeout(() => {
      scrollTo(targetIndex);
      hoverCooldownRef.current = Date.now();
      hoverDwellRef.current = null;
    }, HOVER_DWELL_MS);
  };

  const handleHoverLeave = () => {
    if (hoverDwellRef.current) {
      window.clearTimeout(hoverDwellRef.current);
      hoverDwellRef.current = null;
    }
    hoverCooldownRef.current = 0;
    hoverLockedRef.current = false;
  };

  const displayImages =
    photos && photos.length > 0
      ? photos.map((photo, index) => {
          const rawPath = photo.path || photo.url;
          const url = resolveMediaUrl(rawPath);
          return {
            url,
            alt: `${title} - фото ${index + 1}`,
          };
        })
      : [{ url: image.src, alt: image.alt }];

  const formatPrice = (value: number, currency?: string): string => {
    const amount = Number(value || 0).toLocaleString('ru-RU');
    return `${amount} ${String(currency || 'TJS').toLowerCase()}`;
  };

  const stageLabel = stageName?.trim();
  const isDoneStage = Boolean(stageLabel && /сдан/i.test(stageLabel));

  return (
    <article
      className={`rounded-[14px] border border-[#E2E8F0] bg-white p-2 shadow-[0_2px_10px_rgba(15,23,42,0.06)] ${className}`}
      onClick={onClick}
    >
      <div className="relative mb-2">
        <div
          className="overflow-hidden rounded-[12px]"
          ref={emblaRef}
          onMouseMove={handleHoverMove}
          onMouseLeave={handleHoverLeave}
        >
          <div className="flex">
            {displayImages.map((img, index) => (
              <div className="min-w-full" key={`${img.url}-${index}`}>
                <Link href={href}>
                  <div className="relative aspect-[16/11] w-full overflow-hidden">
                    <FallbackImage
                      src={img.url}
                      alt={img.alt}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </div>

        <div className="absolute left-2 top-2 flex flex-col gap-1">
          {hasInstallmentOption && (
            <span className="rounded-full bg-[#FACC15] px-2.5 py-0.5 text-[10px] font-bold text-[#111827]">
              Ипотека
            </span>
          )}
          {stageLabel && (
            <span
              className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold text-white ${
                isDoneStage ? 'bg-[#16A34A]' : 'bg-[#F59E0B]'
              }`}
            >
              {stageLabel}
            </span>
          )}
        </div>

        <FavoriteButton
          propertyId={id}
          source={source}
          listingType="new-buildings"
          className="absolute right-2 top-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-sm"
          activeClassName="bg-black/45 ring-1 ring-[#0B5DFF]"
          iconClassName="h-[14px] w-[14px] text-white"
          activeIconClassName="h-[14px] w-[14px] stroke-white fill-[#0B5DFF] text-white opacity-100 scale-110"
        />

        {displayImages.length > 1 && (
          <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1">
            {displayImages.map((_, index) => (
              <button
                key={index}
                className={`h-1.5 w-1.5 rounded-full bg-white transition-opacity ${
                  index === selectedIndex ? 'opacity-95' : 'opacity-50'
                }`}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  scrollTo(index);
                }}
                aria-label={`Перейти к слайду ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      <div>
        <Link href={href}>
          <h3 className="line-clamp-1 text-[20px] leading-tight font-extrabold md:text-[22px] text-[#111827]">
            {title}
          </h3>
        </Link>
        <p className="mt-1 line-clamp-1 text-[13px] text-[#64748B] md:text-[14px]">{location}</p>

        <div className="mt-2 space-y-1">
          {apartmentOptions.length > 0 ? (
            apartmentOptions.slice(0, 3).map((option, index) => (
              <div
                key={`${option.rooms}-${option.area}-${index}`}
                className="flex items-center justify-between text-[13px] md:text-[14px]"
              >
                <p className="text-[#64748B]">
                  {option.rooms} комнатные&nbsp;&nbsp;от {option.area}м²
                </p>
                <p className="font-medium text-[#64748B]">
                  от {formatPrice(option.price, option.currency)}
                </p>
              </div>
            ))
          ) : (
            <p className="text-[13px] text-[#94A3B8]">Планировки скоро появятся</p>
          )}
        </div>

        <div className="mt-2 flex items-center gap-1">
          <Link href={`/developers/${developer.id}`} className="text-[15px] font-bold text-[#0036A5]">
            {developer.name}
          </Link>
          <VerifiedIcon className="h-4 w-4 text-[#0036A5]" />
        </div>

        <div className="mt-2 grid grid-cols-[1fr_auto] gap-1.5 md:grid-cols-2">
          <Link
            href={href}
            className="flex h-9 items-center justify-center rounded-lg border border-[#D6DEE8] text-[12px] font-semibold text-[#111827]"
          >
            Консультация
          </Link>
          <a
            href={developer.phone ? `tel:${developer.phone}` : href}
            className="flex h-9 w-9 items-center justify-center gap-0 rounded-lg bg-[#0036A5] text-[12px] font-semibold text-white md:w-auto md:gap-1.5"
          >
            <Phone size={13} />
            <span className="hidden md:inline">Позвонить</span>
          </a>
        </div>
      </div>
    </article>
  );
};

export default NewBuildingCard;
