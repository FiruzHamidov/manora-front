import type { InfiniteData, QueryClient } from '@tanstack/react-query';
import type {
  ChatKind,
  ChatMessage,
  ChatMessagesPage,
  ChatMessageStatusEvent,
  ChatSession,
  OptimisticChatMessage,
} from '@/services/messaging/types';
import { messagingKeys } from '@/services/messaging/queryKeys';

const sameMessageFingerprint = (left: Partial<ChatMessage>, right: Partial<ChatMessage>) =>
  left.session_uuid === right.session_uuid &&
  left.sender_id === right.sender_id &&
  (left.content || '').trim() === (right.content || '').trim();

export const sortMessagesAsc = <T extends Partial<ChatMessage>>(messages: T[]) =>
  [...messages].sort((a, b) => {
    const aDate = new Date(a.created_at ?? 0).getTime();
    const bDate = new Date(b.created_at ?? 0).getTime();
    if ((a.id ?? 0) !== (b.id ?? 0)) return (a.id ?? 0) - (b.id ?? 0);
    return aDate - bDate;
  });

export const mergeMessages = (
  existing: OptimisticChatMessage[],
  incoming: ChatMessage[]
): OptimisticChatMessage[] => {
  const next = [...existing];

  for (const message of incoming) {
    const exactIndex = next.findIndex((item) => item.id === message.id);
    if (exactIndex >= 0) {
      next[exactIndex] = { ...next[exactIndex], ...message, optimistic: false, error: false };
      continue;
    }

    const optimisticIndex = next.findIndex(
      (item) =>
        item.optimistic &&
        sameMessageFingerprint(item, message) &&
        Math.abs(new Date(item.created_at).getTime() - new Date(message.created_at).getTime()) < 30_000
    );

    if (optimisticIndex >= 0) {
      next[optimisticIndex] = {
        ...next[optimisticIndex],
        ...message,
        optimistic: false,
        error: false,
      };
      continue;
    }

    next.push(message);
  }

  return sortMessagesAsc(next);
};

export const updateMessageStatus = (
  messages: OptimisticChatMessage[],
  event: ChatMessageStatusEvent
): OptimisticChatMessage[] =>
  messages.map((message) =>
    message.id === event.message_id
      ? {
          ...message,
          delivery_status: event.delivery_status,
          delivered_at: event.delivered_at ?? message.delivered_at,
          seen_at: event.seen_at ?? message.seen_at,
        }
      : message
  );

export const flattenInfiniteMessages = (
  data?: InfiniteData<ChatMessagesPage>
): OptimisticChatMessage[] => {
  if (!data) return [];
  return sortMessagesAsc(
    data.pages.flatMap((page) => page.data) as OptimisticChatMessage[]
  );
};

export const setMessagesCache = (
  queryClient: QueryClient,
  kind: ChatKind,
  sessionUuid: string,
  updater: (messages: OptimisticChatMessage[]) => OptimisticChatMessage[]
) => {
  queryClient.setQueryData<InfiniteData<ChatMessagesPage>>(
    messagingKeys.messages(kind, sessionUuid),
    (current) => {
      if (!current) return current;

      const pages = [...current.pages];
      const latest = pages[pages.length - 1];
      const older = pages.slice(0, -1);
      const currentMessages = flattenInfiniteMessages(current);
      const updatedMessages = updater(currentMessages);

      return {
        ...current,
        pages: [
          ...older,
          {
            ...(latest ?? { data: [], hasMore: false, nextBeforeId: null }),
            data: updatedMessages,
          },
        ],
      };
    }
  );
};

const getSessionTimestamp = (session: ChatSession) =>
  new Date(session.last_message_at ?? session.updated_at ?? session.created_at ?? 0).getTime();

export const mergeSession = (sessions: ChatSession[], session: ChatSession): ChatSession[] => {
  const next = [...sessions];
  const index = next.findIndex((item) => item.session_uuid === session.session_uuid);

  if (index >= 0) {
    next[index] = { ...next[index], ...session };
  } else {
    next.push(session);
  }

  return next.sort((a, b) => getSessionTimestamp(b) - getSessionTimestamp(a));
};

export const applyMessageToSession = (
  sessions: ChatSession[],
  message: ChatMessage
): ChatSession[] =>
  mergeSession(
    sessions,
    {
      session_uuid: message.session_uuid,
      chat_type: sessions.find((item) => item.session_uuid === message.session_uuid)?.chat_type ?? 'direct',
      last_message: message,
      last_message_at: message.created_at,
    }
  );

export const updateSessionsCache = (
  queryClient: QueryClient,
  kind: ChatKind,
  updater: (sessions: ChatSession[]) => ChatSession[]
) => {
  queryClient.setQueryData<ChatSession[]>(messagingKeys.sessions(kind), (current = []) => updater(current));
};
