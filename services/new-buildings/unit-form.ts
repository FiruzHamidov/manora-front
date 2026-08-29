import type { BuildingUnit, BuildingUnitPayload, UnitLayout } from './types';

export const unitTextFields = ['name', 'number', 'description', 'finishing', 'external_id'] as const;
export const unitIntegerFields = ['block_id', 'entrance_id', 'layout_id', 'rooms', 'bathrooms', 'floor', 'position_on_floor'] as const;
export const unitDecimalFields = ['area', 'living_area', 'kitchen_area', 'discount_price'] as const;
type Field = typeof unitTextFields[number] | typeof unitIntegerFields[number] | typeof unitDecimalFields[number];
export type UnitDraft = Record<Field, string> & {
  version?: number;
  pricing_basis: 'total' | 'per_sqm';
  amount: string;
  on_request: boolean;
  publication_status: BuildingUnit['publication_status'];
  availability_status: BuildingUnit['availability_status'];
  window_view: string;
  reason: string;
};

export function unitDraft(unit?: BuildingUnit): UnitDraft {
  const fields = Object.fromEntries([...unitTextFields, ...unitIntegerFields, ...unitDecimalFields].map(key => [key, unit?.[key] == null ? '' : String(unit[key])])) as Record<Field, string>;
  const basis = unit?.pricing_basis ?? 'total';
  const amount = unit?.[basis === 'total' ? 'total_price' : 'price_per_sqm'];
  return { ...fields, version: unit?.version, pricing_basis: basis, amount: amount ?? '', on_request: amount == null,
    publication_status: unit?.publication_status === 'published' || unit?.publication_status === 'rejected' ? 'pending' : unit?.publication_status ?? 'draft',
    availability_status: unit?.availability_status ?? 'available', window_view: unit?.window_view ?? '', reason: '' };
}

const decimal = (value: string) => value.trim() ? value.trim().replace(',', '.') : null;

export function unitPayload(draft: UnitDraft): BuildingUnitPayload {
  const payload: BuildingUnitPayload = {
    version: draft.version, pricing_basis: draft.pricing_basis, currency: 'TJS',
    publication_status: draft.publication_status, availability_status: draft.availability_status,
    window_view: (draft.window_view || null) as BuildingUnit['window_view'], reason: draft.reason || undefined,
  };
  for (const key of unitTextFields) {
    if (key === 'name') payload.name = draft.name.trim();
    else payload[key] = draft[key].trim() || null;
  }
  for (const key of unitIntegerFields) {
    const value = draft[key].trim();
    if (value && !/^\d+$/.test(value)) throw new Error('Укажите целые номера, комнатность и этаж.');
    payload[key] = value === '' ? null : Number(value);
  }
  for (const key of unitDecimalFields) payload[key] = decimal(draft[key]);
  if (!draft.on_request && !draft.amount.trim()) throw new Error('Укажите сумму или выберите «Цена по запросу».');
  payload[draft.pricing_basis === 'total' ? 'total_price' : 'price_per_sqm'] = draft.on_request ? null : decimal(draft.amount);
  return payload;
}

/** Explicit user action only: never run in response to a layout query refetch. */
export function applyLayoutDefaults(draft: UnitDraft, layout: UnitLayout): UnitDraft {
  const next = { ...draft };
  for (const key of ['rooms', 'area', 'living_area', 'kitchen_area'] as const) {
    if (next[key] === '' && layout[key] !== null) next[key] = String(layout[key]);
  }
  return next;
}

export const unitDraftLabels = {
  name: 'Название', number: 'Номер квартиры', external_id: 'Внешний ID', description: 'Описание',
  block_id: 'Корпус (ID)', entrance_id: 'Подъезд (ID)', floor: 'Этаж', position_on_floor: 'Позиция на этаже',
  layout_id: 'Типовая планировка (ID)', rooms: 'Комнатность', bathrooms: 'Санузлы',
  area: 'Общая площадь', living_area: 'Жилая площадь', kitchen_area: 'Площадь кухни',
  finishing: 'Отделка', window_view: 'Вид из окон', pricing_basis: 'Основание цены',
  amount: 'Сумма', on_request: 'Цена по запросу', discount_price: 'Скидочная цена',
  publication_status: 'Публикация при сохранении', availability_status: 'Доступность',
} satisfies Record<Exclude<keyof UnitDraft, 'version' | 'reason'>, string>;
type EditableField = keyof typeof unitDraftLabels;
const editableFields = Object.keys(unitDraftLabels) as EditableField[];
// Do not combine an amount with a different basis, or positions from different entrances.
const relatedFields: EditableField[][] = [
  ['pricing_basis', 'amount', 'on_request'],
  ['block_id', 'entrance_id', 'floor', 'position_on_floor', 'number'],
];

function editedFields(base: UnitDraft, draft: UnitDraft): Set<EditableField> {
  const edited = new Set(editableFields.filter(key => draft[key] !== base[key]));
  for (const group of relatedFields) if (group.some(key => edited.has(key))) group.forEach(key => edited.add(key));
  return edited;
}

export function unitConflictChanges(base: UnitDraft, draft: UnitDraft, latest: BuildingUnit) {
  const remote = unitDraft(latest), edited = editedFields(base, draft);
  return editableFields.filter(key => base[key] !== remote[key] || draft[key] !== base[key]).map(key => ({
    key, label: unitDraftLabels[key], before: base[key], current: remote[key], local: draft[key], keepLocal: edited.has(key),
  }));
}

/** Called only after the user reviews the diff; does not send a mutation. */
export function rebaseUnitDraft(base: UnitDraft, draft: UnitDraft, latest: BuildingUnit): UnitDraft {
  if (!Number.isSafeInteger(latest.version) || latest.version <= (base.version ?? 0)) throw new Error('Нужна более новая версия квартиры. Повторите загрузку.');
  if (latest.publication_status === 'archived') throw new Error('Квартира архивирована. Ваши правки сохранены, но восстановление не выполняется автоматически.');
  const next = unitDraft(latest);
  for (const key of editedFields(base, draft)) Object.assign(next, { [key]: draft[key] });
  next.reason = draft.reason;
  return next;
}
