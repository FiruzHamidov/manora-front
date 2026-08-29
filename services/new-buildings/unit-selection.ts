import type { CompletionValue } from './completion';
import type { PublicUnit, UnitFilters } from './public-unit';

export type UnitCard = Pick<PublicUnit, 'id' | 'new_building_id' | 'number' | 'rooms' | 'area' | 'floor' | 'position_on_floor' | 'total_price' | 'discount_price' | 'effective_total_price' | 'effective_price_per_sqm' | 'currency' | 'availability_status' | 'version' | 'block' | 'entrance'> & {
  building?: CompletionValue;
  plan: { source: 'unit' | 'layout'; image: Pick<NonNullable<PublicUnit['plan']>['image'], 'id' | 'url' | 'sources' | 'alt' | 'width' | 'height'> } | null;
};
export type SelectionMeta = {
  matched_count: number; matched_available_count: number; matched_reserved_count: number;
  available_price_min: string | null; price_min: string | null; price_max: string | null;
  area_min: string | null; area_max: string | null; kitchen_area_min: string | null; kitchen_area_max: string | null;
  floor_min: number | null; floor_max: number | null; as_of: string;
};
export type UnitList = { data: UnitCard[]; meta: SelectionMeta & { page: number; per_page: number; last_page: number } };
export type UnitFacets = {
  meta: SelectionMeta;
  options: Record<'rooms' | 'finishing' | 'window_view', { value: string; count: number }[]>;
  blocks: { id: number; name: string; entrances: { id: number; name: string; residential_floor_from: number | null; residential_floor_to: number | null }[] }[];
};
export type UnitGrid = {
  meta: SelectionMeta & { unplaced_matching_count: number; visible_matched_count?: number };
  geometry: null | {
    block: { id: number; name: string }; entrance: { id: number; name: string }; complete: boolean;
    floors: { floor: number; kind: 'residential' | 'outside_residential' | 'unknown' | 'technical_floor' }[]; positions: number[];
    spaces: { floor: number; position: number; kind: 'empty_position' }[];
    floor_page: number; floor_pages: number; position_page: number; position_pages: number;
  };
  cells: (Omit<UnitCard, 'block' | 'entrance' | 'plan'> & { matches: boolean })[];
};

const keys = new Set(['block_id', 'entrance_id', 'rooms', 'price_min', 'price_max', 'area_min', 'area_max',
  'kitchen_area_min', 'kitchen_area_max', 'floor_min', 'floor_max', 'not_first', 'not_last', 'only_last',
  'include_reserved', 'sort', 'page', 'view', 'grid_floor_page', 'grid_position_page']);
const aliases: Record<string, string> = { exclude_first_floor: 'not_first', exclude_last_floor: 'not_last', only_last_floor: 'only_last' };
const multiKey = /^(finishing|window_view)(?:\[(?:[0-9]|1[0-9])?\])?$/;

/** Keep malformed known values for the server's field errors, not a silently broader result. */
export function readUnitSelection(params: URLSearchParams): UnitFilters {
  const result: UnitFilters = {};
  for (const key of keys) {
    const value = params.get(key);
    if (value !== null && value !== '') result[key] = value.slice(0, 200);
  }
  for (const [alias, key] of Object.entries(aliases)) {
    if (!(key in result) && params.has(alias)) result[key] = (params.get(alias) ?? '').slice(0, 200);
  }
  const rooms = params.getAll('rooms[]');
  if (rooms.length) result.rooms = rooms.slice(0, 6).join(',');
  for (const field of ['finishing', 'window_view']) {
    const values: string[] = [];
    for (const [key, value] of params) if (multiKey.test(key) && key.split('[')[0] === field) values.push(value.slice(0, 200));
    values.slice(0, 20).forEach((value, i) => { result[field + '[' + i + ']'] = value; });
  }
  return result;
}

export function selectionQuery(filters: UnitFilters): string {
  return new URLSearchParams(Object.entries(filters).filter(([, value]) => value !== '').sort(([a], [b]) => a.localeCompare(b))).toString();
}
export function unitApiQuery(filters: UnitFilters): string {
  const params = new URLSearchParams(selectionQuery(filters));
  params.delete('view');
  params.set('per_page', '20');
  return params.toString();
}
export function selectionNavigation(current: string, filters: UnitFilters): string {
  const params = new URLSearchParams(current);
  for (const key of [...params.keys()]) if (keys.has(key) || key in aliases || key === 'rooms[]' || multiKey.test(key)) params.delete(key);
  for (const [key, value] of Object.entries(filters)) if (value !== '') params.set(key, value);
  return params.toString();
}
export function changeSelection(filters: UnitFilters, key: string, value: string): UnitFilters {
  const next = { ...filters };
  if (value === '') delete next[key]; else next[key] = value;
  if (key === 'block_id') delete next.entrance_id;
  if (key === 'not_last' && value === '1') delete next.only_last;
  if (key === 'only_last' && value === '1') delete next.not_last;
  if (!['page', 'grid_floor_page', 'grid_position_page', 'view'].includes(key)) {
    delete next.page; delete next.grid_floor_page; delete next.grid_position_page;
  }
  return next;
}
export function selectionValues(filters: UnitFilters, key: string): string[] {
  return Object.entries(filters).filter(([name]) => name === key || name.startsWith(key + '[')).map(([, value]) => value);
}
export function toggleSelectionValue(filters: UnitFilters, key: string, value: string): UnitFilters {
  const values = selectionValues(filters, key);
  const next = changeSelection(filters, key, '');
  for (const name of Object.keys(next)) if (name.startsWith(key + '[')) delete next[name];
  (values.includes(value) ? values.filter(v => v !== value) : [...values, value]).forEach((v, i) => { next[key + '[' + i + ']'] = v; });
  return next;
}
export const SELECTION_SORTS = [
  ['newest', 'Сначала новые'], ['price_asc', 'Цена по возрастанию'], ['price_desc', 'Цена по убыванию'],
  ['area_asc', 'Площадь по возрастанию'], ['area_desc', 'Площадь по убыванию'],
  ['floor_asc', 'Этаж по возрастанию'], ['floor_desc', 'Этаж по убыванию'],
] as const;
