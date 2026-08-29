import type { BuildingVideosResponse, PublicBuildingVideo } from './videos';
import type { BuildingGallery, PublicBuilding, PublicMasterplan } from './public-building';
import type { NearbyPlacesResponse } from './nearby-places';

export class PublicBuildingError extends Error {
  readonly status: number;
  constructor(status: number) {
    super(status === 404 ? 'Жилой комплекс не найден' : status === 409 ? 'Галерея изменилась. Обновите данные ЖК.' : 'Не удалось обновить данные ЖК');
    this.status = status;
  }
}
async function request<T>(url: string, signal?: AbortSignal, transport: typeof fetch = fetch): Promise<T> {
  try {
    const response = await transport(url, { cache: 'no-store', headers: { Accept: 'application/json' },
      signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(12_000)]) : AbortSignal.timeout(12_000) });
    if (!response.ok) throw new PublicBuildingError(response.status);
    return await response.json() as T;
  } catch (error) {
    if (signal?.aborted || error instanceof PublicBuildingError) throw error;
    throw new PublicBuildingError(503);
  }
}
export async function fetchPublicBuilding(baseUrl: string, id: string, signal?: AbortSignal, transport: typeof fetch = fetch): Promise<PublicBuilding> {
  if (!/^[1-9]\d{0,14}$/.test(id) || !Number.isSafeInteger(Number(id))) throw new PublicBuildingError(404);
  const building = await request<PublicBuilding>(baseUrl.replace(/\/$/, '') + '/v2/new-buildings/' + id, signal, transport);
  if (building.id !== Number(id)) throw new PublicBuildingError(502);
  return building;
}
export async function fetchBuildingGallery(baseUrl: string, id: number, version: number, page: number, signal?: AbortSignal, transport: typeof fetch = fetch): Promise<BuildingGallery> {
  const gallery = await request<BuildingGallery>(baseUrl.replace(/\/$/, '') + '/v2/new-buildings/' + id + '/photos?version=' + version + '&page=' + page + '&per_page=6', signal, transport);
  if (gallery.meta.version !== version) throw new PublicBuildingError(409);
  return gallery;
}

export function fetchPublicMasterplan(baseUrl: string, id: number, signal?: AbortSignal, transport: typeof fetch = fetch): Promise<PublicMasterplan> {
  return request<PublicMasterplan>(baseUrl.replace(/\/$/, '') + '/v2/new-buildings/' + id + '/masterplan', signal, transport);
}

export function fetchPublicNearbyPlaces(baseUrl: string, id: number, signal?: AbortSignal, transport: typeof fetch = fetch): Promise<NearbyPlacesResponse> {
  return request<NearbyPlacesResponse>(baseUrl.replace(/\/$/, '') + '/v2/new-buildings/' + id + '/nearby-places', signal, transport);
}

export function fetchPublicVideos(baseUrl: string, id: number, signal?: AbortSignal, transport: typeof fetch = fetch): Promise<BuildingVideosResponse<PublicBuildingVideo>> {
  return request<BuildingVideosResponse<PublicBuildingVideo>>(baseUrl.replace(/\/$/, '') + '/v2/new-buildings/' + id + '/videos', signal, transport);
}
