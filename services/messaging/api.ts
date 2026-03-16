import { axios } from '@/utils/axios';
import type {
  AssignSupportSessionPayload,
  ChatKind,
  ChatMessage,
  ChatMessagesPage,
  ChatSession,
  ChatSessionListFilters,
  CreateDirectSessionPayload,
  CreateSupportSessionPayload,
  MarkMessagesPayload,
  SendChatMessagePayload,
} from '@/services/messaging/types';

type CollectionResponse<T> = T[] | { data?: T[] } | { sessions?: T[] } | { messages?: T[] };

const getBasePath = (kind: ChatKind) =>
  kind === 'direct' ? '/direct-chat' : '/support-chat';

const unwrapCollection = <T>(payload: CollectionResponse<T> | null | undefined): T[] => {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if ('data' in payload && Array.isArray(payload.data)) return payload.data;
  if ('sessions' in payload && Array.isArray(payload.sessions)) return payload.sessions;
  if ('messages' in payload && Array.isArray(payload.messages)) return payload.messages;
  return [];
};

const sortMessagesAsc = (messages: ChatMessage[]) =>
  [...messages].sort((a, b) => {
    if (a.id !== b.id) return a.id - b.id;
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
  });

export const messagingApi = {
  async getDirectSessions(filters?: ChatSessionListFilters): Promise<ChatSession[]> {
    const { data } = await axios.get<CollectionResponse<ChatSession>>('/direct-chat/sessions', {
      params: filters,
    });
    return unwrapCollection(data);
  },

  async createDirectSession(payload: CreateDirectSessionPayload): Promise<ChatSession> {
    const { data } = await axios.post<ChatSession>('/direct-chat/sessions', payload);
    return data;
  },

  async getSupportSessions(filters?: ChatSessionListFilters): Promise<ChatSession[]> {
    const { data } = await axios.get<CollectionResponse<ChatSession>>('/support-chat/sessions', {
      params: filters,
    });
    return unwrapCollection(data);
  },

  async getSupportQueue(): Promise<ChatSession[]> {
    const { data } = await axios.get<CollectionResponse<ChatSession>>('/support-chat/queue');
    return unwrapCollection(data);
  },

  async createSupportSession(payload: CreateSupportSessionPayload): Promise<ChatSession> {
    const { data } = await axios.post<ChatSession>('/support-chat/sessions', payload);
    return data;
  },

  async getSupportSession(sessionUuid: string): Promise<ChatSession> {
    const { data } = await axios.get<ChatSession>(`/support-chat/sessions/${sessionUuid}`);
    return data;
  },

  async getMessages(
    kind: ChatKind,
    sessionUuid: string,
    params?: { limit?: number; before_id?: number | null }
  ): Promise<ChatMessagesPage> {
    const { data } = await axios.get<CollectionResponse<ChatMessage>>(
      `${getBasePath(kind)}/sessions/${sessionUuid}/messages`,
      {
        params: {
          limit: params?.limit ?? 50,
          ...(params?.before_id ? { before_id: params.before_id } : {}),
        },
      }
    );

    const messages = sortMessagesAsc(unwrapCollection(data));
    const oldestMessage = messages[0];

    return {
      data: messages,
      nextBeforeId: oldestMessage?.id ?? null,
      hasMore: messages.length >= (params?.limit ?? 50),
    };
  },

  async sendMessage(
    kind: ChatKind,
    sessionUuid: string,
    payload: SendChatMessagePayload
  ): Promise<ChatMessage> {
    const { data } = await axios.post<ChatMessage>(
      `${getBasePath(kind)}/sessions/${sessionUuid}/messages`,
      payload
    );
    return data;
  },

  async markRead(kind: ChatKind, sessionUuid: string): Promise<void> {
    await axios.post(`${getBasePath(kind)}/sessions/${sessionUuid}/read`);
  },

  async markDelivered(
    kind: ChatKind,
    sessionUuid: string,
    payload: MarkMessagesPayload
  ): Promise<void> {
    if (!payload.message_ids.length) return;
    await axios.post(`${getBasePath(kind)}/sessions/${sessionUuid}/delivered`, payload);
  },

  async markSeen(kind: ChatKind, sessionUuid: string, payload: MarkMessagesPayload): Promise<void> {
    if (!payload.message_ids.length) return;
    await axios.post(`${getBasePath(kind)}/sessions/${sessionUuid}/seen`, payload);
  },

  async assignSupportSession(
    sessionUuid: string,
    payload: AssignSupportSessionPayload
  ): Promise<ChatSession> {
    const { data } = await axios.post<ChatSession>(
      `/support-chat/sessions/${sessionUuid}/assign`,
      payload
    );
    return data;
  },

  async closeSupportSession(sessionUuid: string): Promise<ChatSession> {
    const { data } = await axios.post<ChatSession>(`/support-chat/sessions/${sessionUuid}/close`);
    return data;
  },
};
