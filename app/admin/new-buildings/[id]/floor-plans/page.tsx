'use client';

import { useState, type FormEvent } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/ui-components/Button';
import { useBuildingBlocks, useManagedNewBuilding } from '@/services/new-buildings/hooks';
import { structureError, useEntrances, useFloorPlans, useSaveStructure } from '@/services/new-buildings/structure';
import type { BuildingFloorPlan } from '@/services/new-buildings/types';
import { StructurePager } from '@/app/admin/new-buildings/_components/UnitEditor';
import DrawingManager from '@/app/admin/new-buildings/_components/DrawingManager';
import FloorRegionManager from '@/app/admin/new-buildings/_components/FloorRegionManager';

export default function FloorPlansPage() {
  const params = useParams<{ id: string }>();
  const buildingId = Number(params.id);
  const building = useManagedNewBuilding(buildingId);
  const blocks = useBuildingBlocks(buildingId);
  const [blockId, setBlockId] = useState<number>();
  const [page, setPage] = useState(1);
  const [editor, setEditor] = useState<BuildingFloorPlan | 'new' | null>(null);
  const [drawings, setDrawings] = useState<number | null>(null);
  const [regions, setRegions] = useState<number | null>(null);
  const [error, setError] = useState('');
  const query = useFloorPlans(buildingId, blockId, page);
  const mutation = useSaveStructure(buildingId, 'floor-plans');
  const canManage = building.data?.capabilities?.manage === true;

  function leave(action: () => void) {
    if ((editor || drawings || regions) && !confirm('Закрыть открытый редактор? Несохранённые изменения будут потеряны.')) return;
    setEditor(null); setDrawings(null); setRegions(null); setError(''); action();
  }

  async function archive(entry: BuildingFloorPlan) {
    if (!confirm(`${entry.archived_at ? 'Восстановить' : 'Архивировать'} план? Квартиры сохранятся. Архивный чертёж не показывается публично.`)) return;
    try { await mutation.mutateAsync({ id: entry.id, payload: { version: entry.version, archive: !entry.archived_at } }); setError(''); }
    catch (error) { setError(structureError(error)); }
  }

  if (building.isLoading) return <p>Загрузка…</p>;
  if (!building.data?.data) return <p role="alert">ЖК недоступен.</p>;
  return <div className="space-y-5">
    <h1 className="text-2xl font-semibold">Планы этажей — {building.data.data.title}</h1>
    <Link className="text-green-800 underline" href={`/admin/new-buildings/${buildingId}/structure`}>← Подъезды и планировки</Link>
    <p className="text-sm text-gray-600">Для каждого чертежа укажите реальный корпус и этажи. План подъезда имеет приоритет перед общим планом корпуса. Пересекающиеся диапазоны одного подъезда запрещены.</p>
    <label className="block text-sm">Корпус<select className="mt-1 block w-full max-w-md rounded border p-2" value={blockId ?? ''} onChange={event => leave(() => { setBlockId(Number(event.target.value) || undefined); setPage(1); })}><option value="">Все корпуса</option>{blocks.data?.map(block => <option key={block.id} value={block.id}>{block.name}{block.archived_at ? ' (архив)' : ''}</option>)}</select></label>
    {error && <p role="alert" className="text-red-700">{error}</p>}
    {canManage && <Button onClick={() => leave(() => setEditor('new'))}>Добавить план этажа</Button>}
    {editor && <FloorPlanForm key={editor === 'new' ? 'new' : editor.id} buildingId={buildingId} blockId={blockId} entry={editor === 'new' ? null : editor} onClose={() => setEditor(null)} />}
    {query.isError ? <p role="alert">Не удалось загрузить планы. <button onClick={() => query.refetch()} className="underline">Повторить</button></p> : query.isLoading ? <p>Загрузка списка…</p> : <>
      {!query.data?.data.length && <p>Планы этажей ещё не добавлены.</p>}
      <div className="space-y-4">{query.data?.data.map(entry => <article key={entry.id} className="rounded-xl border bg-white p-4">
        <h2 className="font-semibold">{entry.name}{entry.archived_at ? ' · Архив' : ''}</h2>
        <p className="text-sm">{entry.block?.name} · {entry.entrance ? entry.entrance.name : 'Весь корпус'} · Этажи {entry.floor_from}–{entry.floor_to} · Версия {entry.version}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => leave(() => setDrawings(entry.id))}>Чертёж</Button>
          <Button variant="outline" onClick={() => leave(() => setRegions(entry.id))}>Области квартир</Button>
          {canManage && <><Button variant="outline" disabled={mutation.isPending} onClick={() => leave(() => setEditor(entry))}>Редактировать</Button><Button variant="outline" disabled={mutation.isPending || !!editor || !!drawings || !!regions} onClick={() => archive(entry)}>{entry.archived_at ? 'Восстановить' : 'Архивировать'}</Button></>}
        </div>
        {regions === entry.id && <FloorRegionManager buildingId={buildingId} planId={entry.id} canManage={canManage} archived={!!entry.archived_at} />}
        {drawings === entry.id && <DrawingManager buildingId={buildingId} kind="floor-plans" ownerId={entry.id} canManage={canManage && !entry.archived_at} />}
      </article>)}</div>
      <StructurePager page={page} last={query.data?.last_page ?? 1} onChange={value => leave(() => setPage(value))} />
    </>}
  </div>;
}

