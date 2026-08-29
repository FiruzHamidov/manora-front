'use client';

import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { trackResidential } from '@/services/new-buildings/track';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { unitFilterContext, unitPrice } from '@/services/new-buildings/public-unit';
import type { UnitFilters } from '@/services/new-buildings/public-unit';
import { changeSelection, readUnitSelection, selectionNavigation, selectionQuery, SELECTION_SORTS } from '@/services/new-buildings/unit-selection';
import type { UnitFacets, UnitGrid, UnitList } from '@/services/new-buildings/unit-selection';
import { useUnitSelection } from '@/services/new-buildings/use-unit-selection';
import { UnitSelectionFilters } from './UnitSelectionFilters';
import { UnitSelectionGrid, UnitSelectionList } from './UnitSelectionResults';

export function UnitSelection({ buildingId, scrollOffset, onReady }: { buildingId: number; scrollOffset?: number; onReady?: (ready: boolean) => void }) {
  const params = useSearchParams(), pathname = usePathname();
  const search = params.toString();
  const committed = useMemo(() => readUnitSelection(new URLSearchParams(search)), [search]);
  const committedKey = selectionQuery(committed);
  const previous = useRef({ buildingId, key: committedKey, block: committed.block_id });
  useEffect(() => {
    const before = previous.current;
    previous.current = { buildingId, key: committedKey, block: committed.block_id };
    if (before.buildingId !== buildingId || before.key === committedKey) return;
    trackResidential('filter_apply', { surface: 'selection', building_id: buildingId, filter_keys: Object.keys(committed) });
    if (before.block !== committed.block_id) trackResidential('block_select', { surface: 'selection', building_id: buildingId, block_id: Number(committed.block_id) });
  }, [buildingId, committedKey, committed]);
  const [draft, setDraft] = useState({ base: committedKey, value: committed, dirty: false });
  const [mobile, setMobile] = useState<boolean | null>(null);
  const [open, setOpen] = useState(false);
  const debounced = useDebouncedValue(draft, 500);
  useEffect(() => {
    const query = window.matchMedia('(max-width: 767px)');
    const update = () => setMobile(query.matches);
    update(); query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  useEffect(() => { setDraft({ base: committedKey, value: committed, dirty: false }); }, [committedKey, committed]);

  const navigate = (filters: UnitFilters) => {
    setDraft({ base: selectionQuery(filters), value: filters, dirty: false });
    const next = selectionNavigation(search, filters);
    window.history.pushState(null, '', pathname + (next ? '?' + next : '') + '#apartments');
  };
  useEffect(() => {
    // A browser Back/Forward navigation invalidates any pending draft from the previous URL.
    if (mobile !== false || open || debounced !== draft || !debounced.dirty || debounced.base !== committedKey) return;
    if (selectionQuery(debounced.value) !== committedKey) {
      const next = selectionNavigation(search, debounced.value);
      window.history.pushState(null, '', pathname + (next ? '?' + next : '') + '#apartments');
    }
  }, [draft, debounced, mobile, open, committedKey, search, pathname]);

  const edit = (value: UnitFilters) => setDraft({ base: committedKey, value, dirty: true });
  const cancel = () => {
    setDraft({ base: committedKey, value: committed, dirty: false });
    setOpen(false);
  };
  const view = committed.view === 'chessboard' ? 'chessboard' : 'list';
  const facets = useUnitSelection<UnitFacets>(buildingId, 'unit-facets', { include_reserved: '1' });
  const list = useUnitSelection<UnitList>(buildingId, 'units', committed, view === 'list');
  const grid = useUnitSelection<UnitGrid>(buildingId, 'availability-grid', committed, view === 'chessboard');
  const preview = useUnitSelection<UnitFacets>(buildingId, 'unit-facets', debounced.value, open);
  const previewReady = selectionQuery(debounced.value) === selectionQuery(draft.value) && !preview.isFetching && !preview.error && Boolean(preview.data);
  const active = view === 'list' ? list : grid;
  useEffect(() => {
    if (!active.isPending && !facets.isPending && mobile !== null) onReady?.(true);
  }, [active.isPending, facets.isPending, mobile, onReady]);
  const meta = active.data?.meta;
  const href = (id: number) => {
    const context = selectionQuery(unitFilterContext(new URLSearchParams(committedKey)));
    return '/new-buildings/' + buildingId + '/units/' + id + (context ? '?' + context : '');
  };
  const reset = () => {
    const value: UnitFilters = committed.view ? { view: committed.view } : {};
    if (open) edit(value); else navigate(value);
  };
  const change = (key: string, value: string) => navigate(changeSelection(committed, key, value));
  return <section id="apartments" style={{ scrollMarginTop: scrollOffset }} className="mt-5 min-w-0 scroll-mt-24 rounded-[26px] bg-white p-4 shadow-[0_2px_20px_rgba(15,23,42,0.05)] md:p-6">
    <h2 className="text-2xl font-bold text-slate-900">Выбрать квартиру</h2>
    <div className="mt-5 hidden lg:block">
      <UnitSelectionFilters value={draft.value} onChange={edit} facets={facets.data} prefix="desktop-selection" errors={active.error?.fields} />
    </div>
    <div className="mt-4 flex flex-wrap gap-3">
      <button type="button" className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white lg:hidden"
        onClick={() => { setDraft({ base: committedKey, value: committed, dirty: false }); setOpen(true); }}>Фильтры</button>
      <button type="button" onClick={reset} className="rounded-lg border px-4 py-2 text-sm">Сбросить фильтры</button>
      <button type="button" className="rounded-lg border px-4 py-2 text-sm disabled:opacity-50" disabled={active.isFetching}
        onClick={() => { void active.refetch(); void facets.refetch(); }}>Обновить наличие</button>
    </div>
    {facets.error && <p role="status" className="mt-3 text-sm text-red-700">Справочник фильтров не загрузился. <button type="button" className="underline" onClick={() => void facets.refetch()}>Повторить</button></p>}
    <div className="my-5 flex flex-wrap items-center justify-between gap-3">
      <div className="flex gap-2" aria-label="Представление квартир">
        {(['list', 'chessboard'] as const).map(mode => <button type="button" key={mode} aria-pressed={view === mode} onClick={() => change('view', mode)}
          className={'rounded-lg border px-3 py-2 text-sm ' + (view === mode ? 'border-blue-600 bg-blue-50 text-blue-800' : 'border-slate-300')}>
          {mode === 'list' ? 'Список' : 'Шахматка'}
        </button>)}
      </div>
      <label className="min-w-0 max-w-full text-sm"><span className="sr-only">Сортировка квартир</span>
        <select className="max-w-full rounded-lg border border-slate-300 bg-white px-3 py-2" value={committed.sort ?? 'newest'} onChange={e => change('sort', e.target.value)}>
          {SELECTION_SORTS.map(([key, title]) => <option key={key} value={key}>{title}</option>)}
        </select>
      </label>
    </div>
    <div aria-live="polite" aria-atomic="true" className="mb-4 text-sm">
      {active.isPending ? <p>Загружаем квартиры…</p> : active.error ? null : meta && <>
        <p className="font-semibold">Найдено: {meta.matched_count} · Свободно: {meta.matched_available_count} · Бронь: {meta.matched_reserved_count}</p>
        <p className="mt-1 text-slate-600">Свободные от: {unitPrice(meta.available_price_min)}{active.isFetching ? ' · Обновляем…' : ''}</p>
      </>}
    </div>
    {active.error ? <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
      <p>{active.error.message}</p>
      {Object.entries(active.error.fields ?? {}).map(([field, messages]) => <p key={field}>{messages.join(' ')}</p>)}
      {active.error.status !== 422 && <button type="button" className="mt-2 underline" onClick={() => void active.refetch()}>Повторить</button>}
    </div> : <>
      {view === 'list' && list.data && <>
        {list.data.data.length ? <UnitSelectionList units={list.data.data} href={href} /> : <p className="rounded-lg bg-slate-50 p-4">
          {list.data.meta.matched_count > 0 ? 'На этой странице квартир нет. Вернитесь на первую страницу.' : 'Квартир по этим условиям нет. Измените фильтры или обратитесь к консультанту.'}
        </p>}
        <nav aria-label="Страницы квартир" className="mt-4 flex flex-wrap items-center gap-3 text-sm">
          <button type="button" className="rounded border px-3 py-2 disabled:opacity-40" disabled={list.data.meta.page <= 1} onClick={() => change('page', String(list.data!.meta.page - 1))}>Назад</button>
          <span>Страница {list.data.meta.page} из {list.data.meta.last_page}</span>
          <button type="button" className="rounded border px-3 py-2 disabled:opacity-40" disabled={list.data.meta.page >= list.data.meta.last_page} onClick={() => change('page', String(list.data!.meta.page + 1))}>Далее</button>
          {list.data.meta.page > 1 && <button type="button" className="underline" onClick={() => change('page', '1')}>На первую</button>}
        </nav>
      </>}
      {view === 'chessboard' && grid.data && <UnitSelectionGrid grid={grid.data} href={href} onPage={change} />}
    </>}
    <Dialog open={open} onClose={cancel} className="relative z-[100]">
      <DialogBackdrop className="fixed inset-0 bg-black/50" />
      <div className="fixed inset-0 flex items-end justify-center p-2 sm:items-center">
        <DialogPanel className="flex max-h-[calc(100dvh-1rem)] w-full max-w-xl flex-col overflow-hidden rounded-2xl bg-white">
          <div className="flex items-center justify-between gap-3 border-b p-4">
            <DialogTitle className="text-lg font-bold">Фильтры квартир</DialogTitle>
            <button type="button" className="rounded border px-3 py-2" onClick={cancel}>Закрыть</button>
          </div>
          <div className="min-h-0 overflow-y-auto p-4">
            <UnitSelectionFilters value={draft.value} onChange={edit} facets={facets.data} prefix="mobile-selection" errors={preview.error?.fields} />
            {preview.error && <div role="alert" className="mt-4 text-sm text-red-700">
              <p>{preview.error.message}</p>{Object.values(preview.error.fields ?? {}).flat().map((message, i) => <p key={i}>{message}</p>)}
              <button type="button" className="underline" onClick={() => void preview.refetch()}>Повторить</button>
            </div>}
          </div>
          <div className="flex flex-wrap gap-3 border-t p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <button type="button" className="min-h-11 flex-1 rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white disabled:opacity-50" disabled={!previewReady}
              onClick={() => { navigate(draft.value); setOpen(false); }}>{previewReady ? 'Показать ' + preview.data!.meta.matched_count : 'Проверяем условия…'}</button>
            <button type="button" className="rounded-lg border px-3 py-2" onClick={reset}>Сбросить</button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  </section>;
}
