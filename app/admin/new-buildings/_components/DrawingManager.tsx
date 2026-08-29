'use client';

import { useRef, useState, type FormEvent } from 'react';
import ResidentialImage from '@/ui-components/ResidentialImage';
import { Button } from '@/ui-components/Button';
import { structureError, useChangeDrawing, useDrawings, type DrawingOwner } from '@/services/new-buildings/structure';
import type { ResidentialDrawing } from '@/services/new-buildings/types';

export default function DrawingManager({ buildingId, kind, ownerId, canManage }: { buildingId: number; kind: DrawingOwner; ownerId: number; canManage: boolean }) {
  const query = useDrawings(buildingId, kind, ownerId);
  const mutate = useChangeDrawing(buildingId, kind, ownerId);
  const input = useRef<HTMLInputElement>(null);
  const [upload, setUpload] = useState<{ file: File; version: number } | null>(null);
  const [alt, setAlt] = useState('');
  const [caption, setCaption] = useState('');
  const [error, setError] = useState('');
  const [edit, setEdit] = useState<{ image: ResidentialDrawing; version: number } | null>(null);
  const version = query.data?.version ?? 0;
  const images = query.data?.images ?? [];

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!upload) return;
    try {
      await mutate.mutateAsync({ action: 'upload', ...upload, alt, caption });
      setUpload(null); setAlt(''); setCaption(''); setError('');
      if (input.current) input.current.value = '';
    } catch (error) { setError(structureError(error)); }
  }

  async function change(action: 'delete' | 'cover' | 'reorder', image: ResidentialDrawing, direction = 0) {
    if (action === 'delete' && !confirm('Убрать чертёж? Публичная и временная ссылки перестанут работать.')) return;
    const order = images.map(item => item.id);
    if (action === 'reorder') {
      const index = order.indexOf(image.id);
      [order[index], order[index + direction]] = [order[index + direction], order[index]];
    }
    try { await mutate.mutateAsync({ action, version, id: image.id, order }); setError(''); }
    catch (error) { setError(structureError(error)); }
  }

  return <section className="mt-4 space-y-4 rounded-lg border bg-gray-50 p-4" aria-label="Чертежи">
    <div className="flex flex-wrap items-center justify-between gap-3"><h3 className="font-semibold">Чертежи</h3><Button variant="outline" size="sm" disabled={query.isFetching} onClick={() => query.refetch()}>Обновить превью</Button></div>
    <p className="text-sm text-gray-600">{kind === 'floor-plans' ? 'Один чертёж на запись. Перед заменой удалите прежний.' : kind === 'units' ? 'До 20 индивидуальных чертежей этой квартиры. Обычные фотографии сюда не добавляются.' : 'До 20 изображений типовой планировки. Фактические параметры квартир не меняются.'} Превью действует 5 минут; файлы закрыты до проверки и публикации ЖК.</p>
    {error && <p role="alert" className="text-red-700">{error}</p>}
    {query.isError ? <p role="alert">Не удалось загрузить чертежи. Повторите обновление.</p> : query.isLoading ? <p>Загрузка…</p> : <>
      {!images.length && <p>Чертёж не загружен.</p>}
      <div className="grid gap-4 md:grid-cols-2">{images.map((image, index) => <figure key={image.id} className="min-w-0 space-y-3 rounded-lg border bg-white p-3">
        <a href={image.url} target="_blank" rel="noopener noreferrer" className="block focus-visible:outline-2 focus-visible:outline-green-800" aria-label={`Открыть чертёж: ${image.alt}`}><ResidentialImage image={image} sizes="(max-width: 767px) 100vw, 500px" width={image.width} height={image.height} alt={image.alt} className="h-56 w-full object-contain" /></a>
        {image.original_download_url && <a href={image.original_download_url} className="block min-h-11 text-sm underline" rel="noreferrer">Скачать оригинал</a>}
        <figcaption className="break-words text-sm">{image.alt}{image.is_cover ? ' · Основной' : ''}{image.caption && <p className="mt-1 text-gray-600">{image.caption}</p>}</figcaption>
        {canManage && <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" disabled={mutate.isPending || !!edit} onClick={() => setEdit({ image, version })}>Описание</Button>
          <Button size="sm" variant="outline" disabled={mutate.isPending || !!edit} onClick={() => change('delete', image)}>Удалить</Button>
          {kind !== 'floor-plans' && <>
            <Button size="sm" variant="outline" disabled={mutate.isPending || !!edit || image.is_cover} onClick={() => change('cover', image)}>Основной</Button>
            <Button size="sm" variant="outline" aria-label={`Переместить чертёж ${index + 1} выше`} disabled={mutate.isPending || !!edit || index === 0} onClick={() => change('reorder', image, -1)}>↑</Button>
            <Button size="sm" variant="outline" aria-label={`Переместить чертёж ${index + 1} ниже`} disabled={mutate.isPending || !!edit || index === images.length - 1} onClick={() => change('reorder', image, 1)}>↓</Button>
          </>}
        </div>}
        {edit?.image.id === image.id && <DrawingDescription key={image.id} initial={edit.image} version={edit.version} buildingId={buildingId} kind={kind} ownerId={ownerId} onClose={() => setEdit(null)} />}
      </figure>)}</div>
      {canManage && images.length < (kind === 'floor-plans' ? 1 : 20) && <form onSubmit={submit} className="space-y-3">
        <fieldset disabled={mutate.isPending || !!edit} className="space-y-3">
          <label className="block text-sm">Добавить чертёж (JPEG, PNG, WebP, AVIF; до 10 МБ)<input ref={input} className="mt-1 block w-full min-w-0 text-sm" type="file" accept="image/jpeg,image/png,image/webp,image/avif" required onChange={event => { const file = event.target.files?.[0]; setUpload(file ? { file, version } : null); }} /></label>
          <label className="block text-sm">Описание изображения для доступности<input required maxLength={250} className="mt-1 w-full rounded border p-2" value={alt} onChange={event => setAlt(event.target.value)} /></label>
          <label className="block text-sm">Подпись (необязательно)<input maxLength={500} className="mt-1 w-full rounded border p-2" value={caption} onChange={event => setCaption(event.target.value)} /></label>
          <Button type="submit" disabled={!upload || !version}>{mutate.isPending ? 'Загрузка…' : 'Загрузить чертёж'}</Button>
        </fieldset>
      </form>}
    </>}
  </section>;
}

