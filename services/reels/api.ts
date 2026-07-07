import { axios, call } from '@/services/_shared/http';
import type {
  CreateReelPayload,
  Reel,
  ReelFilters,
  ReelsListResponse,
  UpdateReelPayload,
} from '@/services/reels/types';

function cleanParams(filters?: ReelFilters) {
  if (!filters) return undefined;

  return Object.fromEntries(
    Object.entries(filters).filter(([, value]) => value !== undefined && value !== null && value !== '')
  );
}

function normalizeReelsList(payload: ReelsListResponse): Reel[] {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.data)) return payload.data;
  if (Array.isArray(payload.items)) return payload.items;
  return [];
}

export const reelsApi = {
  list: (filters?: ReelFilters) =>
    call(async () =>
      await axios.get<ReelsListResponse>('/reels', {
        params: cleanParams(filters),
      })
    ).then(normalizeReelsList),
  getById: (id: number | string) => call(async () => await axios.get<Reel>(`/reels/${id}`)),
  create: (payload: CreateReelPayload) =>
    call(async () => await axios.post<Reel>('/reels', payload)),
  update: (id: number | string, payload: UpdateReelPayload) =>
    call(async () => await axios.put<Reel>(`/reels/${id}`, payload)),
  remove: (id: number | string) =>
    call(async () => await axios.delete<{ message?: string }>(`/reels/${id}`)),
};
