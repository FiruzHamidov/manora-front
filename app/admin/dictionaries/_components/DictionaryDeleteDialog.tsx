'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Loader2, X } from 'lucide-react';
import { toast } from 'react-toastify';
import { dictionariesApi } from '@/services/dictionaries/api';
import type { DictionaryResource } from '@/services/dictionaries/types';
import showAxiosErrorToast from '@/utils/showAxiosErrorToast';

export type DictionaryDeleteTarget = { id: number; label: string };

type Props = {
  resource: DictionaryResource;
  target: DictionaryDeleteTarget | null;
  onClose: () => void;
  onCompleted?: () => void | Promise<unknown>;
  onDeleteUnused?: (resource: DictionaryResource, id: number) => Promise<unknown>;
};

function usageMessage(count: number) {
  const singular = count % 10 === 1 && count % 100 !== 11;
  return `Это значение используется в ${count} ${singular ? 'связанной записи' : 'связанных записях'}.`;
}

export default function DictionaryDeleteDialog({ resource, target, onClose, onCompleted, onDeleteUnused }: Props) {
  const queryClient = useQueryClient();
  const [replacementId, setReplacementId] = useState('');
  const usage = useQuery({
    queryKey: ['dictionary-usage', resource, target?.id],
    queryFn: () => dictionariesApi.usage(resource, target!.id),
    enabled: Boolean(target),
  });

  useEffect(() => setReplacementId(''), [target?.id]);

  const remove = useMutation({
    mutationFn: async () => {
      if (!target || !usage.data) return;
      if (usage.data.total === 0) {
        return onDeleteUnused
          ? onDeleteUnused(resource, target.id)
          : dictionariesApi.remove(resource, target.id);
      }
      return dictionariesApi.replaceAndDelete(resource, target.id, Number(replacementId));
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['dictionaries', resource] });
      await onCompleted?.();
      toast.success(usage.data?.total ? `Заменено связей: ${usage.data.total}. Запись удалена.` : 'Запись удалена');
      onClose();
    },
    onError: (error) => showAxiosErrorToast(error, 'Не удалось удалить запись'),
  });

  if (!target) return null;

  const hasUsage = Boolean(usage.data?.total);
  const canSubmit = usage.data && (!hasUsage || Boolean(replacementId));

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="dictionary-delete-title">
      <button type="button" className="absolute inset-0 bg-black/40" onClick={onClose} aria-label="Закрыть" />
      <div className="relative z-10 w-full max-w-xl rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 id="dictionary-delete-title" className="text-xl font-semibold text-[#101828]">Удаление «{target.label}»</h3>
            <p className="mt-1 text-sm text-[#667085]">Сначала проверяем все связанные записи.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 hover:bg-gray-100" aria-label="Закрыть"><X className="h-5 w-5" /></button>
        </div>

        {usage.isLoading && <div className="flex items-center gap-2 py-8 text-[#475467]"><Loader2 className="h-5 w-5 animate-spin" /> Проверка использования…</div>}
        {usage.isError && <div className="mt-5 rounded-xl bg-red-50 p-4 text-red-700">Не удалось проверить связанные записи.</div>}

        {usage.data && (
          <div className="mt-5 space-y-4">
            {hasUsage ? (
              <>
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <div className="flex gap-3"><AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" /><div>
                    <p className="font-medium text-amber-900">{usageMessage(usage.data.total)}</p>
                    <ul className="mt-2 space-y-1 text-sm text-amber-800">
                      {usage.data.usages.filter((item) => item.count > 0).map((item) => <li key={item.key}>{item.label}: {item.count}</li>)}
                    </ul>
                  </div></div>
                </div>

                {usage.data.replacements.length > 0 ? (
                  <label className="block text-sm font-medium text-[#344054]">
                    На что заменить
                    <select value={replacementId} onChange={(event) => setReplacementId(event.target.value)} className="mt-2 w-full rounded-lg border border-[#D0D5DD] px-3 py-2.5 text-[#101828]">
                      <option value="">Выберите другое значение</option>
                      {usage.data.replacements.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
                    </select>
                  </label>
                ) : (
                  <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700">Удаление невозможно: сначала создайте другое значение в этом справочнике.</div>
                )}
              </>
            ) : (
              <div className="rounded-xl bg-emerald-50 p-4 text-emerald-800">Связанных записей нет. Значение можно безопасно удалить.</div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={onClose} disabled={remove.isPending} className="rounded-lg border border-[#D0D5DD] px-4 py-2">Отмена</button>
              <button type="button" onClick={() => remove.mutate()} disabled={!canSubmit || remove.isPending} className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-50">
                {remove.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                {hasUsage ? `Заменить и удалить` : 'Удалить'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
