import type { User } from '@/services/login/types';

export type ChatKind = 'direct' | 'support';
export type ChatDeliveryStatus = 'sent' | 'delivered' | 'seen';
export type ChatSessionStatus = 'open' | 'assigned' | 'closed';
export type ChatParticipantRole = 'user' | 'moderator' | 'assistant' | 'system' | 'tool';

export type ChatMessage = {
  id: number;
  chat_session_id?: number;
  session_uuid: string;
  sender_id: number | null;
  recipient_id: number | null;
  role: ChatParticipantRole;
  content: string;
  delivery_status: ChatDeliveryStatus;
  delivered_at?: string | null;
  seen_at?: string | null;
  created_at: string;
  updated_at?: string;
};

export type ChatSession = {
  id?: number;
  session_uuid: string;
  chat_type: ChatKind;
  status?: ChatSessionStatus;
  title?: string | null;
  topic?: string | null;
  priority?: number | null;
  assigned_moderator_id?: number | null;
  assigned_at?: string | null;
  closed_at?: string | null;
  last_message_at?: string | null;
  last_message?: ChatMessage | null;
  unread_count?: number;
  participant?: User | null;
  participants?: User[];
  creator?: User | null;
  moderator?: User | null;
  user?: User | null;
  updated_at?: string;
  created_at?: string;
};

export type ChatMessageStatusEvent = {
  message_id: number;
  session_uuid: string;
  chat_session_id?: number;
  delivery_status: ChatDeliveryStatus;
  delivered_at?: string | null;
  seen_at?: string | null;
};

export type ChatMessageEvent = ChatMessage;

export type ChatSessionEvent = ChatSession;

export type ChatMessagesPage = {
  data: ChatMessage[];
  nextBeforeId: number | null;
  hasMore: boolean;
};

export type CreateDirectSessionPayload = {
  user_id: number;
};

export type CreateSupportSessionPayload = {
  message: string;
  topic?: string;
  priority?: number;
};

export type SendChatMessagePayload = {
  content: string;
};

export type MarkMessagesPayload = {
  message_ids: number[];
};

export type AssignSupportSessionPayload = {
  moderator_id?: number;
};

export type ChatSessionListFilters = {
  status?: string;
};

export type ChatQueueFilter = 'waiting' | 'my' | 'all';

export type OptimisticChatMessage = ChatMessage & {
  optimistic?: boolean;
  temp_id?: string;
  error?: boolean;
};
