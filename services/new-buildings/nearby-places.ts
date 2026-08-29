export const nearbyCategories = { school: 'Школы', kindergarten: 'Детские сады', healthcare: 'Медицина', shopping: 'Магазины', transport: 'Транспорт', park: 'Парки', sport: 'Спорт', other: 'Другое' } as const;
export const distanceMethods = { straight_line: 'По прямой', walking_route: 'По пешему маршруту', driving_route: 'По автомобильному маршруту', measured: 'Измерено на местности' } as const;
export type NearbyCategory = keyof typeof nearbyCategories;
export type DistanceMethod = keyof typeof distanceMethods;
export type NearbyPlace = {
  id: number; name: string; category: NearbyCategory; latitude: string | null; longitude: string | null; source: string;
  distance_m: string | null; distance_method: DistanceMethod | null; distance_source: string | null; verified_at: string | null;
};
export type NearbyPlacesResponse = { version: number; places: NearbyPlace[] };
export type NearbyPlaceInput = Omit<NearbyPlace, 'id'>;

export function nearbyDistance(place: Pick<NearbyPlace, 'distance_m' | 'distance_method'>): string {
  if (place.distance_m === null || !place.distance_method || !distanceMethods[place.distance_method]) return 'Расстояние не указано';
  const value = Number(place.distance_m);
  if (!Number.isFinite(value) || value < 0) return 'Расстояние не указано';
  return value.toLocaleString('ru-RU', { maximumFractionDigits: 2 }) + ' м · ' + distanceMethods[place.distance_method];
}
