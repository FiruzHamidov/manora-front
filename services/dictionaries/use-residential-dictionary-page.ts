'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { axios } from '@/utils/axios';
import type { Paginated } from '@/services/new-buildings/types';
import type { ResidentialDictionaryResource } from './residential-editor';

export type DictionaryPage<T> = Paginated<T> & { last_page: number };

export function useResidentialDictionaryPage<T> (resource: ResidentialDictionaryResource, options: { enabled?: boolean; perPage?: number } = {}) {
  const [params, setParams] = useState({ page: 1, per_page: options.perPage ?? 15, search: '' });
  const query = useQuery({
    queryKey: [resource, params],
    queryFn: async ({ signal }) => (await axios.get<DictionaryPage<T>>(`/${resource}`, { params, signal, timeout: 15_000 })).data,
    retry: false,
    enabled: options.enabled ?? true,
  });
  const setPage = (page: number) => setParams(previous => ({ ...previous, page }));
  const setSearch = (search: string) => setParams(previous => ({ ...previous, page: 1, search }));
  const setPerPage = (per_page: number) => setParams(previous => ({ ...previous, page: 1, per_page }));
  const afterDelete = async () => {
    const result = await query.refetch();
    // The last row may have disappeared; never strand the user on an empty page.
    if (result.data && params.page > result.data.last_page) setPage(Math.max(1, result.data.last_page));
  };
  return { ...query, params, setPage, setSearch, setPerPage, afterDelete };
}
