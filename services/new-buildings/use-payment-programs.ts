'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { axios } from '@/utils/axios';
import type { ManagedPaymentPrograms, PaymentProgramFields } from './payment-programs';

const path = (id: number) => '/manage/new-buildings/' + id + '/payment-programs';
export function useManagedPaymentPrograms(id: number, page: number) {
  return useQuery({ queryKey: ['managed-payment-programs', id, page], queryFn: async ({ signal }) => (await axios.get<ManagedPaymentPrograms>(path(id), { params: { page }, signal })).data, enabled: id > 0 });
}
export function useChangePaymentProgram(id: number) {
  const cache = useQueryClient();
  const refresh = () => Promise.all([
    cache.invalidateQueries({ queryKey: ['managed-payment-programs', id] }), cache.invalidateQueries({ queryKey: ['manage-new-buildings'] }),
    cache.invalidateQueries({ queryKey: ['public-payment-programs'] }), cache.invalidateQueries({ queryKey: ['public-building', id] }),
    cache.invalidateQueries({ queryKey: ['residential-catalog'] }),
  ]);
  return useMutation({
    mutationFn: async (change: { version: number; id?: number; data?: PaymentProgramFields & { block_ids: number[]; unit_ids: number[] }; reason?: string; archived?: boolean }) => {
      const body = { ...change.data, version: change.version, reason: change.reason };
      if (change.archived !== undefined) return axios.post(path(id) + '/' + change.id + '/archive', { ...body, archived: change.archived });
      if (change.id) return axios.patch(path(id) + '/' + change.id, body);
      return axios.post(path(id), body);
    },
    onSuccess: refresh,
    onError: async error => { if (isAxiosError(error) && error.response?.status === 409) await refresh(); },
  });
}
