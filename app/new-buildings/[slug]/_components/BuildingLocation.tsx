'use client';

import { measureResidential } from '@/services/new-buildings/track';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { useQuery } from '@tanstack/react-query';
import { API_BASE_URL } from '@/config/api';
import { fetchPublicNearbyPlaces } from '@/services/new-buildings/public-building-api';
import type { PublicBuilding } from '@/services/new-buildings/public-building';
import { nearbyCategories, nearbyDistance, type NearbyCategory } from '@/services/new-buildings/nearby-places';
import { unitCoordinates } from '@/services/new-buildings/public-unit';

const BuildingMap = dynamic(() => import('../../_components/BuildingLocationMap'), { ssr: false, loading: () => <p role="status">Загрузка карты…</p> });
const button = 'min-h-11 max-w-full break-words rounded-xl border px-3 py-2 text-[#006341] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006341]';
export default function BuildingLocation({ building }: { building: PublicBuilding }) {
  const [requested, setRequested] = useState(false), [mapOpen, setMapOpen] = useState(false), [category, setCategory] = useState<NearbyCategory | ''>(''), [selected, setSelected] = useState<number | null>(null);
  const query = useQuery({ queryKey: ['public-nearby-places', building.id, building.version], enabled: requested && building.has_nearby_places,
    queryFn: ({ signal }) => measureResidential({ surface: 'building', building_id: building.id, endpoint: 'nearby' }, () => fetchPublicNearbyPlaces(API_BASE_URL, building.id, signal), signal), retry: false, refetchInterval: 30_000, refetchOnWindowFocus: true });
  const places = building.has_nearby_places && !query.isError ? query.data?.places ?? [] : [];
  const filtered = places.filter(place => !category || place.category === category);
  const selectedPlace = filtered.find(place => place.id === selected);
  const coordinates = unitCoordinates(building);
  return <div className="min-w-0 space-y-4">
    <p>{[building.city, building.address, building.district].filter(Boolean).join(', ') || 'Адрес не указан'}</p>
    {coordinates ? <>{mapOpen ? <BuildingMap buildingId={building.id} coordinates={coordinates} title={building.title} places={filtered} selected={selectedPlace?.id} onSelect={setSelected} /> : <button className={button} onClick={() => { setMapOpen(true); setRequested(true); }}>Показать на карте</button>}</> : <p className="text-gray-600">Координаты ЖК не указаны. Карта не показана.</p>}
    <h3 className="text-xl font-semibold">Инфраструктура рядом</h3>
    {!building.has_nearby_places ? <p>Проверенные объекты рядом пока не указаны.</p> : !requested ? <button className={button} onClick={() => setRequested(true)}>Показать инфраструктуру</button> : query.isError ? <p role="alert">Не удалось получить актуальные объекты рядом. <button className={button} onClick={() => void query.refetch()}>Повторить инфраструктуру</button></p> : query.isPending ? <p role="status">Загрузка инфраструктуры…</p> : !places.length ? <p>Проверенные объекты рядом больше не доступны.</p> : <>
      <div className="flex flex-wrap gap-2" aria-label="Категории инфраструктуры">
        <button className={button + ' aria-pressed:bg-green-50'} aria-pressed={!category} onClick={() => setCategory('')}>Все объекты ({places.length})</button>
        {(Object.keys(nearbyCategories) as NearbyCategory[]).filter(key => places.some(place => place.category === key)).map(key => <button className={button + ' aria-pressed:bg-green-50'} key={key} aria-pressed={category === key} onClick={() => setCategory(key)}>{nearbyCategories[key]} ({places.filter(place => place.category === key).length})</button>)}
      </div>
      {category && !filtered.length && <p>В выбранной категории больше нет объектов. Выберите «Все объекты».</p>}
      {selectedPlace && <p role="status">Выбран объект: {selectedPlace.name}. {nearbyDistance(selectedPlace)}.</p>}
      <ul className="space-y-3">{filtered.map(place => <li key={place.id} className={'min-w-0 space-y-2 break-words rounded-xl border p-3 ' + (selectedPlace?.id === place.id ? 'border-green-800 bg-green-50' : '')}>
        <button className={button + ' text-left font-semibold'} aria-pressed={selectedPlace?.id === place.id} onClick={() => setSelected(place.id)}>{place.name}</button>
        <p className="text-sm">{nearbyCategories[place.category]} · {nearbyDistance(place)}</p>
        <p className="text-sm text-gray-600">Источник объекта: {place.source}</p>
        {place.distance_source && <p className="text-sm text-gray-600">Источник расстояния: {place.distance_source}</p>}
        <p className="text-sm text-gray-600">Проверено: {place.verified_at?.split('-').reverse().join('.')}</p>
      </li>)}</ul>
      <p className="text-sm text-gray-600">Расстояния указаны от ЖК способом, указанным у каждого объекта. Время в пути не рассчитывается.</p>
    </>}
  </div>;
}
