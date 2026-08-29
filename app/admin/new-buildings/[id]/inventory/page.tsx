'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { axios } from '@/utils/axios';
import { useMe } from '@/services/login/hooks';
import { batchBusy, batchStatuses, bulkRows, type InventoryBatch, type BatchPage, type SelectedInventoryUnit } from '@/services/new-buildings/inventory-batches';
import type { BuildingUnit } from '@/services/new-buildings/types';
import BatchDetails from './BatchDetails';
import { batchButton, batchField, batchError, batchPath, downloadBatchFile, inventoryValue } from './batch-ui';

export default function InventoryBatchPage() {
  const params = useParams<{ id: string }>(), me = useMe();
  const buildingId = Number(params.id);
  if (!me.data) return <p role="status">Войдите в аккаунт для управления фондом.</p>;
  return <InventoryWorkspace key={buildingId + ':' + me.data.id} buildingId={buildingId} userId={me.data.id} />;
}

function InventoryWorkspace({ buildingId, userId }: { buildingId: number; userId: number }) {
  const [page, setPage] = useState(1), [kind, setKind] = useState<'bulk' | 'import'>('bulk');
  const [reason, setReason] = useState(''), [error, setError] = useState(''), [busy, setBusy] = useState(false);
  const [pending, setPending] = useState<FormData | Record<string, unknown> | null>(null);
  const cache = useQueryClient(), router = useRouter(), params = useSearchParams();
  const activeId = Number(params.get('batch')) || 0;
  const open = (id: number) => router.replace('/admin/new-buildings/' + buildingId + '/inventory?batch=' + id, { scroll: false });
  const list = useQuery({
    queryKey: ['inventory-batches', buildingId, userId, 'list', page],
    queryFn: async ({ signal }) => (await axios.get<BatchPage<InventoryBatch> & { building: { id: number; title: string }; capabilities: { import_inventory: boolean } }>(batchPath(buildingId),
      { signal, timeout: 12_000, params: { page, expected_user_id: userId } })).data,
    retry: false, refetchInterval: 10_000,
  });
  const send = async (payload: FormData | Record<string, unknown>) => {
    setPending(payload); setBusy(true); setError('');
    try {
      const response = await axios.post<{ data: InventoryBatch }>(batchPath(buildingId), payload, { timeout: 25_000 });
      open(response.data.data.id); setPending(null);
    } catch (e) { setError(batchError(e)); }
    finally { setBusy(false); await cache.invalidateQueries({ queryKey: ['inventory-batches', buildingId, userId] }); }
  };
  const createBulk = (rows: Record<string, unknown>[]) => send({ kind: 'bulk', rows, reason, request_key: crypto.randomUUID(), expected_user_id: userId });
  const createImport = (file: File, delimiter: string) => {
    const payload = new FormData();
    payload.set('kind', 'import'); payload.set('file', file); payload.set('delimiter', delimiter); payload.set('reason', reason);
    payload.set('request_key', crypto.randomUUID()); payload.set('expected_user_id', String(userId));
    return send(payload);
  };
  return <div className="min-w-0 space-y-6">
    <Link className="inline-flex min-h-11 items-center text-green-800 underline" href={'/admin/new-buildings/' + buildingId}>← К жилому комплексу</Link>
    <h1 className="text-2xl font-semibold">Массовые изменения и импорт фонда</h1>
    {list.data && <p>{list.data.building.title}</p>}
    <p className="text-sm text-gray-600">Сначала подготовьте preview и проверьте значения «до/после». До отдельного подтверждения фонд не меняется. Обработка выполняется в очереди; результат остаётся в журнале после закрытия вкладки.</p>
    {list.isPending && <p role="status">Загрузка прав и журнала…</p>}
    {list.isError && <div role="alert"><p>{batchError(list.error)}</p><button className={batchButton} onClick={() => void list.refetch()}>Обновить журнал</button></div>}
    {list.data && <section className="min-w-0 space-y-4 rounded-2xl border bg-white p-4">
      <h2 className="text-xl font-semibold">Новый пакет</h2>
      <fieldset disabled={busy || !!pending || list.isError} className="min-w-0 space-y-4 disabled:opacity-60">
        <div className="flex flex-wrap gap-3"><button className={batchButton} aria-pressed={kind === 'bulk'} onClick={() => setKind('bulk')}>Цены и доступность</button>
          {list.data.capabilities.import_inventory && <button className={batchButton} aria-pressed={kind === 'import'} onClick={() => setKind('import')}>Импорт CSV</button>}</div>
        <label className="block">Причина изменения<input className={batchField} required maxLength={900} value={reason} onChange={e => setReason(e.target.value)} /></label>
        {kind === 'bulk' ? <BulkEditor buildingId={buildingId} userId={userId} canSubmit={!!reason.trim()} onSubmit={createBulk} />
          : list.data.capabilities.import_inventory && <ImportEditor buildingId={buildingId} userId={userId} canSubmit={!!reason.trim()} onSubmit={createImport} />}
      </fieldset>
      {error && <p role="alert" className="text-red-700">{error}</p>}
      {pending && !busy && <div className="space-y-3 rounded-xl border border-amber-400 p-3">
        <p>Повтор отправит сохранённые данные с тем же ключом. Проверьте журнал: сервер мог уже принять пакет. Это ещё не применение фонда.</p>
        <div className="flex flex-wrap gap-3"><button className={batchButton} onClick={() => void send(pending)}>Повторить тот же запрос</button>
          <button className={batchButton} onClick={() => { setPending(null); setError(''); }}>Вернуться к редактированию нового пакета</button></div>
      </div>}
      {busy && <p role="status">Сервер принимает пакет…</p>}
    </section>}
    {activeId > 0 && <BatchDetails key={activeId + ':' + userId} buildingId={buildingId} userId={userId} batchId={activeId} />}
    {list.data && <section className="space-y-3">
      <h2 className="text-xl font-semibold">Журнал пакетов</h2>
      {!list.isError && !list.data.data.length && <p>Пакетов пока нет.</p>}
      <ul className="space-y-3">{list.data.data.map(batch => <li key={batch.id} className="min-w-0 rounded-xl border bg-white p-4">
        <button className={batchButton} onClick={() => open(batch.id)}>Пакет №{batch.id} · {batch.kind === 'import' ? 'Импорт' : 'Массовая правка'}</button>
        <p className="mt-2">{batchStatuses[batch.status]} · Записей: {batch.row_count}{batchBusy(batch.status) ? ' · Можно закрыть вкладку и вернуться позже' : ''}</p>
        <p className="mt-1 break-words text-sm">{batch.reason}</p>
      </li>)}</ul>
      <nav aria-label="Страницы пакетов" className="flex flex-wrap items-center gap-3">
        <button className={batchButton} disabled={page <= 1 || list.isFetching} onClick={() => setPage(p => p - 1)}>Предыдущие пакеты</button><span>{page} / {list.data.meta.last_page}</span>
        <button className={batchButton} disabled={page >= list.data.meta.last_page || list.isFetching} onClick={() => setPage(p => p + 1)}>Следующие пакеты</button>
      </nav>
    </section>}
  </div>;
}

