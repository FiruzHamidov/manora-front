'use client';

import { useId, useState } from 'react';
import ResidentialImage from '@/ui-components/ResidentialImage';
import dynamic from 'next/dynamic';
import { Dialog, DialogPanel, DialogTitle, Tab, TabGroup, TabList, TabPanel, TabPanels } from '@headlessui/react';
import { useQuery } from '@tanstack/react-query';
import { API_BASE_URL } from '@/config/api';
import type { PublicDrawing, PublicUnit } from '@/services/new-buildings/public-unit';

const UnitMap = dynamic(() => import('./UnitMap'), { ssr: false, loading: () => <p role="status" className="p-6">Загрузка карты…</p> });
const button = 'min-h-11 rounded-lg border px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006341] disabled:opacity-40';

function DrawingImage({ image, points, full }: { image: PublicDrawing; points?: [number, number][]; full: boolean }) {
  const [failed, setFailed] = useState(false);
  if (failed) return <p role="status" className="p-8">Изображение недоступно. Остальные разделы и форма обращения продолжают работать.</p>;
  return <div className="relative w-full" style={{ aspectRatio: image.width > 0 && image.height > 0 ? image.width / image.height : 1.5 }}>
    <ResidentialImage image={image} full={full} priority sizes="(max-width: 1023px) 100vw, 800px" alt={image.alt || 'Чертёж квартиры'} width={image.width || 600} height={image.height || 400} onError={() => setFailed(true)} className="block h-auto w-full object-contain" />
    {points && <svg aria-label="Выделение выбранной квартиры" role="img" className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 1 1" preserveAspectRatio="none">
      <polygon points={points.map(([x, y]) => x + ',' + y).join(' ')} fill="rgba(0,99,65,.22)" stroke="#006341" strokeWidth=".006" strokeDasharray=".012 .006" />
    </svg>}
  </div>;
}

function DrawingViewer({ images, points, onFullScreen }: { images: PublicDrawing[]; points?: [number, number][]; onFullScreen?: () => void }) {
  const [index, setIndex] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const selected = images[Math.min(index, images.length - 1)];
  const id = useId();
  const move = (direction: number) => { setIndex((current) => (current + direction + images.length) % images.length); setZoom(1); };
  if (!selected) return <p className="p-8">Чертёж не предоставлен.</p>;
  return <div className="min-w-0 space-y-3">
    <div className="flex flex-wrap items-center gap-2" aria-label="Управление чертежом">
      <button type="button" className={button} disabled={zoom <= 1} aria-label="Уменьшить чертёж" onClick={() => setZoom(Math.max(1, zoom - .5))}>−</button>
      <span className="min-w-12 text-center text-sm" aria-live="polite">{zoom * 100}%</span>
      <button type="button" className={button} disabled={zoom >= 4} aria-label="Увеличить чертёж" onClick={() => setZoom(Math.min(4, zoom + .5))}>+</button>
      <button type="button" className={button} onClick={() => setZoom(1)}>Сбросить масштаб</button>
      {onFullScreen && <button type="button" className={button} onClick={onFullScreen}>На весь экран</button>}
    </div>
    <p id={id} className="text-xs text-gray-600">После увеличения прокручивайте чертёж пальцем, трекпадом или клавишами стрелок. {images.length > 1 && 'При масштабе 100% свайп переключает изображения.'}</p>
    <div tabIndex={0} role="region" aria-label="Просмотр чертежа" aria-describedby={id} className="max-h-[65vh] min-h-52 w-full overflow-auto rounded-xl border bg-white focus-visible:outline-2 focus-visible:outline-[#006341]"
      onTouchStart={(event) => setTouchStart(event.touches.length === 1 ? event.touches[0].clientX : null)}
      onTouchEnd={(event) => {
        if (zoom === 1 && touchStart !== null && images.length > 1) {
          const distance = event.changedTouches[0].clientX - touchStart;
          if (Math.abs(distance) > 65) move(distance < 0 ? 1 : -1);
        }
        setTouchStart(null);
      }}>
      <div style={{ width: zoom * 100 + '%' }}><DrawingImage key={selected.url} image={selected} points={points} full={!onFullScreen || zoom > 1} /></div>
    </div>
    {points && <p className="text-sm">Выбранная квартира выделена контуром.</p>}
    {selected.caption && <p className="break-words text-sm text-gray-600">{selected.caption}</p>}
    {images.length > 1 && <div className="flex items-center justify-center gap-3">
      <button type="button" className={button} aria-label="Предыдущий чертёж" onClick={() => move(-1)}>←</button>
      <span aria-live="polite">{Math.min(index + 1, images.length)} / {images.length}</span>
      <button type="button" className={button} aria-label="Следующий чертёж" onClick={() => move(1)}>→</button>
    </div>}
  </div>;
}

