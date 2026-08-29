import { axios } from '@/utils/axios';
import type { FavoriteTarget, FavoriteList, FavoriteMerge, FavoriteResponse, FavoriteType, FavoriteDeal } from './types';

export const getFavoriteKeys = async (signal?: AbortSignal, userId?: number): Promise<FavoriteTarget[]> => (await axios.get<{ data: FavoriteTarget[] }>('/v2/favorites/keys', { signal, params: { expected_user_id: userId } })).data.data;
export const getFavorites = async (page = 1, type?: FavoriteType, signal?: AbortSignal, userId?: number, offer?: FavoriteDeal): Promise<FavoriteList> =>
  (await axios.get<FavoriteList>('/v2/favorites', { params: { page, type, offer_type: offer, expected_user_id: userId }, signal })).data;
export const addToFavorites = async (target: FavoriteTarget, userId?: number): Promise<void> => { await axios.post('/v2/favorites', { target, expected_user_id: userId }); };
export const removeFromFavorites = async (target: FavoriteTarget, userId?: number): Promise<void> => { await axios.delete('/v2/favorites', { data: { target, expected_user_id: userId } }); };
export const mergeFavorites = async (targets: FavoriteTarget[], userId: number): Promise<FavoriteMerge> =>
  (await axios.post<FavoriteMerge>('/v2/favorites/merge', { targets, expected_user_id: userId }, { timeout: 15_000 })).data;
export const resolveFavorites = async (targets: FavoriteTarget[], signal?: AbortSignal): Promise<FavoriteResponse[]> =>
  (await axios.post<{ data: FavoriteResponse[] }>('/v2/favorite-targets/resolve', { targets }, { signal, timeout: 15_000 })).data.data;

export const refreshFavoriteDeals = async (ids: number[], userId: number): Promise<{ checked: number; deferred: number }> =>
  (await axios.post('/v2/favorites/refresh-deals', { favorite_ids: ids, expected_user_id: userId }, { timeout: 15_000 })).data;
