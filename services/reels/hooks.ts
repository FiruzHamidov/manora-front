import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { reelsApi } from '@/services/reels/api';
import { REEL_QUERY_KEYS } from '@/services/reels/queryKeys';
import type {
  CreateReelPayload,
  ReelFilters,
  UpdateReelPayload,
} from '@/services/reels/types';

export const useReels = (filters?: ReelFilters) =>
  useQuery({
    queryKey: REEL_QUERY_KEYS.list(filters),
    queryFn: () => reelsApi.list(filters),
  });

export const useReel = (id?: number | string) =>
  useQuery({
    queryKey: REEL_QUERY_KEYS.detail(id ?? 0),
    queryFn: () => reelsApi.getById(id as number | string),
    enabled: Boolean(id),
  });

export const useCreateReel = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateReelPayload) => reelsApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: REEL_QUERY_KEYS.all });
    },
  });
};

export const useUpdateReel = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: number | string; payload: UpdateReelPayload }) =>
      reelsApi.update(id, payload),
    onSuccess: (reel) => {
      queryClient.invalidateQueries({ queryKey: REEL_QUERY_KEYS.all });
      queryClient.setQueryData(REEL_QUERY_KEYS.detail(reel.id), reel);
    },
  });
};

export const useDeleteReel = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number | string) => reelsApi.remove(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: REEL_QUERY_KEYS.all });
      queryClient.removeQueries({ queryKey: REEL_QUERY_KEYS.detail(id) });
    },
  });
};
