'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { Map, Placemark, YMaps } from '@pbe/react-yandex-maps';
import {
  Calendar1Icon,
  ChevronDown,
  Copy,
  MapPin,
  MessageCircle,
  Phone,
  Send,
  Share2,
} from 'lucide-react';
import type { Car } from '@/services/cars/types';
import FallbackImage from '@/app/_components/FallbackImage';
import PhotoGalleryModal from '@/ui-components/PhotoGalleryModal';
import SmoothGalleryImage from '@/ui-components/SmoothGalleryImage';
import UserIcon from '@/icons/UserIcon';
import { toast } from 'react-toastify';
import FavoriteButton from '@/ui-components/favorite-button/favorite-button';

function formatPrice(value?: string | number, currency?: string) {
  const amount = Number(value ?? 0).toLocaleString('ru-RU');
  void currency;
  return `${amount} с.`;
}

function getCarTitle(car: Car) {
  return car.title || `${car.brand?.name || ''} ${car.model?.name || ''}`.trim() || 'Автомобиль';
}

function getConditionLabel(condition?: Car['condition']) {
  if (condition === 'new') return 'Новый';
  if (condition === 'used') return 'С пробегом';
  return 'Не указано';
}

function getFuelLabel(fuel?: Car['fuel_type']) {
  const labels: Record<string, string> = {
    petrol: 'Бензин',
    diesel: 'Дизель',
    hybrid: 'Гибрид',
    electric: 'Электричество',
    gas: 'Газ',
    other: 'Другое',
  };
  return fuel ? labels[fuel] ?? fuel : 'Не указано';
}

function getTransmissionLabel(transmission?: Car['transmission']) {
  const labels: Record<string, string> = {
    manual: 'Механика',
    automatic: 'Автомат',
    robot: 'Робот',
    variator: 'Вариатор',
  };
  return transmission ? labels[transmission] ?? transmission : 'Не указано';
}

function getDriveLabel(drive?: Car['drive_type']) {
  const labels: Record<string, string> = {
    front: 'Передний',
    rear: 'Задний',
    all_wheel: 'Полный',
  };
  return drive ? labels[drive] ?? drive : 'Не указано';
}

const cardClassName = 'rounded-[18px] bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)]';