function BulkEditor({ buildingId, userId, canSubmit, onSubmit }: { buildingId: number; userId: number; canSubmit: boolean; onSubmit: (rows: Record<string, unknown>[]) => Promise<void> }) {
  const [page, setPage] = useState(1), [selected, setSelected] = useState<Record<number, SelectedInventoryUnit>>({});
  const [price, setPrice] = useState({ enabled: false, basis: 'per_sqm' as 'total' | 'per_sqm', amount: '', onRequest: false, clearDiscount: false });
  const [availability, setAvailability] = useState(''), [error, setError] = useState('');
  const query = useQuery({
    queryKey: ['inventory-batch-units', buildingId, userId, page],
    queryFn: async ({ signal }) => (await axios.get<{ data: BuildingUnit[]; current_page: number; last_page: number }>('/manage/new-buildings/' + buildingId + '/units',
      { signal, timeout: 12_000, params: { page, per_page: 20 } })).data, retry: false, refetchInterval: 30_000,
  });
  const choose = (unit: BuildingUnit, checked: boolean) => setSelected(current => {
    const next = { ...current };
    if (checked) {
      if (Object.keys(current).length >= 500) { setError('Не более 500 лотов в пакете.'); return current; }
      next[unit.id] = { id: unit.id, version: unit.version, label: unit.number || unit.name || String(unit.id) };
    } else delete next[unit.id];
    return next;
  });
  return <div className="min-w-0 space-y-4">
    <p>Выбрано лотов: {Object.keys(selected).length} / 500. Выбор сохраняется при переходе между страницами.</p>
    {Object.keys(selected).length > 0 && <button className={batchButton} onClick={() => setSelected({})}>Очистить выбор</button>}
    {query.isPending && <p role="status">Загрузка лотов…</p>}
    {query.isError ? <div role="alert"><p>Актуальные лоты недоступны.</p><button className={batchButton} onClick={() => void query.refetch()}>Обновить лоты</button></div>
      : query.data && <div className="space-y-2">
        {query.data.data.filter(unit => unit.publication_status !== 'archived').map(unit => <label key={unit.id} className="flex min-h-11 min-w-0 gap-3 rounded-xl border p-3">
          <input type="checkbox" className="mt-1 h-5 w-5 shrink-0" checked={!!selected[unit.id]} onChange={e => choose(unit, e.target.checked)} />
          <span className="min-w-0 break-words">#{unit.id} · {unit.number || unit.name || 'Без номера'} · {unit.area ?? '—'} м² · {unit.total_price ?? 'По запросу'} TJS
            <span className="block text-sm text-gray-600">{inventoryValue('availability_status', unit.availability_status)} · Версия {unit.version}</span>
            {selected[unit.id] && selected[unit.id].version !== unit.version && <span className="block text-amber-800">Версия изменилась. Снимите выбор и выберите лот заново после проверки.</span>}
          </span>
        </label>)}
        <nav aria-label="Страницы выбора лотов" className="flex flex-wrap items-center gap-3"><button className={batchButton} disabled={page <= 1 || query.isFetching} onClick={() => setPage(p => p - 1)}>Лоты: назад</button>
          <span>{page} / {query.data.last_page}</span><button className={batchButton} disabled={page >= query.data.last_page || query.isFetching} onClick={() => setPage(p => p + 1)}>Лоты: далее</button></nav>
      </div>}
    <label className="flex min-h-11 items-center gap-3"><input type="checkbox" className="h-5 w-5" checked={price.enabled} onChange={e => setPrice(p => ({ ...p, enabled: e.target.checked }))} />Установить новую цену выбранным лотам</label>
    {price.enabled && <div className="grid gap-3 sm:grid-cols-2">
      <label>Основа цены<select className={batchField} value={price.basis} onChange={e => setPrice(p => ({ ...p, basis: e.target.value as 'total' | 'per_sqm' }))}><option value="per_sqm">Цена за м²</option><option value="total">Общая цена каждого лота</option></select></label>
      <label>Сумма, TJS<input className={batchField} inputMode="decimal" disabled={price.onRequest} value={price.amount} onChange={e => setPrice(p => ({ ...p, amount: e.target.value }))} /></label>
      <label className="flex min-h-11 items-center gap-3"><input type="checkbox" className="h-5 w-5" checked={price.onRequest} onChange={e => setPrice(p => ({ ...p, onRequest: e.target.checked }))} />Цена по запросу</label>
    </div>}
    <label className="flex min-h-11 items-center gap-3"><input type="checkbox" className="h-5 w-5" checked={price.clearDiscount} onChange={e => setPrice(p => ({ ...p, clearDiscount: e.target.checked }))} />Убрать скидочную цену у выбранных лотов</label>
    <label className="block">Новая доступность<select className={batchField} value={availability} onChange={e => setAvailability(e.target.value)}>
      <option value="">Не менять доступность</option><option value="available">Свободна</option><option value="reserved">Бронь</option><option value="sold">Продана</option><option value="withdrawn">Снята</option></select></label>
    <button className={batchButton} disabled={!canSubmit || query.isError || query.isPending} onClick={() => {
      try { setError(''); void onSubmit(bulkRows(Object.values(selected), price, availability)); } catch (e) { setError(e instanceof Error ? e.message : 'Проверьте данные.'); }
    }}>Подготовить preview выбранных лотов</button>
    {error && <p role="alert" className="text-red-700">{error}</p>}
  </div>;
}

