'use client';

import { measureResidential } from '@/services/new-buildings/track';

import { useEffect, useState } from 'react';
import ResidentialImage from '@/ui-components/ResidentialImage';
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { Camera, ChevronLeft, ChevronRight } from 'lucide-react';
import { API_BASE_URL } from '@/config/api';
import { fetchBuildingGallery, PublicBuildingError } from '@/services/new-buildings/public-building-api';
import type { BuildingImage, PublicBuilding } from '@/services/new-buildings/public-building';

const button = 'min-h-11 rounded-xl border border-gray-300 px-3 py-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006341] disabled:opacity-40';
function Photo({ image, priority = false, contain = false, thumbnail = false }: { image: BuildingImage; priority?: boolean; contain?: boolean; thumbnail?: boolean }) {
  const [failed, setFailed] = useState(false);
  if (failed) return <span role="status" className="flex h-full min-h-32 items-center justify-center p-4 text-center text-gray-600">Фото недоступно. Другие фотографии можно листать.</span>;
  return <ResidentialImage image={image} alt={image.alt} full={contain} priority={priority} sizes={thumbnail ? '(max-width: 639px) 30vw, 150px' : '(max-width: 1023px) 100vw, 900px'}
    className={'absolute inset-0 h-full w-full ' + (contain ? 'object-contain' : 'object-cover')} onError={() => setFailed(true)} />;
}

