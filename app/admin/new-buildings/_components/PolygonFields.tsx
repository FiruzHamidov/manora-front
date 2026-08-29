'use client';

import { useState } from 'react';
import Image from 'next/image';
import { parsePoints, pointDrafts, pointerPoint, type PointDraft } from '@/services/new-buildings/geometry';

/** Shared normalized-image coordinate input; ownership and persistence belong to the enclosing editor. */
export default function PolygonFields({ image, drafts, onChange, disabled = false }: {
  image: { url: string; alt: string; width: number | null; height: number | null };
  drafts: PointDraft[]; onChange: (drafts: PointDraft[]) => void; disabled?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  let preview = '';
  try { preview = parsePoints(drafts).map(point => point.join(',')).join(' '); } catch { /* Keep incomplete input editable. */ }
  return <fieldset disabled={disabled} className="min-w-0 space-y-3">
    <p className="text-sm">Отметьте вершины на изображении или введите X/Y в процентах от левого верхнего угла. От 3 до 30 вершин, без самопересечений. Enter на изображении добавляет центр; затем уточните координаты.</p>
    {failed && <p role="alert">Превью недоступно. Обновите данные; введённые координаты сохранятся.</p>}
    <button type="button" disabled={drafts.length >= 30 || failed} aria-label="Добавить вершину на изображении" className="relative block w-full cursor-crosshair focus-visible:outline-2 focus-visible:outline-green-800" onClick={event => {
      const point = event.detail === 0 ? [0.5, 0.5] as [number, number] : pointerPoint(event.clientX, event.clientY, event.currentTarget.getBoundingClientRect());
      onChange([...drafts, ...pointDrafts([point])]);
    }}>
      <Image unoptimized src={image.url} width={image.width || 1000} height={image.height || 1000} alt={image.alt} className="block h-auto w-full" onLoad={() => setFailed(false)} onError={() => setFailed(true)} />
      <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 1 1" preserveAspectRatio="none" aria-hidden="true">{preview && <polygon points={preview} fill="rgba(0,99,65,.25)" stroke="#006341" strokeWidth="2" vectorEffect="non-scaling-stroke" />}</svg>
    </button>
    <ol className="space-y-2">{drafts.map((draft, index) => <li key={index} className="flex flex-wrap items-end gap-2">
      {(['x', 'y'] as const).map(axis => <label key={axis} className="min-w-0 flex-1 text-sm">{axis.toUpperCase()} вершины {index + 1}, %<input inputMode="decimal" required value={draft[axis]} className="mt-1 w-full rounded border p-2" onChange={event => onChange(drafts.map((point, position) => position === index ? { ...point, [axis]: event.target.value } : point))} /></label>)}
      <button type="button" className="min-h-11 rounded border px-3" aria-label={'Удалить вершину ' + (index + 1)} onClick={() => onChange(drafts.filter((_, position) => position !== index))}>×</button>
    </li>)}</ol>
    <div className="flex flex-wrap gap-2"><button type="button" className="min-h-11 rounded border px-3" disabled={drafts.length >= 30} onClick={() => onChange([...drafts, { x: '', y: '' }])}>Добавить вершину</button><button type="button" className="min-h-11 rounded border px-3" disabled={!drafts.length} onClick={() => onChange([])}>Очистить контур</button></div>
  </fieldset>;
}
