export type InventoryBatchStatus = 'queued_preview' | 'ready' | 'invalid' | 'queued_apply' | 'applied' | 'conflict' | 'failed' | 'cancelled';
export type InventorySnapshot = Record<string, string | number | null>;
export type InventoryBatch = {
  id: number; created_by: number | null; kind: 'bulk' | 'import'; status: InventoryBatchStatus; version: number; reason: string;
  source_name: string | null; row_count: number; created_at: string; applied_at: string | null; error: string | null;
  summary: { create: number; update: number; noop: number; error: number } | null;
  impact: { affected_count: number; building_publication_before: string; building_publication_after: string; requires_building_reverification: boolean; new_or_changed_imports_require_moderation: boolean } | null;
};
export type BatchRow = { id: number; row_number: number; unit_id: number | null; unit_version: number | null; action: 'create' | 'update' | 'noop' | 'error' | null;
  input: Record<string, unknown>; before: InventorySnapshot | null; after: InventorySnapshot | null; result: InventorySnapshot | null; errors: Record<string, string[]> | null };
export type BatchPage<T> = { data: T[]; meta: { current_page: number; last_page: number; total: number } };
export type BatchDetail = { data: InventoryBatch; rows: BatchPage<BatchRow>; can_command: boolean;
  events: { id: number; status: InventoryBatchStatus; version: number; created_at: string; message: string }[] };
export type SelectedInventoryUnit = { id: number; version: number; label: string };
export const batchStatuses: Record<InventoryBatchStatus, string> = { queued_preview: 'Подготовка preview', ready: 'Готов к подтверждению', invalid: 'Ошибки данных',
  queued_apply: 'Применение ожидается или выполняется', applied: 'Применён', conflict: 'Конфликт: нужен новый preview', failed: 'Техническая ошибка', cancelled: 'Отменён' };
export const batchActions = { create: 'Создать', update: 'Изменить', noop: 'Без изменений', error: 'Ошибка' };
export const batchBusy = (status: InventoryBatchStatus) => status === 'queued_preview' || status === 'queued_apply';
export function bulkRows(units: SelectedInventoryUnit[], price: { enabled: boolean; basis: 'total' | 'per_sqm'; amount: string; onRequest: boolean; clearDiscount: boolean }, availability: string): Record<string, unknown>[] {
  if (!units.length || units.length > 500) throw new Error('Выберите от 1 до 500 лотов.');
  if (!price.enabled && !availability && !price.clearDiscount) throw new Error('Укажите цену, очистку скидки или новый статус доступности.');
  const amount = price.amount.trim().replace(',', '.');
  if (price.enabled && !price.onRequest && !/^\d+(\.\d{1,2})?$/.test(amount)) throw new Error('Укажите положительную сумму с точностью до двух знаков.');
  if (price.enabled && !price.onRequest && /^0+(\.0{1,2})?$/.test(amount)) throw new Error('Нулевая цена недопустима. Используйте «По запросу».');
  if (availability && !['available', 'reserved', 'sold', 'withdrawn'].includes(availability)) throw new Error('Неизвестный статус доступности.');
  return units.map(unit => ({
    unit_id: unit.id, version: unit.version,
    ...(price.enabled ? { pricing_basis: price.basis, [price.basis === 'total' ? 'total_price' : 'price_per_sqm']: price.onRequest ? null : amount } : {}),
    ...(price.clearDiscount ? { discount_price: null } : {}),
    ...(availability ? { availability_status: availability } : {}),
  }));
}
export function inventoryDiff(before: InventorySnapshot | null, after: InventorySnapshot | null): { field: string; before: string | number | null; after: string | number | null }[] {
  if (!after) return [];
  return Object.keys(after).filter(field => !['id', 'version'].includes(field) && (before ? before[field] !== after[field] : after[field] !== null))
    .map(field => ({ field, before: before?.[field] ?? null, after: after[field] }));
}
export const inventoryLabels: Record<string, string> = {
  external_id: 'Внешний ID', name: 'Название', block_id: 'ID корпуса', entrance_id: 'ID подъезда', layout_id: 'ID планировки',
  number: 'Номер квартиры', rooms: 'Комнатность (0 — студия)', bathrooms: 'Санузлы', floor: 'Этаж', position_on_floor: 'Позиция',
  area: 'Площадь, м²', living_area: 'Жилая площадь, м²', kitchen_area: 'Кухня, м²', pricing_basis: 'Основа цены',
  total_price: 'Цена, TJS', price_per_sqm: 'Цена за м², TJS', discount_price: 'Цена со скидкой, TJS', availability_status: 'Доступность',
  publication_status: 'Публикация', finishing: 'Отделка', window_view: 'Вид из окна', description: 'Описание',
};