export default function BuildingGallery({ building, onRefresh }: { building: PublicBuilding; onRefresh: () => void }) {
  const [index, setIndex] = useState(0), [open, setOpen] = useState(false), [zoom, setZoom] = useState(1);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const gallery = useInfiniteQuery({
    queryKey: ['public-building-gallery', building.id, building.version],
    initialPageParam: 1,
    initialData: { pages: [{ data: building.photos, meta: { page: 1, per_page: 6, total: building.photo_count, last_page: Math.max(1, Math.ceil(building.photo_count / 6)), version: building.version } }], pageParams: [1] },
    queryFn: ({ pageParam, signal }) => measureResidential({ surface: 'building', building_id: building.id, endpoint: 'gallery' }, () => fetchBuildingGallery(API_BASE_URL, building.id, building.version, pageParam, signal), signal),
    getNextPageParam: last => last.meta.page < last.meta.last_page ? last.meta.page + 1 : undefined,
    staleTime: Infinity, enabled: false, retry: false,
  });
  const images = gallery.data.pages.flatMap(page => page.data);
  const selected = images[index] ?? images[0];
  const choose = (next: number) => { setIndex(next); setZoom(1); };
  useEffect(() => {
    if (!open || !gallery.hasNextPage || gallery.isFetchingNextPage) return;
    void gallery.fetchNextPage();
  }, [open, gallery.hasNextPage, gallery.isFetchingNextPage, gallery.fetchNextPage]);
  useEffect(() => {
    if (open || images.length < 2) return;
    const interval = window.setInterval(() => {
      setIndex(current => current < images.length - 1 ? current + 1 : 0);
    }, 5000);
    return () => window.clearInterval(interval);
  }, [images.length, open]);
  const next = async () => {
    if (gallery.isFetchingNextPage) return;
    if (index < images.length - 1) { choose(index + 1); return; }
    if (gallery.hasNextPage) {
      const result = await gallery.fetchNextPage();
      if (!result.isError && result.data && result.data.pages.flatMap(page => page.data).length > index + 1) choose(index + 1);
    } else choose(0);
  };
  const previous = () => choose(index === 0 ? images.length - 1 : index - 1);
  const controls = <div className="flex flex-wrap items-center justify-between gap-2">
    {images.length > 1 && <button type="button" className={button} disabled={gallery.isFetchingNextPage} aria-label="Предыдущее фото" onClick={previous}>←</button>}
    <span className="text-sm" aria-live="polite">Фото {index + 1} из {building.photo_count}</span>
    {building.photo_count > 1 && <button type="button" className={button} disabled={gallery.isFetchingNextPage} aria-label="Следующее фото" onClick={() => void next()}>→</button>}
  </div>;
  const versionConflict = gallery.error instanceof PublicBuildingError && gallery.error.status === 409;
  const feedback = <>
    {gallery.isFetchingNextPage && <p role="status">Загрузка следующих фотографий…</p>}
    {gallery.isError && <p role="alert" className="text-red-700">{gallery.error.message} <button className={button} onClick={() => versionConflict ? onRefresh() : void next()}>{versionConflict ? 'Обновить данные ЖК' : 'Повторить'}</button></p>}
  </>;
  if (!selected) return <div className="flex min-h-56 items-center justify-center rounded-3xl bg-gray-100 text-gray-600">Фотографии ЖК пока не добавлены.</div>;
  return <section aria-label="Галерея жилого комплекса" className="min-w-0">
    <div className="relative min-h-[320px] w-full overflow-hidden rounded-[28px] bg-[#111827] text-white md:min-h-[520px]">
      <button type="button" onClick={() => setOpen(true)} aria-label="Открыть фотографии на весь экран" className="absolute inset-0 block w-full focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-white">
        <Photo key={selected.url} image={selected} priority />
        <span className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-black/15" aria-hidden="true" />
      </button>
      <button type="button" onClick={() => setOpen(true)} className="absolute right-4 top-4 z-10 inline-flex min-h-11 items-center gap-2 rounded-full border border-white/25 bg-black/40 px-4 py-2 text-sm font-semibold text-white backdrop-blur-md transition hover:bg-black/65 focus-visible:outline-2 focus-visible:outline-white sm:right-6 sm:top-6">
        <Camera className="h-4 w-4" />
        Смотреть фото
      </button>
      {images.length > 1 && <>
        <button type="button" onClick={previous} aria-label="Предыдущее фото" className="absolute left-4 top-1/2 z-10 inline-flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/25 bg-black/40 text-white backdrop-blur-md transition hover:bg-black/65 focus-visible:outline-2 focus-visible:outline-white sm:left-6">
          <ChevronLeft className="h-7 w-7" />
        </button>
        <button type="button" onClick={() => void next()} disabled={gallery.isFetchingNextPage} aria-label="Следующее фото" className="absolute right-4 top-1/2 z-10 inline-flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/25 bg-black/40 text-white backdrop-blur-md transition hover:bg-black/65 focus-visible:outline-2 focus-visible:outline-white disabled:opacity-50 sm:right-6">
          <ChevronRight className="h-7 w-7" />
        </button>
      </>}
      <div className="pointer-events-none absolute inset-x-4 bottom-4 z-10 flex items-end justify-between gap-3 sm:inset-x-6 sm:bottom-6">
        {selected.caption ? <p className="max-w-3xl text-sm text-white drop-shadow">{selected.caption}</p> : <span />}
        <span className="shrink-0 rounded-full bg-black/45 px-3 py-1.5 text-sm font-medium backdrop-blur-md" aria-live="polite">{index + 1} / {building.photo_count}</span>
      </div>
    </div>
    {images.length > 1 && <div className="mt-4 grid grid-cols-4 gap-3 sm:grid-cols-5">
      {images.slice(0, 10).map((image, imageIndex) =>
        <button type="button" key={image.id} aria-label={'Фото ' + (imageIndex + 1) + ': ' + image.alt} aria-pressed={index === imageIndex} onClick={() => choose(imageIndex)}
          className="relative aspect-[4/3] overflow-hidden rounded-2xl border-2 border-transparent bg-gray-100 transition hover:border-[#006341]/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006341] aria-pressed:border-[#006341] aria-pressed:shadow-[0_6px_18px_rgba(0,99,65,0.16)]">
          <Photo image={image} thumbnail />
        </button>)}
    </div>}
    <div className="mt-3">{feedback}</div>
    <Dialog open={open} onClose={setOpen} className="relative z-[200]">
      <div className="fixed inset-0 bg-black/60" aria-hidden="true" />
      <div className="fixed inset-0 overflow-y-auto p-2 sm:p-6">
        <DialogPanel className="mx-auto min-w-0 max-w-6xl space-y-3 rounded-2xl bg-white p-3 md:p-5" onKeyDown={event => {
          if (zoom !== 1 || gallery.isFetchingNextPage) return;
          if (event.key === 'ArrowRight') { event.preventDefault(); void next(); }
          if (event.key === 'ArrowLeft') { event.preventDefault(); choose(Math.max(0, index - 1)); }
        }}>
          <div className="flex items-start justify-between gap-3"><DialogTitle className="text-lg font-bold">{building.title} · Фотографии</DialogTitle><button data-autofocus className={button} onClick={() => setOpen(false)}>Закрыть</button></div>
          <div className="flex flex-wrap items-center gap-2">
            <button className={button} aria-label="Уменьшить фото" disabled={zoom <= 1} onClick={() => setZoom(value => Math.max(1, value - .5))}>−</button>
            <span aria-live="polite">{zoom * 100}%</span>
            <button className={button} aria-label="Увеличить фото" disabled={zoom >= 4} onClick={() => setZoom(value => Math.min(4, value + .5))}>+</button>
            <button className={button} onClick={() => setZoom(1)}>Сбросить масштаб</button>
          </div>
          <p className="text-sm text-gray-600">При масштабе 100% используйте стрелки или свайп для листания. После увеличения прокручивайте изображение.</p>
          <div role="region" aria-label="Просмотр фотографии" tabIndex={0} className="max-h-[65vh] overflow-auto rounded-xl bg-gray-100 focus-visible:outline-2 focus-visible:outline-[#006341]"
            onTouchStart={event => setTouchStart(event.touches.length === 1 ? event.touches[0].clientX : null)}
            onTouchEnd={event => {
              const distance = touchStart === null ? 0 : event.changedTouches[0].clientX - touchStart;
              if (zoom === 1 && !gallery.isFetchingNextPage && Math.abs(distance) > 65) {
                if (distance < 0) void next(); else choose(Math.max(0, index - 1));
              }
              setTouchStart(null);
            }}>
            <div className="relative min-h-56" style={{ width: zoom * 100 + '%', aspectRatio: (selected.width || 1600) / (selected.height || 1000) }}><Photo key={selected.url} image={selected} contain /></div>
          </div>
          {selected.caption && <p className="text-sm">{selected.caption}</p>}
          {feedback}
          {controls}
          <div className="flex flex-wrap gap-2">{images.map((image, imageIndex) => <button key={image.id} className={button + ' aria-pressed:bg-green-50'} aria-pressed={index === imageIndex} onClick={() => choose(imageIndex)}>Фото {imageIndex + 1}</button>)}</div>
        </DialogPanel>
      </div>
    </Dialog>
  </section>;
}
