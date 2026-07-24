export const PROPERTY_DOCUMENT_TYPES = [
  { id: 'ownership_certificate', name: 'Свидетельство о собственности' },
  { id: 'technical_passport', name: 'Технический паспорт' },
  { id: 'sale_purchase_agreement', name: 'Договор купли-продажи' },
  { id: 'inheritance_certificate', name: 'Свидетельство о наследстве' },
  { id: 'other', name: 'Другой документ' },
  { id: 'none', name: 'Документы отсутствуют' },
] as const;

export type PropertyDocumentType = (typeof PROPERTY_DOCUMENT_TYPES)[number]['id'];

export const getPropertyDocumentTypeLabel = (value?: string | null): string =>
  PROPERTY_DOCUMENT_TYPES.find((option) => option.id === value)?.name ?? 'Не указан';
