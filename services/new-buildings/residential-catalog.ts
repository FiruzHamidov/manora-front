import type { MediaSource } from './media';
import type { CompletionValue } from './completion';

export type CatalogFilters = Record<string, string>;
export type CatalogCard = {
  id: number; title: string; address: string | null; district: string | null; city: string | null;
  coordinates: [number, number] | null; installment_available: boolean; has_installment_programs: boolean;
  developer: { id: number; name: string } | null; stage: { id: number; name: string } | null; material: { id: number; name: string } | null;
  published_at: string | null; updated_at: string | null; data_verified_at: string | null;
  completion: { from: CompletionValue | null; to: CompletionValue | null; has_unknown: boolean; source: 'blocks' | 'building' };
  cover: { sources?: MediaSource[]; id: number; url: string; width: number | null; height: number | null; alt: string } | null;
  available_count: number; min_price: string | null; min_price_per_sqm: string | null; currency: 'TJS';
  rooms_summary: { rooms: string | null; available_count: number; area_from: string | null; min_price: string | null }[];
};
export type CatalogMeta = {
  total_complexes: number; total_available_units: number; mapped_complexes: number; unmapped_complexes: number;
  bbox_applied: boolean; as_of: string; source: 'local';
};
export type CatalogList = { data: CatalogCard[]; meta: CatalogMeta & { page: number; per_page: number; last_page: number } };
export type CatalogMap = {
  type: 'FeatureCollection'; meta: CatalogMeta & { zoom: number; truncated: boolean };
  features: { type: 'Feature'; id: string; geometry: { type: 'Point'; coordinates: [number, number] };
    properties: { kind: 'cluster' | 'building'; complex_count: number; building_id: number | null; title: string | null;
      available_count: number; min_price: string | null; currency: 'TJS'; bounds: [number, number, number, number] } }[];
};
export type CatalogFacets = { data: {
  cities: string[]; districts: { city: string | null; name: string }[];
  developers: { id: number; name: string }[]; stages: { id: number; name: string }[]; materials: { id: number; name: string }[];
} };
export const CATALOG_SORTS = [
  ['newest', 'Недавно опубликованные'], ['price_asc', 'Сначала дешевле'], ['price_desc', 'Сначала дороже'], ['completion_asc', 'Ближайшая сдача'],
] as const;
const unitKeys = ['rooms', 'price_min', 'price_max', 'area_min', 'area_max'];
const keys = new Set([...unitKeys, 'search', 'city', 'district', 'developer_id', 'stage_id', 'material_id', 'completion_year_min',
  'completion_year_max', 'installment_available', 'sort', 'page', 'view', 'bbox', 'zoom', 'source', 'include_reserved']);

/** Retain malformed known values for API validation; never broaden a requested filter silently. */
export function readCatalogFilters(params: URLSearchParams): CatalogFilters {
  const result: CatalogFilters = {};
  for (const key of keys) {
    const value = params.get(key);
    if (value !== null && value !== '') result[key] = value.slice(0, 300);
  }
  const rooms = [...params].filter(([key]) => /^rooms\[(?:\d+)?\]$/.test(key)).map(([, value]) => value);
  if (rooms.length) result.rooms = rooms.slice(0, 6).join(',');
  return result;
}
export function catalogQuery(filters: CatalogFilters): string {
  return new URLSearchParams(Object.entries(filters).filter(([, value]) => value !== '').sort(([a], [b]) => a.localeCompare(b))).toString();
}
export function catalogApiQuery(filters: CatalogFilters): string {
  const next = { ...filters }; delete next.view;
  return catalogQuery({ ...next, per_page: '20' });
}
export function catalogNavigation(current: string, filters: CatalogFilters): string {
  const params = new URLSearchParams(current);
  for (const key of [...params.keys()]) if (keys.has(key) || /^rooms\[.*\]$/.test(key)) params.delete(key);
  for (const [key, value] of Object.entries(filters)) if (value !== '') params.set(key, value);
  return params.toString();
}
export function changeCatalog(filters: CatalogFilters, key: string, value: string): CatalogFilters {
  const next = { ...filters };
  if (value === '') delete next[key]; else next[key] = value;
  if (key !== 'page' && key !== 'view') delete next.page;
  if (key === 'city') delete next.district;
  return next;
}
export function applyCatalogViewport(filters: CatalogFilters, area: { bbox: string; zoom: string }): CatalogFilters {
  const next: CatalogFilters = { ...filters, ...area };
  delete next.page;
  return next;
}
export function clearCatalogViewport(filters: CatalogFilters): CatalogFilters {
  const next = { ...filters };
  delete next.bbox;
  delete next.zoom;
  delete next.page;
  return next;
}
export function catalogBuildingHref(id: number, filters: CatalogFilters, room?: string): string {
  const selection = Object.fromEntries(Object.entries(filters).filter(([key]) => unitKeys.includes(key)));
  if (room !== undefined) selection.rooms = room;
  const query = catalogQuery(selection);
  return '/new-buildings/' + id + (query ? '?' + query : '') + '#apartments';
}
/** Yandex uses lat/lon bounds; public GeoJSON and the API use lon/lat. */
export function catalogViewport(bounds: number[][], zoom: number): { bbox: string; zoom: string } | null {
  if (bounds.length !== 2 || bounds.some(point => point.length !== 2 || point.some(value => !Number.isFinite(value))) || !Number.isFinite(zoom)) return null;
  const [[south, west], [north, east]] = bounds;
  const longitude = (value: number) => ((value + 180) % 360 + 360) % 360 - 180;
  const world = Math.abs(east - west) >= 360;
  const box = [world ? -180 : longitude(west), Math.max(-90, south), world ? 180 : longitude(east), Math.min(90, north)].map(value => Number(value.toFixed(6)));
  if (box[0] === box[2] || box[1] >= box[3]) return null;
  return { bbox: box.join(','), zoom: String(Math.max(0, Math.min(20, Math.round(zoom)))) };
}
