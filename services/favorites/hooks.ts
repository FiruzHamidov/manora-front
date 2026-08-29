'use client';

import { createContext, useContext } from 'react';
import type { FavoriteTarget } from './types';
import type { GuestFavorite } from './guest';

export type FavoritesState = { targets: FavoriteTarget[]; guestEntries: GuestFavorite[]; userId: number | null; loading: boolean; busy: boolean;
  error: string | null; mergeError: string | null; mergeNotice: string | null;
  change: (target: FavoriteTarget, saved: boolean) => Promise<void>; refresh: () => void; retryMerge: () => void };
export const FavoritesContext = createContext<FavoritesState | null>(null);
export function useFavoritesState(): FavoritesState {
  const value = useContext(FavoritesContext);
  if (!value) throw new Error('FavoritesProvider is required');
  return value;
}
