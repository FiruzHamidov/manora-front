'use client';

import { trackResidential } from '@/services/new-buildings/track';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useMemo } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { applyCatalogViewport, CATALOG_SORTS, catalogApiQuery, catalogNavigation, catalogQuery, changeCatalog, clearCatalogViewport, readCatalogFilters, type CatalogFacets, type CatalogFilters as Filters, type CatalogList, type CatalogMap } from '@/services/new-buildings/residential-catalog';
import { useResidentialCatalog } from '@/services/new-buildings/use-residential-catalog';
import { CatalogFilters } from './CatalogFilters';
import { ResidentialCatalogCard } from './ResidentialCatalogCard';

const ResidentialCatalogMap = dynamic(() => import('./ResidentialCatalogMap'), { ssr: false, loading: () => <p role="status" className="p-6">Загрузка карты…</p> });
export default function ResidentialCatalogScreen({ initial, initialQuery }: { initial: CatalogList | null; initialQuery: string }) {
  const params = useSearchParams(), pathname = usePathname(), search = params.toString();
  const filters = useMemo(() => readCatalogFilters(new URLSearchParams(search)), [search]);
  const key = catalogQuery(filters), query = catalogApiQuery(filters);
  const list = useResidentialCatalog<CatalogList>('', query, true, query === initialQuery ? initial ?? undefined : undefined);
  const options = useResidentialCatalog<CatalogFacets>('facets', '');
  const map = useResidentialCatalog<CatalogMap>('map', catalogApiQuery(filters), filters.view === 'map');
  const currentFilters = () => readCatalogFilters(new URLSearchParams(window.location.search));
  const navigate = (next: Filters) => {
    trackResidential('filter_apply', { surface: 'catalog', filter_keys: Object.keys(next) });
    const query = catalogNavigation(window.location.search, next);
    window.history.pushState(null, '', pathname + (query ? '?' + query : ''));
    document.getElementById('catalog-results')?.focus({ preventScroll: true });
  };
  const change = (key: string, value: string) => navigate(changeCatalog(currentFilters(), key, value));
  const reset = () => navigate(currentFilters().view === 'map' ? { view: 'map' } : {});
  const apply = (value: Filters) => {
    // Presentation changes can land before React renders the new URL.
    const current = currentFilters(), next = { ...value };
    for (const key of ['view', 'sort', 'bbox', 'zoom']) {
      if (current[key]) next[key] = current[key]; else delete next[key];
    }
    delete next.page;
    navigate(next);
  };
  const value = list.isError ? undefined : list.data;
  const meta = value?.meta;
  const updateArea = (area: { bbox: string; zoom: string }) => navigate(applyCatalogViewport(currentFilters(), area));
  const clearArea = () => navigate(clearCatalogViewport(currentFilters()));
  return <section aria-label="Каталог жилых комплексов" className="mx-auto min-w-0 max-w-[1280px] space-y-6 px-3 py-6 text-gray-900 sm:px-6 md:py-10">
    <nav aria-label="Хлебные крошки" className="text-sm text-gray-600"><Link href="/" className="underline">Главная</Link> / Жилые комплексы</nav>
    <header><h1 className="text-3xl font-bold md:text-4xl">Жилые комплексы</h1><p className="mt-3 text-gray-600">Фонд Manora: свободные опубликованные квартиры от застройщиков.</p></header>
    <CatalogFilters key={key} value={filters} options={options.isError ? undefined : options.data?.data} errors={list.error?.fields ?? {}} onApply={apply} onReset={reset} />
    {options.isError && <p role="alert" className="text-sm">Не удалось обновить варианты городов и застройщиков. Введённые фильтры сохранены. <button className="min-h-11 underline" onClick={() => void options.refetch()}>Повторить</button></p>}
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="flex flex-wrap gap-2" aria-label="Вид каталога">
        {['list', 'map'].map(view => <button key={view} aria-pressed={(filters.view === 'map' ? 'map' : 'list') === view}
          className="min-h-11 rounded-xl border border-gray-300 px-5 py-3 aria-pressed:border-[#006341] aria-pressed:bg-green-50"
          onClick={() => change('view', view)}>{view === 'map' ? 'На карте' : 'Списком'}</button>)}
      </div>
      <label className="flex min-w-0 max-w-full flex-col gap-1 text-sm">Сортировка
        <select className="min-h-11 min-w-0 max-w-full rounded-xl border border-gray-300 bg-white p-3 text-base" value={filters.sort ?? 'newest'} onChange={event => change('sort', event.target.value)}>
          {filters.sort && !CATALOG_SORTS.some(([sort]) => sort === filters.sort) && <option value={filters.sort}>Неизвестная сортировка</option>}
          {CATALOG_SORTS.map(([sort, label]) => <option key={sort} value={sort}>{label}</option>)}
        </select>
      </label>
    </div>
    {filters.bbox && <p className="rounded-xl bg-green-50 p-3">Применена область карты. <button className="min-h-11 underline" onClick={clearArea}>Искать во всех районах</button></p>}
    <div id="catalog-results" tabIndex={-1} aria-live="polite" aria-atomic="true" className="scroll-mt-24">
      {list.isError ? <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4">
        <p>{list.error.message} Актуальные результаты не показаны.</p>
        {list.error.status === 422 && <ul className="mt-2 text-sm">{Object.entries(list.error.fields).map(([name, messages]) => <li key={name}>{messages.join(' ')}</li>)}</ul>}
        <button className="mt-2 min-h-11 underline" onClick={() => void list.refetch()}>Повторить запрос</button>
      </div> : meta ? <div><p className="text-lg font-semibold">Жилых комплексов: {meta.total_complexes} · Свободных квартир: {meta.total_available_units}</p>
        <p className="mt-1 text-sm text-gray-600">{list.isFetching ? 'Обновляем данные…' : 'Данные получены: ' + new Date(meta.as_of).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Dushanbe' }) + ' (Душанбе)'}</p>
      </div> : <p role="status">Загрузка жилых комплексов…</p>}
    </div>
    {filters.view === 'map' && !list.isError && <div className="space-y-4">
      {(meta?.unmapped_complexes ?? 0) > 0 && <p className="text-sm text-gray-600">Без геопозиции: {meta!.unmapped_complexes} ЖК. Они доступны в списке без фильтра области, но не показаны на карте.</p>}
      {map.isError ? <p role="alert" className="rounded-xl bg-amber-50 p-4">Не удалось обновить маркеры. Список продолжает работать. <button className="min-h-11 underline" onClick={() => void map.refetch()}>Повторить карту</button></p>
        : map.data ? <ResidentialCatalogMap data={map.data} filters={filters} onArea={updateArea} />
          : <p role="status">Загрузка маркеров…</p>}
    </div>}
    {value && !value.data.length && <section className="rounded-3xl bg-gray-50 p-6 text-center">
      <h2 className="text-xl font-bold">{meta!.total_complexes > 0 ? 'На этой странице нет ЖК' : 'По этим условиям ЖК не найдены'}</h2>
      <p className="mt-2">Измените фильтры или вернитесь к полной выдаче.</p>
      {meta!.total_complexes > 0 && <button className="m-2 min-h-11 underline" onClick={() => change('page', '1')}>Первая страница</button>}
      <button className="m-2 min-h-11 underline" onClick={reset}>Сбросить фильтры</button>
    </section>}
    {value && <div className="grid min-w-0 gap-5 md:grid-cols-2 xl:grid-cols-3" aria-label="Список жилых комплексов">
      {value.data.map((building, index) => <ResidentialCatalogCard key={building.id} building={building} filters={filters} priority={index === 0 && filters.view !== 'map'} />)}
    </div>}
    {meta && meta.last_page > 1 && <nav aria-label="Страницы каталога" className="flex flex-wrap items-center justify-center gap-3">
      <button disabled={meta.page <= 1} className="min-h-11 rounded-xl border px-4 py-2 disabled:opacity-40" onClick={() => change('page', String(Math.max(1, Number(currentFilters().page || 1) - 1)))}>Предыдущая</button>
      <span>Страница {meta.page} из {meta.last_page}</span>
      <button disabled={meta.page >= meta.last_page} className="min-h-11 rounded-xl border px-4 py-2 disabled:opacity-40" onClick={() => change('page', String(Number(currentFilters().page || 1) + 1))}>Следующая</button>
    </nav>}
  </section>;
}
