'use client';

import { useState, type FormEvent } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { isAxiosError } from 'axios';
import { useManagedNewBuilding } from '@/services/new-buildings/hooks';
import { type BuildingVideo, type BuildingVideoInput, type BuildingVideosResponse } from '@/services/new-buildings/videos';
import { useBuildingVideos, useChangeBuildingVideo } from '@/services/new-buildings/use-building-videos';
import { structureError } from '@/services/new-buildings/structure';

const button = 'min-h-11 max-w-full break-words rounded-xl border border-green-800 px-3 py-2 text-green-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-800 disabled:opacity-40';
const input = 'mt-1 min-h-11 w-full min-w-0 rounded border p-2';
const empty: BuildingVideoInput = { title: '', source_url: '', caption: null, sort_order: 0 };
export default function VideosPage() {
  const { id } = useParams<{ id: string }>(), buildingId = Number(id);
  const building = useManagedNewBuilding(buildingId), query = useBuildingVideos(buildingId), mutation = useChangeBuildingVideo(buildingId);
  const [editor, setEditor] = useState<{ video: BuildingVideo | null; version: number } | null>(null);
  const [removing, setRemoving] = useState<{ video: BuildingVideo; version: number } | null>(null), [error, setError] = useState('');
  const canManage = building.data?.capabilities?.manage === true && !building.isError && !query.isError;
  async function remove() {
    if (!removing || !canManage || mutation.isPending) return;
    try { await mutation.mutateAsync({ id: removing.video.id, version: removing.version, remove: true }); setError(''); }
    catch (e) { setError(structureError(e)); }
    finally { setRemoving(null); }
  }
  if (building.isLoading || query.isLoading) return <p>Загрузка видео…</p>;
  if (!building.data?.data) return <p role="alert">ЖК недоступен.</p>;
  return <div className="min-w-0 space-y-5">
    <h1 className="break-words text-2xl font-bold">Видео — {building.data.data.title}</h1>
    <Link href={'/admin/new-buildings/' + buildingId} className="inline-flex min-h-11 items-center text-green-800 underline">← К жилому комплексу</Link>
    <p>Добавляйте только материалы этого ЖК, которые вы вправе публиковать. Поддерживаются HTTPS-ссылки YouTube и Vimeo, без HTML. Разрешите встраивание на сайте Manora в настройках источника. После изменения нужна повторная модерация ЖК.</p>
    <p className="text-sm">Ссылки Vimeo с ограничением «по ссылке» будут видны посетителям после публикации. Приватное видео без разрешения на просмотр не станет публичным автоматически.</p>
    <button className={button} disabled={query.isFetching || building.isFetching} onClick={() => { void query.refetch(); void building.refetch(); }}>Обновить видео</button>
    {(query.isError || building.isError) && <p role="alert">Данные не загружены. Введённые поля сохранены, отправка приостановлена.</p>}
    {error && <p role="alert">{error}</p>}
    {query.data && <>
      <p>Видео: {query.data.videos.length} / 10 · Версия ЖК: {query.data.version}</p>
      {canManage && <button className={button} disabled={!!editor || !!removing || query.data.videos.length >= 10} onClick={() => setEditor({ video: null, version: query.data!.version })}>Добавить видео</button>}
      {editor && <VideoForm buildingId={buildingId} initial={editor} current={query.data} disabled={!canManage} onClose={() => setEditor(null)} />}
      {removing && <div role="group" aria-label="Подтверждение удаления видео" className="space-y-3 rounded-xl border border-red-300 p-4"><p>Удалить «{removing.video.title}»? Изменение останется в журнале ЖК.</p><div className="flex flex-wrap gap-3"><button className={button} disabled={!canManage || mutation.isPending} onClick={() => void remove()}>Подтвердить удаление видео</button><button className={button} disabled={mutation.isPending} onClick={() => setRemoving(null)}>Отмена удаления</button></div></div>}
      {!query.data.videos.length && <p>Видео ещё не добавлены. На сайте раздел не показывается.</p>}
      <ul className="space-y-3">{query.data.videos.map(video => <li key={video.id} className="min-w-0 space-y-2 break-words rounded-xl border bg-white p-4">
        <h2 className="text-lg font-semibold">{video.title}</h2><p className="[overflow-wrap:anywhere]">Источник: {video.source_url}</p><p>Порядок: {video.sort_order}</p>
        {video.caption && <p className="whitespace-pre-wrap">{video.caption}</p>}
        {canManage && <div className="flex flex-wrap gap-3"><button className={button} disabled={!!editor || !!removing || mutation.isPending} onClick={() => setEditor({ video, version: query.data!.version })}>Изменить {video.title}</button><button className={button} disabled={!!editor || !!removing || mutation.isPending} onClick={() => setRemoving({ video, version: query.data!.version })}>Удалить {video.title}</button></div>}
      </li>)}</ul>
    </>}
  </div>;
}

