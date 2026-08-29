'use client';

import { useState, type FormEvent } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { isAxiosError } from 'axios';
import { useManagedNewBuilding, useBuildingBlocks } from '@/services/new-buildings/hooks';
import { useEntrances, useLayouts, useSaveStructure, type StructurePayload } from '@/services/new-buildings/structure';
import type { BuildingEntrance, UnitLayout } from '@/services/new-buildings/types';
import { StructurePager } from '@/app/admin/new-buildings/_components/UnitEditor';
import { Button } from '@/ui-components/Button';
import DrawingManager from '@/app/admin/new-buildings/_components/DrawingManager';
import EntranceGeometryEditor from '@/app/admin/new-buildings/_components/EntranceGeometryEditor';

type Kind = 'entrances' | 'layouts';
type Entry = BuildingEntrance | UnitLayout;
const fields: Record<Kind, { key: string; label: string; mode?: 'numeric' | 'decimal' }[]> = {
  entrances: [
    { key: 'name', label: 'Название / номер подъезда' },
    { key: 'residential_floor_from', label: 'Первый жилой этаж', mode: 'numeric' },
    { key: 'residential_floor_to', label: 'Последний жилой этаж', mode: 'numeric' },
    { key: 'positions_per_floor', label: 'Количество позиций на этаже', mode: 'numeric' },
    { key: 'sort_order', label: 'Порядок', mode: 'numeric' },
  ],
  layouts: [
    { key: 'code', label: 'Стабильный код планировки' }, { key: 'name', label: 'Название' },
    { key: 'rooms', label: 'Комнатность: 0 — подтверждённая студия', mode: 'numeric' },
    { key: 'area', label: 'Типовая общая площадь, м²', mode: 'decimal' },
    { key: 'living_area', label: 'Типовая жилая площадь, м²', mode: 'decimal' },
    { key: 'kitchen_area', label: 'Типовая кухня, м²', mode: 'decimal' },
  ],
};

