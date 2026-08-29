'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { axios } from '@/utils/axios';
import { useManagedNewBuilding } from '@/services/new-buildings/hooks';
import type { NewBuilding, NewBuildingDetailResponse } from '@/services/new-buildings/types';
import { invalidatePublicInventory } from '@/services/new-buildings/invalidate-public-inventory';
import { residentialDateInput, residentialDateLabel } from '@/services/new-buildings/dates';

type Person = { id: number; name: string; role: string };
const inputClass = 'min-w-0 w-full max-w-full rounded-lg border border-gray-300 bg-white p-3';
const buttonClass = 'max-w-full whitespace-normal break-words rounded-lg border border-gray-300 px-4 py-2 text-sm disabled:opacity-50';

export default function BuildingPublicationPanel({ buildingId }: { buildingId: number }) {
  const query = useManagedNewBuilding(buildingId);
  if (!query.data) return null;
  return <PublicationEditor key={buildingId} response={query.data} refresh={async () => (await query.refetch()).data} />;
}

function PublicationEditor({ response, refresh }: { response: NewBuildingDetailResponse; refresh: () => Promise<NewBuildingDetailResponse | undefined> }) {
  const building = response.data;
  const capabilities = response.capabilities;
  const cache = useQueryClient();
  const [version, setVersion] = useState(building.version);
  const [responsible, setResponsible] = useState(building.responsible_user_id ?? null);
  const [consultant, setConsultant] = useState(building.consultant_user_id ?? null);
  const [verifiedDate, setVerifiedDate] = useState(residentialDateInput(building.data_verified_at));
  const [search, setSearch] = useState('');
  const [checked, setChecked] = useState(false);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [historyPage, setHistoryPage] = useState(1);
  const history = useQuery({
    queryKey: ['residential-history', building.id, version, historyPage],
    queryFn: async () => (await axios.get<{ last_page: number; data: Array<{ id: number; version: number; actor_name: string | null; created_at: string; reason: string | null; before: string; after: string }> }>(`/manage/new-buildings/${building.id}/history`, { params: { page: historyPage } })).data,
    enabled: showHistory,
  });
  const people = useQuery({
    queryKey: ['residential-people', search],
    queryFn: async ({ signal }) => (await axios.get<{ responsible: Person[]; consultants: Person[] }>('/manage/new-buildings/people', { params: { q: search || undefined }, signal })).data,
    enabled: Boolean(capabilities?.assign),
  });

  const save = async (path: string, payload: Record<string, unknown>) => {
    setBusy(true); setError(''); setNotice('');
    try {
      const { data } = await axios.patch<NewBuilding>(path, { ...payload, version, reason: reason || null });
      setVersion(data.version); setHistoryPage(1); setChecked(false); setNotice('Изменения сохранены.');
      await Promise.all([
        cache.invalidateQueries({ queryKey: ['manage-new-buildings'] }),
        cache.invalidateQueries({ queryKey: ['catalog-new-buildings'] }),
        cache.invalidateQueries({ queryKey: ['new-buildings'] }),
        invalidatePublicInventory(cache, building.id),
      ]);
    } catch (failure) {
      const message = isAxiosError(failure) ? failure.response?.data?.message : undefined;
      setError(isAxiosError(failure) && failure.response?.status === 409
        ? 'ЖК уже изменён. Проверьте свои правки и загрузите актуальные данные перед повтором.'
        : message || 'Не удалось сохранить изменения.');
    } finally { setBusy(false); }
  };

  const reload = async () => {
    const latest = await refresh();
    if (!latest) return;
    setVersion(latest.data.version); setResponsible(latest.data.responsible_user_id ?? null);
    setConsultant(latest.data.consultant_user_id ?? null); setVerifiedDate(residentialDateInput(latest.data.data_verified_at));
    setChecked(false); setError(''); setNotice('Загружены актуальные данные.');
  };

  const choose = (kind: 'responsible' | 'consultants', selected: number | null, label: string, change: (id: number | null) => void) => {
    const options = people.data?.[kind] ?? [];
    return <label className="block space-y-2 text-sm">
      <span>{label}</span>
      <select className={inputClass} value={selected ?? ''} onChange={(event) => change(event.target.value ? Number(event.target.value) : null)}>
        <option value="">Не назначен</option>
        {selected && !options.some((person) => person.id === selected) && <option value={selected}>Текущее назначение #{selected}</option>}
        {options.map((person) => <option value={person.id} key={person.id}>{person.name} · {person.role}</option>)}
      </select>
    </label>;
  };

  return <section className="min-w-0 space-y-5 rounded-2xl border bg-white p-4 sm:p-5" aria-labelledby="publication-heading">
    <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
      <h2 id="publication-heading" className="min-w-0 break-words text-lg font-semibold">Публикация и ответственность</h2>
      <span className="text-sm text-gray-600">Версия {version} · {({ draft: 'Черновик', pending: 'На модерации', published: 'Опубликован', rejected: 'Отклонён', archived: 'Архив' })[building.publication_status]}</span>
    </div>
    {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}
    {notice && <p role="status" className="text-sm text-green-800">{notice}</p>}
    {building.version > version && <p role="status" className="text-sm text-amber-800">На сервере уже версия {building.version}. Перед записью загрузите актуальные данные.</p>}
    <dl className="min-w-0 grid gap-2 break-words text-sm sm:grid-cols-2">
      <div><dt className="text-gray-500">Ответственный за данные</dt><dd>{building.responsible_employee?.name || 'Не назначен'}</dd></div>
      <div><dt className="text-gray-500">Публичный консультант Manora</dt><dd>{building.consultant?.name || 'Не назначен'}{building.consultant?.phone && ` · ${building.consultant.phone}`}</dd></div>
      <div><dt className="text-gray-500">Данные проверены</dt><dd>{residentialDateLabel(building.data_verified_at) ?? 'Не подтверждено'}</dd></div>
    </dl>
    {capabilities?.assign && <fieldset disabled={busy} className="min-w-0 space-y-3 rounded-xl border p-3 sm:p-4">
      <legend className="max-w-full break-words px-2 font-medium">Назначения</legend>
      <label className="block text-sm">Поиск сотрудника по имени<input className={`${inputClass} mt-2`} value={search} onChange={(event) => setSearch(event.target.value)} /></label>
      {people.isError && <p role="alert" className="text-sm text-red-700">Не удалось загрузить сотрудников.</p>}
      {choose('responsible', responsible, 'Ответственный сотрудник ЖК', setResponsible)}
      {choose('consultants', consultant, 'Консультант Manora — его имя и телефон будут публичными', setConsultant)}
      <button type="button" className={buttonClass} onClick={() => void save(`/manage/new-buildings/${building.id}/assignments`, { responsible_user_id: responsible, consultant_user_id: consultant })}>Сохранить назначения</button>
    </fieldset>}
    {capabilities?.verify_data && <fieldset disabled={busy} className="min-w-0 space-y-3 rounded-xl border p-3 sm:p-4">
      <legend className="max-w-full break-words px-2 font-medium">Актуальность фонда</legend>
      <label className="block text-sm">Фактическая дата проверки<input type="date" className={`${inputClass} mt-2`} value={verifiedDate} onChange={(event) => setVerifiedDate(event.target.value)} /></label>
      <button type="button" disabled={!verifiedDate} className={buttonClass} onClick={() => void save(`/manage/new-buildings/${building.id}/verify-data`, { data_verified_at: verifiedDate })}>Подтвердить проверку данных</button>
    </fieldset>}
    {Object.keys(response.publication_errors ?? {}).length > 0 && <div className="rounded-xl bg-amber-50 p-4 text-sm text-amber-900">
      <p className="font-medium">Для публикации требуется:</p>
      <ul className="mt-2 list-inside list-disc">{Object.entries(response.publication_errors ?? {}).map(([field, message]) => <li key={field}>{message}</li>)}</ul>
    </div>}
    <label className="block text-sm">Комментарий к изменению<textarea className={`${inputClass} mt-2`} value={reason} maxLength={1000} onChange={(event) => setReason(event.target.value)} /></label>
    {capabilities?.moderate && <label className="flex items-start gap-3 text-sm"><input type="checkbox" checked={checked} onChange={(event) => setChecked(event.target.checked)} className="mt-1" />Я проверил содержание, контакты и медиа этого ЖК.</label>}
    <div className="flex min-w-0 flex-wrap gap-3">
      {capabilities?.manage && <button type="button" disabled={busy} className={buttonClass} onClick={() => void save(`/new-buildings/${building.id}`, { publication_status: 'pending' })}>Отправить на модерацию</button>}
      {capabilities?.moderate && <>
        <button type="button" disabled={busy || !checked} className={`${buttonClass} bg-[#006341] text-white`} onClick={() => void save(`/moderation/new-buildings/${building.id}`, { status: 'published', content_checked: checked })}>Опубликовать</button>
        <button type="button" disabled={busy || !reason.trim()} className={buttonClass} onClick={() => void save(`/moderation/new-buildings/${building.id}`, { status: 'rejected' })}>Отклонить с причиной</button>
      </>}
      <button type="button" disabled={busy} className={buttonClass} onClick={() => void reload()}>Загрузить актуальные данные</button>
    </div>
    <details onToggle={(event) => setShowHistory(event.currentTarget.open)} className="rounded-xl border p-4">
      <summary className="cursor-pointer break-words font-medium">Журнал изменений ЖК</summary>
      {history.isLoading && <p className="mt-3 text-sm">Загрузка…</p>}
      {history.isError && <p role="alert" className="mt-3 text-sm text-red-700">Не удалось загрузить журнал.</p>}
      <ol className="mt-3 space-y-3 text-sm">{history.data?.data.map((entry) => <li key={entry.id} className="border-t pt-3">
        <p>Версия {entry.version} · {entry.actor_name || 'Удалённый пользователь'} · {new Date(entry.created_at).toLocaleString('ru-RU')}</p>
        {entry.reason && <p className="mt-1 text-gray-600">{entry.reason}</p>}
        <details className="mt-2"><summary className="cursor-pointer">Значения до и после</summary><div className="mt-2 grid gap-3 lg:grid-cols-2"><div><p>До</p><pre className="max-h-60 overflow-auto whitespace-pre-wrap break-all rounded bg-gray-50 p-2">{entry.before}</pre></div><div><p>После</p><pre className="max-h-60 overflow-auto whitespace-pre-wrap break-all rounded bg-gray-50 p-2">{entry.after}</pre></div></div></details>
      </li>)}</ol>
      {history.data && history.data.last_page > 1 && <div className="mt-3 flex gap-3"><button type="button" disabled={historyPage <= 1} className={buttonClass} onClick={() => setHistoryPage((page) => page - 1)}>Предыдущие</button><span className="self-center text-sm">{historyPage} / {history.data.last_page}</span><button type="button" disabled={historyPage >= history.data.last_page} className={buttonClass} onClick={() => setHistoryPage((page) => page + 1)}>Следующие</button></div>}
      {history.data?.data.length === 0 && <p className="mt-3 text-sm text-gray-600">Изменений пока нет.</p>}
    </details>
  </section>;
}
