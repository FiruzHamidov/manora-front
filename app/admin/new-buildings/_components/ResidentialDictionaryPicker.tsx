'use client';

import { useId, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { axios } from '@/utils/axios';
import { Button } from '@/ui-components/Button';
import { useResidentialDictionaryPage, type DictionaryPage } from '@/services/dictionaries/use-residential-dictionary-page';
import type { ResidentialDictionaryResource } from '@/services/dictionaries/residential-editor';
import { changeDictionarySelection, dictionarySelectionIds, loadDictionarySelection, type DictionaryOption } from '@/services/dictionaries/selection';
import { parseDictionaryError } from '@/services/dictionaries/utils';

type Props = {
  resource: ResidentialDictionaryResource; label: string; selectedIds: readonly (number | string)[];
  onChange: (ids: number[]) => void; multiple?: boolean; error?: string;
};

export default function ResidentialDictionaryPicker({ resource, label, selectedIds, onChange, multiple = false, error }: Props) {
  const name = useId();
  const [open, setOpen] = useState(false);
  const ids = dictionarySelectionIds(selectedIds);
  const query = useResidentialDictionaryPage<DictionaryOption>(resource, { enabled: open, perPage: 20 });
  const selection = useQuery({
    queryKey: [resource, 'selected-options', ids],
    queryFn: ({ signal }) => loadDictionarySelection(ids, async chunk => (await axios.get<DictionaryPage<DictionaryOption>>(`/${resource}`, {
      params: { ids: chunk, per_page: 100 }, signal, timeout: 15_000,
    })).data.data),
    enabled: ids.length > 0, retry: false,
  });
  const known = new Map([...(query.data?.data ?? []), ...(selection.data ?? [])].map(record => [record.id, record]));
  const itemLabel = (record: DictionaryOption) => `${record.name} (№${record.id})${record.is_active === false ? ' — неактивен' : ''}`;
  return <fieldset className="min-w-0 space-y-3 rounded-xl border p-3" aria-describedby={error ? `${name}-error` : undefined}>
    <legend className="px-1 font-medium">{label}</legend>
    {ids.length === 0 ? <p className="text-sm text-gray-600">Не выбрано</p> : <ul aria-label={`Выбрано: ${label}`} className="space-y-2">
      {ids.map(id => <li key={id} className="flex min-w-0 items-start justify-between gap-2 text-sm">
        <span className="min-w-0 break-words">{known.has(id) ? itemLabel(known.get(id)!) : selection.isPending ? `Запись №${id} — загрузка названия…` : selection.isError ? `Запись №${id} — название недоступно` : `Запись №${id} не найдена. Проверьте связь.`}</span>
        <button type="button" className="shrink-0 underline" aria-label={`Убрать ${label}, запись №${id}`} onClick={() => onChange(ids.filter(value => value !== id))}>Убрать</button>
      </li>)}
    </ul>}
    {ids.length > 0 && selection.isError && <div role="alert" className="text-sm text-red-700">Не удалось загрузить выбранные значения. ID сохранены. <button type="button" className="underline" onClick={() => void selection.refetch()}>Повторить загрузку выбранного</button></div>}
    {error && <p id={`${name}-error`} role="alert" className="text-sm text-red-700">{error}</p>}
    <details open={open} onToggle={event => setOpen(event.currentTarget.open)}>
      <summary className="cursor-pointer rounded border p-2">Выбрать: {label}</summary>
      <div className="mt-3 space-y-3">
        <label className="block text-sm">Поиск: {label}
          <input type="search" maxLength={255} value={query.params.search} onChange={event => query.setSearch(event.target.value)} className="mt-1 w-full min-w-0 rounded border p-2" />
        </label>
        {query.isPending && <p role="status">Загрузка вариантов…</p>}
        {query.isError && <div role="alert" className="text-sm text-red-700">Не удалось загрузить варианты. {parseDictionaryError(query.error).message} <button type="button" className="underline" onClick={() => void query.refetch()}>Повторить поиск</button></div>}
        {!query.isError && query.data && <>
          <p className="text-sm text-gray-600" role="status">Найдено: {query.data.total}. Страница {query.data.current_page} из {query.data.last_page}.</p>
          {query.data.data.length === 0 && <p>Ничего не найдено. Выбранные значения сохранены.</p>}
          <div className="max-h-64 space-y-1 overflow-y-auto" role="group" aria-label={`Варианты: ${label}`}>
            {query.data.data.map(record => <label key={record.id} className="flex cursor-pointer items-start gap-2 rounded border p-2 text-sm">
              <input className="mt-1 shrink-0" type={multiple ? 'checkbox' : 'radio'} name={name} checked={ids.includes(record.id)} onChange={() => onChange(changeDictionarySelection(ids, record.id, multiple))} />
              <span className="min-w-0 break-words">{itemLabel(record)}</span>
            </label>)}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" disabled={query.isFetching || query.data.current_page <= 1} onClick={() => query.setPage(query.data!.current_page - 1)}>Предыдущие</Button>
            <Button size="sm" variant="outline" disabled={query.isFetching || query.data.current_page >= query.data.last_page} onClick={() => query.setPage(query.data!.current_page + 1)}>Следующие</Button>
          </div>
        </>}
      </div>
    </details>
  </fieldset>;
}
