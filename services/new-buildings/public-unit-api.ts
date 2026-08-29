import type { PublicUnit } from './public-unit';

export class PublicUnitError extends Error {
  readonly status: number;
  constructor(status: number) {
    super(status === 404 ? 'Квартира не найдена' : 'Не удалось обновить данные квартиры');
    this.status = status;
  }
}

export function validUnitRouteId(id: string): boolean {
  return /^[1-9]\d{0,14}$/.test(id) && Number.isSafeInteger(Number(id));
}

/** Shared fetch contract: 404 is distinct from a temporary failure; no cached availability. */
export async function fetchPublicUnit(baseUrl: string, buildingId: string, unitId: string, signal?: AbortSignal, transport: typeof fetch = fetch): Promise<PublicUnit> {
  if (!validUnitRouteId(buildingId) || !validUnitRouteId(unitId)) throw new PublicUnitError(404);
  const response = await transport(baseUrl.replace(/\/$/, '') + '/v2/new-buildings/' + buildingId + '/units/' + unitId, {
    cache: 'no-store', headers: { Accept: 'application/json' }, signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(12000)]) : AbortSignal.timeout(12000),
  });
  if (!response.ok) throw new PublicUnitError(response.status);
  const unit = await response.json() as PublicUnit;
  if (unit.id !== Number(unitId) || unit.new_building_id !== Number(buildingId) || unit.building?.id !== Number(buildingId)) throw new PublicUnitError(502);
  return unit;
}

export async function fetchSimilarUnits(baseUrl: string, buildingId: string, unitId: string, signal?: AbortSignal, transport: typeof fetch = fetch): Promise<import('./similar-units').SimilarUnits> {
  if (!validUnitRouteId(buildingId) || !validUnitRouteId(unitId)) throw new PublicUnitError(404);
  const response = await transport(baseUrl.replace(/\/$/, '') + '/v2/new-buildings/' + buildingId + '/units/' + unitId + '/similar', {
    cache: 'no-store', headers: { Accept: 'application/json' }, signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(12000)]) : AbortSignal.timeout(12000),
  });
  if (!response.ok) throw new PublicUnitError(response.status);
  const data = await response.json() as import('./similar-units').SimilarUnits;
  if (data.meta?.unit_id !== Number(unitId) || data.meta?.building_id !== Number(buildingId) || !Array.isArray(data.data)
    || data.data.length > 6 || data.data.some(row => row.availability_status !== 'available' || row.id === Number(unitId)
      || !Number.isSafeInteger(row.id) || row.id <= 0 || !Number.isSafeInteger(row.new_building_id) || row.new_building_id <= 0
      || row.building?.id !== row.new_building_id)) throw new PublicUnitError(502);
  return data;
}
