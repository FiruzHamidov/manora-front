'use client';

import { useEffect, useMemo } from 'react';
import {
  InfiniteData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { v4 as uuidv4 } from 'uuid';
import { messagingApi } from '@/services/messaging/api';
import { messagingKeys } from '@/services/messaging/queryKeys';
import {
  applyMessageToSession,
  flattenInfiniteMessages,
  mergeMessages,
  mergeSession,
  setMessagesCache,
  updateMessageStatus,
  updateSessionsCache,
} from '@/services/messaging/helpers';
import type {
  ChatKind,
  ChatMessage,
  ChatMessagesPage,
  ChatMessageStatusEvent,
  ChatSession,
  ChatSessionListFilters,
  CreateSupportSessionPayload,
  OptimisticChatMessage,
} from '@/services/messaging/types';

const DEFAULT_LIMIT = 50;

const updateSessionDetail = (
  queryClient: ReturnType<typeof useQueryClient>,
  kind: ChatKind,
  session: ChatSession
) => {
  queryClient.setQueryData(messagingKeys.session(kind, session.session_uuid), (current?: ChatSession) => ({
    ...current,
    ...session,
  }));
};

export const useDirectSessions = (filters?: ChatSessionListFilters, enabled = true) =>
  useQuery({
    queryKey: messagingKeys.sessions('direct'),
    queryFn: () => messagingApi.getDirectSessions(filters),
    enabled,
  });

export const useSupportSessions = (filters?: ChatSessionListFilters, enabled = true) =>
  useQuery({
    queryKey: messagingKeys.sessions('support'),
    queryFn: () => messagingApi.getSupportSessions(filters),
    enabled,
  });

export const useSupportQueue = (enabled = true) =>
  useQuery({
    queryKey: messagingKeys.queue(),
    queryFn: () => messagingApi.getSupportQueue(),
    enabled,
  });

export const useSupportSession = (sessionUuid?: string | null, enabled = true) =>
  useQuery({
    queryKey: sessionUuid ? messagingKeys.session('support', sessionUuid) : [...messagingKeys.all, 'session', 'support', 'idle'],
    queryFn: () => messagingApi.getSupportSession(sessionUuid as string),
    enabled: Boolean(sessionUuid) && enabled,
  });

export const useChatMessages = (kind: ChatKind, sessionUuid?: string | null) =>
  useInfiniteQuery({
    queryKey: sessionUuid
      ? messagingKeys.messages(kind, sessionUuid)
      : [...messagingKeys.all, 'messages', kind, 'idle'],
    enabled: Boolean(sessionUuid),
    initialPageParam: null as number | null,
    queryFn: ({ pageParam }) =>
      messagingApi.getMessages(kind, sessionUuid as string, {
        limit: DEFAULT_LIMIT,
        before_id: pageParam,
      }),
    getNextPageParam: (lastPage) =>
      lastPage.hasMore && lastPage.nextBeforeId ? lastPage.nextBeforeId : undefined,
  });

export const useCreateDirectSessionMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: messagingApi.createDirectSession,
    onSuccess: (session) => {
      updateSessionsCache(queryClient, 'direct', (sessions) => mergeSession(sessions, session));
      updateSessionDetail(queryClient, 'direct', session);
    },
  });
};

export const useCreateSupportSessionMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateSupportSessionPayload) => messagingApi.createSupportSession(payload),
    onSuccess: (session) => {
      updateSessionsCache(queryClient, 'support', (sessions) => mergeSession(sessions, session));
      updateSessionDetail(queryClient, 'support', session);
      queryClient.invalidateQueries({ queryKey: messagingKeys.queue() });
    },
  });
};

export const useSendMessageMutation = (
  kind: ChatKind,
  session?: ChatSession | null,
  currentUserId?: number
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (content: string) =>
      messagingApi.sendMessage(kind, session?.session_uuid as string, { content }),
    onMutate: async (content) => {
      if (!session?.session_uuid) return {};

      await queryClient.cancelQueries({
        queryKey: messagingKeys.messages(kind, session.session_uuid),
      });

      const optimisticMessage: OptimisticChatMessage = {
        id: -Date.now(),
        temp_id: uuidv4(),
        session_uuid: session.session_uuid,
        chat_session_id: session.id,
        sender_id: currentUserId ?? null,
        recipient_id: null,
        role: 'user',
        content,
        delivery_status: 'sent',
        created_at: new Date().toISOString(),
        optimistic: true,
      };

      queryClient.setQueryData<InfiniteData<ChatMessagesPage>>(
        messagingKeys.messages(kind, session.session_uuid),
        (current) => {
          if (!current) {
            return {
              pageParams: [null],
              pages: [{ data: [optimisticMessage], hasMore: false, nextBeforeId: optimisticMessage.id }],
            };
          }

          const pages = [...current.pages];
          const lastPage = pages[pages.length - 1] ?? {
            data: [],
            hasMore: false,
            nextBeforeId: null,
          };

          pages[pages.length - 1] = {
            ...lastPage,
            data: mergeMessages(lastPage.data as OptimisticChatMessage[], [optimisticMessage]),
          };

          return {
            ...current,
            pages,
          };
        }
      );

      updateSessionsCache(queryClient, kind, (sessions) =>
        applyMessageToSession(sessions, optimisticMessage)
      );

      return { optimisticMessage };
    },
    onSuccess: (message, _content, context) => {
      if (!session?.session_uuid) return;
      setMessagesCache(queryClient, kind, session.session_uuid, (messages) =>
        mergeMessages(
          messages.filter((item) => item.temp_id !== context?.optimisticMessage?.temp_id),
          [message]
        )
      );
      updateSessionsCache(queryClient, kind, (sessions) => applyMessageToSession(sessions, message));
    },
    onError: (_error, _content, context) => {
      if (!session?.session_uuid || !context?.optimisticMessage?.temp_id) return;
      setMessagesCache(queryClient, kind, session.session_uuid, (messages) =>
        messages.map((message) =>
          message.temp_id === context.optimisticMessage.temp_id
            ? { ...message, error: true, optimistic: false }
            : message
        )
      );
    },
  });
};