function timeAgo(dateString?: string) {
  if (!dateString) return 'Дата не указана';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return 'Дата не указана';
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'только что';
  if (minutes < 60) return `${minutes} мин назад`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ч назад`;
  const days = Math.floor(hours / 24);
  return `${days} дней назад`;
}

export default function CarDetailsWrapper({
  car,
  photos,
}: {
  car: Car;
  photos: string[];
}) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isShareMenuOpen, setIsShareMenuOpen] = useState(false);
  const shareMenuRef = useRef<HTMLDivElement | null>(null);

  const title = getCarTitle(car);
  const galleryPhotos = photos.length > 0 ? photos : ['/images/no-image.png'];
  const source = car.__source === 'aura' ? 'aura' : 'local';
  const coordinates = useMemo<[number, number] | null>(() => {
    const lat = Number(car.latitude);
    const lng = Number(car.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    return [lat, lng];
  }, [car.latitude, car.longitude]);

  const infoRows = [
    { label: 'Кузов', value: car.category?.name || 'Седан' },
    { label: 'Состояние', value: getConditionLabel(car.condition) },
    { label: 'Год выпуска', value: car.year || 'Не указан' },
    { label: 'Вид топлива', value: getFuelLabel(car.fuel_type) },
    { label: 'Цвет', value: 'Не указано' },
    { label: 'Растаможен в РТ', value: 'Не указано' },
    { label: 'Привод', value: getDriveLabel(car.drive_type) },
    { label: 'Коробка передач', value: getTransmissionLabel(car.transmission) },
  ];

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('Ссылка скопирована');
    } catch {
      toast.error('Не удалось скопировать ссылку');
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (shareMenuRef.current && !shareMenuRef.current.contains(event.target as Node)) {
        setIsShareMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const shareUrl =
    typeof window !== 'undefined'
      ? window.location.href
      : `https://www.manora.tj/cars/${car.id}?source=${source}`;
  const telegramShareUrl = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(title)}`;
  const whatsappShareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(`${title} - ${shareUrl}`)}`;

  return (
    <>
      <div className="mx-auto w-full max-w-[1520px] bg-[#F3F4F6] px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px] xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-4">
            <section className={`${cardClassName} p-4 md:p-5`}>
              <h1 className="text-[26px] font-bold leading-tight text-[#101828]">
                {title}
              </h1>

              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-[#667085]">
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-[#0036A5]" />
                  <span>город Душанбе{coordinates ? '' : ''}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar1Icon className="h-4 w-4" />
                  <span>{timeAgo(car.created_at)}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar1Icon className="h-4 w-4" />
                  <span>Номер объявления: {car.id}</span>
                </div>
              </div>

              <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_108px]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(true)}
                  className="relative overflow-hidden rounded-[16px] bg-[#E5E7EB]"
                >
                  <div className="relative h-full min-h-[280px] w-full md:min-h-[460px]">
                    <SmoothGalleryImage
                      src={galleryPhotos[selectedIndex]}
                      alt={`Фото ${selectedIndex + 1}`}
                      className="object-cover"
                      sizes="(max-width: 1024px) 100vw, 900px"
                      priority
                    />
                  </div>
                </button>

                <div className="flex gap-3 overflow-x-auto lg:flex-col lg:overflow-visible">
                  {galleryPhotos.slice(0, 4).map((photo, index) => (
                    <button
                      key={`${photo}-${index}`}
                      type="button"
                      onClick={() => setSelectedIndex(index)}
                      className={`relative h-[82px] w-[82px] shrink-0 overflow-hidden rounded-[12px] border-2 transition lg:h-[103px] lg:w-[108px] ${
                        selectedIndex === index ? 'border-[#0F56D9]' : 'border-transparent'
                      }`}
                    >
                      <FallbackImage
                        src={photo}
                        alt={`Миниатюра ${index + 1}`}
                        width={240}
                        height={240}
                        className="h-full w-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>
            </section>

            <section className={`${cardClassName} p-4 md:p-5`}>
              <h2 className="mb-4 text-[30px] font-bold text-[#101828]">Информация</h2>
              <div className="grid gap-x-8 gap-y-3 md:grid-cols-2">
                {infoRows.map((row) => (
                  <div key={row.label} className="border-b border-[#EAECF0] pb-2 text-sm">
                    <div className="text-[#667085]">{row.label}</div>
                    <div className="mt-1 font-semibold text-[#101828]">{row.value}</div>
                  </div>
                ))}
              </div>
            </section>

            <section className={`${cardClassName} p-4 md:p-5`}>
              <h2 className="mb-4 text-[30px] font-bold text-[#101828]">Описание</h2>
              <div className="whitespace-pre-line text-[15px] leading-7 text-[#344054]">
                {car.description || 'Описание не указано'}
              </div>
            </section>

            {coordinates ? (
              <section className={`${cardClassName} p-4 md:p-5`}>
                <h2 className="mb-4 text-[30px] font-bold text-[#101828]">На карте</h2>
                <div className="h-[240px] overflow-hidden rounded-[16px] md:h-[380px]">
                  <YMaps query={{ lang: 'ru_RU', apikey: 'dbdc2ae1-bcbd-4f76-ab38-94ca88cf2a6f' }}>
                    <Map state={{ center: coordinates, zoom: 13 }} width="100%" height="100%">
                      <Placemark
                        geometry={coordinates}
                        options={{
                          iconLayout: 'default#image',
                          iconImageHref: '/images/pin.svg',
                          iconImageSize: [44, 44],
                          iconImageOffset: [-22, -44],
                        }}
                      />
                    </Map>
                  </YMaps>
                </div>
              </section>
            ) : null}
          </div>

          <aside className="space-y-4 lg:sticky lg:top-4 lg:self-start">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex h-12 items-center justify-center rounded-[14px] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                <FavoriteButton
                  propertyId={car.id}
                  source={source}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-[14px] bg-white text-sm font-medium text-[#344054]"
                  iconClassName="h-4 w-4 text-[#667085]"
                  label="В избранное"
                />
              </div>
              <div className="relative" ref={shareMenuRef}>
                <button
                  type="button"
                  onClick={() => setIsShareMenuOpen((prev) => !prev)}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-[14px] bg-white text-sm font-medium text-[#344054] shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
                >
                  <Share2 className="h-4 w-4 text-[#667085]" />
                  Поделиться
                  <ChevronDown className="h-4 w-4 text-[#98A2B3]" />
                </button>

                {isShareMenuOpen && (
                  <div className="absolute right-0 top-[calc(100%+8px)] z-20 w-56 rounded-[16px] border border-[#EAECF0] bg-white p-2 shadow-[0_12px_32px_rgba(15,23,42,0.12)]">
                    <a
                      href={telegramShareUrl}
                      target="_blank"
                      rel="noopener"
                      className="flex items-center gap-3 rounded-[12px] px-3 py-2 text-sm text-[#344054] hover:bg-[#F8FAFC]"
                      onClick={() => setIsShareMenuOpen(false)}
                    >
                      <Send className="h-4 w-4" />
                      Telegram
                    </a>
                    <a
                      href={whatsappShareUrl}
                      target="_blank"
                      rel="noopener"
                      className="flex items-center gap-3 rounded-[12px] px-3 py-2 text-sm text-[#344054] hover:bg-[#F8FAFC]"
                      onClick={() => setIsShareMenuOpen(false)}
                    >
                      <MessageCircle className="h-4 w-4" />
                      WhatsApp
                    </a>
                    <button
                      type="button"
                      onClick={async () => {
                        await handleCopyLink();
                        setIsShareMenuOpen(false);
                      }}
                      className="flex w-full items-center gap-3 rounded-[12px] px-3 py-2 text-left text-sm text-[#344054] hover:bg-[#F8FAFC]"
                    >
                      <Copy className="h-4 w-4" />
                      Копировать ссылку
                    </button>
                  </div>
                )}
              </div>
            </div>

            <section className={`${cardClassName} p-4 md:p-5`}>
              <div className="flex items-start gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#F2F4F7]">
                  <UserIcon className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-lg font-bold text-[#101828]">Менеджер Manora</div>
                  <div className="text-sm text-[#667085]">Продавец</div>
                </div>
              </div>

              <div className="mt-4">
                <div className="text-sm text-[#667085]">Цена</div>
                <div className="mt-1 flex items-end gap-2">
                  <div className="text-[34px] font-bold leading-none text-[#0036A5]">
                    {formatPrice(car.price, car.currency)}
                  </div>
                </div>
              </div>

              <button
                type="button"
                className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-[10px] bg-[#0036A5] text-sm font-semibold text-white"
              >
                <Phone className="h-4 w-4" />
                Позвонить
              </button>

              <button
                type="button"
                className="mt-3 flex h-12 w-full items-center justify-center rounded-[10px] border border-[#D0D5DD] text-sm font-semibold text-[#101828]"
              >
                Консультация
              </button>

              <Link
                href="/cars"
                className="mt-3 flex h-11 w-full items-center justify-center rounded-[10px] text-sm text-[#667085]"
              >
                Назад к автомобилям
              </Link>
            </section>
          </aside>
        </div>
      </div>

      <PhotoGalleryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        photos={galleryPhotos}
        initialIndex={selectedIndex}
      />
    </>
  );
}
