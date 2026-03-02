'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { branchesApi } from '@/services/branches/api';
import type { BranchPayload } from '@/services/branches/types';

export function useBranches() {
  return useQuery({
    queryKey: ['branches'],
    queryFn: branchesApi.list,
  });
}

export function useBranch(id?: number) {
  return useQuery({
    queryKey: ['branches', id],
    queryFn: () => branchesApi.get(id as number),
    enabled: !!id,
  });
}

export function useCreateBranch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: BranchPayload) => branchesApi.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['branches'] });
    },
  });
}

export function useUpdateBranch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: BranchPayload }) =>
      branchesApi.update(id, payload),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['branches'] });
      qc.invalidateQueries({ queryKey: ['branches', vars.id] });
    },
  });
}

export function useDeleteBranch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => branchesApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['branches'] });
    },
  });
}
