// services/add-post/api.ts
import { axios } from '@/utils/axios';
import type {
  BuildingType,
  ContractType,
  CreatePropertyPayload,
  CreatePropertyRequest,
  CreatePropertyResponse,
  HeatingType,
  Location,
  ParkingType,
  PropertyType,
  RepairType,
  UpdatePropertyPayload,
} from './types';
import {isAxiosError} from "axios";
import {Developer} from "@/services/new-buildings/types";

/** ---------------- Endpoints ---------------- */
const EP = {
  PROPERTY_TYPES: '/property-types',
  BUILDING_TYPES: '/building-types',
  LOCATIONS: '/locations',
  REPAIR_TYPES: '/repair-types',
  DEVELOPERS: '/developers',
  HEATING_TYPES: '/heating-types',
  PARKING_TYPES: '/parking-types',
  CONTRACT_TYPES: '/contract-types',
  PROPERTIES: '/properties',
  photosReorder: (propertyId: string | number) =>
      `/properties/${propertyId}/photos/reorder`,
  photo: (propertyId: string | number, photoId: number | string) =>
      `/properties/${propertyId}/photos/${photoId}`,
} as const;

/** ---------------- Helpers ---------------- */
const safeAppend = (fd: FormData, key: string, value: unknown) => {
  if (value === undefined || value === null) return;

  // boolean / "true"/"false" → '1'/'0'
  if (typeof value === 'boolean') {
    fd.append(key, value ? '1' : '0');
    return;
  }
  if (value === 'true' || value === 'false') {
    fd.append(key, value === 'true' ? '1' : '0');
    return;
  }

  // File/Blob
  if (typeof File !== 'undefined' && value instanceof File) {
    fd.append(key, value);
    return;
  }
  if (typeof Blob !== 'undefined' && value instanceof Blob) {
    fd.append(key, value);
    return;
  }

  // number / string / Date
  if (typeof value === 'number') {
    fd.append(key, String(value));
    return;
  }
  if (value instanceof Date) {
    fd.append(key, value.toISOString());
    return;
  }
  if (typeof value === 'string') {
    if (value.trim() !== '') fd.append(key, value);
    return;
  }

  // массивы — вызывающий код должен добавлять с []-суффиксами
  // объекты — не сериализуем здесь специально, чтобы не засорять payload
};

const buildFormDataFromJson = (payload: CreatePropertyRequest) => {
  const fd = new FormData();

  // простые поля
  (
      [
        'description',
        'type_id',
        'status_id',
        'location_id',
        'moderation_status',
        'repair_type_id',
        'district',
        'address',
        'heating_type_id',
        'contract_type_id',
        'parking_type_id',
        'price',
        'currency',
        'offer_type',
        'listing_type',
        'rooms',
        'total_area',
        'living_area',
        'floor',
        'total_floors',
        'year_built',
        'condition',
        'apartment_type',
        'has_garden',
        'has_parking',
        'is_mortgage_available',
        'is_from_developer',
        'landmark',
        'owner_phone',
        'youtube_link',
        'latitude',
        'longitude',
        'agent_id',
      ] as Array<keyof CreatePropertyRequest>
  ).forEach((k) => safeAppend(fd, k, payload[k]));

  // файлы и id-шники
  (payload.photos ?? []).forEach((file) => fd.append('photos[]', file));
  (payload.photos_keep ?? []).forEach((id) => fd.append('photos_keep[]', String(id)));
  (payload.remove_ids ?? []).forEach((id) => fd.append('remove_ids[]', String(id)));
  if (payload.cover_id) fd.append('cover_id', String(payload.cover_id));

  return fd;
};

/** ---------------- API ---------------- */
export const addPostApi = {
  // справочники
  getPropertyTypes: async (): Promise<PropertyType[]> =>
      (await axios.get(EP.PROPERTY_TYPES)).data,
  getBuildingTypes: async (): Promise<BuildingType[]> =>
      (await axios.get(EP.BUILDING_TYPES)).data,
  getLocations: async (): Promise<Location[]> =>
      (await axios.get(EP.LOCATIONS)).data,
  getRepairTypes: async (): Promise<RepairType[]> =>
      (await axios.get(EP.REPAIR_TYPES)).data,

    getDevelopers: async (): Promise<Developer[]> =>
        (await axios.get(EP.DEVELOPERS)).data.data,
  getHeatingTypes: async (): Promise<HeatingType[]> =>
      (await axios.get(EP.HEATING_TYPES)).data,
  getParkingTypes: async (): Promise<ParkingType[]> =>
      (await axios.get(EP.PARKING_TYPES)).data,
  getContractTypes: async (): Promise<ContractType[]> =>
      (await axios.get(EP.CONTRACT_TYPES)).data,

  // create
    async createProperty(payload: CreatePropertyPayload): Promise<CreatePropertyResponse> {
        try {
            const response = payload instanceof FormData
                ? await axios.post(EP.PROPERTIES, payload)
                : await axios.post(EP.PROPERTIES, buildFormDataFromJson(payload));

            if (!response) {
                throw new Error('No response received from axios when creating property');
            }

            return response.data as CreatePropertyResponse;
        } catch (err) {
            // preserve original axios error if present so callers can use isAxiosError
            if (isAxiosError(err)) {
                throw err;
            }
            throw new Error(`createProperty failed: ${(err as Error)?.message ?? String(err)}`);
        }
    },

  // update
  async updateProperty(payload: UpdatePropertyPayload): Promise<CreatePropertyResponse> {
    const { id } = payload;
    if ('formData' in payload) {
      const fd = payload.formData;
      if (!fd.has('_method')) fd.append('_method', 'PUT'); // method override
      return (await axios.post(`${EP.PROPERTIES}/${id}`, fd)).data;
    }
    // JSON-вариант
    return (await axios.put(`${EP.PROPERTIES}/${id}`, payload.json)).data;
  },

  // reorder photos
  async reorderPhotos(propertyId: number | string, orderedPhotoIds: number[]): Promise<void> {
    await axios.put(EP.photosReorder(propertyId), { photo_order: orderedPhotoIds });
  },

  // delete photo
  async deletePropertyPhoto(propertyId: number | string, photoId: number): Promise<void> {
    await axios.delete(EP.photo(propertyId, photoId));
  },
};