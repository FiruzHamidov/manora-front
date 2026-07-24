import { axios } from '@/utils/axios';
import type { NotificationItem, NotificationsResponse } from './types';

export const notificationsApi = {
  list: async (params?: { is_read?: boolean; page?: number; per_page?: number }) => {
    const { data } = await axios.get<NotificationsResponse>('/notifications', { params });
    return data;
  },
  unreadCount: async () => {
    const { data } = await axios.get<{ unread_count: number }>('/notifications/unread-count');
    return data;
  },
  markRead: async (id: number) => {
    const { data } = await axios.patch<NotificationItem>(`/notifications/${id}/read`);
    return data;
  },
  markAllRead: async () => {
    const { data } = await axios.patch<{ updated: number }>('/notifications/read-all');
    return data;
  },
};