export const useMarkDeliveredMutation = (kind: ChatKind, sessionUuid?: string | null) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (messageIds: number[]) =>
      messagingApi.markDelivered(kind, sessionUuid as string, { message_ids: messageIds }),
    onSuccess: (_data, messageIds) => {
      if (!sessionUuid) return;
      const deliveredAt = new Date().toISOString();
      setMessagesCache(queryClient, kind, sessionUuid, (messages) =>
        messages.map((message) =>
          messageIds.includes(message.id)
            ? {
                ...message,
                delivery_status:
                  message.delivery_status === 'seen' ? message.delivery_status : 'delivered',
                delivered_at: message.delivered_at ?? deliveredAt,
              }
            : message
        )
      );
    },
  });
};

export const useMarkSeenMutation = (kind: ChatKind, sessionUuid?: string | null) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (messageIds: number[]) =>
      messagingApi.markSeen(kind, sessionUuid as string, { message_ids: messageIds }),
    onSuccess: (_data, messageIds) => {
      if (!sessionUuid) return;
      const seenAt = new Date().toISOString();
      setMessagesCache(queryClient, kind, sessionUuid, (messages) =>
        messages.map((message) =>
          messageIds.includes(message.id)
            ? {
                ...message,
                delivery_status: 'seen',
                delivered_at: message.delivered_at ?? seenAt,
                seen_at: message.seen_at ?? seenAt,
              }
            : message
        )
      );
    },
  });
};

export const useMarkReadMutation = (kind: ChatKind, sessionUuid?: string | null) =>
  useMutation({
    mutationFn: () => messagingApi.markRead(kind, sessionUuid as string),
  });

export const useAssignSupportSessionMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ sessionUuid, moderatorId }: { sessionUuid: string; moderatorId?: number }) =>
      messagingApi.assignSupportSession(sessionUuid, { moderator_id: moderatorId }),
    onSuccess: (session) => {
      updateSessionsCache(queryClient, 'support', (sessions) => mergeSession(sessions, session));
      updateSessionDetail(queryClient, 'support', session);
      queryClient.invalidateQueries({ queryKey: messagingKeys.queue() });
    },
  });
};

export const useCloseSupportSessionMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sessionUuid: string) => messagingApi.closeSupportSession(sessionUuid),
    onSuccess: (session) => {
      updateSessionsCache(queryClient, 'support', (sessions) => mergeSession(sessions, session));
      updateSessionDetail(queryClient, 'support', session);
      queryClient.invalidateQueries({ queryKey: messagingKeys.queue() });
    },
  });
};

export const useChatCacheSync = (kind: ChatKind, sessionUuid?: string | null) => {
  const queryClient = useQueryClient();

  return useMemo(
    () => ({
      onMessage(message: ChatMessage) {
        if (!sessionUuid || message.session_uuid !== sessionUuid) return;
        setMessagesCache(queryClient, kind, sessionUuid, (messages) => mergeMessages(messages, [message]));
        updateSessionsCache(queryClient, kind, (sessions) => applyMessageToSession(sessions, message));
      },
      onSession(session: ChatSession) {
        updateSessionsCache(queryClient, kind, (sessions) => mergeSession(sessions, session));
        updateSessionDetail(queryClient, kind, session);
      },
      onStatus(event: ChatMessageStatusEvent) {
        if (!sessionUuid || event.session_uuid !== sessionUuid) return;
        setMessagesCache(queryClient, kind, sessionUuid, (messages) =>
          updateMessageStatus(messages, event)
        );
      },
    }),
    [kind, queryClient, sessionUuid]
  );
};

export const useVisibleIncomingIds = (
  currentUserId: number | undefined,
  messagesData?: InfiniteData<ChatMessagesPage>
) =>
  useMemo(
    () =>
      flattenInfiniteMessages(messagesData).filter(
        (message) =>
          message.id > 0 &&
          message.sender_id !== currentUserId &&
          message.delivery_status === 'sent'
      ),
    [currentUserId, messagesData]
  );

export const useSeenIncomingIds = (
  currentUserId: number | undefined,
  messagesData?: InfiniteData<ChatMessagesPage>
) =>
  useMemo(
    () =>
      flattenInfiniteMessages(messagesData).filter(
        (message) =>
          message.id > 0 &&
          message.sender_id !== currentUserId &&
          message.delivery_status !== 'seen'
      ),
    [currentUserId, messagesData]
  );

export const useSessionAutoSync = (
  kind: ChatKind,
  sessionUuid: string | undefined,
  enabled: boolean
) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled || !sessionUuid) return;
    queryClient.invalidateQueries({ queryKey: messagingKeys.messages(kind, sessionUuid) });
    queryClient.invalidateQueries({ queryKey: messagingKeys.sessions(kind) });
  }, [enabled, kind, queryClient, sessionUuid]);
};
