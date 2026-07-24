import { useQuery } from '@tanstack/react-query';
import { getCatalogSearchSuggestions } from './api';

export const useCatalogSearchSuggestions = (query: string) => {
  const normalizedQuery = query.trim();

  return useQuery({
    queryKey: ['catalog-search', normalizedQuery],
    queryFn: () => getCatalogSearchSuggestions(normalizedQuery),
    enabled: normalizedQuery.length >= 2,
    staleTime: 30_000,
    retry: 1,
  });
};
