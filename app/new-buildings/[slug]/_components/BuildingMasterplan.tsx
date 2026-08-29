'use client';

import { measureResidential } from '@/services/new-buildings/track';

import { useRef, useState } from 'react';
import ResidentialImage from '@/ui-components/ResidentialImage';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import { useQuery } from '@tanstack/react-query';
import { API_BASE_URL } from '@/config/api';
import { fetchPublicMasterplan } from '@/services/new-buildings/public-building-api';
import type { PublicMasterplan } from '@/services/new-buildings/public-building';
import { changeSelection, readUnitSelection, selectionNavigation } from '@/services/new-buildings/unit-selection';
import { formatCompletion } from '@/services/new-buildings/completion';

const control = 'min-h-11 max-w-full break-words rounded-xl border border-gray-300 px-3 py-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006341] disabled:opacity-40';
export default function BuildingMasterplan({ buildingId, version, scrollOffset }: { buildingId: number; version: number; scrollOffset: number }) {
  const [requested, setRequested] = useState(false), [fullscreen, setFullscreen] = useState(false), [selected, setSelected] = useState<number | null>(null);
  const query = useQuery({ queryKey: ['public-masterplan', buildingId, version], enabled: requested,
    queryFn: ({ signal }) => measureResidential({ surface: 'building', building_id: buildingId, endpoint: 'masterplan' }, () => fetchPublicMasterplan(API_BASE_URL, buildingId, signal), signal), retry: false, refetchInterval: 30_000, refetchOnWindowFocus: true });
  const params = useSearchParams();
  const block = query.data?.blocks.find(item => item.id === selected);
  const blockInfo = block && <div className="space-y-2 rounded-xl border border-green-200 bg-green-50 p-3" aria-live="polite">
    <h3 className="break-words font-semibold">{block.name}</h3><p>Сдача: {formatCompletion(block)} · Свободных квартир: {block.available_count}</p>
    <Link onClick={() => setFullscreen(false)} className={control + ' inline-flex items-center text-[#006341]'} href={'?' + selectionNavigation(params.toString(), changeSelection(readUnitSelection(new URLSearchParams(params.toString())), 'block_id', String(block.id))) + '#apartments'}>Квартиры корпуса</Link>
  </div>;
  const contents = query.isError ? <p role="alert" className="text-red-700">Не удалось получить актуальный генплан. <button className={control} onClick={() => void query.refetch()}>Повторить</button></p>
    : query.isPending ? <p role="status">Загрузка генплана…</p>
    : !query.data?.image ? <p>Генплан больше не доступен. Обновите данные ЖК.</p>
    : <>
      <MasterplanImage key={query.data.image.id} plan={query.data} selected={block?.id ?? null} onSelect={setSelected} fullscreen={fullscreen} />
      {!!query.data.blocks.length && <div className="space-y-2"><p className="text-sm">Выберите область на изображении или корпус в списке:</p><div className="flex flex-wrap gap-2" aria-label="Корпуса на генплане">
        {query.data.blocks.map(item => <button type="button" key={item.id} className={control + ' aria-pressed:border-[#006341] aria-pressed:bg-green-50'} aria-pressed={block?.id === item.id} onClick={() => setSelected(item.id)}>{item.name}</button>)}
      </div></div>}
      {!query.data.regions.length && <p className="text-sm text-gray-600">Области корпусов пока не размечены.</p>}
      {blockInfo}
    </>;
  return <section id="masterplan" className="min-w-0 space-y-4 rounded-3xl border border-gray-200 bg-white p-4 md:p-6" style={{ scrollMarginTop: scrollOffset }}>
    <h2 className="text-2xl font-bold">Генплан</h2>
    {!requested ? <button className={control} onClick={() => setRequested(true)}>Открыть генплан</button> : <>
      {!fullscreen && contents}
      {query.data?.image && !query.isError && <button className={control} onClick={() => setFullscreen(true)}>Генплан на весь экран</button>}
    </>}
    <Dialog open={fullscreen} onClose={setFullscreen} className="relative z-[200]">
      <div className="fixed inset-0 bg-black/60" aria-hidden="true" />
      <div className="fixed inset-0 overflow-y-auto p-2 sm:p-6"><DialogPanel className="mx-auto max-w-6xl space-y-4 rounded-2xl bg-white p-3 md:p-5">
        <div className="flex items-center justify-between gap-3"><DialogTitle className="text-xl font-bold">Генплан</DialogTitle><button data-autofocus className={control} onClick={() => setFullscreen(false)}>Закрыть генплан</button></div>
        {contents}
      </DialogPanel></div>
    </Dialog>
  </section>;
}

