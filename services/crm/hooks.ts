'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { crmApi } from '@/services/crm/api';
import type {
  CreateCrmStagePayload,
  CrmRequestsFilters,
  MoveCrmRequestPayload,
  ReorderCrmStagesPayload,
  UpdateCrmRequestPayload,
  UpdateCrmStagePayload,
} from '@/services/crm/types';

export const CRM_QUERY_KEYS = {
  stages: ['crm', 'stages'] as const,
  requests: (filters?: CrmRequestsFilters) => ['crm', 'requests', filters ?? {}] as const,
  request: (id?: number) => ['crm', 'request', id] as const,
};

export function useCrmStages() {
  return useQuery({
    queryKey: CRM_QUERY_KEYS.stages,
    queryFn: crmApi.listStages,
  });
}

export function useCrmRequests(filters?: CrmRequestsFilters, enabled: boolean = true) {
  return useQuery({
    queryKey: CRM_QUERY_KEYS.requests(filters),
    queryFn: () => crmApi.listRequests(filters),
    enabled,
    placeholderData: (previousData) => previousData,
  });
}

export function useCrmRequest(id?: number) {
  return useQuery({
    queryKey: CRM_QUERY_KEYS.request(id),
    queryFn: () => crmApi.getRequest(id as number),
    enabled: Boolean(id),
  });
}

export function useUpdateCrmRequest() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...payload }: UpdateCrmRequestPayload & { id: number }) =>
      crmApi.updateRequest({ id, ...payload }),
    onSuccess: (data) => {
      qc.setQueryData(CRM_QUERY_KEYS.request(data.id), data);
      qc.invalidateQueries({ queryKey: ['crm', 'requests'] });
      qc.invalidateQueries({ queryKey: CRM_QUERY_KEYS.stages });
    },
  });
}

export function useMoveCrmRequest() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...payload }: MoveCrmRequestPayload & { id: number }) =>
      crmApi.moveRequest({ id, ...payload }),
    onSuccess: (data) => {
      qc.setQueryData(CRM_QUERY_KEYS.request(data.id), data);
      qc.invalidateQueries({ queryKey: ['crm', 'requests'] });
      qc.invalidateQueries({ queryKey: CRM_QUERY_KEYS.stages });
    },
  });
}

export function useCreateCrmStage() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateCrmStagePayload) => crmApi.createStage(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: CRM_QUERY_KEYS.stages });
      qc.invalidateQueries({ queryKey: ['crm', 'requests'] });
    },
  });
}

export function useUpdateCrmStage() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...payload }: UpdateCrmStagePayload & { id: number }) =>
      crmApi.updateStage({ id, ...payload }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: CRM_QUERY_KEYS.stages });
      qc.invalidateQueries({ queryKey: ['crm', 'requests'] });
    },
  });
}

export function useDeleteCrmStage() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => crmApi.deleteStage(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: CRM_QUERY_KEYS.stages });
      qc.invalidateQueries({ queryKey: ['crm', 'requests'] });
    },
  });
}

export function useReorderCrmStages() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: ReorderCrmStagesPayload) => crmApi.reorderStages(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: CRM_QUERY_KEYS.stages });
      qc.invalidateQueries({ queryKey: ['crm', 'requests'] });
    },
  });
}
