export type DictionaryResource =
  | 'property-types'
  | 'property-statuses'
  | 'building-types'
  | 'parking-types'
  | 'heating-types'
  | 'repair-types'
  | 'contract-types'
  | 'locations'
  | 'districts'
  | 'car-categories'
  | 'car-brands'
  | 'car-models'
  | 'branches'
  | 'developers'
  | 'features'
  | 'materials'
  | 'construction-stages';

export interface DictionaryUsage {
  resource: DictionaryResource;
  id: number;
  label: string;
  total: number;
  usages: Array<{ key: string; label: string; count: number }>;
  replacements: Array<{ id: number; label: string }>;
}

export interface DictionaryRecord {
  id: number;
  name: string;
  slug?: string;
  city?: string;
  city_id?: number;
  latitude?: number | string | null;
  longitude?: number | string | null;
  parent_id?: number | null;
  brand_id?: number | null;
  brand_name?: string | null;
}

export interface DictionaryPayload {
  [key: string]: string | number | null | undefined;
}

export type DictionaryListParams = {
  city_ids?: number[];
  brand_id?: number | string;
};

export interface PaginatedDictionaryResponse<T> {
  data: T[];
}

export interface DictionaryListResponse<T> {
  items: T[];
}

export interface DictionaryErrorPayload {
  message?: string;
  errors?: Record<string, string | string[]>;
  error?: string;
  detail?: string;
}
