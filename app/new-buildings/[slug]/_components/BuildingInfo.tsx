'use client';

import { FC, useEffect, useMemo, useRef, useState } from 'react';
import PhotoGalleryModal from '@/ui-components/PhotoGalleryModal';
import SmoothGalleryImage from '@/ui-components/SmoothGalleryImage';
import type {
  NewBuilding,
  NewBuildingPhoto,
  NewBuildingStats,
} from '@/services/new-buildings/types';
import { resolveMediaUrl } from '@/constants/base-url';
import {
  Building2,
  CalendarDays,
  ChevronDown,
  Copy,
  MapPin,
  MessageCircle,
  Send,
} from 'lucide-react';
import { toast } from 'react-toastify';

interface BuildingInfoProps {
  building: NewBuilding;
  photos: NewBuildingPhoto[];
  stats?: NewBuildingStats;
}

const formatCompletionLabel = (dateStr?: string | null) => {
  if (!dateStr) return 'Уточняется';
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return 'Уточняется';
  return `${date.toLocaleString('ru-RU', { month: 'short' })} ${date.getFullYear()}`;
};

const formatDateLong = (dateStr?: string | null) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

export const BuildingInfo: FC<BuildingInfoProps> = ({ building, photos, stats }) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isShareMenuOpen, setIsShareMenuOpen] = useState(false);
  const shareMenuRef = useRef<HTMLDivElement | null>(null);

  const displayImages = useMemo(
    () =>
      photos.length > 0
        ? [...photos]
            .sort(
              (a, b) =>
                (a.sort_order || a.order || 0) - (b.sort_order || b.order || 0)
            )
            .map((photo) => resolveMediaUrl(photo.path || photo.url))
        : ['/images/no-image.png'],
    [photos]
  );

  const shareUrl =
    typeof window !== 'undefined'
      ? window.location.href
      : `https://manora.tj/new-buildings/${building.id}`;
  const title = building.title || 'Новостройка';
  const telegramShareUrl = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(title)}`;
  const whatsappShareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(`${title} - ${shareUrl}`)}`;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (shareMenuRef.current && !shareMenuRef.current.contains(event.target as Node)) {
        setIsShareMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success('Ссылка скопирована');
      setIsShareMenuOpen(false);
    } catch {
      toast.error('Не удалось скопировать ссылку');
    }
  };

  const infoCards = [
    {
      icon: <Building2 className="h-4 w-4 text-[#0036A5]" />,
      label: 'Стадия строительства',
      value: building.stage?.name || 'Уточняется',
    },
    {
      icon: <Building2 className="h-4 w-4 text-[#0036A5]" />,
      label: 'Квартиры на продажу',
      value: `${building.units?.length || 0} шт`,
    },
    {
      icon: <CalendarDays className="h-4 w-4 text-[#0036A5]" />,
      label: 'Срок сдачи',
      value: formatCompletionLabel(building.completion_at),
    },
  ];

  return (
    <div className="space-y-5">
      <section className="relative overflow-hidden rounded-[28px] bg-[#111827] text-white">
        <div className="absolute inset-0">
          <SmoothGalleryImage
            src={displayImages[selectedIndex]}
            alt={building.title}
            className="object-cover"
            sizes="100vw"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/68 via-black/46 to-black/28" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/52 via-transparent to-transparent" />
        </div>

        <div className="relative flex min-h-[260px] flex-col justify-between px-5 py-5 md:min-h-[380px] md:px-8 md:py-7">
          <div className="flex flex-wrap justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/28 px-4 py-2 text-sm font-medium backdrop-blur-md"
            >
              Смотреть фото
            </button>

            <div className="relative" ref={shareMenuRef}>
              <button
                type="button"
                onClick={() => setIsShareMenuOpen((prev) => !prev)}
                className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/28 px-4 py-2 text-sm font-medium backdrop-blur-md"
              >
                Поделиться
                <ChevronDown className={`h-4 w-4 transition-transform ${isShareMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {isShareMenuOpen && (
                <div className="absolute right-0 top-full z-20 mt-2 w-56 overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white p-2 text-[#0F172A] shadow-[0_18px_50px_rgba(15,23,42,0.18)]">
                  <a
                    href={telegramShareUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm hover:bg-[#F8FAFC]"
                  >
                    <Send className="h-4 w-4 text-sky-500" />
                    Telegram
                  </a>
                  <a
                    href={whatsappShareUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm hover:bg-[#F8FAFC]"
                  >
                    <MessageCircle className="h-4 w-4 text-green-500" />
                    WhatsApp
                  </a>
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm hover:bg-[#F8FAFC]"
                  >
                    <Copy className="h-4 w-4 text-[#64748B]" />
                    Копировать ссылку
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="max-w-3xl">
            <h1 className="text-[28px] font-extrabold leading-tight md:text-[46px]">
              {building.title}
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-white/82 md:text-base">
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-[#60A5FA]" />
                {building.address || building.district || 'г. Душанбе'}
              </span>
              {formatDateLong(building.created_at) ? (
                <span>Добавлено {formatDateLong(building.created_at)}</span>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      {displayImages.length > 1 ? (
        <section className="rounded-[26px] bg-white p-4 shadow-[0_2px_20px_rgba(15,23,42,0.05)]">
          <div className="grid grid-cols-4 gap-3 md:grid-cols-5">
            {displayImages.slice(0, 10).map((image, index) => (
              <button
                key={`${image}-${index}`}
                type="button"
                onClick={() => setSelectedIndex(index)}
                className={`relative aspect-[4/3] overflow-hidden rounded-2xl border-2 transition ${
                  selectedIndex === index
                    ? 'border-[#0036A5] shadow-[0_6px_18px_rgba(0,54,165,0.16)]'
                    : 'border-transparent hover:border-[#BFDBFE]'
                }`}
              >
                <SmoothGalleryImage
                  src={image}
                  alt={`${building.title} ${index + 1}`}
                  className="object-cover"
                  sizes="(max-width: 768px) 25vw, 180px"
                />
              </button>
            ))}
          </div>
        </section>
      ) : null}

      <section className="rounded-[26px] bg-white p-4 shadow-[0_2px_20px_rgba(15,23,42,0.05)] md:p-6">
        <h2 className="text-[28px] font-extrabold text-[#111827]">Информация о ЖК</h2>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {infoCards.map((item) => (
            <div key={item.label} className="rounded-2xl bg-[#F8FAFC] px-4 py-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#111827]">
                {item.icon}
                {item.label}
              </div>
              <div className="mt-2 text-[15px] text-[#475569]">{item.value}</div>
            </div>
          ))}
        </div>
      </section>

      {building.features && building.features.length > 0 ? (
        <section className="rounded-[26px] bg-white p-4 shadow-[0_2px_20px_rgba(15,23,42,0.05)] md:p-6">
          <h2 className="text-[28px] font-extrabold text-[#111827]">Особенности недвижимости</h2>
          <div className="mt-5 grid gap-y-3 md:grid-cols-2 lg:grid-cols-3">
            {building.features.map((feature) => (
              <div key={feature.id} className="flex items-center gap-2 text-[15px] text-[#334155]">
                <span className="h-2 w-2 rounded-full bg-[#0036A5]" />
                {feature.name}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {building.description ? (
        <section className="rounded-[26px] bg-white p-4 shadow-[0_2px_20px_rgba(15,23,42,0.05)] md:p-6">
          <h2 className="text-[28px] font-extrabold text-[#111827]">О жилом комплексе</h2>
          <div className="mt-4 whitespace-pre-line text-[15px] leading-7 text-[#475569]">
            {building.description}
          </div>

          {(stats?.total_price?.formatted || stats?.price_per_sqm?.formatted) ? (
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {stats?.total_price?.formatted ? (
                <div className="rounded-2xl bg-[#F8FAFC] px-4 py-4">
                  <div className="text-sm text-[#64748B]">Диапазон цен</div>
                  <div className="mt-1 text-lg font-bold text-[#0036A5]">
                    {stats.total_price.formatted}
                  </div>
                </div>
              ) : null}
              {stats?.price_per_sqm?.formatted ? (
                <div className="rounded-2xl bg-[#F8FAFC] px-4 py-4">
                  <div className="text-sm text-[#64748B]">Цена за м²</div>
                  <div className="mt-1 text-lg font-bold text-[#0036A5]">
                    {stats.price_per_sqm.formatted}
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}
        </section>
      ) : null}

      <PhotoGalleryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        photos={displayImages}
        initialIndex={selectedIndex}
      />
    </div>
  );
};
