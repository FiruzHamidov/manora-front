'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { axios } from '@/utils/axios';
import type { BuildingImage, MasterplanRegion } from './public-building';
import type { Point } from './geometry';

export type ManagedMasterplan = { version: number; image: (BuildingImage & { original_download_url?: string | null }) | null; regions: (MasterplanRegion & { block: { id: number; name: string; archived_at: string | null } })[] };
const path = (id: number) => '/manage/new-buildings/' + id + '/masterplan';
export function useMasterplan(id: number) {
  return useQuery({ queryKey: ['residential-masterplan', id], queryFn: async ({ signal }) => (await axios.get<ManagedMasterplan>(path(id), { signal })).data, enabled: id > 0 });
}
export type MasterplanChange = { version: number; drawingId?: number; blockId?: number; points?: Point[]; file?: File; alt?: string; caption?: string | null; reason?: string; action: 'upload' | 'metadata' | 'delete' | 'region' | 'remove-region' };
export function useChangeMasterplan(id: number) {
  const cache = useQueryClient();
  const refresh = () => Promise.all([
    cache.invalidateQueries({ queryKey: ['residential-masterplan', id] }), cache.invalidateQueries({ queryKey: ['manage-new-buildings'] }),
    cache.invalidateQueries({ queryKey: ['public-building', id] }), cache.invalidateQueries({ queryKey: ['public-masterplan', id] }),
    cache.invalidateQueries({ queryKey: ['residential-catalog'] }),
  ]);
  return useMutation({
    mutationFn: async (change: MasterplanChange) => {
      if (change.action === 'upload') {
        const data = new FormData(); data.append('file', change.file!); data.append('version', String(change.version));
        data.append('alt', change.alt ?? ''); data.append('caption', change.caption ?? '');
        return axios.post(path(id), data);
      }
      const data = { version: change.version, drawing_id: change.drawingId, points: change.points, reason: change.reason };
      if (change.action === 'region') return axios.put(path(id) + '/regions/' + change.blockId, data);
      if (change.action === 'remove-region') return axios.delete(path(id) + '/regions/' + change.blockId, { data });
      if (change.action === 'delete') return axios.delete(path(id) + '/' + change.drawingId, { data });
      return axios.patch(path(id) + '/' + change.drawingId, { version: change.version, alt: change.alt, caption: change.caption });
    },
    onSuccess: refresh,
    onError: async error => { if (isAxiosError(error) && error.response?.status === 409) await refresh(); },
  });
}
