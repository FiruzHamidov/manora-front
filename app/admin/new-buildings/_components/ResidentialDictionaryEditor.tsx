'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { useMe } from '@/services/login/hooks';
import { axios } from '@/utils/axios';
import { FormLayout } from '@/ui-components/FormLayout';
import { Button } from '@/ui-components/Button';
import { useDictionaryEntries } from '@/services/dictionaries/hooks';
import { parseDictionaryError } from '@/services/dictionaries/utils';
import { dictionaryDraft, dictionaryEditPayload, dictionaryFieldLabels, dictionaryFields, dictionaryListPath, type DictionaryEditContext, type DictionaryEditHistory, type VersionedDictionaryResource } from '@/services/dictionaries/residential-editor';

const moderationLabels: Record<string, string> = { pending: 'На модерации', approved: 'Одобрено', rejected: 'Отклонено', draft: 'Черновик', deleted: 'Удалено' };
const numberFields = ['founded_year', 'total_projects', 'built_count', 'under_construction_count', 'sort_order'];
const inputClass = 'w-full min-w-0 rounded-md border border-gray-300 p-3';

export default function ResidentialDictionaryEditor({ resource }: { resource: VersionedDictionaryResource }) {
  const { id } = useParams<{ id: string }>();
  const me = useMe();
  if (!me.data) return <p role="status">Проверка доступа…</p>;
  return <EditorLoader key={`${resource}:${id}:${me.data.id}`} resource={resource} id={Number(id)} userId={me.data.id} />;
}

function EditorLoader({ resource, id, userId }: { resource: VersionedDictionaryResource; id: number; userId: number }) {
  const [generation, setGeneration] = useState(0);
  const context = useQuery({
    queryKey: ['dictionary-edit-context', resource, id, userId],
    queryFn: async ({ signal }) => (await axios.get<DictionaryEditContext>(`/dictionaries/${resource}/${id}/edit-context`, { params: { expected_user_id: userId }, signal, timeout: 15_000 })).data,
    retry: false, staleTime: 0, refetchOnMount: 'always', refetchOnWindowFocus: false, refetchOnReconnect: false,
  });
  async function reload() {
    const result = await context.refetch();
    if (result.isError) throw result.error;
    setGeneration(value => value + 1);
  }
  return <FormLayout title="Редактирование справочника" description="Правка общего значения влияет на все связанные ЖК.">
    {!context.data && context.isPending && <p role="status">Загрузка…</p>}
    {!context.data && context.isError && <div role="alert"><p>{parseDictionaryError(context.error).message}</p><Button onClick={() => void context.refetch()}>Повторить загрузку</Button></div>}
    {context.data && <EditorForm key={generation} resource={resource} userId={userId} initial={context.data} reload={reload} />}
    <Link className="mt-6 inline-block underline" href={dictionaryListPath(resource)}>К списку справочника</Link>
  </FormLayout>;
}

