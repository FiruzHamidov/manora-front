'use client';

import { useEffect, useRef, useState } from 'react';
import type ymaps from 'yandex-maps';
import { catalogApiQuery, catalogViewport, type CatalogFilters, type CatalogList, type CatalogMap } from '@/services/new-buildings/residential-catalog';
import { useResidentialCatalog } from '@/services/new-buildings/use-residential-catalog';
import { ResidentialCatalogCard } from './ResidentialCatalogCard';
import { useResidentialResourceFailure } from '@/services/new-buildings/use-resource-failure';
import { loadYandexMaps } from '@/services/new-buildings/yandex-maps-sdk';

export default function ResidentialCatalogMap({ data, filters, onArea }: {
  data: CatalogMap; filters: CatalogFilters; onArea: (area: { bbox: string; zoom: string }) => void;
}) {
  const map = useRef<ymaps.Map | null>(null);
  const container = useRef<HTMLDivElement | null>(null);
  const [ready, setReady] = useState(false), [failed, setFailed] = useState(false), [attempt, setAttempt] = useState(0);
  useResidentialResourceFailure(failed, attempt, { surface: 'catalog', endpoint: 'map-sdk' });
  const [viewport, setViewport] = useState<{ bbox: string; zoom: string } | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const cardFilters: CatalogFilters = { ...filters, building_id: String(selected ?? '') }; delete cardFilters.bbox; delete cardFilters.page;
  const card = useResidentialCatalog<CatalogList>('', catalogApiQuery(cardFilters), selected !== null);
  useEffect(() => {
    if (ready || !data.features.length) return;
    const timeout = window.setTimeout(() => setFailed(true), 12_000);
    return () => window.clearTimeout(timeout);
  }, [ready, attempt, data.features.length]);
  useEffect(() => { setSelected(null); }, [filters]);
  useEffect(() => {
    if (failed || !data.features.length || !container.current) return;
    let cancelled = false;
    const first = data.features[0].geometry.coordinates;
    const bounds = filters.bbox?.split(',').map(Number);
    const initialState = bounds?.length === 4 ? { bounds: [[bounds[1], bounds[0]], [bounds[3], bounds[2]]] }
      : { center: [first[1], first[0]], zoom: data.meta.zoom };
    void loadYandexMaps().then(sdk => {
      if (cancelled || !container.current) return;
      const instance = new sdk.Map(container.current, { ...initialState, controls: ['zoomControl'] });
      map.current = instance;
      const changed = () => {
        const currentBounds = instance.getBounds();
        setViewport(currentBounds ? catalogViewport(currentBounds, instance.getZoom()) : null);
      };
      instance.events.add('boundschange', changed);
      for (const feature of data.features) {
        const marker = new sdk.Placemark([feature.geometry.coordinates[1], feature.geometry.coordinates[0]],
          { iconCaption: feature.properties.kind === 'cluster' ? feature.properties.complex_count + ' ЖК' : 'ЖК' },
          { preset: feature.properties.kind === 'cluster' ? 'islands#darkGreenCircleIcon' : 'islands#darkGreenDotIcon' });
        marker.events.add('click', () => {
          if (feature.properties.building_id !== null) { setSelected(feature.properties.building_id); return; }
          const [west, south, east, north] = feature.properties.bounds;
          void instance.setBounds([[south, west], [north, east]], { checkZoomRange: true, zoomMargin: [40, 40, 40, 40] });
        });
        instance.geoObjects.add(marker);
      }
      setReady(true);
      changed();
    }).catch(() => { if (!cancelled) setFailed(true); });
    return () => { cancelled = true; map.current?.destroy(); map.current = null; };
  }, [attempt, data, failed, filters.bbox]);
  const selectFeature = (feature: CatalogMap['features'][number]) => {
    if (feature.properties.building_id !== null) { setSelected(feature.properties.building_id); return; }
    const [west, south, east, north] = feature.properties.bounds;
    void map.current?.setBounds([[south, west], [north, east]], { checkZoomRange: true, zoomMargin: [40, 40, 40, 40] });
  };
  if (!data.features.length) return <p className="rounded-2xl bg-white p-6">В выбранной области нет ЖК с указанными координатами. Список доступен ниже.</p>;
  if (failed) return <div role="alert" className="rounded-2xl border border-amber-300 bg-amber-50 p-5">
    <p>Не удалось загрузить карту. Фильтры и список ЖК продолжают работать.</p>
    <button className="mt-3 min-h-11 rounded-xl border px-4 underline" onClick={() => { setReady(false); setFailed(false); setAttempt(value => value + 1); }}>Повторить загрузку карты</button>
  </div>;
  return <section aria-label="Карта жилых комплексов" className="min-w-0 space-y-4">
    <p className="text-sm text-gray-600">Переместите карту, затем нажмите «Искать в этой области». Нажмите на кластер, чтобы приблизить; на маркер — чтобы открыть карточку ЖК.</p>
    <div className="flex flex-wrap items-center gap-3">
      <button disabled={!viewport || !ready} className="min-h-11 rounded-xl bg-[#006341] px-4 py-3 font-semibold text-white disabled:opacity-50" onClick={() => viewport && onArea(viewport)}>Искать в этой области</button>
      {!ready && <span role="status">Загрузка карты…</span>}
    </div>
    <div className="overflow-hidden rounded-2xl border border-gray-200">
      <div ref={container} className="h-[420px] w-full" />
    </div>
    {data.meta.truncated && <p role="status" className="text-sm text-amber-800">Показаны первые 500 групп на карте. Приблизьте карту и примените область, чтобы увидеть остальные. Список ниже включает всю выдачу.</p>}
    {selected !== null && <div className="max-w-md rounded-2xl bg-gray-50 p-3">
      <button className="mb-2 min-h-11 underline" onClick={() => setSelected(null)}>Закрыть карточку на карте</button>
      {card.isError ? <p role="alert">Не удалось обновить карточку. <button className="min-h-11 underline" onClick={() => void card.refetch()}>Повторить</button></p>
        : card.data?.data[0] ? <ResidentialCatalogCard building={card.data.data[0]} filters={filters} />
          : card.isPending ? <p role="status">Загрузка карточки…</p> : <p>ЖК больше не соответствует фильтрам или снят с публикации.</p>}
    </div>}
    <details><summary className="min-h-11 cursor-pointer py-3">Выбрать маркер с клавиатуры</summary>
      <ul className="flex max-h-60 flex-wrap gap-2 overflow-y-auto">{data.features.map(feature => <li key={feature.id}>
        <button className="min-h-11 rounded-xl border px-3 py-2 text-left" onClick={() => selectFeature(feature)}>{feature.properties.title || feature.properties.complex_count + ' ЖК в группе'}</button>
      </li>)}</ul>
    </details>
  </section>;
}
