'use client';

import { useRef, useState, type FormEvent } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import ResidentialImage from '@/ui-components/ResidentialImage';
import { isAxiosError } from 'axios';
import { useBuildingBlocks, useManagedNewBuilding } from '@/services/new-buildings/hooks';
import { useMasterplan, useChangeMasterplan, type ManagedMasterplan } from '@/services/new-buildings/masterplan';
import { structureError } from '@/services/new-buildings/structure';
import { parsePoints, pointDrafts, type PointDraft } from '@/services/new-buildings/geometry';
import PolygonFields from '../../_components/PolygonFields';

const button = 'min-h-11 rounded-xl border border-[#006341] px-3 py-2 text-[#006341] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006341] disabled:opacity-40';
export default function MasterplanPage() {
  const { id } = useParams<{ id: string }>(), buildingId = Number(id);
  const building = useManagedNewBuilding(buildingId), blocks = useBuildingBlocks(buildingId), query = useMasterplan(buildingId), mutation = useChangeMasterplan(buildingId);
  const [mediaEditor, setMediaEditor] = useState(false), [blockId, setBlockId] = useState(''), [error, setError] = useState('');
  const [region, setRegion] = useState<{ blockId: number; name: string; initial: ManagedMasterplan } | null>(null);
  const data = query.data;
  const canManage = building.data?.capabilities?.manage === true && !building.isError && !query.isError;
  const disabled = !canManage || mutation.isPending || mediaEditor || !!region;
  async function remove(drawingId: number, block?: number) {
    if (!data || !confirm(block ? 'Убрать область с генплана? Корпус и квартиры сохранятся.' : 'Удалить генплан? Его публичная ссылка перестанет работать.')) return;
    try { await mutation.mutateAsync({ action: block ? 'remove-region' : 'delete', version: data.version, drawingId, blockId: block }); setError(''); }
    catch (e) { setError(structureError(e)); }
  }
  if (building.isLoading || query.isLoading) return <p>Загрузка генплана…</p>;
  if (!building.data?.data) return <p role="alert">ЖК недоступен.</p>;
  return <div className="min-w-0 space-y-5">
    <h1 className="text-2xl font-bold">Генплан — {building.data.data.title}</h1>
    <Link href={'/admin/new-buildings/' + buildingId} className="inline-flex min-h-11 items-center text-green-800 underline">← К жилому комплексу</Link>
    <p>Один отдельный генплан ЖК. Изменение изображения, подписи или областей требует повторной модерации. Перед заменой изображения удалите его области.</p>
    <button className={button} disabled={query.isFetching} onClick={() => void query.refetch()}>Обновить данные генплана</button>
    {(query.isError || building.isError) && <p role="alert" className="text-red-700">Актуальные данные не загружены. Редактирование приостановлено; введённый текст сохранён.</p>}
    {error && <p role="alert" className="text-red-700">{error}</p>}
    {data && <>
      <p className="text-sm">Версия ЖК: {data.version}</p>
      {data.image ? <figure className="space-y-3 rounded-2xl border bg-white p-4">
        <ResidentialImage image={data.image} sizes="(max-width: 1023px) 100vw, 1000px" width={data.image.width || 1000} height={data.image.height || 1000} alt={data.image.alt} className="max-h-96 w-full object-contain" />
        {data.image.original_download_url && <a href={data.image.original_download_url} className="block min-h-11 text-sm underline" rel="noreferrer">Скачать оригинал</a>}
        <figcaption>{data.image.alt}{data.image.caption && <p className="mt-2 text-sm">{data.image.caption}</p>}</figcaption>
        {canManage && <div className="flex flex-wrap gap-3"><button className={button} disabled={disabled} onClick={() => setMediaEditor(true)}>Изменить подпись генплана</button><button className={button} disabled={disabled || data.regions.length > 0} onClick={() => void remove(data.image!.id)}>Удалить генплан</button></div>}
      </figure> : <p>Генплан не загружен. Секция не показывается публично.</p>}
      {!data.image && canManage && <button className={button} disabled={disabled} onClick={() => setMediaEditor(true)}>Добавить генплан</button>}
      {mediaEditor && <MasterplanMediaForm buildingId={buildingId} current={data} disabled={!canManage} onClose={() => setMediaEditor(false)} />}
      <h2 className="text-xl font-semibold">Области корпусов: {data.regions.length}</h2>
      {region && <MasterplanRegionForm buildingId={buildingId} blockId={region.blockId} name={region.name} initial={region.initial} current={data} disabled={!canManage} onClose={() => { setRegion(null); setBlockId(''); }} />}
      <ul className="space-y-3">{data.regions.map(item => <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3">
        <span>{item.block.name}{item.block.archived_at ? ' · Архив' : ''} · {item.points.length} вершин</span>
        <div className="flex flex-wrap gap-2"><button className={button} disabled={disabled || !!item.block.archived_at} onClick={() => setRegion({ blockId: item.block_id, name: item.block.name, initial: data })}>Изменить область {item.block.name}</button><button className={button} disabled={disabled} onClick={() => void remove(data.image!.id, item.block_id)}>Убрать область {item.block.name}</button></div>
      </li>)}</ul>
      {data.image && canManage && <div className="space-y-3 rounded-xl border p-4">
        <label className="block">Корпус для новой области<select className="mt-2 block min-h-11 w-full rounded border p-2" value={blockId} disabled={disabled || blocks.isError} onChange={event => setBlockId(event.target.value)}><option value="">Выберите корпус</option>{blocks.data?.filter(block => !block.archived_at && !data.regions.some(region => region.block_id === block.id)).map(block => <option key={block.id} value={block.id}>{block.name}</option>)}</select></label>
        {blocks.isError && <p role="alert">Корпуса не загрузились. <button className={button} onClick={() => void blocks.refetch()}>Повторить загрузку корпусов</button></p>}
        <button className={button} disabled={disabled || !blockId || blocks.isError} onClick={() => { const block = blocks.data?.find(item => item.id === Number(blockId)); if (block) setRegion({ blockId: block.id, name: block.name, initial: data }); }}>Разметить корпус</button>
      </div>}
    </>}
  </div>;
}

