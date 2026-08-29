import type { MediaSource } from './media';
import type { CompletionValue } from './completion';

export type BuildingImage = { sources?: MediaSource[]; id: number; url: string; alt: string; caption: string | null; width: number | null; height: number | null };
export type PublicBuilding = {
  id: number; title: string; description: string | null; address: string | null; district: string | null; city: string | null;
  latitude: string | null; longitude: string | null; version: number;
  housing_class: string | null; ceiling_height: string | null; advantages: string[] | null; installment_available: boolean;
  heating_description: string | null; parking_description: string | null; landscaping_description: string | null;
  developer: { id: number; name: string; description: string | null; founded_year: number | null } | null;
  consultant: { name: string; phone: string } | null;
  stage: { id: number; name: string } | null; material: { id: number; name: string } | null;
  features: { id: number; name: string }[];
  blocks: (CompletionValue & { id: number; name: string; floors_from: number | null; floors_to: number | null; available_count: number })[];
  completion: { from: CompletionValue | null; to: CompletionValue | null; has_unknown: boolean; source: 'blocks' | 'building' };
  inventory: { available_count: number; reserved_count: number; min_price: string | null; min_price_per_sqm: string | null; currency: 'TJS' };
  photos: BuildingImage[]; photo_count: number; has_masterplan: boolean; has_nearby_places: boolean; has_videos: boolean; has_payment_programs: boolean;
  created_at: string | null; updated_at: string | null; published_at: string | null; data_verified_at: string | null; as_of: string;
};
export type BuildingGallery = { data: BuildingImage[]; meta: { page: number; per_page: number; total: number; last_page: number; version: number } };
export type MasterplanRegion = { id: number; block_id: number; points: [number, number][] };
export type PublicMasterplan = { version: number; image: BuildingImage | null; regions: MasterplanRegion[]; blocks: PublicBuilding['blocks'] };

export function residentialInventoryLabel(availableCount: number): string {
  return availableCount > 0 ? 'Свободных квартир: ' + availableCount : 'Нет доступных квартир';
}

export function buildingSections(building: PublicBuilding): { id: string; label: string }[] {
  return [
    { id: 'characteristics', label: 'Характеристики' }, { id: 'apartments', label: 'Квартиры' },
    ...(building.has_masterplan ? [{ id: 'masterplan', label: 'Генплан' }] : []),
    ...(building.description?.trim() || building.advantages?.length ? [{ id: 'description', label: 'О комплексе' }] : []),
    ...(building.has_nearby_places || building.address || building.city || building.latitude !== null && building.longitude !== null ? [{ id: 'location', label: 'Расположение' }] : []),
    ...(building.has_videos ? [{ id: 'videos', label: 'Видео' }] : []),
    ...(building.has_payment_programs ? [{ id: 'payment-programs', label: 'Условия покупки' }] : []),
    { id: 'reviews', label: 'Отзывы' }, { id: 'contacts', label: 'Контакты' },
  ];
}

export function buildingUpdatedLabel(building: Pick<PublicBuilding, 'updated_at' | 'created_at' | 'as_of'>): string | null {
  const value = building.updated_at || building.created_at;
  if (!value) return null;
  const date = new Date(value), now = new Date(building.as_of);
  if (!Number.isFinite(date.getTime()) || !Number.isFinite(now.getTime())) return null;
  const elapsed = now.getTime() - date.getTime(), days = Math.floor(elapsed / 86_400_000);
  if (elapsed >= 0 && days < 14) {
    if (days === 0) return 'Сегодня';
    if (days === 1) return 'Вчера';
    return days + ' ' + (days < 5 ? 'дня' : 'дней') + ' назад';
  }
  return date.toLocaleDateString('ru-RU', { timeZone: 'Asia/Dushanbe' });
}
