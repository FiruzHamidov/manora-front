'use client';

import { isAxiosError } from 'axios';
import type { QueryClient } from '@tanstack/react-query';

/** Refresh authoritative editor snapshots after optimistic-version rejection. */
export async function refreshManagedConflict(error: unknown, cache: QueryClient, buildingId: number): Promise<boolean> {
  if (!isAxiosError(error) || error.response?.status !== 409) return false;
  await Promise.all([
    cache.invalidateQueries({ queryKey: ['manage-new-buildings'] }),
    cache.invalidateQueries({ queryKey: ['new-buildings', buildingId] }),
    cache.invalidateQueries({ queryKey: ['residential-structure', buildingId] }),
  ]);
  return true;
}
