import { formatCompletion } from './completion';
import { formatResidentialDecimal, unitPrice, UNIT_STATUS_LABELS, type PublicUnit } from './public-unit';

export const UNIT_COMPARISON_KEY = 'manora:unit-comparison:v1';
export const UNIT_COMPARISON_EVENT = 'manora:unit-comparison-changed';
export type UnitReference = { buildingId: number; unitId: number };
export const unitReferenceKey = (ref: UnitReference) => ref.buildingId + ':' + ref.unitId;
export const unitReferenceHref = (ref: UnitReference) => `/new-buildings/${ref.buildingId}/units/${ref.unitId}`;
export function validUnitReference(ref: unknown): ref is UnitReference {
  if (!ref || typeof ref !== 'object') return false;
  const value = ref as UnitReference;
  return Number.isSafeInteger(value.buildingId) && value.buildingId > 0 && Number.isSafeInteger(value.unitId) && value.unitId > 0;
}
export function parseUnitComparison(raw: string): { units: UnitReference[]; error: string | null } {
  if (!raw) return { units: [], error: null };
  try {
    const data = JSON.parse(raw);
    if (data.version !== 1 || !Array.isArray(data.units) || data.units.length > 4 || !data.units.every(validUnitReference)) throw new Error();
    const units: UnitReference[] = data.units.map(({ buildingId, unitId }: UnitReference) => ({ buildingId, unitId }));
    return { units: [...new Map(units.map(ref => [unitReferenceKey(ref), ref])).values()], error: null };
  } catch { return { units: [], error: 'Не удалось прочитать список сравнения. Сохранённые записи не перезаписаны.' }; }
}
export function changeUnitComparison(units: UnitReference[], ref: UnitReference, add: boolean): UnitReference[] {
  if (!validUnitReference(ref)) throw new Error('Некорректная квартира.');
  const existing = units.some(item => unitReferenceKey(item) === unitReferenceKey(ref));
  if (!add) return units.filter(item => unitReferenceKey(item) !== unitReferenceKey(ref));
  if (existing) return units;
  if (units.length >= 4) throw new Error('Можно сравнить до 4 квартир. Сначала удалите одну из выбранных.');
  return [...units, { buildingId: ref.buildingId, unitId: ref.unitId }];
}

const size = (value: string | null) => value === null ? 'Не указана' : formatResidentialDecimal(value) + ' м²';
export const unitComparisonFields: { key: string; label: string; value: (unit: PublicUnit) => string }[] = [
  { key: 'building', label: 'Жилой комплекс', value: u => u.building.title },
  { key: 'price', label: 'Цена', value: u => unitPrice(u.effective_total_price, u.currency) },
  { key: 'price_sqm', label: 'Цена за м²', value: u => unitPrice(u.effective_price_per_sqm, u.currency) },
  { key: 'area', label: 'Общая площадь', value: u => size(u.area) },
  { key: 'rooms', label: 'Комнаты', value: u => u.rooms === null ? 'Не указаны' : u.rooms === 0 ? 'Студия' : String(u.rooms) },
  { key: 'floor', label: 'Этаж', value: u => u.floor === null ? 'Не указан' : String(u.floor) },
  { key: 'block', label: 'Корпус', value: u => u.block?.name || 'Не указан' },
  { key: 'entrance', label: 'Подъезд', value: u => u.entrance?.name || 'Не указан' },
  { key: 'completion', label: 'Сдача', value: u => formatCompletion(u.block ?? u.building) },
  { key: 'finishing', label: 'Отделка', value: u => u.finishing || 'Не указана' },
  { key: 'status', label: 'Статус', value: u => UNIT_STATUS_LABELS[u.availability_status] },
];
export function unitComparisonRows(units: PublicUnit[], differences: boolean) {
  return unitComparisonFields.map(field => ({ key: field.key, label: field.label, values: units.map(field.value) }))
    .filter(row => !differences || new Set(row.values).size > 1);
}
