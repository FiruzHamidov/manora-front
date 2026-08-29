import type { FavoriteDeal, FavoriteDealCounts, FavoriteList, FavoriteResponse, FavoriteType } from './types';

export function favoriteDeal(row: FavoriteResponse): FavoriteDeal {
  if (row.type !== 'property') return 'sale';
  return row.state === 'visible' ? row.item?.offer_type ?? 'unknown' : 'unknown';
}

/** Resolve the complete bounded guest list before counting/filtering/paginating. */
export function filterGuestFavorites(rows: FavoriteResponse[], page: number, type?: FavoriteType, deal?: FavoriteDeal): FavoriteList {
  const typed = rows.filter(row => !type || row.type === type);
  const deals: FavoriteDealCounts = { sale: 0, rent: 0, unknown: 0 };
  for (const row of typed) deals[favoriteDeal(row)]++;
  const filtered = typed.filter(row => !deal || favoriteDeal(row) === deal);
  return { data: filtered.slice((page - 1) * 20, page * 20), meta: {
    page, per_page: 20, total: filtered.length, last_page: Math.max(1, Math.ceil(filtered.length / 20)), deals,
  } };
}
