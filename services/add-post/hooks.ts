import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { addPostApi } from './api';
import type {
  CreatePropertyPayload,
  CreatePropertyResponse, // = { ok:true; data: Property } | { ok:false; ... }
  UpdatePropertyPayload,
} from './types';

// ---- READ QUERIES ----
export const useGetPropertyTypesQuery = () =>
    useQuery({ queryKey: ['get-property-types'], queryFn: addPostApi.getPropertyTypes });

export const useGetBuildingTypesQuery = () =>
    useQuery({ queryKey: ['get-building-types'], queryFn: addPostApi.getBuildingTypes });

export const useGetLocationsQuery = () =>
    useQuery({ queryKey: ['get-locations'], queryFn: addPostApi.getLocations });

export const useGetRepairTypesQuery = () =>
    useQuery({ queryKey: ['get-repair-types'], queryFn: addPostApi.getRepairTypes });

export const useGetDevelopers = () =>
    useQuery({ queryKey: ['get-developers'], queryFn: addPostApi.getDevelopers });

export const useGetHeatingTypesQuery = () =>
    useQuery({ queryKey: ['get-heating-types'], queryFn: addPostApi.getHeatingTypes });

export const useGetParkingTypesQuery = () =>
    useQuery({ queryKey: ['get-parking-types'], queryFn: addPostApi.getParkingTypes });

export const useGetContractTypesQuery = () =>
    useQuery({ queryKey: ['get-contract-types'], queryFn: addPostApi.getContractTypes });

export const useCreatePropertyMutation = () => {
  const qc = useQueryClient();
  return useMutation<CreatePropertyResponse, Error, CreatePropertyPayload & { force?: boolean }>({
    mutationFn: (payload) => addPostApi.createProperty(payload),
    onSuccess: (res) => {
      if (res.ok) {
        qc.invalidateQueries({ queryKey: ['get-properties'] });
        qc.invalidateQueries({ queryKey: ['get-property-by-id', String(res.data.id)] });
      }
    },
  });
};

export const useUpdatePropertyMutation = () => {
  const qc = useQueryClient();
  return useMutation<CreatePropertyResponse, Error, UpdatePropertyPayload>({
    mutationFn: (payload) => addPostApi.updateProperty(payload), // ← возвращает CreatePropertyResponse (union)
    onSuccess: (res) => {
      if (res.ok) {
        qc.invalidateQueries({ queryKey: ['get-properties'] });
        qc.invalidateQueries({ queryKey: ['get-property-by-id', String(res.data.id)] });
      }
    },
  });
};

export const useReorderPropertyPhotosMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, order }: { id: number | string; order: number[] }) =>
        addPostApi.reorderPhotos(id, order),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['get-properties'] });
      qc.invalidateQueries({ queryKey: ['get-property-by-id'] });
    },
  });
};

export const useDeletePropertyPhotoMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ propertyId, photoId }: { propertyId: number | string; photoId: number }) =>
        addPostApi.deletePropertyPhoto(propertyId, photoId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['get-properties'] });
      qc.invalidateQueries({ queryKey: ['get-property-by-id'] });
    },
  });
};