export default function StructurePage() {
  const params = useParams<{ id: string }>();
  const buildingId = Number(params.id);
  const building = useManagedNewBuilding(buildingId);
  const blocks = useBuildingBlocks(buildingId);
  const [kind, setKind] = useState<Kind>('entrances');
  const [blockId, setBlockId] = useState<number>();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [editor, setEditor] = useState<Entry | 'new' | null>(null);
  const [drawings, setDrawings] = useState<number | null>(null);
  const [geometry, setGeometry] = useState<number | null>(null);
  const [error, setError] = useState('');
  const entrances = useEntrances(buildingId, blockId, kind === 'entrances' ? page : 1);
  const layouts = useLayouts(buildingId, kind === 'layouts' ? page : 1, search);
  const mutation = useSaveStructure(buildingId, kind, blockId);
  const query = kind === 'entrances' ? entrances : layouts;
  const canManage = building.data?.capabilities?.manage === true;

  function changeContext(action: () => void) {
    if ((editor || drawings || geometry) && !confirm('Закрыть редактор без сохранения?')) return;
    setEditor(null); setDrawings(null); setGeometry(null); setError(''); action();
  }

  async function archive(entry: Entry) {
    const action = entry.archived_at ? 'Восстановить' : 'Архивировать';
    if (!confirm(`${action} запись? Связанных квартир: ${entry.units_count}. Квартиры и их фактические параметры сохранятся.`)) return;
    try { await mutation.mutateAsync({ id: entry.id, payload: { version: entry.version, archive: !entry.archived_at, reason: `${action}: управление структурой ЖК` } }); setError(''); }
    catch (error) { setError(isAxiosError(error) && error.response?.status === 409 ? 'Запись изменилась. Обновите список и проверьте её перед повтором.' : 'Не удалось изменить архивный статус. Проверьте состояние корпуса.'); }
  }

  if (building.isLoading) return <p>Загрузка…</p>;
  if (!building.data?.data) return <p role="alert">ЖК недоступен.</p>;
  return <div className="min-w-0 space-y-5">
    <h1 className="break-words text-2xl font-semibold">Подъезды и планировки — {building.data.data.title}</h1>
    <Link className="text-green-800 underline" href={`/admin/new-buildings/${buildingId}`}>← К управлению ЖК</Link>
    <p className="text-sm text-gray-600">Подъезд задаёт реальную геометрию фонда. Планировка — повторно используемый тип; её изменение не перезаписывает параметры квартир. Новые данные требуют повторной проверки ЖК.</p>
    <Link className="block text-green-800 underline" href={`/admin/new-buildings/${buildingId}/floor-plans`}>Планы этажей →</Link>
    <div className="flex flex-wrap gap-3" aria-label="Раздел структуры">
      <Button aria-pressed={kind === 'entrances'} variant={kind === 'entrances' ? 'primary' : 'outline'} onClick={() => changeContext(() => { setKind('entrances'); setPage(1); })}>Подъезды</Button>
      <Button aria-pressed={kind === 'layouts'} variant={kind === 'layouts' ? 'primary' : 'outline'} onClick={() => changeContext(() => { setKind('layouts'); setPage(1); })}>Планировки</Button>
    </div>
    {kind === 'entrances' ? <div className="min-w-0 space-y-2"><label className="block min-w-0">Корпус<select className="mt-2 block min-w-0 w-full max-w-full rounded border p-2" value={blockId ?? ''} onChange={event => changeContext(() => { setBlockId(Number(event.target.value) || undefined); setPage(1); })}><option value="">Выберите корпус</option>{blocks.data?.map(block => <option key={block.id} value={block.id}>{block.name}{block.archived_at ? ' (архив)' : ''}</option>)}</select></label><Link className="break-words text-sm underline" href={`/admin/new-buildings/${buildingId}/blocks`}>Управление корпусами</Link></div>
      : <label className="block min-w-0">Поиск по коду<input className="mt-2 block min-w-0 w-full max-w-full rounded border p-2" value={search} onChange={event => { setSearch(event.target.value); setPage(1); }} /></label>}
    {error && <p role="alert" className="text-red-700">{error}</p>}
    {(kind === 'layouts' || blockId) && <>
      {canManage && <Button onClick={() => changeContext(() => setEditor('new'))}>Добавить {kind === 'entrances' ? 'подъезд' : 'планировку'}</Button>}
      {editor && <StructureForm key={`${kind}:${blockId}:${editor === 'new' ? 'new' : editor.id}`} kind={kind} buildingId={buildingId} blockId={blockId} entry={editor === 'new' ? null : editor} onClose={() => setEditor(null)} />}
      {query.isError ? <p role="alert">Не удалось загрузить записи. <button className="underline" onClick={() => query.refetch()}>Повторить</button></p> : query.isLoading ? <p>Загрузка списка…</p> : <>
        {!query.data?.data.length && <p>Записей пока нет.</p>}
        <div className="space-y-3">{query.data?.data.map(entry => <article key={entry.id} className="rounded-xl border bg-white p-4">
          <h2 className="font-semibold">{'code' in entry ? `${entry.code} ${entry.name ?? ''}` : entry.name}{entry.archived_at ? ' · Архив' : ''}</h2>
          <p className="text-sm text-gray-600">{'code' in entry ? `${entry.rooms === 0 ? 'Студия' : entry.rooms == null ? 'Комнатность неизвестна' : `${entry.rooms} комн.`} · ${entry.area ?? 'Площадь неизвестна'}${entry.area ? ' м²' : ''}` : `Жилые этажи: ${entry.residential_floor_from ?? '?'}–${entry.residential_floor_to ?? '?'} · Позиций: ${entry.positions_per_floor ?? 'неизвестно'}`}</p>
          <p className="text-sm">Связанных квартир: {entry.units_count} · Версия {entry.version}</p>
          {kind === 'entrances' && <Button className="mt-3" variant="outline" onClick={() => changeContext(() => setGeometry(entry.id))}>Пустые места и технические этажи</Button>}
          {kind === 'entrances' && geometry === entry.id && blockId && <EntranceGeometryEditor buildingId={buildingId} blockId={blockId} entranceId={entry.id} canManage={canManage && !entry.archived_at} />}
          {canManage && <div className="mt-3 flex flex-wrap gap-3"><Button variant="outline" disabled={mutation.isPending} onClick={() => changeContext(() => setEditor(entry))}>Редактировать</Button><Button variant="outline" disabled={mutation.isPending} onClick={() => archive(entry)}>{entry.archived_at ? 'Восстановить' : 'Архивировать'}</Button></div>}
          {kind === 'layouts' && <Button className="mt-3" variant="outline" onClick={() => changeContext(() => setDrawings(entry.id))}>Чертежи планировки</Button>}
          {kind === 'layouts' && drawings === entry.id && <DrawingManager buildingId={buildingId} kind="layouts" ownerId={entry.id} canManage={canManage && !entry.archived_at} />}
        </article>)}</div>
        <StructurePager page={page} last={query.data?.last_page ?? 1} onChange={value => changeContext(() => setPage(value))} />
      </>}
    </>}
  </div>;
}