function MasterplanImage({ plan, selected, onSelect, fullscreen }: { plan: PublicMasterplan; selected: number | null; onSelect: (id: number) => void; fullscreen: boolean }) {
  const [zoom, setZoom] = useState(1), [failed, setFailed] = useState(false);
  const viewport = useRef<HTMLDivElement | null>(null);
  const drag = useRef<{ x: number; y: number; left: number; top: number; moved: boolean } | null>(null);
  const image = plan.image!;
  return <div className="min-w-0 space-y-3">
    <div className="flex flex-wrap items-center gap-2">
      <button className={control} aria-label="Уменьшить генплан" disabled={zoom <= 1} onClick={() => setZoom(value => Math.max(1, value - .5))}>−</button>
      <span aria-live="polite">{zoom * 100}%</span>
      <button className={control} aria-label="Увеличить генплан" disabled={zoom >= 4} onClick={() => setZoom(value => Math.min(4, value + .5))}>+</button>
      <button className={control} onClick={() => { setZoom(1); viewport.current?.scrollTo(0, 0); }}>Сбросить масштаб генплана</button>
    </div>
    <p className="text-sm text-gray-600">После увеличения перемещайте изображение мышью, пальцем или полосами прокрутки. Контуры корпусов масштабируются вместе с генпланом.</p>
    {failed ? <p role="alert">Изображение генплана недоступно. Список корпусов остаётся доступен. <button className={control} onClick={() => setFailed(false)}>Повторить загрузку изображения</button></p> :
      <div ref={viewport} role="region" aria-label="Изображение генплана" tabIndex={0} className="max-h-[65vh] overflow-auto rounded-xl bg-gray-100 focus-visible:outline-2 focus-visible:outline-[#006341]"
        onPointerDown={event => {
          drag.current = null;
          if (zoom <= 1 || event.pointerType !== 'mouse' || event.button !== 0) return;
          drag.current = { x: event.clientX, y: event.clientY, left: event.currentTarget.scrollLeft, top: event.currentTarget.scrollTop, moved: false };
        }}
        onPointerMove={event => {
          const value = drag.current;
          if (!value || event.buttons !== 1) return;
          if (Math.abs(event.clientX - value.x) + Math.abs(event.clientY - value.y) > 5) value.moved = true;
          if (value.moved) { event.currentTarget.scrollLeft = value.left + value.x - event.clientX; event.currentTarget.scrollTop = value.top + value.y - event.clientY; }
        }} onClickCapture={event => { if (event.detail > 0 && drag.current?.moved) { event.preventDefault(); event.stopPropagation(); } drag.current = null; }}>
        <div className="relative" style={{ width: zoom * 100 + '%', aspectRatio: (image.width || 1) / (image.height || 1) }}>
          <ResidentialImage image={image} alt={image.alt} sizes="(max-width: 1023px) 100vw, 900px" full={fullscreen || zoom > 1} draggable={false} className="pointer-events-none absolute inset-0 h-full w-full object-contain" onError={() => setFailed(true)} />
          <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1 1" preserveAspectRatio="none" aria-label="Области корпусов">
            {plan.regions.map(region => { const block = plan.blocks.find(item => item.id === region.block_id); return block ? <polygon key={region.id} points={region.points.map(point => point.join(',')).join(' ')} role="button" tabIndex={0} aria-label={'Выбрать корпус ' + block.name} aria-pressed={selected === block.id}
              fill={selected === block.id ? 'rgba(0,99,65,.45)' : 'rgba(0,99,65,.12)'} stroke="#006341" strokeWidth="2" vectorEffect="non-scaling-stroke" className="cursor-pointer focus:fill-amber-200 focus:stroke-black"
              onClick={() => onSelect(block.id)} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onSelect(block.id); } }}><title>{block.name}</title></polygon> : null; })}
          </svg>
        </div>
      </div>}
    {image.caption && <p className="text-sm text-gray-600">{image.caption}</p>}
  </div>;
}
