'use client';

import { useState, type FormEvent } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { isAxiosError } from 'axios';
import { useManagedNewBuilding } from '@/services/new-buildings/hooks';
import { nearbyCategories, distanceMethods, nearbyDistance, type NearbyPlace, type NearbyPlaceInput, type NearbyPlacesResponse } from '@/services/new-buildings/nearby-places';
import { useNearbyPlaces, useChangeNearbyPlace } from '@/services/new-buildings/use-nearby-places';
import { structureError } from '@/services/new-buildings/structure';

const button = 'min-h-11 max-w-full break-words rounded-xl border border-[#006341] px-3 py-2 text-[#006341] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006341] disabled:opacity-40';
const empty: NearbyPlaceInput = { name: '', category: 'school', latitude: null, longitude: null, source: '', distance_m: null, distance_method: null, distance_source: null, verified_at: null };
export default function NearbyPlacesPage() {
  const { id } = useParams<{ id: string }>(), buildingId = Number(id);
  const building = useManagedNewBuilding(buildingId), query = useNearbyPlaces(buildingId), mutation = useChangeNearbyPlace(buildingId);
  const [editor, setEditor] = useState<{ place: NearbyPlace | null; version: number } | null>(null), [removing, setRemoving] = useState<{ place: NearbyPlace; version: number } | null>(null), [error, setError] = useState('');
  const canManage = building.data?.capabilities?.manage === true && !building.isError && !query.isError;
  async function remove() {
    if (!removing || !query.data || !canManage || mutation.isPending) return;
    try { await mutation.mutateAsync({ id: removing.place.id, version: removing.version, remove: true }); setRemoving(null); setError(''); }
    catch (e) { setError(structureError(e)); setRemoving(null); }
  }
  if (building.isLoading || query.isLoading) return <p>Загрузка инфраструктуры…</p>;
  if (!building.data?.data) return <p role="alert">ЖК недоступен.</p>;
  return <div className="min-w-0 space-y-5">
    <h1 className="break-words text-2xl font-bold">Инфраструктура — {building.data.data.title}</h1>
    <Link href={'/admin/new-buildings/' + buildingId} className="inline-flex min-h-11 items-center text-green-800 underline">← К жилому комплексу</Link>
    <p>Сохраняйте реальные объекты, источник и дату проверки. Записи без даты и координат не публикуются. После изменения нужна повторная модерация ЖК. Время в пути не вычисляется из расстояния.</p>
    <button className={button} disabled={query.isFetching || building.isFetching} onClick={() => { void query.refetch(); void building.refetch(); }}>Обновить инфраструктуру</button>
    {(query.isError || building.isError) && <p role="alert">Данные не загружены. Введённые поля сохранены, отправка приостановлена.</p>}
    {error && <p role="alert">{error}</p>}
    {query.data && <>
      <p>Объектов: {query.data.places.length} / 200 · Версия ЖК: {query.data.version}</p>
      {canManage && <button className={button} disabled={!!editor || !!removing || query.data.places.length >= 200} onClick={() => setEditor({ place: null, version: query.data!.version })}>Добавить объект рядом</button>}
      {editor && <NearbyPlaceForm buildingId={buildingId} initial={editor} current={query.data} disabled={!canManage} onClose={() => setEditor(null)} />}
      {removing && <div role="group" aria-label="Подтверждение удаления объекта" className="space-y-3 rounded-xl border border-red-300 p-4"><p>Удалить «{removing.place.name}»? Изменение останется в журнале ЖК.</p><div className="flex flex-wrap gap-3"><button className={button} disabled={!canManage || mutation.isPending} onClick={() => void remove()}>Подтвердить удаление объекта</button><button className={button} disabled={mutation.isPending} onClick={() => setRemoving(null)}>Отмена удаления</button></div></div>}
      {!query.data.places.length && <p>Объекты рядом ещё не добавлены.</p>}
      <ul className="space-y-3">{query.data.places.map(place => <li key={place.id} className="min-w-0 space-y-2 break-words rounded-xl border bg-white p-4">
        <h2 className="text-lg font-semibold">{place.name}</h2><p>{nearbyCategories[place.category]} · {nearbyDistance(place)}</p>
        <p>Координаты: {place.latitude ?? '—'}, {place.longitude ?? '—'}</p><p>Источник: {place.source}</p>
        {place.distance_source && <p>Источник расстояния: {place.distance_source}</p>}
        <p>{place.verified_at ? 'Дата проверки: ' + place.verified_at.split('-').reverse().join('.') : 'Не проверен · скрыт на сайте'}</p>
        {canManage && <div className="flex flex-wrap gap-3"><button className={button} disabled={!!editor || !!removing || mutation.isPending} onClick={() => setEditor({ place, version: query.data!.version })}>Изменить {place.name}</button><button className={button} disabled={!!editor || !!removing || mutation.isPending} onClick={() => setRemoving({ place, version: query.data!.version })}>Удалить {place.name}</button></div>}
      </li>)}</ul>
    </>}
  </div>;
}

