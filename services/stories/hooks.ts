import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { storiesApi } from '@/services/stories/api';
import type { StoryStatus } from '@/services/stories/types';

const storyKeys = {
  all: ['stories'] as const,
  public: (limit: number) => ['stories', 'public', limit] as const,
  my: (status?: StoryStatus | 'history') => ['stories', 'my', status ?? 'all'] as const,
  moderation: (status?: StoryStatus) => ['stories', 'moderation', status ?? 'all'] as const,
};

export const usePublicStories = (limit: number = 20) =>
  useQuery({
    queryKey: storyKeys.public(limit),
    queryFn: () => storiesApi.publicList(limit),
    staleTime: 60_000,
  });

export const useMyStories = (status?: StoryStatus | 'history') =>
  useQuery({
    queryKey: storyKeys.my(status),
    queryFn: () => storiesApi.myList(status),
  });

export const useUploadStory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: FormData) => storiesApi.upload(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: storyKeys.all }),
  });
};

export const useChangeStoryStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, action }: { id: number; action: 'archive' | 'republish' }) =>
      storiesApi.changeStatus(id, action),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: storyKeys.all }),
  });
};

export const useModerationStories = (status?: StoryStatus) =>
  useQuery({
    queryKey: storyKeys.moderation(status),
    queryFn: () => storiesApi.moderationList(status),
  });

export const useModerateStory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      action,
      reason,
    }: {
      id: number;
      action: 'hide' | 'archive' | 'republish';
      reason?: string;
    }) => storiesApi.moderate(id, action, reason),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: storyKeys.all }),
  });
};
