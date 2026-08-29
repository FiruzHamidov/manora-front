'use client';

import { measureResidential } from './track';
import { useQuery } from '@tanstack/react-query';
import { API_BASE_URL } from '@/config/api';
import { unitApiQuery } from './unit-selection';
import type { UnitFilters } from './public-unit';
import { fetchUnitSelection, UnitSelectionError } from './unit-selection-api';
export function useUnitSelection<T>(buildingId: number, endpoint: 'units' | 'unit-facets' | 'availability-grid', filters: UnitFilters, enabled = true) {
  const query = unitApiQuery(filters);
  return useQuery<T, UnitSelectionError>({
    queryKey: ['residential-selection', buildingId, endpoint, query],
    queryFn: ({ signal }) => measureResidential({ surface: 'selection', building_id: buildingId, endpoint }, () => fetchUnitSelection<T>(API_BASE_URL, buildingId, endpoint, query, signal), signal),
    enabled, staleTime: 0, refetchOnWindowFocus: true, refetchInterval: 30_000,
    retry: (count, error) => error.status !== 404 && error.status !== 422 && count < 1,
  });
}
