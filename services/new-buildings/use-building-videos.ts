'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { axios } from '@/utils/axios';
import type { BuildingVideoInput, BuildingVideosResponse } from './videos';

const path = (id: number) => '/manage/new-buildings/' + id + '/videos';
export function useBuildingVideos(id: number) {
  return useQuery({ queryKey: ['residential-building-videos', id], queryFn: async ({ signal }) => (await axios.get<BuildingVideosResponse>(path(id), { signal })).data, enabled: id > 0, refetchInterval: 30_000 });
}
export function useChangeBuildingVideo(id: number) {
  const cache = useQueryClient();
  const refresh = () => Promise.all([
    cache.invalidateQueries({ queryKey: ['residential-building-videos', id] }), cache.invalidateQueries({ queryKey: ['manage-new-buildings'] }),
    cache.invalidateQueries({ queryKey: ['public-building', id] }), cache.invalidateQueries({ queryKey: ['public-building-videos', id] }),
    cache.invalidateQueries({ queryKey: ['residential-catalog'] }),
  ]);
  return useMutation({
    mutationFn: async (change: { version: number; id?: number; data?: BuildingVideoInput; reason?: string; remove?: boolean }) => {
      const data = { ...change.data, version: change.version, reason: change.reason };
      if (change.remove) return axios.delete(path(id) + '/' + change.id, { data });
      if (change.id) return axios.put(path(id) + '/' + change.id, data);
      return axios.post(path(id), data);
    },
    onSuccess: refresh,
    onError: async error => { if (isAxiosError(error) && error.response?.status === 409) await refresh(); },
  });
}