function FloorPlanForm({ buildingId, blockId: initialBlock, entry, onClose }: { buildingId: number; blockId?: number; entry: BuildingFloorPlan | null; onClose: () => void }) {
  const blocks = useBuildingBlocks(buildingId);
  const [blockId, setBlockId] = useState(entry?.block_id ?? initialBlock);
  const [entranceId, setEntranceId] = useState(entry?.entrance_id ?? null);
  const [entrancePage, setEntrancePage] = useState(1);
  const entrances = useEntrances(buildingId, blockId, entrancePage);
  const [selected, setSelected] = useState(entry?.entrance ?? null);
  const [name, setName] = useState(entry?.name ?? '');
  const [from, setFrom] = useState(String(entry?.floor_from ?? ''));
  const [to, setTo] = useState(String(entry?.floor_to ?? ''));
  const [error, setError] = useState('');
  const mutation = useSaveStructure(buildingId, 'floor-plans');
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!/^\d+$/.test(from) || !/^\d+$/.test(to)) { setError('Укажите целые номера этажей.'); return; }
    try {
      await mutation.mutateAsync({ id: entry?.id, payload: {
        ...(entry ? { version: entry.version } : { block_id: blockId }),
        entrance_id: entranceId, name, floor_from: Number(from), floor_to: Number(to),
      } }); onClose();
    } catch (error) { setError(structureError(error)); }
  }
  return <form onSubmit={submit} className="space-y-4 rounded-xl border-2 border-green-800 bg-white p-5">
    <h2 className="font-semibold">{entry ? 'Изменить план этажа' : 'Новый план этажа'}</h2>
    {error && <p role="alert" className="text-red-700">{error}</p>}
    <fieldset disabled={mutation.isPending} className="space-y-4">
      <label className="block text-sm">Название<input required maxLength={160} className="mt-1 w-full rounded border p-2" value={name} onChange={event => setName(event.target.value)} /></label>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block text-sm">Корпус<select required disabled={!!entry} className="mt-1 w-full rounded border p-2" value={blockId ?? ''} onChange={event => { setBlockId(Number(event.target.value) || undefined); setEntranceId(null); setSelected(null); setEntrancePage(1); }}><option value="">Выберите корпус</option>{blocks.data?.map(block => <option key={block.id} value={block.id} disabled={!!block.archived_at}>{block.name}</option>)}</select></label>
        <div><label className="block text-sm">Подъезд<select disabled={!blockId} className="mt-1 w-full rounded border p-2" value={entranceId ?? ''} onChange={event => { const id = Number(event.target.value) || null; setEntranceId(id); setSelected(entrances.data?.data.find(item => item.id === id) ?? null); }}><option value="">Общий план корпуса</option>{selected && !entrances.data?.data.some(item => item.id === selected.id) && <option value={selected.id}>{selected.name}</option>}{entrances.data?.data.map(item => <option key={item.id} value={item.id} disabled={!!item.archived_at}>{item.name}{item.archived_at ? ' (архив)' : ''}</option>)}</select></label>{entrances.isError && <p role="alert">Подъезды не загрузились. <button type="button" className="underline" onClick={() => entrances.refetch()}>Повторить</button></p>}<StructurePager page={entrancePage} last={entrances.data?.last_page ?? 1} onChange={setEntrancePage} /></div>
        <label className="block text-sm">Первый этаж<input required inputMode="numeric" className="mt-1 w-full rounded border p-2" value={from} onChange={event => setFrom(event.target.value)} /></label>
        <label className="block text-sm">Последний этаж<input required inputMode="numeric" className="mt-1 w-full rounded border p-2" value={to} onChange={event => setTo(event.target.value)} /></label>
      </div>
      <p className="text-sm text-gray-600">Для одного этажа укажите одинаковые значения. Сначала сохраните привязку, затем загрузите чертёж.</p>
      <div className="flex flex-wrap gap-3"><Button type="submit">Сохранить</Button><Button variant="outline" onClick={onClose}>Отмена</Button></div>
    </fieldset>
  </form>;
}
