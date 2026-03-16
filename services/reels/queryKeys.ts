import type { ReelFilters } from '@/services/reels/types';

export const REEL_QUERY_KEYS = {
  all: ['reels'] as const,
  list: (filters?: ReelFilters) => ['reels', 'list', filters ?? {}] as const,
  detail: (id: number | string) => ['reels', 'detail', Number(id)] as const,
};
