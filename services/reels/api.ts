import { axios, call } from '@/services/_shared/http';
import type {
  CreateReelPayload,
  Reel,
  ReelFilters,
  UpdateReelPayload,
} from '@/services/reels/types';

function cleanParams(filters?: ReelFilters) {
  if (!filters) return undefined;

  return Object.fromEntries(
    Object.entries(filters).filter(([, value]) => value !== undefined && value !== null && value !== '')
  );
}

export const reelsApi = {
  list: (filters?: ReelFilters) =>
    call(async () =>
      await axios.get<Reel[]>('/reels', {
        params: cleanParams(filters),
      })
    ),
  getById: (id: number | string) => call(async () => await axios.get<Reel>(`/reels/${id}`)),
  create: (payload: CreateReelPayload) =>
    call(async () => await axios.post<Reel>('/reels', payload)),
  update: (id: number | string, payload: UpdateReelPayload) =>
    call(async () => await axios.put<Reel>(`/reels/${id}`, payload)),
  remove: (id: number | string) =>
    call(async () => await axios.delete<{ message?: string }>(`/reels/${id}`)),
};
