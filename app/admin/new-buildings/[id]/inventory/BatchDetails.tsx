'use client';

import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { axios } from '@/utils/axios';
import { batchActions, batchBusy, batchStatuses, inventoryDiff, inventoryLabels, type BatchDetail } from '@/services/new-buildings/inventory-batches';
import { batchButton, batchError, batchPath, downloadBatchFile, inventoryValue } from './batch-ui';
import { invalidatePublicInventory } from '@/services/new-buildings/invalidate-public-inventory';

export default function BatchDetails({ buildingId, userId, batchId }: { buildingId: number; userId: number; batchId: number }) {
  const [page, setPage] = useState(1), [errorsOnly, setErrorsOnly] = useState(false), [confirmedVersion, setConfirmedVersion] = useState<number | null>(null);
  const [busy, setBusy] = useState(false), [message, setMessage] = useState(''), [error, setError] = useState('');
  const cache = useQueryClient();
  const query = useQuery({
    queryKey: ['inventory-batches', buildingId, userId, batchId, page, errorsOnly],
    queryFn: async ({ signal }) => (await axios.get<BatchDetail>(batchPath(buildingId) + '/' + batchId,
      { signal, timeout: 12_000, params: { page, errors_only: errorsOnly ? 1 : 0, expected_user_id: userId } })).data,
    retry: false, refetchInterval: state => state.state.data && batchBusy(state.state.data.data.status) ? 2_000 : false,
  });
  const batch = query.data?.data;
  useEffect(() => {
    // The apply response only queues work. Refresh inventory again after commit,
    // without replacing the revisions the user has already selected for a draft.
    if (batch?.status !== 'applied') return;
    void Promise.all([
      cache.invalidateQueries({ queryKey: ['inventory-batch-units', buildingId, userId] }),
      cache.invalidateQueries({ queryKey: ['inventory-batches', buildingId, userId, 'list'] }),
      cache.invalidateQueries({ queryKey: ['manage-new-buildings'] }),
      invalidatePublicInventory(cache, buildingId),
    ]);
  }, [batch?.status, batch?.id, buildingId, userId, cache]);
  const command = async (action: 'apply' | 'cancel' | 'retry') => {
    if (!batch) return;
    setBusy(true); setError(''); setMessage('');
    try {
      await axios.post(batchPath(buildingId) + '/' + batchId, { action, version: action === 'apply' ? confirmedVersion : batch.version,
        confirm: action === 'apply' ? true : undefined, expected_user_id: userId }, { timeout: 20_000 });
      setConfirmedVersion(null);
      setMessage(action === 'apply' ? 'Запрос на применение принят. Дождитесь статуса «Применён» в журнале.' : 'Запрос принят.');
    } catch (e) { setError(batchError(e)); }
    finally {
      await Promise.all([cache.invalidateQueries({ queryKey: ['inventory-batches', buildingId, userId] }),
        cache.invalidateQueries({ queryKey: ['inventory-batch-units', buildingId] }), cache.invalidateQueries({ queryKey: ['manage-new-buildings'] })]);
      setBusy(false);
    }
  };
  return <section aria-label={'Пакет ' + batchId} className="min-w-0 space-y-4 rounded-2xl border border-green-700 bg-white p-4">
    <h2 className="text-xl font-semibold">Пакет №{batchId}</h2>
    {query.isPending && <p role="status">Загрузка пакета…</p>}
    {query.isError && <p role="alert">Актуальный статус не получен. Действия отключены до обновления.</p>}
    <button className={batchButton} disabled={query.isFetching} onClick={() => void query.refetch()}>Обновить пакет</button>
    {batch && <>
      <p className="text-lg font-semibold" role="status">{batchStatuses[batch.status]} · Версия {batch.version}</p>
      <p className="break-words">{batch.reason}</p>
      {batch.source_name && <p className="break-words">Источник: {batch.source_name}</p>}
      <p>Записей: {batch.row_count} · Автор: {batch.created_by ?? 'аккаунт удалён'}</p>
      {batchBusy(batch.status) && <p>Операция выполняется фоновым обработчиком. Можно вернуться позже по ссылке на этот пакет. Если статус долго не меняется, проверьте worker очереди residential-inventory.</p>}
      {batch.summary && <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">{Object.entries(batch.summary).map(([key, count]) => <div key={key}><dt>{batchActions[key as keyof typeof batchActions]}</dt><dd className="text-xl font-semibold">{count}</dd></div>)}</dl>}
      {batch.impact && <div className="space-y-2 rounded-xl bg-amber-50 p-3">
        <p>{batch.status === 'applied' ? 'Затронуто лотов' : 'Лотов с предлагаемыми изменениями'}: {batch.impact.affected_count}.</p>
        {batch.impact.requires_building_reverification && <p>После правки застройщика потребуется повторная проверка ЖК. Если он опубликован, он будет снят с публикации до одобрения.</p>}
        {batch.impact.new_or_changed_imports_require_moderation && <p>Новые и изменённые импортом лоты не публикуются автоматически. Неизменённые лоты сохраняют прежний статус.</p>}
      </div>}
      {batch.error && <p role="alert" className="text-red-700">{batch.error}</p>}
      {query.data?.can_command && <fieldset disabled={busy || query.isError} className="space-y-3 disabled:opacity-60">
        {batch.status === 'ready' && <>
          <label className="flex min-h-11 items-start gap-3"><input className="mt-1 h-5 w-5 shrink-0" type="checkbox" checked={confirmedVersion === batch.version} onChange={e => setConfirmedVersion(e.target.checked ? batch.version : null)} />
            <span>Проверил все изменения и их влияние на публикацию. Подтверждаю применение пакета целиком.</span></label>
          <button className={batchButton} disabled={confirmedVersion !== batch.version} onClick={() => void command('apply')}>Применить проверенный пакет</button>
        </>}
        {batch.status === 'failed' && <button className={batchButton} onClick={() => void command('retry')}>Повторить подготовку после технической ошибки</button>}
        {!['applied', 'cancelled'].includes(batch.status) && <button className={batchButton} onClick={() => void command('cancel')}>Отменить пакет</button>}
      </fieldset>}
      {batch.status === 'applied' && <p className="font-semibold text-green-800">{batch.impact?.affected_count === 0 ? 'Пакет завершён без изменений фонда.' : 'Изменения пакета применены.'} Время завершения: {batch.applied_at ? new Date(batch.applied_at).toLocaleString('ru-RU') : 'не указано'}. Повторное применение этого пакета не создаст дубли.</p>}
      {batch.status === 'invalid' && <p>Ни одна строка не применена. Исправьте данные по отчёту и создайте новый preview.</p>}
      {message && batchBusy(batch.status) && <p role="status">{message}</p>}{error && <p role="alert" className="text-red-700">{error}</p>}
      <button className={batchButton} onClick={() => void downloadBatchFile(batchPath(buildingId) + '/' + batchId + '/report', userId, 'manora-inventory-batch-' + batchId + '.json').catch(e => setError(batchError(e)))}>Скачать полный отчёт JSON</button>
      <label className="flex min-h-11 items-center gap-3"><input className="h-5 w-5" type="checkbox" checked={errorsOnly} onChange={e => { setErrorsOnly(e.target.checked); setPage(1); }} />Только ошибки</label>
      {!query.isError && query.data?.rows.data.map(row => <details key={row.id} className="min-w-0 rounded-xl border p-3" open={row.action === 'error'}>
        <summary className="min-h-11 cursor-pointer break-words">Запись {row.row_number} · {row.action ? batchActions[row.action] : 'Ожидает проверки'} · {row.unit_id ? 'Лот #' + row.unit_id : String(row.input.external_id ?? 'Новый лот')}</summary>
        {row.errors && <ul className="list-disc space-y-2 pl-5 text-red-700">{Object.entries(row.errors).map(([field, messages]) => <li key={field}>{inventoryLabels[field] ?? field}: {messages.join(' ')}</li>)}</ul>}
        {row.action === 'noop' && <p>Значения совпадают. Версия лота не изменится.</p>}
        <dl className="space-y-3">{inventoryDiff(row.before, row.result ?? row.after).map(change => <div key={change.field} className="min-w-0 border-t pt-2">
          <dt className="font-semibold">{inventoryLabels[change.field] ?? change.field}</dt><dd className="whitespace-pre-wrap break-words">До: {inventoryValue(change.field, change.before)}</dd><dd className="whitespace-pre-wrap break-words">После: {inventoryValue(change.field, change.after)}</dd>
        </div>)}</dl>
        <details className="mt-3"><summary className="min-h-11 cursor-pointer">Исходные данные записи</summary><pre className="whitespace-pre-wrap break-all text-xs">{JSON.stringify(row.input, null, 2)}</pre></details>
      </details>)}
      {query.data && <nav aria-label="Страницы preview" className="flex flex-wrap items-center gap-3">
        <button className={batchButton} disabled={page <= 1 || query.isFetching} onClick={() => setPage(p => p - 1)}>Записи: назад</button><span>{page} / {query.data.rows.meta.last_page}</span>
        <button className={batchButton} disabled={page >= query.data.rows.meta.last_page || query.isFetching} onClick={() => setPage(p => p + 1)}>Записи: далее</button>
      </nav>}
      <details><summary className="min-h-11 cursor-pointer font-semibold">История обработки (последние 50 событий)</summary><ol className="list-decimal space-y-3 pl-5">{query.data?.events.map(event => <li key={event.id}>
        <p>{batchStatuses[event.status]} · Версия {event.version} · {event.created_at}</p><p className="break-words">{event.message}</p>
      </li>)}</ol><p className="mt-3 text-sm">Все события доступны в полном отчёте JSON.</p></details>
    </>}
  </section>;
}
