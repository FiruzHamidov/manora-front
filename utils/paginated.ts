import type { Paginated } from '@/services/new-buildings/types';

export const rows = <T>(pg?: Paginated<T>) => pg?.data ?? [];