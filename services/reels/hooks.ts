import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { reelsApi } from '@/services/reels/api';
import { REEL_QUERY_KEYS } from '@/services/reels/queryKeys';
import type {
  CreateReelPayload,
  ReelFilters,
  UpdateReelPayload,
  ReelPublishStatus,
  ReelModerationAction,
} from '@/services/reels/types';

export const useReels = (filters?: ReelFilters) =>
  useQuery({
    queryKey: REEL_QUERY_KEYS.list(filters),
    queryFn: () => reelsApi.list(filters),
  });

export const useMyReels = (filters?: Pick<ReelFilters, 'status' | 'page' | 'per_page'>) =>
  useQuery({
    queryKey: REEL_QUERY_KEYS.myList(filters),
    queryFn: () => reelsApi.myList(filters),
  });

export const useModerationReels = (filters?: Pick<ReelFilters, 'status' | 'page' | 'per_page'>) =>
  useQuery({
    queryKey: REEL_QUERY_KEYS.moderationList(filters),
    queryFn: () => reelsApi.moderationList(filters),
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

export const useUploadReel = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: FormData) => reelsApi.upload(payload),
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

export const usePublishReel = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: number | string;
      status: ReelPublishStatus;
    }) => reelsApi.publish(id, status),
    onSuccess: (reel) => {
      queryClient.invalidateQueries({ queryKey: REEL_QUERY_KEYS.all });
      queryClient.setQueryData(REEL_QUERY_KEYS.detail(reel.id), reel);
    },
  });
};

export const useModerateReel = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      action,
      reason,
    }: {
      id: number | string;
      action: ReelModerationAction;
      reason?: string;
    }) => reelsApi.moderate(id, action, reason),
    onSuccess: (reel) => {
      queryClient.invalidateQueries({ queryKey: REEL_QUERY_KEYS.all });
      queryClient.setQueryData(REEL_QUERY_KEYS.detail(reel.id), reel);
    },
  });
};
