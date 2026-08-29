'use client';

import { useState, type FormEvent } from 'react';
import PolygonFields from './PolygonFields';
import { Button } from '@/ui-components/Button';
import { StructurePager } from './UnitEditor';
import { structureError, useFloorRegions, useRegionCandidates, useSaveFloorRegion, type FloorRegion, type FloorRegions, type RegionUnit } from '@/services/new-buildings/structure';
import { parsePoints, pointDrafts, type PointDraft } from '@/services/new-buildings/geometry';

const unitLabel = (unit: RegionUnit) => `${unit.number ? `№ ${unit.number}` : unit.name || `Квартира #${unit.id}`} · этаж ${unit.floor ?? '?'}${unit.publication_status !== 'published' ? ' · Не опубликована' : ''}`;

export default function FloorRegionManager({ buildingId, planId, canManage, archived }: { buildingId: number; planId: number; canManage: boolean; archived: boolean }) {
  const [page, setPage] = useState(1);
  const [candidatePage, setCandidatePage] = useState(1);
  const [search, setSearch] = useState('');
  const [floor, setFloor] = useState('');
  const [error, setError] = useState('');
  const [editor, setEditor] = useState<{ unit: RegionUnit; region?: FloorRegion; version: number; image: NonNullable<FloorRegions['image']> } | null>(null);
  const query = useFloorRegions(buildingId, planId, page);
  const candidates = useRegionCandidates(buildingId, planId, candidatePage, search, floor);
  const mutation = useSaveFloorRegion(buildingId, planId);

  function open(unit: RegionUnit, region?: FloorRegion) {
    if (!query.data?.image) return;
    if (editor && !confirm('Закрыть текущую разметку без сохранения?')) return;
    setEditor({ unit, region, version: query.data.version, image: query.data.image }); setError('');
  }

  async function remove(region: FloorRegion) {
    if (!query.data || !confirm(`Убрать выделение квартиры ${region.unit.number || region.unit_id}? Сама квартира сохранится.`)) return;
    try { await mutation.mutateAsync({ unitId: region.unit_id, version: query.data.version, remove: true }); setError(''); }
    catch (error) { setError(structureError(error)); }
  }

  return <section className="mt-4 space-y-4 rounded-lg border bg-gray-50 p-4" aria-label="Области квартир на плане">
    <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-semibold">Области квартир на плане</h3><Button size="sm" variant="outline" onClick={() => query.refetch()}>Обновить данные</Button></div>
    <p className="text-sm">Привязывайте контур к конкретной квартире, а не к её позиции в списке. На публичной странице показывается только область открытого лота.</p>
    {error && <p role="alert" className="text-red-700">{error}</p>}
    {query.isError ? <p role="alert">Не удалось загрузить области. Повторите обновление.</p> : query.isLoading ? <p>Загрузка…</p> : <>
      {!query.data?.image && <p>Сначала загрузите чертёж плана этажа.</p>}
      {archived && <p>План архивирован. Можно удалить прежние области, чтобы исправить размещение квартир.</p>}
      {editor && <RegionEditor key={`${editor.unit.id}:${editor.version}`} buildingId={buildingId} planId={planId} initial={editor} readOnly={!canManage || archived} imageUrl={query.data?.image?.id === editor.image.id ? query.data.image.url : editor.image.url} onClose={() => setEditor(null)} />}
      <h4 className="font-medium">Сохранённые области: {query.data?.regions.total ?? 0}</h4>
      <ul className="space-y-2">{query.data?.regions.data.map(region => <li key={region.id} className="flex flex-wrap items-center justify-between gap-2 rounded border bg-white p-3">
        <span className="text-sm">{unitLabel(region.unit)} · {region.points.length} вершин</span>
        <div className="flex flex-wrap gap-2"><Button variant="outline" size="sm" disabled={mutation.isPending} onClick={() => open(region.unit, region)}>{canManage && !archived ? 'Изменить область' : 'Посмотреть область'}</Button>{canManage && <Button variant="outline" size="sm" disabled={!!editor || mutation.isPending} onClick={() => remove(region)}>Убрать область</Button>}</div>
      </li>)}</ul>
      <StructurePager page={page} last={query.data?.regions.last_page ?? 1} onChange={setPage} />
      {canManage && !archived && query.data?.image && <div className="space-y-3 border-t pt-4">
        <h4 className="font-medium">Добавить область квартиры</h4>
        <div className="grid gap-3 md:grid-cols-2"><label className="text-sm">Номер / название<input className="mt-1 w-full rounded border p-2" value={search} onChange={event => { setSearch(event.target.value); setCandidatePage(1); }} /></label><label className="text-sm">Этаж<input inputMode="numeric" className="mt-1 w-full rounded border p-2" value={floor} onChange={event => { if (/^\d*$/.test(event.target.value)) { setFloor(event.target.value); setCandidatePage(1); } }} /></label></div>
        {candidates.isError ? <p role="alert">Квартиры не загрузились. <button className="underline" onClick={() => candidates.refetch()}>Повторить</button></p> : candidates.isLoading ? <p>Загрузка квартир…</p> : <>
          {!candidates.data?.data.length && <p>Подходящих квартир нет. Проверьте корпус, подъезд и этажи в редакторе квартиры.</p>}
          <div className="flex flex-wrap gap-2">{candidates.data?.data.map(unit => <Button key={unit.id} size="sm" variant="outline" onClick={() => open(unit, unit.region ? { ...unit.region, unit } : undefined)}>{unitLabel(unit)}{unit.region ? ' · Область есть' : ''}</Button>)}</div>
          <StructurePager page={candidatePage} last={candidates.data?.last_page ?? 1} onChange={setCandidatePage} />
        </>}
      </div>}
    </>}
  </section>;
}

function RegionEditor({ buildingId, planId, initial, imageUrl, readOnly, onClose }: { buildingId: number; planId: number; initial: { unit: RegionUnit; region?: FloorRegion; version: number; image: NonNullable<FloorRegions['image']> }; imageUrl: string; readOnly: boolean; onClose: () => void }) {
  const mutation = useSaveFloorRegion(buildingId, planId);
  const [drafts, setDrafts] = useState<PointDraft[]>(() => pointDrafts(initial.region?.points ?? []));
  const [error, setError] = useState('');
  async function submit(event: FormEvent) {
    event.preventDefault();
    try { await mutation.mutateAsync({ unitId: initial.unit.id, version: initial.version, drawingId: initial.image.id, points: parsePoints(drafts) }); onClose(); }
    catch (error) { setError(error instanceof Error && !('response' in error) ? error.message : structureError(error)); }
  }
  return <form onSubmit={submit} className="space-y-3 rounded-lg border-2 border-green-800 bg-white p-3" aria-label="Редактор контура квартиры">
    <h4 className="font-semibold">{unitLabel(initial.unit)}</h4>
    {error && <p role="alert" className="text-red-700">{error}</p>}
    {readOnly && <p>Просмотр без права изменения.</p>}
    <fieldset disabled={mutation.isPending || readOnly} className="space-y-3">
      <PolygonFields image={{ ...initial.image, url: imageUrl }} drafts={drafts} onChange={setDrafts} disabled={mutation.isPending || readOnly} />
      {!readOnly && <Button type="submit" disabled={drafts.length < 3}>Сохранить область</Button>}
    </fieldset>
    <Button variant="outline" onClick={onClose}>{readOnly ? 'Закрыть просмотр' : 'Отмена'}</Button>
  </form>;
}
