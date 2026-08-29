'use client';

import { useEffect, useRef, useState } from 'react';
import type ymaps from 'yandex-maps';
import type { NearbyPlace } from '@/services/new-buildings/nearby-places';
import { buildingLocationMarkers, hasReadyMapTile } from '@/services/new-buildings/building-location-map';
import { useResidentialResourceFailure } from '@/services/new-buildings/use-resource-failure';
import { loadYandexMaps } from '@/services/new-buildings/yandex-maps-sdk';

export default function BuildingLocationMap({ buildingId, coordinates, title, places = [], selected, onSelect, height = 360 }: { buildingId: number; coordinates: [number, number]; title: string; places?: NearbyPlace[]; selected?: number; onSelect?: (id: number) => void; height?: number }) {
  const map = useRef<ymaps.Map | null>(null), container = useRef<HTMLDivElement | null>(null), select = useRef(onSelect);
  const [ready, setReady] = useState(false), [failed, setFailed] = useState(false), [attempt, setAttempt] = useState(0);
  select.current = onSelect;
  useResidentialResourceFailure(failed, attempt, { surface: 'building', endpoint: 'map-sdk', building_id: buildingId });
  useEffect(() => {
    if (ready) return;
    const timeout = window.setTimeout(() => setFailed(true), 12_000);
    return () => window.clearTimeout(timeout);
  }, [ready, attempt]);
  useEffect(() => {
    if (failed || !container.current) return;
    let cancelled = false;
    setReady(false);
    void loadYandexMaps().then(sdk => {
      if (cancelled || !container.current) return;
      const instance = new sdk.Map(container.current, { center: coordinates, zoom: 15, controls: ['zoomControl'] });
      map.current = instance;
      const onTileLoadChange = (event: ymaps.IEvent) => {
        if (hasReadyMapTile(event.get('readyTileNumber'), event.get('totalTileNumber'))) setReady(true);
      };
      instance.layers.events.add('tileloadchange', onTileLoadChange);
      for (const spec of buildingLocationMarkers(coordinates, title, places, selected)) {
        const marker = new sdk.Placemark(spec.coordinates, { hintContent: spec.title }, { preset: spec.preset });
        if (spec.id !== null) marker.events.add('click', () => select.current?.(spec.id!));
        instance.geoObjects.add(marker);
      }
    }).catch(() => { if (!cancelled) setFailed(true); });
    return () => { cancelled = true; map.current?.destroy(); map.current = null; };
  }, [attempt, coordinates, failed, places, selected, title]);
  if (failed) return <p role="alert">Карта временно недоступна. Остальные разделы и форма работают. <button className="min-h-11 underline" onClick={() => { setReady(false); setFailed(false); setAttempt(value => value + 1); }}>Повторить карту</button></p>;
  return <div aria-label={'Расположение ЖК ' + title} className="overflow-hidden rounded-2xl">
    {!ready && <p role="status">Загрузка карты…</p>}
    <div ref={container} className="w-full" style={{ height }} />
  </div>;
}
