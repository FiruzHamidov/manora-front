import { axios, call } from '@/services/_shared/http';
import type { StoriesListResponse, Story, StoryStatus } from '@/services/stories/types';

function normalize(payload: StoriesListResponse | Story[]): Story[] {
  if (Array.isArray(payload)) return payload;
  return Array.isArray(payload.data) ? payload.data : [];
}

export const storiesApi = {
  publicList: (limit: number = 20) =>
    call(async () =>
      await axios.get<StoriesListResponse>('/stories', {
        params: { scope: 'all', limit },
      })
    ).then(normalize),
  markViewed: (
    storyId: number,
    payload: {
      story_item_id: number;
      viewer_fingerprint?: string;
      watch_seconds?: number;
    }
  ) =>
    call(async () => await axios.post(`/stories/${storyId}/view`, payload)),
  myList: (status?: StoryStatus | 'history') =>
    call(async () =>
      await axios.get<StoriesListResponse>('/my/stories', {
        params: status ? { status, per_page: 50 } : { per_page: 50 },
      })
    ).then(normalize),
  upload: (payload: FormData) =>
    call(async () => await axios.post<Story>('/stories', payload)),
  changeStatus: (id: number, action: 'archive' | 'republish') =>
    call(async () => await axios.patch<Story>(`/stories/${id}/status`, { action })),
  moderationList: (status?: StoryStatus) =>
    call(async () =>
      await axios.get<StoriesListResponse>('/admin/stories', {
        params: status ? { status, per_page: 100 } : { per_page: 100 },
      })
    ).then(normalize),
  moderate: (id: number, action: 'hide' | 'archive' | 'republish', reason?: string) =>
    call(async () =>
      await axios.patch<Story>(`/admin/stories/${id}/status`, { action, reason })
    ),
};