function DrawingDescription({ initial, version, buildingId, kind, ownerId, onClose }: { initial: ResidentialDrawing; version: number; buildingId: number; kind: DrawingOwner; ownerId: number; onClose: () => void }) {
  const [alt, setAlt] = useState(initial.alt);
  const [caption, setCaption] = useState(initial.caption ?? '');
  const [error, setError] = useState('');
  const mutate = useChangeDrawing(buildingId, kind, ownerId);
  async function submit(event: FormEvent) {
    event.preventDefault();
    try { await mutate.mutateAsync({ action: 'metadata', id: initial.id, version, alt, caption: caption || null }); onClose(); }
    catch (error) { setError(structureError(error)); }
  }
  return <form onSubmit={submit} className="space-y-3 border-t pt-3">
    {error && <p role="alert" className="text-red-700">{error}</p>}
    <fieldset disabled={mutate.isPending} className="space-y-3">
      <label className="block text-sm">Описание<input required maxLength={250} value={alt} onChange={event => setAlt(event.target.value)} className="mt-1 w-full rounded border p-2" /></label>
      <label className="block text-sm">Подпись<input maxLength={500} value={caption} onChange={event => setCaption(event.target.value)} className="mt-1 w-full rounded border p-2" /></label>
      <div className="flex flex-wrap gap-2"><Button type="submit" size="sm">Сохранить описание</Button><Button size="sm" variant="outline" onClick={onClose}>Отмена</Button></div>
    </fieldset>
  </form>;
}