function MasterplanMediaForm({ buildingId, current, disabled, onClose }: { buildingId: number; current: ManagedMasterplan; disabled: boolean; onClose: () => void }) {
  const initial = useRef(current).current;
  const [version, setVersion] = useState(initial.version), [alt, setAlt] = useState(initial.image?.alt ?? ''), [caption, setCaption] = useState(initial.image?.caption ?? '');
  const [file, setFile] = useState<File | null>(null), [error, setError] = useState(''), [conflict, setConflict] = useState(false);
  const mutation = useChangeMasterplan(buildingId);
  const replaced = initial.image?.id !== current.image?.id;
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (disabled || conflict || replaced || mutation.isPending) return;
    try { await mutation.mutateAsync({ action: initial.image ? 'metadata' : 'upload', version, drawingId: initial.image?.id, file: file ?? undefined, alt: alt.trim(), caption: caption.trim() || null }); onClose(); }
    catch (e) { setError(structureError(e)); setConflict(isAxiosError(e) && e.response?.status === 409); }
  }
  return <form onSubmit={submit} className="space-y-3 rounded-xl border-2 border-green-800 bg-white p-4" aria-label="Редактор изображения генплана">
    {error && <p role="alert">{error}</p>}
    {replaced && <p role="alert">Изображение заменено или удалено. Закройте редактор и откройте актуальный генплан; прежняя подпись не будет применена к чужому изображению.</p>}
    <fieldset disabled={disabled || mutation.isPending || replaced} className="space-y-3">
      {!initial.image && <label className="block">Файл генплана (до 10 МБ)<input type="file" required accept="image/jpeg,image/png,image/webp,image/avif" className="mt-2 block w-full min-w-0" onChange={event => setFile(event.target.files?.[0] ?? null)} /></label>}
      <label className="block">Описание генплана для доступности<input required maxLength={250} className="mt-2 min-h-11 w-full rounded border p-2" value={alt} onChange={event => setAlt(event.target.value)} /></label>
      <label className="block">Подпись генплана<textarea maxLength={500} className="mt-2 w-full rounded border p-2" value={caption} onChange={event => setCaption(event.target.value)} /></label>
      {conflict && <div className="space-y-2 bg-amber-50 p-3"><p>Текущая подпись: {current.image?.caption || 'Не указана'}. Описание: {current.image?.alt || 'Не указано'}.</p><button type="button" className={button} disabled={current.version <= version} onClick={() => { setVersion(current.version); setConflict(false); setError(''); }}>Подтвердить новую версию генплана</button></div>}
      <button type="submit" className={button} disabled={conflict || (!initial.image && !file)}>Сохранить генплан</button>
    </fieldset>
    <button type="button" className={button} disabled={mutation.isPending} onClick={onClose}>Закрыть редактор изображения</button>
  </form>;
}

function MasterplanRegionForm({ buildingId, blockId, name, initial, current, disabled, onClose }: { buildingId: number; blockId: number; name: string; initial: ManagedMasterplan; current: ManagedMasterplan; disabled: boolean; onClose: () => void }) {
  const [version, setVersion] = useState(initial.version), [drafts, setDrafts] = useState<PointDraft[]>(() => pointDrafts(initial.regions.find(item => item.block_id === blockId)?.points ?? []));
  const [error, setError] = useState(''), [conflict, setConflict] = useState(false);
  const mutation = useChangeMasterplan(buildingId);
  const replaced = initial.image?.id !== current.image?.id;
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (disabled || conflict || replaced || mutation.isPending) return;
    try { await mutation.mutateAsync({ action: 'region', blockId, version, drawingId: initial.image!.id, points: parsePoints(drafts) }); onClose(); }
    catch (e) { setError(isAxiosError(e) ? structureError(e) : e instanceof Error ? e.message : 'Не удалось сохранить'); setConflict(isAxiosError(e) && e.response?.status === 409); }
  }
  return <form onSubmit={submit} className="space-y-3 rounded-xl border-2 border-green-800 bg-white p-4" aria-label="Редактор области корпуса">
    <h3 className="break-words font-semibold">{name}</h3>
    {error && <p role="alert">{error}</p>}
    {replaced && <p role="alert">Генплан заменён. Введённые координаты сохранены здесь, но не будут применены к другому изображению. Начните разметку нового генплана заново.</p>}
    <PolygonFields image={replaced ? initial.image! : current.image!} drafts={drafts} onChange={setDrafts} disabled={disabled || mutation.isPending || replaced} />
    {conflict && <div className="space-y-2 rounded bg-amber-50 p-3"><p>Текущие вершины корпуса, X/Y в процентах: {pointDrafts(current.regions.find(item => item.block_id === blockId)?.points ?? []).map(point => point.x + '/' + point.y).join('; ') || 'Область отсутствует'}.</p><button type="button" className={button} disabled={disabled || replaced || current.version <= version} onClick={() => { setVersion(current.version); setConflict(false); setError(''); }}>Подтвердить новую версию генплана</button></div>}
    <div className="flex flex-wrap gap-3"><button className={button} type="submit" disabled={disabled || replaced || conflict || mutation.isPending || drafts.length < 3}>Сохранить область корпуса</button><button type="button" className={button} disabled={mutation.isPending} onClick={onClose}>Закрыть редактор области</button></div>
  </form>;
}
