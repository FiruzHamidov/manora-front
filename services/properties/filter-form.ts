export const FILTER_DOCUMENT_TYPES = [
  { id: 'technical_passport', name: 'Техпаспорт' },
  { id: 'ownership_certificate', name: 'Свидетельство' },
  { id: 'sale_purchase_agreement', name: 'Договор купли-продажи' },
  { id: 'certificate_other', name: 'Сертификат' },
  { id: 'other', name: 'Другое' },
];

export const RENOVATION_FILTER_OPTIONS = [
  { id: 'renovated', name: 'С ремонтом' },
  { id: 'unrenovated', name: 'Без ремонта' },
  { id: 'shell', name: 'Коробка' },
];

export function normalizeFilterNumber(value: string): string {
  return value.trim().replace(/\s/g, '').replace(',', '.');
}

export function validateFilterRanges(ranges: Array<{label: string; from: string; to: string; integer?: boolean; min?: number}>): string | null {
  for (const {label, from, to, integer, min = 0} of ranges) {
    const values = [from, to].map(normalizeFilterNumber);
    if (values.some(value => value !== '' && (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(value) || !Number.isFinite(Number(value)) || Number(value) < min || (integer && !Number.isInteger(Number(value)))))) {
      return `${label}: введите ${integer ? 'целое ' : ''}число не меньше ${min}.`;
    }
    if (values.every(value => value !== '') && Number(values[0]) > Number(values[1])) {
      return `${label}: значение «от» не должно превышать «до».`;
    }
  }
  return null;
}

const FILTER_ALIASES: Record<string, string[]> = {
  priceFrom: ['price_tjs_from', 'price_from'], priceTo: ['price_tjs_to', 'price_to'],
  roomsFrom: ['rooms_from'], roomsTo: ['rooms_to'], areaFrom: ['total_area_from'], areaTo: ['total_area_to'],
  floorFrom: ['floor_from'], floorTo: ['floor_to'],
};
export function readPropertyFilterParam(params: {get(key: string): string | null}, key: string): string | undefined {
  return [key, ...(FILTER_ALIASES[key] ?? [])].map(name => params.get(name)).find(value => value !== null && value !== '') ?? undefined;
}

export function propertyFilterInitialValues(params: {get(key: string): string | null}, offerType = 'sale') {
  const text = (key: string) => readPropertyFilterParam(params, key);
  const list = (key: string) => text(key)?.split(',').filter(Boolean);
  return {
    propertyTypes: list('propertyTypes'), cities: list('cities'),
    objectTypes: list('object_type_codes'), areaCodes: list('area_codes'), repairs: list('renovation_codes'),
    priceFrom: text('priceFrom'), priceTo: text('priceTo'), roomsFrom: text('roomsFrom'), roomsTo: text('roomsTo'),
    areaFrom: text('areaFrom'), areaTo: text('areaTo'), floorFrom: text('floorFrom'), floorTo: text('floorTo'),
    landAreaFrom: text('land_area_sotka_from'), landAreaTo: text('land_area_sotka_to'),
    landmark: text('landmark'), document_type: text('document_type'), construction_status: text('construction_status'),
    is_full_apartment: ['true', '1'].includes(params.get('is_full_apartment') ?? ''),
    offer_type: params.get('offer_type') || offerType,
    commercial_purpose: text('commercial_purpose'), power_kw_from: text('power_kw_from'), power_kw_to: text('power_kw_to'),
    vehicle_capacity_from: text('vehicle_capacity_from'), vehicle_capacity_to: text('vehicle_capacity_to'),
  };
}