function EditorForm({ resource, userId, initial, reload }: { resource: VersionedDictionaryResource; userId: number; initial: DictionaryEditContext; reload: () => Promise<void> }) {
  // A background cache update must never replace the draft or its expected revision.
  const [snapshot] = useState(initial);
  const [draft, setDraft] = useState(() => dictionaryDraft(resource, initial.data));
  const [reason, setReason] = useState('');
  const [logo, setLogo] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const queryClient = useQueryClient();
  const router = useRouter();
  const cities = useDictionaryEntries('locations', undefined, resource === 'districts');
  useEffect(() => {
    if (!logo) { setPreview(null); return; }
    const url = URL.createObjectURL(logo); setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [logo]);
  const logoUrl = preview || (snapshot.data.logo_path ? `${process.env.NEXT_PUBLIC_STORAGE_URL}/${snapshot.data.logo_path}` : null);
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true); setError('');
    try {
      const payload = dictionaryEditPayload(resource, draft, { version: snapshot.data.version, usage_token: snapshot.usage.usage_token, expected_user_id: userId, reason });
      if (logo) {
        const body = new FormData();
        Object.entries(payload).forEach(([key, value]) => body.append(key, value === null ? '' : String(value)));
        body.append('logo', logo); body.append('_method', 'PUT');
        await axios.post(`/${resource}/${snapshot.data.id}`, body, { timeout: 30_000 });
      } else await axios.put(`/${resource}/${snapshot.data.id}`, payload, { timeout: 30_000 });
      void queryClient.invalidateQueries();
      toast.success('Справочник сохранён');
      router.push(dictionaryListPath(resource));
    } catch (failure) {
      const parsed = parseDictionaryError(failure);
      setError([parsed.message, ...Object.values(parsed.fieldErrors).flat(), 'Введённые данные сохранены в форме.', ...(!parsed.status || parsed.status >= 500 ? ['Результат запроса не подтверждён. Можно повторить с прежней версией или загрузить актуальную запись и проверить историю.'] : [])].join(' '));
    } finally { setBusy(false); }
  }
  async function refresh() {
    if (busy) return;
    setBusy(true);
    try { await reload(); } catch (failure) { setError(parseDictionaryError(failure).message); }
    finally { setBusy(false); }
  }
  return <div className="mx-auto max-w-3xl space-y-6">
    <p>Запись №{snapshot.data.id}, версия {snapshot.data.version}. Связанных ЖК: {snapshot.usage.affected_buildings}. Опубликованных: {snapshot.usage.published_buildings}.</p>
    {snapshot.usage.affected_buildings > 0 && <p className="rounded-md bg-amber-50 p-3">После изменения связанные ЖК потребуют повторной проверки данных и контента. Опубликованные ЖК вернутся на модерацию. Индивидуальные площади и цены лотов не изменятся.</p>}
    {resource === 'districts' && <p className="rounded-md bg-amber-50 p-3">Связанных объявлений: {snapshot.usage.total}. При переносе района их город также изменится. Район в карточке ЖК — отдельный текст: совпадение названия не создаёт связь и не переносит ЖК.</p>}
    <form onSubmit={submit} className="space-y-5">
      <fieldset disabled={busy} className="min-w-0 space-y-5">
        {dictionaryFields(resource).map(key => <label key={key} className="block space-y-1"><span>{dictionaryFieldLabels[key]}</span>
          {key === 'location_id' ? <><select required className={inputClass} value={draft[key]} onChange={e => setDraft({ ...draft, [key]: e.target.value })}>
            {!cities.data?.some(city => city.id === Number(draft[key])) && <option value={draft[key]}>Город №{draft[key]} (название не загружено)</option>}
            {cities.data?.map(city => <option key={city.id} value={city.id}>{city.city} (№{city.id})</option>)}
          </select>{cities.isError && <span role="alert">Города не загружены. Текущий выбор сохранён. <button type="button" className="underline" onClick={() => void cities.refetch()}>Повторить</button></span>}</> : key === 'description' ? <textarea className={inputClass} rows={5} value={draft[key]} onChange={e => setDraft({ ...draft, [key]: e.target.value })} />
            : key === 'moderation_status' || key === 'is_active' ? <select className={inputClass} value={draft[key]} onChange={e => setDraft({ ...draft, [key]: e.target.value })}>
              {Object.entries(key === 'is_active' ? { '1': 'Да', '0': 'Нет' } : moderationLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
            : <input className={inputClass} type={numberFields.includes(key) ? 'number' : 'text'} min={key === 'founded_year' ? 1800 : 0} max={key === 'founded_year' ? new Date().getFullYear() : undefined} maxLength={key === 'phone' ? 50 : 255} required={key === 'city' || key === 'name' || key === 'slug' || key === 'sort_order'} value={draft[key]} onChange={e => setDraft({ ...draft, [key]: e.target.value })} />}
        </label>)}
        {resource === 'developers' && <div className="space-y-2">
          {logoUrl && <Image unoptimized src={logoUrl} alt="Логотип компании" width={160} height={160} className="h-40 w-40 object-contain" />}
          <label className="block">Новый логотип (jpg/jpeg/png/webp, до 5 МБ)
            <input className="block w-full min-w-0" type="file" accept="image/jpeg,image/png,image/webp" onChange={e => {
              const file = e.target.files?.[0] ?? null;
              if (file && (file.size > 5 * 1024 * 1024 || !['image/jpeg', 'image/png', 'image/webp'].includes(file.type))) { setError('Выберите jpg/jpeg/png/webp до 5 МБ.'); e.target.value = ''; setLogo(null); return; }
              setLogo(file);
            }} />
          </label>
        </div>}
        <label className="block space-y-1"><span>Причина изменения *</span><textarea className={inputClass} required maxLength={900} value={reason} onChange={e => setReason(e.target.value)} /></label>
        <Button type="submit" disabled={busy || !reason.trim()} loading={busy}>Сохранить изменения</Button>
      </fieldset>
      {error && <p role="alert" className="break-words text-red-700">{error}</p>}
      <Button type="button" variant="outline" disabled={busy} onClick={() => void refresh()}>Загрузить актуальную запись (заменит введённые данные)</Button>
    </form>
    <History resource={resource} id={snapshot.data.id} userId={userId} />
  </div>;
}

function History({ resource, id, userId }: { resource: VersionedDictionaryResource; id: number; userId: number }) {
  const [page, setPage] = useState(1);
  const history = useQuery({
    queryKey: ['dictionary-history', resource, id, userId, page],
    queryFn: async ({ signal }) => (await axios.get<{ data: DictionaryEditHistory[]; last_page: number }>(`/dictionaries/${resource}/${id}/history`, { params: { page, expected_user_id: userId }, signal, timeout: 15_000 })).data,
    retry: false,
  });
  const display = (key: string, value: unknown) => value === null || value === undefined || value === '' ? 'Не указано' : key === 'moderation_status' ? moderationLabels[String(value)] ?? String(value) : key === 'is_active' ? value ? 'Да' : 'Нет' : String(value);
  return <section className="space-y-3"><h2 className="text-xl font-semibold">История изменений</h2>
    {history.isPending && <p role="status">Загрузка истории…</p>}
    {history.isError && <p role="alert">История не загружена. <button type="button" className="underline" onClick={() => void history.refetch()}>Повторить</button></p>}
    {history.data?.data.length === 0 && <p>Изменений пока нет.</p>}
    {history.data?.data.map(change => <article key={change.id} className="space-y-2 rounded border p-3 break-words">
      <p>Версия {change.version} · {change.created_at} · Сотрудник {change.actor_id ? `№${change.actor_id}` : 'удалён'}</p><p>{change.reason}</p>
      <ul className="list-disc pl-5">{Object.keys(dictionaryFieldLabels).filter(key => display(key, change.before[key]) !== display(key, change.after[key])).map(key => <li key={key}>{dictionaryFieldLabels[key]}: {display(key, change.before[key])} → {display(key, change.after[key])}</li>)}</ul>
    </article>)}
    {history.data && history.data.last_page > 1 && <div className="flex flex-wrap items-center gap-3"><Button disabled={page <= 1} onClick={() => setPage(page - 1)}>Назад</Button><span>Страница {page} из {history.data.last_page}</span><Button disabled={page >= history.data.last_page} onClick={() => setPage(page + 1)}>Далее</Button></div>}
  </section>;
}
