import type { ChatKind } from '@/services/messaging/types';

export const messagingKeys = {
  all: ['messaging'] as const,
  sessions: (kind: ChatKind) => [...messagingKeys.all, 'sessions', kind] as const,
  queue: () => [...messagingKeys.all, 'queue'] as const,
  session: (kind: ChatKind, sessionUuid: string) =>
    [...messagingKeys.all, 'session', kind, sessionUuid] as const,
  messages: (kind: ChatKind, sessionUuid: string) =>
    [...messagingKeys.all, 'messages', kind, sessionUuid] as const,
};
