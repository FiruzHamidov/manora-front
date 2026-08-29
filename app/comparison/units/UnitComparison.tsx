'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQueries } from '@tanstack/react-query';
import { API_BASE_URL } from '@/config/api';
import { useUnitComparison } from '@/services/new-buildings/use-unit-comparison';
import { unitComparisonRows, unitReferenceHref, unitReferenceKey } from '@/services/new-buildings/unit-comparison';
import { fetchPublicUnit, PublicUnitError } from '@/services/new-buildings/public-unit-api';

const button = 'min-h-11 rounded-xl border border-green-800 px-3 py-2 text-green-800 disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-800';
export default function UnitComparison() {
  const comparison = useUnitComparison(), [differences, setDifferences] = useState(false);
  const queries = useQueries({ queries: comparison.units.map(ref => ({
    queryKey: ['unit-comparison', ref.buildingId, ref.unitId],
    queryFn: ({ signal }: { signal: AbortSignal }) => fetchPublicUnit(API_BASE_URL, String(ref.buildingId), String(ref.unitId), signal),
    staleTime: 0, refetchInterval: 30_000, refetchOnWindowFocus: 'always' as const, retry: false,
  })) });
  // An error must not leave stale price/status data presented as current comparison.
  const visible = queries.flatMap((query, index) => query.data && !query.isError ? [{ index, unit: query.data }] : []);
  const rows = unitComparisonRows(visible.map(row => row.unit), differences);
  const loading = queries.some(query => query.isFetching);
  return <div className="mx-auto min-w-0 max-w-7xl space-y-5 px-3 pb-32 pt-8 sm:px-6">
    <h1 className="text-3xl font-bold">Сравнение квартир ЖК</h1>
    <p>Выберите от 2 до 4 реальных квартир. В этом списке нет целых ЖК и обычных объявлений. Выбор сохраняется в этом браузере.</p>
    <div className="flex flex-wrap gap-4"><Link href="/new-buildings" className="inline-flex min-h-11 items-center text-green-800 underline">Выбрать квартиры в ЖК</Link><Link href="/comparison" className="inline-flex min-h-11 items-center text-green-800 underline">Сравнение обычных объявлений</Link></div>
    {comparison.error && <p role="alert">{comparison.error}</p>}
    <p role="status">Выбрано: {comparison.units.length} из 4.{comparison.units.length < 2 ? ' Добавьте минимум две квартиры для сравнения.' : ''}</p>
    <div className="flex flex-wrap items-center gap-4">
      <label className="flex min-h-11 items-center gap-2"><input type="checkbox" checked={differences} onChange={event => setDifferences(event.target.checked)} />Только различия</label>
      <button className={button} disabled={!queries.length || loading} onClick={() => queries.forEach(query => { void query.refetch(); })}>Обновить данные</button>
    </div>
    <p className="text-sm text-gray-600">Данные обновляются каждые 30 секунд и при возвращении на вкладку. Забронированные и проданные квартиры отмечены своим статусом.</p>
    <ul className="grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {comparison.units.map((ref, index) => {
        const query = queries[index], unit = !query.isError ? query.data : undefined;
        return <li key={unitReferenceKey(ref)} className="min-w-0 space-y-3 rounded-xl border p-4 [overflow-wrap:anywhere]">
          <h2 className="font-semibold">Квартира {index + 1}</h2>
          {unit ? <><Link href={unitReferenceHref(ref)} className="text-green-800 underline">{unit.building.title} · {unit.number ? '№ ' + unit.number : 'ID ' + unit.id}</Link><p className="text-xs text-gray-600">Загружено: {new Date(query.dataUpdatedAt).toLocaleTimeString('ru-RU')}</p></>
            : <p role="status">{query.isPending ? 'Загрузка…' : query.error instanceof PublicUnitError && query.error.status === 404 ? 'Квартира снята с публикации или недоступна. Её данные скрыты.' : 'Не удалось обновить квартиру. Повторите загрузку; выбор сохранён.'}</p>}
          <button className={button} disabled={comparison.busy} onClick={() => void comparison.change(ref, false)}>Удалить квартиру {index + 1}</button>
        </li>;
      })}
    </ul>
    {comparison.units.length >= 2 && visible.length < 2 && <p role="status">Для сравнения нужны актуальные данные хотя бы двух выбранных квартир.</p>}
    {visible.length >= 2 && <>
      {visible.length < comparison.units.length && <p role="status">В таблице только квартиры с загруженными данными. Недоступные записи остаются в списке выше.</p>}
      {!rows.length ? <p>Различий в загруженных параметрах нет.</p> : <div className="max-w-full overflow-x-auto rounded-xl border focus-visible:outline-2 focus-visible:outline-green-800" role="region" aria-label="Таблица сравнения квартир, прокручиваемая область" tabIndex={0}>
        <table className="w-full border-collapse text-left text-sm">
          <caption className="p-3 text-left">{differences ? 'Различающиеся параметры' : 'Все параметры'} · сравнивается квартир: {visible.length}</caption>
          <thead><tr><th scope="col" className="sticky left-0 min-w-32 border-b bg-white p-3">Параметр</th>{visible.map(({ index, unit }) => <th key={unit.id} scope="col" className="min-w-40 border-b bg-white p-3">Квартира {index + 1}{unit.number ? ' · № ' + unit.number : ''}</th>)}</tr></thead>
          <tbody>{rows.map(row => <tr key={row.key} className="odd:bg-gray-50">
            <th scope="row" className="sticky left-0 border-b bg-white p-3 font-medium">{row.label}</th>
            {row.values.map((value, index) => <td key={visible[index].unit.id} className="max-w-64 break-words border-b p-3">{value}</td>)}
          </tr>)}</tbody>
        </table>
      </div>}
    </>}
  </div>;
}
