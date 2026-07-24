'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from './api';

const notificationKeys = {
  all: ['notifications'] as const,
  list: (isRead?: boolean) => ['notifications', 'list', isRead] as const,
  unread: ['notifications', 'unread-count'] as const,
};

export const useNotificationsQuery = (isRead?: boolean, enabled = true) =>
  useQuery({
    queryKey: notificationKeys.list(isRead),
    queryFn: () => notificationsApi.list({ is_read: isRead, per_page: 50 }),
    enabled,
    staleTime: 30_000,
  });

export const useUnreadNotificationsCountQuery = (enabled = true) =>
  useQuery({
    queryKey: notificationKeys.unread,
    queryFn: notificationsApi.unreadCount,
    enabled,
    refetchInterval: enabled ? 60_000 : false,
    staleTime: 30_000,
  });

export const useMarkNotificationReadMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: notificationsApi.markRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: notificationKeys.all }),
  });
};

export const useMarkAllNotificationsReadMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: notificationsApi.markAllRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: notificationKeys.all }),
  });
};