function VideoForm({ buildingId, initial, current, disabled, onClose }: { buildingId: number; initial: { video: BuildingVideo | null; version: number }; current: BuildingVideosResponse; disabled: boolean; onClose: () => void }) {
  const [draft, setDraft] = useState<BuildingVideoInput>(initial.video ?? empty), [version, setVersion] = useState(initial.version), [reason, setReason] = useState('');
  const [error, setError] = useState(''), [conflict, setConflict] = useState(false);
  const mutation = useChangeBuildingVideo(buildingId), latest = current.videos.find(video => video.id === initial.video?.id);
  const removed = !!initial.video && !latest, changed = conflict || version !== current.version;
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (disabled || removed || changed || mutation.isPending) return;
    try { await mutation.mutateAsync({ id: initial.video?.id, version, data: draft, reason }); onClose(); }
    catch (e) { setError(structureError(e)); setConflict(isAxiosError(e) && e.response?.status === 409); }
  }
  return <form onSubmit={submit} aria-label="Редактор видео" className="min-w-0 space-y-4 rounded-xl border-2 border-green-800 bg-white p-4">
    <h2 className="font-semibold">{initial.video ? 'Редактирование видео' : 'Новое видео'}</h2>
    {error && <p role="alert">{error}</p>}{removed && <p role="alert">Видео удалено в другой вкладке. Поля сохранены здесь, но запись не будет восстановлена автоматически.</p>}
    <fieldset disabled={disabled || removed || mutation.isPending} className="min-w-0 space-y-3">
      <label className="block">Название видео<input className={input} required maxLength={200} value={draft.title} onChange={event => setDraft({ ...draft, title: event.target.value })} /></label>
      <label className="block">Ссылка на видео<input className={input} type="url" required maxLength={500} value={draft.source_url} onChange={event => setDraft({ ...draft, source_url: event.target.value })} /></label>
      <label className="block">Подпись к видео<textarea className={input} maxLength={1000} value={draft.caption ?? ''} onChange={event => setDraft({ ...draft, caption: event.target.value || null })} /></label>
      <label className="block">Порядок видео<input className={input} type="number" required min={0} max={65535} step={1} value={draft.sort_order} onChange={event => setDraft({ ...draft, sort_order: event.target.value === '' ? 0 : Number(event.target.value) })} /></label>
      <p className="text-sm">Меньшее число показывается раньше. При одинаковом порядке — раньше добавленное видео. Параметры автозапуска и отслеживания из ссылки удаляются.</p>
      <label className="block">Причина изменения<textarea className={input} maxLength={1000} value={reason} onChange={event => setReason(event.target.value)} /></label>
      {changed && <div className="space-y-3 break-words rounded bg-amber-50 p-3"><p>ЖК изменён. Сравните актуальное видео ниже; ваши поля не перезаписаны.</p>
        {latest ? <dl className="space-y-1 [overflow-wrap:anywhere]">{Object.entries(latest).filter(([key]) => key in empty).map(([key, value]) => <div key={key}><dt className="inline font-semibold">{key}: </dt><dd className="inline">{String(value ?? '—')}</dd></div>)}</dl> : <p>Создаваемого видео ещё нет. В списке ниже — текущие видео.</p>}
        <button type="button" className={button} disabled={current.version <= version || removed} onClick={() => { setVersion(current.version); setConflict(false); setError(''); }}>Подтвердить актуальную версию видео</button>
      </div>}
      <button className={button} type="submit" disabled={changed}>Сохранить видео</button>
    </fieldset>
    <button className={button} type="button" disabled={mutation.isPending} onClick={onClose}>Закрыть редактор видео</button>
  </form>;
}
