import { axios } from '@/utils/axios';
import type {
  DictionaryListParams,
  DictionaryPayload,
  DictionaryRecord,
  DictionaryResource,
  DictionaryUsage,
  DictionaryDeleteCommand,
} from './types';
import { normalizeDictionaryList } from './utils';

const DICTIONARY_ENDPOINTS: Record<DictionaryResource, string> = {
  'property-types': '/property-types',
  'property-statuses': '/property-statuses',
  'building-types': '/building-types',
  'parking-types': '/parking-types',
  'heating-types': '/heating-types',
  'repair-types': '/repair-types',
  'contract-types': '/contract-types',
  locations: '/locations',
  districts: '/districts',
  'car-categories': '/car-categories',
  'car-brands': '/car-brands',
  'car-models': '/car-models',
  branches: '/branches',
  developers: '/developers',
  features: '/features',
  materials: '/materials',
  'construction-stages': '/construction-stages',
};

function normalizeParams(params?: DictionaryListParams) {
  if (!params) return undefined;

  return Object.entries(params).reduce<Record<string, unknown>>((acc, [key, value]) => {
    if (value === undefined || value === null || value === '') return acc;
    if (Array.isArray(value) && value.length === 0) return acc;

    if (Array.isArray(value)) {
      acc[`${key}[]`] = value;
      return acc;
    }

    acc[key] = value;
    return acc;
  }, {});
}

export const dictionariesApi = {
  async list(resource: DictionaryResource, params?: DictionaryListParams): Promise<DictionaryRecord[]> {
    const endpoint = DICTIONARY_ENDPOINTS[resource];
    const requestParams = normalizeParams(params);

    // These lists serve dictionary management. Revalidation must reach the server
    // after a mutation instead of reusing the public endpoint's HTTP cache.
    const { data } = await axios.get(endpoint, { params: requestParams, headers: { 'Cache-Control': 'no-cache' }, timeout: 15_000 });
    return normalizeDictionaryList<DictionaryRecord>(data);
  },

  async create(resource: DictionaryResource, payload: DictionaryPayload): Promise<DictionaryRecord> {
    const endpoint = DICTIONARY_ENDPOINTS[resource];
    const { data } = await axios.post<DictionaryRecord>(endpoint, payload);
    return data;
  },

  async update(
    resource: DictionaryResource,
    id: number,
    payload: DictionaryPayload
  ): Promise<DictionaryRecord> {
    const endpoint = `${DICTIONARY_ENDPOINTS[resource]}/${id}`;
    const { data } = await axios.put<DictionaryRecord>(endpoint, payload);
    return data;
  },

  async remove(resource: DictionaryResource, id: number): Promise<number> {
    const endpoint = `${DICTIONARY_ENDPOINTS[resource]}/${id}`;
    const response = await axios.delete(endpoint);
    return response.status;
  },

  async usage(resource: DictionaryResource, id: number, userId?: number): Promise<DictionaryUsage> {
    const { data } = await axios.get<DictionaryUsage>(`/dictionaries/${resource}/${id}/usage`, { timeout: 15_000, params: { expected_user_id: userId } });
    return data;
  },

  async replaceAndDelete(resource: DictionaryResource, id: number, command: DictionaryDeleteCommand) {
    const { data } = await axios.post<{ reassigned: number }>(`/dictionaries/${resource}/${id}/replace-delete`, command, { timeout: 30_000 });
    return data;
  },
};