function ImportEditor({ buildingId, userId, canSubmit, onSubmit }: { buildingId: number; userId: number; canSubmit: boolean; onSubmit: (file: File, delimiter: string) => Promise<void> }) {
  const [source, setSource] = useState('file'), [file, setFile] = useState<File | null>(null), [text, setText] = useState(''), [delimiter, setDelimiter] = useState(';'), [error, setError] = useState('');
  return <div className="min-w-0 space-y-4">
    <p>CSV в UTF-8, до 10 МБ и 10 000 записей. Обязателен стабильный external_id; совпавший ID обновляет существующий лот этого ЖК. Новые и изменённые данные требуют модерации.</p>
    <p className="text-sm">Пустая ячейка сохраняет прежнее значение. NULL очищает поле. Цены — десятичные строки; запятая или точка допустимы. Указывайте только одну исходную цену в строке. Неизвестные ID корпусов/подъездов не создаются автоматически.</p>
    <button className={batchButton} onClick={() => void downloadBatchFile(batchPath(buildingId) + '/template', userId, 'manora-unit-import.csv').catch(e => setError(batchError(e)))}>Скачать шаблон CSV</button>
    <label className="block">Источник CSV<select className={batchField} value={source} onChange={e => setSource(e.target.value)}><option value="file">Загрузить файл</option><option value="text">Вставить CSV-текст</option></select></label>
    {source === 'file' ? <label className="block">Файл CSV<input className={batchField} type="file" accept=".csv,.txt,text/csv,text/plain" onChange={e => setFile(e.target.files?.[0] ?? null)} /></label>
      : <label className="block">CSV-текст<textarea className={batchField + ' font-mono text-sm'} rows={7} value={text} onChange={e => setText(e.target.value)} placeholder={'external_id;name;rooms;area;total_price\n'} /></label>}
    <label className="block">Разделитель<select className={batchField} value={delimiter} onChange={e => setDelimiter(e.target.value)}><option value=";">Точка с запятой (;)</option><option value=",">Запятая (,)</option></select></label>
    <button className={batchButton} disabled={!canSubmit} onClick={() => {
      const upload = source === 'file' ? file : new File([text], 'pasted-units.csv', { type: 'text/csv' });
      if (!upload?.size || upload.size > 10 * 1024 * 1024) { setError('Выберите непустой CSV не больше 10 МБ.'); return; }
      setError(''); void onSubmit(upload, delimiter);
    }}>Подготовить preview импорта</button>
    {error && <p role="alert" className="text-red-700">{error}</p>}
  </div>;
}
