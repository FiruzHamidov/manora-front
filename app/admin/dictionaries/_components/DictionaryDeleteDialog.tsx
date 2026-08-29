'use client';

import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { X } from 'lucide-react';
import { toast } from 'react-toastify';
import { dictionariesApi } from '@/services/dictionaries/api';
import type { DictionaryDeleteCommand, DictionaryResource } from '@/services/dictionaries/types';
import { useMe } from '@/services/login/hooks';

export type DictionaryDeleteTarget = { id: number; label: string };
type Props = {
  resource: DictionaryResource;
  target: DictionaryDeleteTarget | null;
  onClose: () => void;
  onCompleted?: () => void | Promise<unknown>;
  onDeleteUnused?: (resource: DictionaryResource, id: number) => Promise<unknown>;
};
const button = 'min-h-11 rounded-xl border px-4 py-2 disabled:opacity-50';
const field = 'mt-2 min-h-11 w-full rounded-xl border border-gray-400 p-3';

export default function DictionaryDeleteDialog(props: Props) {
  const me = useMe();
  if (!props.target || !me.data) return null;
  return <DeleteDialog key={props.resource + ':' + props.target.id + ':' + me.data.id} {...props} target={props.target} userId={me.data.id} />;
}

function DeleteDialog({ resource, target, userId, onClose, onCompleted, onDeleteUnused }: Props & { target: DictionaryDeleteTarget; userId: number }) {
  const cache = useQueryClient(), dialog = useRef<HTMLDialogElement>(null);
  const [replacementId, setReplacementId] = useState(''), [reason, setReason] = useState('');
  const [error, setError] = useState(''), [needsRefresh, setNeedsRefresh] = useState(false);
  const [pendingCommand, setPendingCommand] = useState<DictionaryDeleteCommand | null>(null);
  const usage = useQuery({
    queryKey: ['dictionary-usage', resource, target.id, userId],
    queryFn: () => dictionariesApi.usage(resource, target.id, userId),
    retry: false, refetchOnWindowFocus: false, refetchOnMount: 'always',
  });
  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    return () => element?.close();
  }, []);
  const remove = useMutation({
    mutationFn: async (command: DictionaryDeleteCommand) => {
      // Preserve existing specialised deletion for unrelated unused dictionaries.
      if (!usage.data?.requires_confirmation && usage.data?.total === 0) {
        if (onDeleteUnused) await onDeleteUnused(resource, target.id);
        else await dictionariesApi.remove(resource, target.id);
        return { reassigned: 0 };
      }
      return dictionariesApi.replaceAndDelete(resource, target.id, command);
    },
    onSuccess: async (result) => {
      await Promise.all([
        cache.invalidateQueries({ queryKey: [resource] }),
        cache.invalidateQueries({ queryKey: ['dictionaries', resource] }),
        cache.invalidateQueries({ queryKey: ['manage-new-buildings'] }),
        cache.invalidateQueries({ queryKey: ['new-buildings'] }),
        ...(resource === 'locations' || resource === 'districts' ? [
          cache.invalidateQueries({ queryKey: ['dictionaries', 'districts'] }),
          cache.invalidateQueries({ queryKey: ['dictionaries', 'locations'] }),
        ] : []),
      ]);
      await onCompleted?.();
      toast.success('Запись удалена. Перенесено связей: ' + result.reassigned);
      onClose();
    },
    onError: (failure) => {
      const status = isAxiosError(failure) ? failure.response?.status : undefined;
      if (status && status >= 400 && status < 500) {
        setPendingCommand(null);
        setNeedsRefresh(true);
        setError(isAxiosError(failure) ? failure.response?.data?.message || 'Удаление отклонено. Обновите использование.' : 'Удаление отклонено.');
      } else {
        setError('Результат не подтверждён. Повтор отправит тот же запрос, не новое удаление.');
      }
    },
  });
  const locked = remove.isPending || !!pendingCommand;
  const current = usage.data;
  const canSubmit = current && !usage.isError && !usage.isFetching && !needsRefresh && !locked &&
    reason.trim() && (!current.total || current.replacements.some(item => item.id === Number(replacementId)));
  const submit = () => {
    if (!canSubmit) return;
    const command = { replacement_id: current.total ? Number(replacementId) : null, usage_token: current.usage_token,
      request_key: crypto.randomUUID(), reason: reason.trim(), expected_user_id: userId };
    setError(''); setPendingCommand(command); remove.mutate(command);
  };
  return <dialog ref={dialog} aria-labelledby="dictionary-delete-title"
    onCancel={event => { event.preventDefault(); if (!remove.isPending) onClose(); }}
    className="m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%_-_2rem)] max-w-xl overflow-y-auto rounded-2xl p-0 backdrop:bg-black/40">
    <div className="min-w-0 space-y-4 p-4 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <h2 id="dictionary-delete-title" className="min-w-0 break-words text-xl font-semibold">Удаление «{target.label}»</h2>
        <button type="button" className={button + ' shrink-0'} disabled={remove.isPending} onClick={onClose} aria-label="Закрыть"><X className="h-5 w-5" /></button>
      </div>
      <p>Проверьте связанные записи и замену. Удаление значения нельзя отменить одной кнопкой.</p>
      {usage.isPending && <p role="status">Проверка использования…</p>}
      {usage.isError && <p role="alert">Не удалось проверить актуальное использование. Удаление отключено.</p>}
      {error && <p role="alert" className="break-words text-red-700">{error}</p>}
      <button className={button} disabled={locked || usage.isFetching} onClick={() => {
        void usage.refetch().then(result => {
          if (!result.isError) { setNeedsRefresh(false); setReplacementId(''); setError(''); }
        });
      }}>Обновить использование</button>
      {current && <fieldset disabled={locked || usage.isError || needsRefresh || usage.isFetching} className="min-w-0 space-y-4 disabled:opacity-60">
        <div className="space-y-2 rounded-xl border border-amber-300 bg-amber-50 p-3">
          <p>Связанных записей: {current.total}.</p>
          <ul>{current.usages.filter(item => item.count > 0).map(item => <li key={item.key}>{item.label}: {item.count}</li>)}</ul>
          {current.affected_buildings > 0 && <p>В {current.affected_buildings} ЖК потребуется повторная проверка данных. Опубликованных ЖК будет снято с публикации: {current.published_buildings}. Индивидуальные лоты и их цены не меняются.</p>}
          {resource === 'locations' && <p>Объявления и районы перейдут в выбранный город. Районы с одинаковым названием объединятся. Текст района и координаты самих ЖК не изменятся.</p>}
          {resource === 'districts' && <p>У связанных объявлений изменятся район и город. Район в ЖК хранится отдельным текстом и автоматически не заменяется.</p>}
          {!current.total && <p>По этому снимку связанных записей нет. Сервер перепроверит их перед удалением.</p>}
        </div>
        {current.total > 0 && (current.replacements.length ? <label className="block">На что заменить
          <select className={field} value={replacementId} onChange={event => setReplacementId(event.target.value)}>
            <option value="">Выберите другое значение</option>
            {current.replacements.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}
          </select>
        </label> : <p>Сначала добавьте другое значение в этот справочник.</p>)}
        <label className="block">Причина удаления или замены
          <textarea className={field} maxLength={900} value={reason} onChange={event => setReason(event.target.value)} />
        </label>
        <div className="flex flex-wrap justify-end gap-3">
          <button className={button} onClick={onClose}>Отмена</button>
          <button className={button + ' bg-red-700 text-white'} disabled={!canSubmit} onClick={submit}>
            {current.total ? 'Подтвердить замену и удаление' : 'Подтвердить удаление'}
          </button>
        </div>
      </fieldset>}
      {remove.isPending && <p role="status">Сервер проверяет и применяет изменение…</p>}
      {pendingCommand && !remove.isPending && <button className={button} onClick={() => remove.mutate(pendingCommand)}>Повторить тот же запрос</button>}
    </div>
  </dialog>;
}