export default function UnitMedia({ unit }: { unit: PublicUnit }) {
  const [tab, setTab] = useState(0);
  const [fullScreen, setFullScreen] = useState(false);
  const gallery = useQuery({
    queryKey: ['public-unit-drawings', unit.new_building_id, unit.id, unit.version],
    enabled: fullScreen && tab === 0 && (unit.plan?.image_count ?? 0) > 1,
    queryFn: async ({ signal }) => {
      const response = await fetch(API_BASE_URL + '/new-buildings/' + unit.new_building_id + '/units/' + unit.id + '/drawings', { signal, cache: 'no-store' });
      if (!response.ok) throw new Error('Не удалось загрузить галерею');
      return await response.json() as { plan: { images: PublicDrawing[] } | null };
    },
    staleTime: 0,
  });
  const images = tab === 0 ? gallery.data?.plan?.images ?? (unit.plan ? [unit.plan.image] : []) : unit.floor_plan ? [unit.floor_plan.image] : [];
  const points = tab === 1 ? unit.floor_plan?.region?.points : undefined;
  return <section aria-label="Чертежи и расположение" className="min-w-0 rounded-2xl border bg-white p-4 md:p-6">
    <TabGroup selectedIndex={tab} onChange={setTab}>
      <TabList className="mb-4 flex flex-wrap gap-2">
        {['Планировка квартиры', 'План этажа', 'Карта'].map((label) => <Tab key={label} className={button + ' data-selected:bg-[#006341] data-selected:text-white'}>{label}</Tab>)}
      </TabList>
      <TabPanels>
        <TabPanel>
          {unit.plan ? <DrawingViewer key={unit.plan.image.url} images={[unit.plan.image]} onFullScreen={() => setFullScreen(true)} /> : <p className="py-12 text-center text-gray-600">Планировка квартиры не предоставлена.</p>}
          {unit.plan && unit.plan.image_count > 1 && <p className="mt-3 text-sm">Все чертежи ({unit.plan.image_count}) доступны в полноэкранном просмотре.</p>}
        </TabPanel>
        <TabPanel>
          {unit.floor_plan ? <><DrawingViewer key={unit.floor_plan.image.url} images={[unit.floor_plan.image]} points={unit.floor_plan.region?.points} onFullScreen={() => setFullScreen(true)} />
            {!unit.floor_plan.region && <p className="mt-3 text-sm text-gray-600">Расположение этой квартиры на чертеже пока не отмечено.</p>}</> : <p className="py-12 text-center text-gray-600">План этажа не предоставлен.</p>}
        </TabPanel>
        <TabPanel>{tab === 2 && <UnitMap building={unit.building} />}</TabPanel>
      </TabPanels>
    </TabGroup>
    <Dialog open={fullScreen} onClose={setFullScreen} className="relative z-[200]">
      <div className="fixed inset-0 bg-black/60" aria-hidden="true" />
      <div className="fixed inset-0 overflow-y-auto p-2 sm:p-6">
        <DialogPanel className="mx-auto min-w-0 max-w-5xl rounded-2xl bg-white p-4">
          <div className="mb-4 flex items-center justify-between gap-3">
            <DialogTitle className="font-semibold">{tab === 0 ? 'Планировка квартиры' : 'План этажа'}</DialogTitle>
            <button type="button" data-autofocus className={button} onClick={() => setFullScreen(false)}>Закрыть</button>
          </div>
          {gallery.isFetching && <p role="status">Загрузка остальных чертежей…</p>}
          {gallery.isError && <p role="alert" className="mb-3 text-red-700">Галерея не загрузилась. <button type="button" className={button} onClick={() => void gallery.refetch()}>Повторить</button></p>}
          <DrawingViewer key={tab} images={images} points={points} />
        </DialogPanel>
      </div>
    </Dialog>
  </section>;
}
