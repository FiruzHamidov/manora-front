'use client';

import { useState, type FormEvent } from 'react';
import { isAxiosError } from 'axios';
import { useEntranceGridSpaces, useSaveGridSpace, structureError } from '@/services/new-buildings/structure';
import { StructurePager } from './UnitEditor';
import { Button } from '@/ui-components/Button';

type Kind = 'empty_position' | 'technical_floor' | 'unknown';
type Draft = { floor: string; position: string; kind: Kind; reason: string; version: number | null };
const initial: Draft = { floor: '', position: '', kind: 'empty_position', reason: '', version: null };
export default function EntranceGeometryEditor({ buildingId, blockId, entranceId, canManage }: {
  buildingId: number; blockId: number; entranceId: number; canManage: boolean;
}) {
  const [draft, setDraft] = useState<Draft>(initial);
  const [page, setPage] = useState(1);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const floorFilter = /^\d+$/.test(draft.floor) && Number(draft.floor) >= 1 && Number(draft.floor) <= 250 ? Number(draft.floor) : undefined;
  const query = useEntranceGridSpaces(buildingId, blockId, entranceId, page, floorFilter);
  const save = useSaveGridSpace(buildingId, blockId, entranceId);
  const version = draft.version ?? query.data?.version;
  const stale = draft.version !== null && query.data && draft.version !== query.data.version;
  function edit(key: keyof Omit<Draft, 'version'>, value: string) {
    setDraft(previous => ({ ...previous, [key]: value, version: previous.version ?? query.data?.version ?? null }));
    setMessage('');
    if (key === 'floor') setPage(1);
  }
  async function submit(event: FormEvent) {
    event.preventDefault();
    const position = draft.kind === 'technical_floor' ? 0 : Number(draft.position);
    if (!floorFilter || (draft.kind !== 'technical_floor' && !/^\d+$/.test(draft.position)) || position > 250 || (draft.kind === 'empty_position' && position < 1)) {
      setError('Укажите этаж 1–250 и позицию 1–250. Для удаления метки целого этажа укажите позицию 0.'); return;
    }
    if (!version || stale) { setError('Сначала проверьте актуальную версию разметки.'); return; }
    setError(''); setMessage('');
    try {
      const result = await save.mutateAsync({ floor: floorFilter, position, kind: draft.kind, reason: draft.reason.trim() || null, version });
      setDraft(previous => ({ ...previous, reason: '', version: null }));
      setMessage('Разметка сохранена. Версия ' + result.version + '.');
    } catch (err) {
      setError(structureError(err));
      if (isAxiosError(err) && err.response?.status === 409) await query.refetch();
    }
  }
  return <section className="mt-4 min-w-0 space-y-4 rounded-xl border-2 border-green-800 bg-white p-4" aria-label="Геометрия подъезда">
    <h3 className="font-semibold">Пустые места и технические этажи</h3>
    <p className="text-sm text-gray-600">Это разметка здания, не квартиры. Неизвестное место не означает «Продано». Чтобы разместить квартиру здесь, сначала снимите явную метку. Все изменения сохраняются в журнале и требуют повторной проверки ЖК.</p>
    {error && <p role="alert" className="text-red-700">{error}</p>}
    {message && <p role="status" className="text-green-800">{message}</p>}
    <form onSubmit={submit}>
      <fieldset disabled={save.isPending || !canManage} className="space-y-3">
        <div className="grid min-w-0 gap-3 sm:grid-cols-3">
          <label className="min-w-0 text-sm">Этаж (также фильтр списка)
            <input className="mt-1 w-full rounded border p-2" inputMode="numeric" maxLength={3} value={draft.floor} onChange={e => edit('floor', e.target.value)} />
          </label>
          <label className="min-w-0 text-sm">Состояние
            <select className="mt-1 w-full rounded border p-2" value={draft.kind} onChange={e => edit('kind', e.target.value)}>
              <option value="empty_position">Пустое место</option><option value="technical_floor">Технический этаж</option><option value="unknown">Снять явную метку</option>
            </select>
          </label>
          {draft.kind !== 'technical_floor' && <label className="min-w-0 text-sm">Позиция{draft.kind === 'unknown' ? ' (0 — весь этаж)' : ''}
            <input className="mt-1 w-full rounded border p-2" inputMode="numeric" maxLength={3} value={draft.position} onChange={e => edit('position', e.target.value)} />
          </label>}
        </div>
        <label className="block text-sm">Причина изменения<input className="mt-1 w-full rounded border p-2" maxLength={1000} value={draft.reason} onChange={e => edit('reason', e.target.value)} /></label>
        {canManage && <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={!query.data || query.isFetching || Boolean(stale)}>{save.isPending ? 'Сохранение…' : 'Сохранить разметку'}</Button>
          <span className="text-sm text-gray-600">Версия формы: {version ?? '…'}</span>
        </div>}
      </fieldset>
    </form>
    {stale && <div role="alert" className="space-y-2 rounded border border-amber-400 bg-amber-50 p-3 text-sm">
      <p>Подъезд изменился до версии {query.data!.version}. Ввод сохранён. Проверьте актуальный список ниже, прежде чем применять правки.</p>
      <Button variant="outline" disabled={query.isFetching || save.isPending} onClick={() => { setDraft(previous => ({ ...previous, version: query.data!.version })); setError(''); }}>Проверено, использовать версию {query.data!.version}</Button>
    </div>}
    <div className="flex flex-wrap items-center gap-3">
      <h4 className="font-medium">Сохранённая разметка{floorFilter ? ' · этаж ' + floorFilter : ''}</h4>
      <Button variant="outline" disabled={query.isFetching || save.isPending} onClick={() => void query.refetch()}>Обновить разметку</Button>
    </div>
    {query.isError ? <p role="alert">Не удалось загрузить разметку. Повторите обновление.</p> : query.isPending ? <p>Загрузка…</p> : <>
      <p className="text-sm">Записей: {query.data.spaces.total} · Актуальная версия {query.data.version}</p>
      {!query.data.spaces.data.length && <p className="text-sm text-gray-600">Явных меток нет. Остальные пустые ячейки остаются неизвестными.</p>}
      <ul className="space-y-2">
        {query.data.spaces.data.map(space => <li key={space.floor + ':' + space.position} className="flex flex-wrap items-center justify-between gap-2 rounded border p-3 text-sm">
          <span>Этаж {space.floor}{space.position ? ', позиция ' + space.position : ''} · {space.kind === 'technical_floor' ? 'Технический этаж' : 'Пустое место'}</span>
          {canManage && <Button variant="outline" disabled={save.isPending} onClick={() => {
            setDraft({ floor: String(space.floor), position: String(space.position), kind: 'unknown', reason: '', version: query.data.version });
            setPage(1); setError(''); setMessage('Для снятия выбранной метки нажмите «Сохранить разметку».');
          }}>Снять метку</Button>}
        </li>)}
      </ul>
      <StructurePager page={page} last={query.data.spaces.last_page} onChange={setPage} />
    </>}
  </section>;
}
