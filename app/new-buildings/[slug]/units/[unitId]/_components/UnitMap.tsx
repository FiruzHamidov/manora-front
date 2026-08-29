'use client';

import { unitCoordinates, type PublicUnit } from '@/services/new-buildings/public-unit';
import BuildingLocationMap from '../../../../_components/BuildingLocationMap';

export default function UnitMap({ building }: { building: PublicUnit['building'] }) {
  const coordinates = unitCoordinates(building);
  if (!coordinates) return <p className="py-12 text-center text-gray-600">Координаты ЖК не указаны.</p>;
  return <div>
    <p className="mb-3 text-sm">{building.address || 'Адрес не указан'}</p>
    <BuildingLocationMap buildingId={building.id} coordinates={coordinates} title={building.title} />
  </div>;
}