function NearbyPlaceForm({ buildingId, initial, current, disabled, onClose }: { buildingId: number; initial: { place: NearbyPlace | null; version: number }; current: NearbyPlacesResponse; disabled: boolean; onClose: () => void }) {
  const [draft, setDraft] = useState<NearbyPlaceInput>(initial.place ?? empty), [version, setVersion] = useState(initial.version), [reason, setReason] = useState('');
  const [error, setError] = useState(''), [conflict, setConflict] = useState(false);
  const mutation = useChangeNearbyPlace(buildingId), latest = current.places.find(place => place.id === initial.place?.id);
  const removed = !!initial.place && !latest;
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (disabled || removed || conflict || mutation.isPending) return;
    try { await mutation.mutateAsync({ id: initial.place?.id, version, data: draft, reason }); onClose(); }
    catch (e) { setError(structureError(e)); setConflict(isAxiosError(e) && e.response?.status === 409); }
  }
  return <form onSubmit={submit} aria-label="Редактор объекта инфраструктуры" className="min-w-0 space-y-4 rounded-xl border-2 border-green-800 bg-white p-4">
    <h2 className="font-semibold">{initial.place ? 'Редактирование объекта' : 'Новый объект рядом'}</h2>
    {error && <p role="alert">{error}</p>}{removed && <p role="alert">Объект удалён в другой вкладке. Поля сохранены здесь, но удалённая запись не будет восстановлена автоматически.</p>}
    <fieldset disabled={disabled || removed || mutation.isPending} className="min-w-0 space-y-3">
      <label className="block">Категория<select className="mt-1 min-h-11 w-full rounded border p-2" value={draft.category} onChange={event => setDraft({ ...draft, category: event.target.value as NearbyPlaceInput['category'] })}>{Object.entries(nearbyCategories).map(([key, name]) => <option key={key} value={key}>{name}</option>)}</select></label>
      {(['name', 'latitude', 'longitude', 'source', 'distance_m', 'distance_source', 'verified_at'] as const).map(field => <label key={field} className="block">{{ name: 'Название объекта', latitude: 'Широта', longitude: 'Долгота', source: 'Источник объекта', distance_m: 'Расстояние от ЖК, м', distance_source: 'Источник расстояния', verified_at: 'Дата проверки объекта и расстояния' }[field]}
        <input className="mt-1 min-h-11 w-full min-w-0 rounded border p-2" type={field === 'verified_at' ? 'date' : 'text'} inputMode={['latitude', 'longitude', 'distance_m'].includes(field) ? 'decimal' : undefined}
          required={['name', 'source'].includes(field) || (['latitude', 'longitude'].includes(field) && !!draft.verified_at)} maxLength={field === 'name' ? 200 : 1000} value={draft[field] ?? ''}
          onInput={field === 'verified_at' ? event => setDraft({ ...draft, verified_at: event.currentTarget.value || null }) : undefined}
          onChange={event => setDraft({ ...draft, [field]: event.target.value || null })} />
      </label>)}
      <label className="block">Способ измерения<select className="mt-1 min-h-11 w-full rounded border p-2" value={draft.distance_method ?? ''} onChange={event => setDraft({ ...draft, distance_method: (event.target.value || null) as NearbyPlaceInput['distance_method'] })}><option value="">Расстояние не указано</option>{Object.entries(distanceMethods).map(([key, name]) => <option key={key} value={key}>{name}</option>)}</select></label>
      <p className="text-sm">Координаты вводятся парой. Для расстояния одновременно укажите значение, способ и источник. «По прямой» не означает пеший маршрут. Без даты проверки запись остаётся скрытой.</p>
      <label className="block">Причина изменения<textarea maxLength={1000} className="mt-1 w-full rounded border p-2" value={reason} onChange={event => setReason(event.target.value)} /></label>
      {conflict && <div className="space-y-3 break-words rounded bg-amber-50 p-3"><p>ЖК изменён. Сравните актуальный объект ниже; ваши поля не перезаписаны.</p>
        {latest ? <dl className="space-y-1">{Object.entries(latest).filter(([key]) => key in empty).map(([key, value]) => <div key={key}><dt className="inline font-semibold">{key}: </dt><dd className="inline">{String(value ?? '—')}</dd></div>)}</dl> : <p>Создаваемого объекта ещё нет. В списке ниже — текущие объекты.</p>}
        <button type="button" className={button} disabled={current.version <= version || removed} onClick={() => { setVersion(current.version); setConflict(false); setError(''); }}>Подтвердить актуальную версию инфраструктуры</button>
      </div>}
      <button className={button} type="submit" disabled={conflict}>Сохранить объект</button>
    </fieldset>
    <button className={button} type="button" disabled={mutation.isPending} onClick={onClose}>Закрыть редактор объекта</button>
  </form>;
}