function StructureForm({ kind, buildingId, blockId, entry, onClose }: { kind: Kind; buildingId: number; blockId?: number; entry: Entry | null; onClose: () => void }) {
  const [values, setValues] = useState<Record<string, string>>(() => Object.fromEntries(fields[kind].map(({ key }) => [key, entry && key in entry ? String((entry as unknown as Record<string, unknown>)[key] ?? '') : ''])));
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const save = useSaveStructure(buildingId, kind, blockId);
  async function submit(event: FormEvent) {
    event.preventDefault();
    const payload: StructurePayload = { reason: reason || null, ...(entry ? { version: entry.version } : {}) };
    for (const { key, mode } of fields[kind]) {
      const value = values[key].trim();
      if (mode === 'numeric' && value && !/^\d+$/.test(value)) { setError('Для этажей, позиций и комнатности укажите целые числа.'); return; }
      payload[key] = value === '' ? (key === 'sort_order' ? 0 : null) : mode === 'numeric' ? Number(value) : mode === 'decimal' ? value.replace(',', '.') : value;
    }
    try { await save.mutateAsync({ id: entry?.id, payload }); onClose(); }
    catch (error) { setError(isAxiosError(error) ? error.response?.status === 409 ? 'Запись изменилась. Правки остались в форме; сравните с актуальной записью, затем откройте редактор заново.' : Object.values(error.response?.data?.errors ?? {}).flat().join(' ') || 'Ошибка сохранения.' : 'Ошибка сохранения.'); }
  }
  return <form onSubmit={submit} className="rounded-xl border-2 border-green-800 bg-white p-5">
    <h2 className="mb-4 font-semibold">{entry ? 'Изменение записи' : 'Новая запись'}</h2>
    {error && <p className="mb-4 text-red-700" role="alert">{error}</p>}
    <fieldset disabled={save.isPending} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">{fields[kind].map(({ key, label, mode }) => <label key={key} className="text-sm">{label}<input className="mt-1 w-full rounded border p-2" inputMode={mode} value={values[key]} onChange={event => setValues(previous => ({ ...previous, [key]: event.target.value }))} /></label>)}</div>
      <label className="block min-w-0 text-sm">Комментарий<input className="mt-2 block min-w-0 w-full max-w-full rounded border p-2" value={reason} onChange={event => setReason(event.target.value)} /></label>
      <div className="flex flex-wrap gap-3"><Button type="submit">{save.isPending ? 'Сохранение…' : 'Сохранить'}</Button><Button type="button" variant="outline" onClick={onClose}>Отмена</Button></div>
    </fieldset>
  </form>;
}
