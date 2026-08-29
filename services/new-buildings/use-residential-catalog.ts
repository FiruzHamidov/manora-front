'use client';

import { measureResidential } from './track';
import { useQuery } from '@tanstack/react-query';
import { API_BASE_URL } from '@/config/api';
import { CatalogError, fetchCatalog } from './residential-catalog-api';

export function useResidentialCatalog<T>(endpoint: '' | 'map' | 'facets', query: string, enabled = true, initialData?: T) {
  return useQuery<T, CatalogError>({
    queryKey: ['residential-catalog', endpoint, query],
    queryFn: ({ signal }) => measureResidential({ surface: 'catalog', endpoint: endpoint || 'list' }, () => fetchCatalog<T>(API_BASE_URL, endpoint, query, signal), signal),
    enabled, initialData, staleTime: 0, refetchInterval: 30_000, refetchOnWindowFocus: true,
    retry: (count, error) => error.status !== 422 && count < 1,
  });
}
