'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { axios } from '@/utils/axios';
import type { NearbyPlaceInput, NearbyPlacesResponse } from './nearby-places';

const path = (id: number) => '/manage/new-buildings/' + id + '/nearby-places';
export function useNearbyPlaces(id: number) {
  return useQuery({ queryKey: ['residential-nearby-places', id], queryFn: async ({ signal }) => (await axios.get<NearbyPlacesResponse>(path(id), { signal })).data, enabled: id > 0 });
}
export function useChangeNearbyPlace(id: number) {
  const cache = useQueryClient();
  const refresh = () => Promise.all([
    cache.invalidateQueries({ queryKey: ['residential-nearby-places', id] }), cache.invalidateQueries({ queryKey: ['manage-new-buildings'] }),
    cache.invalidateQueries({ queryKey: ['public-building', id] }), cache.invalidateQueries({ queryKey: ['public-nearby-places', id] }),
    cache.invalidateQueries({ queryKey: ['residential-catalog'] }),
  ]);
  return useMutation({
    mutationFn: async (change: { version: number; id?: number; data?: NearbyPlaceInput; reason?: string; remove?: boolean }) => {
      const data = { ...change.data, version: change.version, reason: change.reason };
      if (change.remove) return axios.delete(path(id) + '/' + change.id, { data });
      if (change.id) return axios.put(path(id) + '/' + change.id, data);
      return axios.post(path(id), data);
    },
    onSuccess: refresh,
    onError: async error => { if (isAxiosError(error) && error.response?.status === 409) await refresh(); },
  });
}
