'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { axios } from '@/utils/axios';
import type { BuildingUnit, PublicationStatus } from '@/services/new-buildings/types';
import { invalidatePublicInventory } from '@/services/new-buildings/invalidate-public-inventory';

export function UnitModerationControls({ buildingId, unit }: { buildingId: number; unit: BuildingUnit }) {
  const cache = useQueryClient();
  const [checked, setChecked] = useState(false);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const moderate = async (status: PublicationStatus) => {
    setBusy(true); setError('');
    try {
      await axios.patch(`/moderation/new-buildings/${buildingId}/units/${unit.id}`, { version: unit.version, status, reason: reason || null });
      setChecked(false);
      await Promise.all([
        cache.invalidateQueries({ queryKey: ['new-buildings', buildingId, 'units'] }),
        cache.invalidateQueries({ queryKey: ['manage-new-buildings'] }),
        cache.invalidateQueries({ queryKey: ['catalog-new-buildings'] }),
        invalidatePublicInventory(cache, buildingId),
      ]);
    } catch (failure) {
      setError(isAxiosError(failure) ? failure.response?.data?.message || 'Не удалось изменить публикацию.' : 'Не удалось изменить публикацию.');
    } finally { setBusy(false); }
  };
  return <details className="min-w-44 max-w-xs whitespace-normal text-left">
    <summary className="cursor-pointer text-sm font-medium text-[#006341]">Модерация</summary>
    <div className="mt-3 space-y-3 rounded-lg border p-3">
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      <label className="flex gap-2 text-sm"><input type="checkbox" checked={checked} onChange={(event) => setChecked(event.target.checked)} />Данные и изображения квартиры проверены</label>
      <label className="block text-sm">Причина решения<textarea value={reason} maxLength={1000} onChange={(event) => setReason(event.target.value)} className="mt-1 w-full rounded border p-2" /></label>
      <div className="flex flex-wrap gap-2">
        <button type="button" disabled={busy || !checked} onClick={() => void moderate('published')} className="rounded bg-[#006341] px-3 py-2 text-sm text-white disabled:opacity-50">Опубликовать</button>
        <button type="button" disabled={busy || !reason.trim()} onClick={() => void moderate('rejected')} className="rounded border px-3 py-2 text-sm disabled:opacity-50">Отклонить</button>
      </div>
    </div>
  </details>;
}
