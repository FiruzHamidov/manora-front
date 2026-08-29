import type { MediaSource } from './media';
import type { CompletionValue } from './completion';
import type { LeadIntent } from '../leads/client';

export type UnitAvailability = 'available' | 'reserved' | 'sold';
export type PublicDrawing = { sources?: MediaSource[]; id: number; url: string; alt: string; caption: string | null; width: number; height: number };
export type PublicUnit = {
  id: number; new_building_id: number; block_id: number | null; entrance_id: number | null;
  name: string; number: string | null; rooms: number | null; area: string | null;
  living_area: string | null; kitchen_area: string | null; bathrooms: number | null;
  floor: number | null; position_on_floor: number | null; version: number;
  total_price: string | null; discount_price: string | null; price_per_sqm: string | null;
  effective_total_price: string | null; effective_price_per_sqm: string | null; currency: string;
  availability_status: UnitAvailability; description: string | null;
  finishing: string | null; window_view: string | null; updated_at: string;
  building: CompletionValue & {
    id: number; title: string; address: string | null; district: string | null;
    latitude: string | number | null; longitude: string | number | null;
    ceiling_height: string | null; data_verified_at: string | null;
    consultant: { name: string; phone: string } | null; developer: { id: number; name: string } | null;
  };
  block: (CompletionValue & { id: number; name: string; floors_from: number | null; floors_to: number | null }) | null;
  entrance: { id: number; name: string; residential_floor_from: number | null; residential_floor_to: number | null } | null;
  plan: { source: 'unit' | 'layout'; image_count: number; image: PublicDrawing } | null;
  floor_plan: { id: number; name: string; image: PublicDrawing; region: { points: [number, number][] } | null } | null;
  photo: { sources?: MediaSource[]; id: number; url: string; width: number | null; height: number | null } | null;
  photo_count: number;
};

export const UNIT_STATUS_LABELS: Record<UnitAvailability, string> = {
  available: 'Свободна', reserved: 'Забронирована', sold: 'Продана',
};
export const UNIT_INTENT_LABELS: Partial<Record<LeadIntent, string>> = {
  availability: 'Уточнить наличие', viewing: 'Записаться на просмотр',
  availability_notification: 'Сообщить, если освободится', similar_selection: 'Подобрать похожую',
  payment_consultation: 'Уточнить условия оплаты',
};
export function unitIntents(status: UnitAvailability): LeadIntent[] {
  if (status === 'sold') return ['similar_selection'];
  if (status === 'reserved') return ['availability_notification', 'similar_selection'];
  return ['availability', 'viewing'];
}
export function unitPrimaryActionLabel(status: UnitAvailability): string {
  return UNIT_INTENT_LABELS[unitIntents(status)[0]] ?? 'Обратиться в Manora';
}

/** Decimal strings remain exact, including amounts beyond safe floating point precision. */
export function formatResidentialDecimal(value: string | number | null | undefined, unknown = 'Не указано'): string {
  if (value === null || value === undefined || !/^\d+(?:\.\d+)?$/.test(String(value))) return unknown;
  const [integer, decimal] = String(value).split('.');
  const fraction = decimal?.replace(/0+$/, '');
  return integer.replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0') + (fraction ? ',' + fraction : '');
}
export function unitPrice(value: string | null, currency = 'TJS'): string {
  return value === null ? 'По запросу' : formatResidentialDecimal(value) + ' ' + currency;
}
export function unitPriceRange(min: string | null, max: string | null, currency = 'TJS'): string {
  if (min === null) return 'По запросу';
  if (max === null || min === max) return unitPrice(min, currency);
  return formatResidentialDecimal(min) + ' – ' + unitPrice(max, currency);
}
export function unitTitle(unit: Pick<PublicUnit, 'rooms' | 'area' | 'floor'>): string {
  const rooms = unit.rooms === null ? 'Квартира' : unit.rooms === 0 ? 'Студия' : unit.rooms + '-комнатная квартира';
  return [rooms, unit.area === null ? null : formatResidentialDecimal(unit.area) + ' м²', unit.floor === null ? null : unit.floor + ' этаж'].filter(Boolean).join(', ');
}
/** A unit's residential top floor belongs to its entrance, not its block. */
export function unitFloorLabel(unit: Pick<PublicUnit, 'floor' | 'entrance'>): string {
  if (unit.floor === null) return 'Не указан';
  return String(unit.floor) + (unit.entrance?.residential_floor_to === null || unit.entrance === null
    ? ' · этажность подъезда не указана'
    : ' из ' + unit.entrance.residential_floor_to);
}
export function unitCoordinates(building: Pick<PublicUnit['building'], 'latitude' | 'longitude'>): [number, number] | null {
  if (building.latitude === null || building.longitude === null || building.latitude === '' || building.longitude === '') return null;
  const lat = Number(building.latitude), lng = Number(building.longitude);
  return Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180 ? [lat, lng] : null;
}

