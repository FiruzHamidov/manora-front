import { axios } from '@/utils/axios';
import type { CatalogSearchResponse } from './types';

export const getCatalogSearchSuggestions = async (
  query: string,
  limit: number = 8
): Promise<CatalogSearchResponse> => {
  const { data } = await axios.get<CatalogSearchResponse>('/search/suggestions', {
    params: { q: query, limit },
  });

  return data;
};
