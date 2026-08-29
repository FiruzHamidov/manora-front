'use client';

import { useEffect, useId, useState } from 'react';
import { isAxiosError } from 'axios';
import { useUpdateNewBuildingPhoto } from '@/services/new-buildings/hooks';
import type { NewBuildingPhoto } from '@/services/new-buildings/types';

export default function PhotoMetadataEditor({ buildingId, photo, version, disabled }: { buildingId: number; photo: NewBuildingPhoto; version: number; disabled: boolean }) {
  const id = useId(), update = useUpdateNewBuildingPhoto(buildingId);
  const [draft, setDraft] = useState({ alt: photo.alt ?? '', caption: photo.caption ?? '', version });
  const [dirty, setDirty] = useState(false), [conflict, setConflict] = useState(false), [message, setMessage] = useState('');
  useEffect(() => {
    if (!dirty) setDraft({ alt: photo.alt ?? '', caption: photo.caption ?? '', version });
  }, [dirty, photo.alt, photo.caption, version]);
  const edit = (key: 'alt' | 'caption', value: string) => { setDirty(true); setMessage(''); setDraft(current => ({ ...current, [key]: value })); };
  return <form className="space-y-3 border-t p-3" onSubmit={async event => {
    event.preventDefault();
    if (!photo.id || disabled || update.isPending || conflict) return;
    try {
      await update.mutateAsync({ photoId: photo.id, version: draft.version, alt: draft.alt.trim() || null, caption: draft.caption.trim() || null });
      setDirty(false); setMessage('Подпись сохранена. ЖК направлен на повторную проверку.');
    } catch (error) {
      const stale = isAxiosError(error) && error.response?.status === 409;
      setConflict(stale);
      setMessage(stale ? 'Фотографии изменены. Введённый текст сохранён; сравните с текущими данными перед повтором.' : 'Подпись не сохранена. Проверьте длину текста и повторите.');
    }
  }}>
    <label htmlFor={id + '-alt'} className="block text-sm">Описание фото для доступности</label>
    <input id={id + '-alt'} value={draft.alt} maxLength={250} disabled={disabled || update.isPending} onChange={event => edit('alt', event.target.value)} className="min-h-11 w-full min-w-0 rounded-lg border p-2 text-sm" />
    <label htmlFor={id + '-caption'} className="block text-sm">Подпись фотографии</label>
    <textarea id={id + '-caption'} value={draft.caption} maxLength={500} disabled={disabled || update.isPending} onChange={event => edit('caption', event.target.value)} className="w-full min-w-0 rounded-lg border p-2 text-sm" rows={3} />
    {message && <p role={update.isError ? 'alert' : 'status'} className="text-sm">{message}</p>}
    {conflict && <div className="space-y-2 rounded-lg bg-amber-50 p-2 text-sm">
      <p>Текущее описание: {photo.alt || 'Не указано'}. Текущая подпись: {photo.caption || 'Не указана'}.</p>
      <button type="button" disabled={version <= draft.version} onClick={() => { setDraft(current => ({ ...current, version })); setConflict(false); setMessage('Версия обновлена. Проверьте текст и сохраните.'); }} className="min-h-11 underline disabled:opacity-40">Применить к обновлённой версии</button>
    </div>}
    <button type="submit" disabled={disabled || !dirty || update.isPending || conflict} className="min-h-11 w-full rounded-lg border border-[#006341] p-2 text-sm font-semibold text-[#006341] disabled:opacity-40">{update.isPending ? 'Сохранение…' : 'Сохранить подпись'}</button>
  </form>;
}
