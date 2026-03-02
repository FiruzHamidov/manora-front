import { axios, call } from '@/services/_shared/http';
import type {
  CreateCrmStagePayload,
  CrmRequestItem,
  CrmRequestsFilters,
  CrmRequestsResponse,
  CrmStage,
  MoveCrmRequestPayload,
  ReorderCrmStagesPayload,
  UpdateCrmRequestPayload,
  UpdateCrmStagePayload,
} from '@/services/crm/types';

function cleanParams(filters?: CrmRequestsFilters) {
  if (!filters) return undefined;

  return Object.fromEntries(
    Object.entries(filters).filter(([, value]) => value !== undefined && value !== null && value !== '')
  );
}

export const crmApi = {
  listStages: () => call(async () => await axios.get<CrmStage[]>('/crm/stages')),
  getStage: (id: number) => call(async () => await axios.get<CrmStage>(`/crm/stages/${id}`)),
  createStage: (payload: CreateCrmStagePayload) =>
    call(async () => await axios.post<CrmStage>('/crm/stages', payload)),
  updateStage: ({ id, ...payload }: UpdateCrmStagePayload & { id: number }) =>
    call(async () => await axios.patch<CrmStage>(`/crm/stages/${id}`, payload)),
  deleteStage: (id: number) =>
    call(async () => await axios.delete<{ message: string }>(`/crm/stages/${id}`)),
  reorderStages: (payload: ReorderCrmStagesPayload) =>
    call(async () => await axios.post<CrmStage[]>('/crm/stages/reorder', payload)),

  listRequests: (filters?: CrmRequestsFilters) =>
    call(
      async () =>
        await axios.get<CrmRequestsResponse>('/crm/requests', {
          params: cleanParams(filters),
        })
    ),
  getRequest: (id: number) => call(async () => await axios.get<CrmRequestItem>(`/crm/requests/${id}`)),
  updateRequest: ({ id, ...payload }: UpdateCrmRequestPayload & { id: number }) =>
    call(async () => await axios.patch<CrmRequestItem>(`/crm/requests/${id}`, payload)),
  moveRequest: ({ id, ...payload }: MoveCrmRequestPayload & { id: number }) =>
    call(async () => await axios.post<CrmRequestItem>(`/crm/requests/${id}/move`, payload)),
};
