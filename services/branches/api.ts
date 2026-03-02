import { axios, call } from '@/services/_shared/http';
import type { Branch, BranchPayload } from '@/services/branches/types';

function toFormData(payload: BranchPayload) {
  const fd = new FormData();
  fd.append('name', payload.name);

  if (payload.lat !== undefined) fd.append('lat', String(payload.lat));
  if (payload.lng !== undefined) fd.append('lng', String(payload.lng));
  if (payload.landmark) fd.append('landmark', payload.landmark);
  if (payload.photo) fd.append('photo', payload.photo);

  return fd;
}

export const branchesApi = {
  list: () => call(async () => await axios.get<Branch[]>('/branches')),
  get: (id: number) => call(async () => await axios.get<Branch>(`/branches/${id}`)),
  create: (payload: BranchPayload) =>
    call(async () =>
      await axios.post<Branch>('/branches', toFormData(payload), {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    ),
  update: (id: number, payload: BranchPayload) =>
    call(async () =>
      await axios.post<Branch>(`/branches/${id}?_method=PUT`, toFormData(payload), {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    ),
  remove: (id: number) =>
    call(async () => await axios.delete<{ message: string }>(`/branches/${id}`)),
};
