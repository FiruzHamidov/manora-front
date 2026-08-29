'use client';

import { Button } from '@/ui-components/Button';
import type { DictionaryPage } from '@/services/dictionaries/use-residential-dictionary-page';

export default function DictionaryPagination({ data, busy, perPage, setPage, setPerPage }: {
  data?: Pick<DictionaryPage<unknown>, 'current_page' | 'last_page' | 'total'>;
  busy: boolean; perPage: number; setPage: (page: number) => void; setPerPage: (count: number) => void;
}) {
  return <nav aria-label="Страницы справочника" className="flex flex-wrap items-center justify-between gap-3">
    <label className="flex items-center gap-2 text-sm">Записей на странице
      <select value={perPage} onChange={e => setPerPage(Number(e.target.value))} className="rounded border p-2">
        {[15, 30, 50, 100].map(size => <option key={size} value={size}>{size}</option>)}
      </select>
    </label>
    {data && <>
      <p className="text-sm text-gray-600" role="status">Всего: {data.total} • Стр. {data.current_page} из {data.last_page}</p>
      <div className="flex gap-2">
        <Button variant="outline" disabled={busy || data.current_page <= 1} onClick={() => setPage(data.current_page - 1)}>← Пред</Button>
        <Button variant="outline" disabled={busy || data.current_page >= data.last_page} onClick={() => setPage(data.current_page + 1)}>След →</Button>
      </div>
    </>}
  </nav>;
}
