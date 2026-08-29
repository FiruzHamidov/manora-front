import type { DictionaryUsage } from './types';

export type ResidentialDictionaryResource = 'developers' | 'materials' | 'features' | 'construction-stages';
export type VersionedDictionaryResource = ResidentialDictionaryResource | 'locations' | 'districts';
export type ResidentialDictionaryRecord = { id: number; version: number; [key: string]: string | number | boolean | null };
export type DictionaryEditContext = { data: ResidentialDictionaryRecord; usage: DictionaryUsage };
export type DictionaryEditCommand = { version: number; usage_token: string; reason: string; expected_user_id: number };
export type DictionaryEditHistory = { id: number; actor_id: number | null; version: number; reason: string; created_at: string; before: ResidentialDictionaryRecord; after: ResidentialDictionaryRecord };
export const residentialDictionaryPaths: Record<ResidentialDictionaryResource, string> = {
  developers: '/admin/new-buildings/developers', materials: '/admin/new-buildings/materials', features: '/admin/new-buildings/features', 'construction-stages': '/admin/new-buildings/stages',
};
export function isResidentialDictionary(resource: string): resource is ResidentialDictionaryResource {
  return Object.hasOwn(residentialDictionaryPaths, resource);
}
export const versionedDictionaryPaths: Record<VersionedDictionaryResource, string> = {
  ...residentialDictionaryPaths, locations: '/admin/dictionaries/geography/locations', districts: '/admin/dictionaries/geography/districts',
};
export function isVersionedDictionary(resource: string): resource is VersionedDictionaryResource {
  return Object.hasOwn(versionedDictionaryPaths, resource);
}
export function dictionaryListPath(resource: VersionedDictionaryResource): string {
  return resource === 'locations' || resource === 'districts' ? '/admin/dictionaries/geography' : residentialDictionaryPaths[resource];
}
export const dictionaryFieldLabels: Record<string, string> = {
  name: 'Название', slug: 'Slug (URL-идентификатор)', description: 'Описание компании', phone: 'Телефон', founded_year: 'Год основания',
  under_construction_count: 'Строится', built_count: 'Построено', total_projects: 'Всего проектов', moderation_status: 'Статус модерации',
  website: 'Веб-сайт', facebook: 'Facebook', instagram: 'Instagram', telegram: 'Telegram', logo_path: 'Логотип', sort_order: 'Порядок сортировки', is_active: 'Активна',
  city: 'Город', district: 'Уточнение города (старое поле)', latitude: 'Широта', longitude: 'Долгота', location_id: 'Город района (№)',
  merged_into_id: 'Объединён с районом №', replacement_id: 'Заменён записью №', deleted: 'Удалён',
};
export function dictionaryFields(resource: VersionedDictionaryResource): string[] {
  if (resource === 'locations') return ['city', 'district', 'latitude', 'longitude'];
  if (resource === 'districts') return ['name', 'location_id'];
  if (resource === 'developers') return ['name', 'phone', 'founded_year', 'total_projects', 'built_count', 'under_construction_count', 'moderation_status', 'description', 'website', 'facebook', 'instagram', 'telegram'];
  return ['name', 'slug', ...(resource === 'construction-stages' ? ['sort_order', 'is_active'] : [])];
}
export function dictionaryDraft(resource: VersionedDictionaryResource, record: ResidentialDictionaryRecord): Record<string, string> {
  return Object.fromEntries(dictionaryFields(resource).map(key => [key, key === 'is_active' ? (record[key] ? '1' : '0') : String(record[key] ?? '')]));
}
export function dictionaryEditPayload(resource: VersionedDictionaryResource, draft: Record<string, string>, command: DictionaryEditCommand) {
  return { ...Object.fromEntries(dictionaryFields(resource).map(key => [resource === 'districts' && key === 'location_id' ? 'city_id' : key, draft[key]?.trim() || null])), ...command, reason: command.reason.trim() };
}