export type UnitFilters = Record<string, string>;
const filterRules: Record<string, RegExp> = {
  block_id: /^[1-9]\d{0,9}$/, entrance_id: /^[1-9]\d{0,9}$/, rooms: /^(?:0|1|2|3|4\+)(?:,(?:0|1|2|3|4\+))*$/,
  price_min: /^\d{1,13}(?:[.,]\d{1,2})?$/, price_max: /^\d{1,13}(?:[.,]\d{1,2})?$/,
  area_min: /^\d{1,8}(?:[.,]\d{1,2})?$/, area_max: /^\d{1,8}(?:[.,]\d{1,2})?$/,
  kitchen_area_min: /^\d{1,8}(?:[.,]\d{1,2})?$/, kitchen_area_max: /^\d{1,8}(?:[.,]\d{1,2})?$/,
  floor_min: /^-?\d{1,3}$/, floor_max: /^-?\d{1,3}$/, not_first: /^[01]$/, not_last: /^[01]$/, only_last: /^[01]$/, include_reserved: /^[01]$/,
  finishing: /^[\p{L}\p{N} _,-]{1,80}$/u, window_view: /^[\p{L}\p{N} _,-]{1,80}$/u,
  sort: /^(price|area|floor)_(asc|desc)$|^newest$/, page: /^[1-9]\d{0,5}$/, view: /^(list|chessboard)$/,
  grid_floor_page: /^[1-9]\d{0,2}$/, grid_position_page: /^[1-9]\d{0,2}$/,
};
/** Only known selection parameters; never arbitrary redirect URLs, phone numbers or tokens. */
export function unitFilterContext(params: URLSearchParams): UnitFilters {
  const filters: UnitFilters = {};
  for (const [key, rule] of Object.entries(filterRules)) {
    const value = params.get(key);
    if (value && value.length <= 100 && rule.test(value)) filters[key] = value;
  }
  for (const [key, value] of params) {
    if (/^(finishing|window_view)\[(?:[0-9]|1[0-9])\]$/.test(key) && value.length <= 120 && !/[\u0000-\u001f]/.test(value)) filters[key] = value;
  }
  return filters;
}
export function unitSelectionHref(buildingId: number, filters: UnitFilters): string {
  const query = new URLSearchParams(unitFilterContext(new URLSearchParams(filters))).toString();
  return '/new-buildings/' + buildingId + (query ? '?' + query : '') + '#apartments';
}

export type UnitQuote = Pick<PublicUnit, 'id' | 'version' | 'total_price' | 'discount_price' | 'currency' | 'availability_status'>;
export function quoteFromConflict(current?: Record<string, unknown>): UnitQuote | null {
  if (!current || !Number.isSafeInteger(current.unit_id) || !Number.isSafeInteger(current.unit_version) || Number(current.unit_version) < 1 || !['available', 'reserved', 'sold'].includes(String(current.availability_status))) return null;
  const validPrice = (value: unknown) => value === null || (typeof value === 'string' && /^\d+(?:\.\d{1,2})?$/.test(value));
  if (!validPrice(current.total_price) || !validPrice(current.discount_price)) return null;
  return { id: Number(current.unit_id), version: Number(current.unit_version), total_price: current.total_price as string | null, discount_price: current.discount_price as string | null, currency: String(current.currency ?? 'TJS'), availability_status: current.availability_status as UnitAvailability };
}
export function sameUnitQuote(a: UnitQuote, b: UnitQuote): boolean {
  return a.id === b.id && a.version === b.version && a.total_price === b.total_price && a.discount_price === b.discount_price && a.currency === b.currency && a.availability_status === b.availability_status;
}
