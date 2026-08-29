export const favoriteTypes = { property: 'Объявления', new_building: 'Жилые комплексы', developer_unit: 'Квартиры ЖК', car: 'Транспорт' } as const;
export type FavoriteDeal = 'sale' | 'rent' | 'unknown';
export type FavoriteDealCounts = Record<FavoriteDeal, number>;
export type FavoriteType = keyof typeof favoriteTypes;
export type FavoriteTarget = { type: FavoriteType; id: number; source: 'local' | 'aura' };
export type FavoriteItem = { title: string; href: string; subtitle: string | null; price: string | number | null; currency: string | null;
  price_prefix?: 'from'; availability: 'available' | 'reserved' | 'sold' | null; available_count?: number; area?: string | null; floor?: number | null;
  offer_type: 'sale' | 'rent' | null; image?: { url: string; alt?: string } | null };
export type FavoriteResponse = FavoriteTarget & { favorite_id?: number; deal_type?: 'sale' | 'rent' | null; deal_checked_at?: string | null; state: 'visible' | 'unavailable' | 'temporarily_unavailable'; item: FavoriteItem | null; saved_at?: string | null };
export type FavoriteList = { data: FavoriteResponse[]; meta: { page: number; last_page: number; per_page: number; total: number; deals: FavoriteDealCounts } };
export type FavoriteMerge = { user_id: number; results: (FavoriteTarget & { result: 'saved' | 'unavailable' | 'temporarily_unavailable' })[] };

export function favoriteKey(target: FavoriteTarget): string { return target.source + ':' + target.type + ':' + target.id; }
export function validFavoriteTarget(value: unknown): value is FavoriteTarget {
  if (!value || typeof value !== 'object') return false;
  const target = value as FavoriteTarget;
  return Object.hasOwn(favoriteTypes, target.type) && Number.isSafeInteger(target.id) && target.id > 0
    && (target.source === 'local' || target.source === 'aura') && !(target.type === 'developer_unit' && target.source !== 'local');
}
