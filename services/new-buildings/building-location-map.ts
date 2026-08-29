import type { NearbyPlace } from './nearby-places';

export type BuildingLocationMarker = {
  id: number | null;
  title: string;
  coordinates: [number, number];
  preset: 'islands#redHomeIcon' | 'islands#blueCircleDotIcon' | 'islands#darkGreenCircleDotIcon';
};

function validCoordinates(latitude: unknown, longitude: unknown): [number, number] | null {
  if ((typeof latitude !== 'number' && typeof latitude !== 'string') ||
      (typeof longitude !== 'number' && typeof longitude !== 'string') ||
      (typeof latitude === 'string' && latitude.trim() === '') ||
      (typeof longitude === 'string' && longitude.trim() === '')) return null;
  const lat = Number(latitude), lon = Number(longitude);
  return Number.isFinite(lat) && Number.isFinite(lon) && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180
    ? [lat, lon]
    : null;
}

export function buildingLocationMarkers(
  building: [number, number],
  buildingTitle: string,
  places: NearbyPlace[],
  selected?: number,
): BuildingLocationMarker[] {
  const center = validCoordinates(building[0], building[1]);
  if (!center) return [];
  return [
    { id: null, title: buildingTitle, coordinates: center, preset: 'islands#redHomeIcon' },
    ...places.flatMap(place => {
      const coordinates = validCoordinates(place.latitude, place.longitude);
      return coordinates ? [{
        id: place.id,
        title: place.name,
        coordinates,
        preset: place.id === selected ? 'islands#darkGreenCircleDotIcon' as const : 'islands#blueCircleDotIcon' as const,
      }] : [];
    }),
  ];
}

export function hasReadyMapTile(readyTileNumber: unknown, totalTileNumber: unknown): boolean {
  const ready = Number(readyTileNumber), total = Number(totalTileNumber);
  return Number.isFinite(ready) && Number.isFinite(total) && total > 0 && ready > 0 && ready <= total;
}
