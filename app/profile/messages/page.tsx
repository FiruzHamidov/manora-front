'use client';

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  Check,
  CheckCheck,
  LifeBuoy,
  MessageCircle,
  RefreshCw,
  Send,
  UserRound,
} from 'lucide-react';
import { useProfile } from '@/services/login/hooks';
import {
  useAssignSupportSessionMutation,
  useChatCacheSync,
  useChatMessages,
  useCloseSupportSessionMutation,
  useCreateDirectSessionMutation,
  useCreateSupportSessionMutation,
  useDirectSessions,
  useMarkDeliveredMutation,
  useMarkReadMutation,
  useMarkSeenMutation,
  useSeenIncomingIds,
  useSendMessageMutation,
  useSessionAutoSync,
  useSupportQueue,
  useSupportSessions,
  useVisibleIncomingIds,
} from '@/services/messaging/hooks';
import { flattenInfiniteMessages } from '@/services/messaging/helpers';
import { useSessionRealtime, useSupportModeratorsRealtime } from '@/services/messaging/realtime';
import type {
  ChatKind,
  ChatQueueFilter,
  ChatSession,
} from '@/services/messaging/types';
import { normalizeRoleSlug } from '@/constants/roles';
import showAxiosErrorToast from '@/utils/showAxiosErrorToast';

const SUPPORT_MODERATOR_ROLES = new Set(['moderator', 'admin', 'superadmin']);

const formatTime = (value?: string | null) =>
  value
    ? new Intl.DateTimeFormat('ru-RU', {
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date(value))
    : '';

const formatDateTime = (value?: string | null) =>
  value
    ? new Intl.DateTimeFormat('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date(value))
    : '';

const getSessionName = (session: ChatSession, currentUserId?: number) => {
  if (session.chat_type === 'support') {
    return session.topic?.trim() || 'Поддержка';
  }

  const participant =
    session.participant ||
    session.user ||
    session.creator ||
    session.participants?.find((candidate) => candidate.id !== currentUserId);

  return participant?.name || session.title || 'Личный чат';
};

const getSessionMeta = (session: ChatSession) => {
  if (session.chat_type === 'support') {
    if (session.status === 'assigned') return 'Назначен';
    if (session.status === 'closed') return 'Закрыт';
    return 'Ожидает';
  }

  return session.participant?.role?.name || 'Переписка';
};

const StatusIcon = ({
  status,
}: {
  status?: 'sent' | 'delivered' | 'seen';
}) => {
  if (status === 'seen') return <CheckCheck className="h-3.5 w-3.5 text-[#0A62FF]" />;
  if (status === 'delivered') return <CheckCheck className="h-3.5 w-3.5 text-[#98A2B3]" />;
  return <Check className="h-3.5 w-3.5 text-[#98A2B3]" />;
};

export default function MessagesPage() {
  const { data: currentUser, isLoading: isProfileLoading } = useProfile();
  const role = normalizeRoleSlug(currentUser?.role?.slug);
  const isModerator = SUPPORT_MODERATOR_ROLES.has(role);
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const tab = (searchParams.get('tab') as ChatKind | null) ?? 'direct';
  const sessionParam = searchParams.get('session');
  const userIdParam = searchParams.get('userId');
  const supportFilter = (searchParams.get('support_filter') as ChatQueueFilter | null) ?? 'waiting';

  const [messageInput, setMessageInput] = useState('');
  const [supportTopic, setSupportTopic] = useState('');
  const [supportMessage, setSupportMessage] = useState('');
  const [supportPriority, setSupportPriority] = useState(3);

  const isAuthorized = Boolean(currentUser?.id);

  const directSessionsQuery = useDirectSessions(undefined, isAuthorized);
  const supportSessionsQuery = useSupportSessions(undefined, isAuthorized);
  const supportQueueQuery = useSupportQueue(isAuthorized && isModerator);

  const directCreateMutation = useCreateDirectSessionMutation();
  const supportCreateMutation = useCreateSupportSessionMutation();
  const assignSupportMutation = useAssignSupportSessionMutation();
  const closeSupportMutation = useCloseSupportSessionMutation();

  const allDirectSessions = directSessionsQuery.data ?? [];
  const allSupportSessions = supportSessionsQuery.data ?? [];
  const supportQueue = supportQueueQuery.data ?? [];

  const supportSessions = useMemo(() => {
    if (!isModerator) return allSupportSessions;
    if (supportFilter === 'waiting') return supportQueue.filter((item) => item.status === 'open');
    if (supportFilter === 'my') {
      return allSupportSessions.filter(
        (item) => item.assigned_moderator_id === currentUser?.id
      );
    }
    return allSupportSessions;
  }, [allSupportSessions, currentUser?.id, isModerator, supportFilter, supportQueue]);

  const sessions = tab === 'support' ? supportSessions : allDirectSessions;
  const selectedSession =
    sessions.find((session) => session.session_uuid === sessionParam) ??
    (sessionParam && tab === 'support'
      ? allSupportSessions.find((session) => session.session_uuid === sessionParam)
      : undefined) ??
    null;

  const messagesQuery = useChatMessages(tab, selectedSession?.session_uuid);
  const messages = flattenInfiniteMessages(messagesQuery.data);

  const sendMessageMutation = useSendMessageMutation(tab, selectedSession, currentUser?.id);
  const deliveredMutation = useMarkDeliveredMutation(tab, selectedSession?.session_uuid);
  const seenMutation = useMarkSeenMutation(tab, selectedSession?.session_uuid);
  const readMutation = useMarkReadMutation(tab, selectedSession?.session_uuid);

  const visibleIncoming = useVisibleIncomingIds(currentUser?.id, messagesQuery.data);
  const seenIncoming = useSeenIncomingIds(currentUser?.id, messagesQuery.data);

  const { onMessage, onSession, onStatus } = useChatCacheSync(tab, selectedSession?.session_uuid);

  useSessionRealtime({
    kind: tab,
    sessionUuid: selectedSession?.session_uuid,
    onMessage,
    onSessionUpdated: onSession,
    onStatusUpdated: onStatus,
    onReconnect: () => {
      messagesQuery.refetch();
      if (tab === 'support') supportSessionsQuery.refetch();
      if (tab === 'direct') directSessionsQuery.refetch();
    },
  });

  useSupportModeratorsRealtime(
    isModerator,
    () => {
      supportQueueQuery.refetch();
      supportSessionsQuery.refetch();
    },
    () => {
      supportQueueQuery.refetch();
      supportSessionsQuery.refetch();
    }
  );

  useSessionAutoSync(tab, selectedSession?.session_uuid, Boolean(selectedSession?.session_uuid));

  useEffect(() => {
    if (!selectedSession?.session_uuid || !visibleIncoming.length) return;
    const ids = visibleIncoming.map((item) => item.id);
    deliveredMutation.mutate(ids, {
      onSuccess: () => {
        readMutation.mutate();
      },
    });
  }, [deliveredMutation, readMutation, selectedSession?.session_uuid, visibleIncoming]);

  useEffect(() => {
    if (!selectedSession?.session_uuid || !seenIncoming.length) return;

    const markSeen = () => {
      if (document.visibilityState !== 'visible') return;
      seenMutation.mutate(
        seenIncoming.map((item) => item.id),
        {
          onSuccess: () => readMutation.mutate(),
        }
      );
    };

    markSeen();
    document.addEventListener('visibilitychange', markSeen);
    window.addEventListener('focus', markSeen);

    return () => {
      document.removeEventListener('visibilitychange', markSeen);
      window.removeEventListener('focus', markSeen);
    };
  }, [readMutation, seenIncoming, seenMutation, selectedSession?.session_uuid]);

  useEffect(() => {
    if (!sessions.length || selectedSession || sessionParam) return;

    const params = new URLSearchParams(searchParams.toString());
    params.set('session', sessions[0].session_uuid);
    router.replace(`${pathname}?${params.toString()}`);
  }, [pathname, router, searchParams, selectedSession, sessionParam, sessions]);

  useEffect(() => {
    if (!currentUser?.id || tab !== 'direct' || !userIdParam || sessionParam) return;
    const targetUserId = Number(userIdParam);
    if (!Number.isFinite(targetUserId) || targetUserId === currentUser.id) return;

    const existing = allDirectSessions.find(
      (session) =>
        session.participant?.id === targetUserId ||
        session.user?.id === targetUserId ||
        session.creator?.id === targetUserId ||
        session.participants?.some((participant) => participant.id === targetUserId)
    );

    if (existing) {
      const params = new URLSearchParams(searchParams.toString());
      params.set('session', existing.session_uuid);
      router.replace(`${pathname}?${params.toString()}`);
      return;
    }

    directCreateMutation.mutate(
      { user_id: targetUserId },
      {
        onSuccess: (session) => {
          const params = new URLSearchParams(searchParams.toString());
          params.set('session', session.session_uuid);
          router.replace(`${pathname}?${params.toString()}`);
        },
        onError: (error) => showAxiosErrorToast(error, 'Не удалось открыть чат'),
      }
    );
  }, [
    allDirectSessions,
    currentUser?.id,
    directCreateMutation,
    pathname,
    router,
    searchParams,
    sessionParam,
    tab,
    userIdParam,
  ]);

  const listLoading =
    tab === 'support'
      ? supportSessionsQuery.isLoading || (isModerator && supportFilter === 'waiting' && supportQueueQuery.isLoading)
      : directSessionsQuery.isLoading;
  const listError =
    tab === 'support'
      ? supportSessionsQuery.error || (isModerator && supportFilter === 'waiting' ? supportQueueQuery.error : null)
      : directSessionsQuery.error;

  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const element = listRef.current;
    if (!element) return;
    element.scrollTop = element.scrollHeight;
  }, [selectedSession?.session_uuid]);

  useEffect(() => {
    const element = listRef.current;
    if (!element) return;
    element.scrollTo({ top: element.scrollHeight, behavior: 'smooth' });
  }, [messages.length]);

  const submitMessage = async (event: FormEvent) => {
    event.preventDefault();
    const value = messageInput.trim();
    if (!value || !selectedSession) return;

    try {
      await sendMessageMutation.mutateAsync(value);
      setMessageInput('');
    } catch (error) {
      showAxiosErrorToast(error, 'Не удалось отправить сообщение');
    }
  };

  const createSupportSession = async (event: FormEvent) => {
    event.preventDefault();
    const message = supportMessage.trim();
    if (!message) return;

    try {
      const session = await supportCreateMutation.mutateAsync({
        message,
        topic: supportTopic.trim() || undefined,
        priority: supportPriority,
      });
      setSupportMessage('');
      setSupportTopic('');
      const params = new URLSearchParams(searchParams.toString());
      params.set('tab', 'support');
      params.set('session', session.session_uuid);
      router.replace(`${pathname}?${params.toString()}`);
    } catch (error) {
      showAxiosErrorToast(error, 'Не удалось создать чат поддержки');
    }
  };

  const selectSession = (session: ChatSession) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', session.chat_type);
    params.set('session', session.session_uuid);
    router.replace(`${pathname}?${params.toString()}`);
  };

  const switchTab = (nextTab: ChatKind) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', nextTab);
    params.delete('session');
    router.replace(`${pathname}?${params.toString()}`);
  };

  const switchSupportFilter = (nextFilter: ChatQueueFilter) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', 'support');
    params.set('support_filter', nextFilter);
    params.delete('session');
    router.replace(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[360px_minmax(0,1fr)]">
      {!isProfileLoading && !isAuthorized ? (
        <section className="rounded-[26px] bg-white p-10 text-center shadow-[0_1px_2px_rgba(16,24,40,0.04)] lg:col-span-2">
          <h1 className="text-2xl font-bold text-[#101828]">Сообщения доступны после входа</h1>
          <p className="mt-2 text-sm text-[#667085]">
            Авторизуйтесь, чтобы писать владельцам объявлений и обращаться в поддержку.
          </p>
          <button
            type="button"
            onClick={() => window.dispatchEvent(new Event('open-login-modal'))}
            className="mt-5 rounded-xl bg-[#0036A5] px-5 py-3 text-sm font-medium text-white"
          >
            Войти
          </button>
        </section>
      ) : null}
      {isProfileLoading || isAuthorized ? (
        <>
      <section className="rounded-[26px] bg-white p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-[#101828]">Сообщения</h1>
            <p className="mt-1 text-sm text-[#667085]">
              Личные диалоги и переписка с поддержкой.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              if (tab === 'support') {
                supportSessionsQuery.refetch();
                supportQueueQuery.refetch();
              } else {
                directSessionsQuery.refetch();
              }
            }}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#D0D5DD] text-[#344054]"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2 rounded-2xl bg-[#F2F4F7] p-1">
          <button
            type="button"
            onClick={() => switchTab('direct')}
            className={`rounded-2xl px-4 py-2 text-sm font-medium ${
              tab === 'direct' ? 'bg-white text-[#0B43B8] shadow-sm' : 'text-[#667085]'
            }`}
          >
            Личные
          </button>
          <button
            type="button"
            onClick={() => switchTab('support')}
            className={`rounded-2xl px-4 py-2 text-sm font-medium ${
              tab === 'support' ? 'bg-white text-[#0B43B8] shadow-sm' : 'text-[#667085]'
            }`}
          >
            Поддержка
          </button>
        </div>

        {tab === 'support' && isModerator ? (
          <div className="mt-3 flex gap-2">
            {(['waiting', 'my', 'all'] as ChatQueueFilter[]).map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => switchSupportFilter(filter)}
                className={`rounded-full px-3 py-1.5 text-sm ${
                  supportFilter === filter
                    ? 'bg-[#E8F0FF] text-[#0B43B8]'
                    : 'bg-[#F8FAFC] text-[#667085]'
                }`}
              >
                {filter === 'waiting' ? 'Waiting' : filter === 'my' ? 'My' : 'All'}
              </button>
            ))}
          </div>
        ) : null}

        {tab === 'support' && !isModerator ? (
          <form onSubmit={createSupportSession} className="mt-4 rounded-[22px] border border-[#EAECF0] bg-[#FCFCFD] p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-[#344054]">
              <LifeBuoy className="h-4 w-4 text-[#0B43B8]" />
              Новый чат поддержки
            </div>
            <input
              value={supportTopic}
              onChange={(event) => setSupportTopic(event.target.value)}
              placeholder="Тема (необязательно)"
              className="mt-3 h-11 w-full rounded-xl border border-[#D0D5DD] px-3 text-sm outline-none focus:border-[#0B43B8]"
            />
            <textarea
              value={supportMessage}
              onChange={(event) => setSupportMessage(event.target.value)}
              placeholder="Опишите ваш вопрос"
              rows={3}
              className="mt-3 w-full rounded-xl border border-[#D0D5DD] px-3 py-3 text-sm outline-none focus:border-[#0B43B8]"
            />
            <div className="mt-3 flex items-center gap-3">
              <select
                value={supportPriority}
                onChange={(event) => setSupportPriority(Number(event.target.value))}
                className="h-11 rounded-xl border border-[#D0D5DD] px-3 text-sm outline-none focus:border-[#0B43B8]"
              >
                {[1, 2, 3, 4, 5].map((priority) => (
                  <option key={priority} value={priority}>
                    Приоритет {priority}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                disabled={supportCreateMutation.isPending}
                className="inline-flex h-11 items-center justify-center rounded-xl bg-[#0036A5] px-4 text-sm font-medium text-white disabled:opacity-60"
              >
                Создать чат
              </button>
            </div>
          </form>
        ) : null}

        <div className="mt-5 space-y-2">
          {listLoading ? <div className="rounded-2xl bg-[#F8FAFC] px-4 py-8 text-center text-sm text-[#667085]">Загрузка чатов...</div> : null}
          {!listLoading && listError ? (
            <div className="rounded-2xl bg-[#FEF3F2] px-4 py-8 text-center text-sm text-[#B42318]">
              Не удалось загрузить список чатов.
            </div>
          ) : null}
          {!listLoading && !listError && sessions.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#D0D5DD] px-4 py-8 text-center text-sm text-[#667085]">
              {tab === 'support'
                ? 'Пока нет чатов поддержки.'
                : 'У вас пока нет личных диалогов.'}
            </div>
          ) : null}

          {!listLoading &&
            !listError &&
            sessions.map((session) => {
              const active = session.session_uuid === selectedSession?.session_uuid;
              return (
                <button
                  key={session.session_uuid}
                  type="button"
                  onClick={() => selectSession(session)}
                  className={`w-full rounded-[22px] border px-4 py-3 text-left transition ${
                    active
                      ? 'border-[#B2CCFF] bg-[#EEF4FF]'
                      : 'border-[#EAECF0] bg-white hover:border-[#D0D5DD]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-[#101828]">
                        {getSessionName(session, currentUser?.id)}
                      </div>
                      <div className="mt-1 text-xs text-[#667085]">{getSessionMeta(session)}</div>
                    </div>
                    <div className="text-xs text-[#667085]">{formatTime(session.last_message_at)}</div>
                  </div>
                  <div className="mt-2 truncate text-sm text-[#667085]">
                    {session.last_message?.content || 'Нет сообщений'}
                  </div>
                </button>
              );
            })}
        </div>
      </section>

      <section className="flex min-h-[720px] flex-col rounded-[26px] bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
        {selectedSession ? (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#EAECF0] px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#E8F0FF] text-[#0B43B8]">
                  {selectedSession.chat_type === 'support' ? (
                    <LifeBuoy className="h-5 w-5" />
                  ) : (
                    <UserRound className="h-5 w-5" />
                  )}
                </div>
                <div>
                  <div className="text-lg font-semibold text-[#101828]">
                    {getSessionName(selectedSession, currentUser?.id)}
                  </div>
                  <div className="text-sm text-[#667085]">{getSessionMeta(selectedSession)}</div>
                </div>
              </div>

              {tab === 'support' && isModerator ? (
                <div className="flex flex-wrap items-center gap-2">
                  {selectedSession.status !== 'assigned' ? (
                    <button
                      type="button"
                      onClick={() =>
                        assignSupportMutation.mutate(
                          { sessionUuid: selectedSession.session_uuid, moderatorId: currentUser?.id },
                          {
                            onError: (error) =>
                              showAxiosErrorToast(error, 'Не удалось назначить чат'),
                          }
                        )
                      }
                      disabled={assignSupportMutation.isPending}
                      className="rounded-xl bg-[#0036A5] px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
                    >
                      Взять в работу
                    </button>
                  ) : null}
                  {selectedSession.status !== 'closed' ? (
                    <button
                      type="button"
                      onClick={() =>
                        closeSupportMutation.mutate(selectedSession.session_uuid, {
                          onError: (error) =>
                            showAxiosErrorToast(error, 'Не удалось закрыть чат'),
                        })
                      }
                      disabled={closeSupportMutation.isPending}
                      className="rounded-xl border border-[#D0D5DD] px-4 py-2 text-sm font-medium text-[#344054] disabled:opacity-60"
                    >
                      Закрыть
                    </button>
                  ) : null}
                </div>
              ) : null}
            </div>

            <div ref={listRef} className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
              {messagesQuery.hasNextPage ? (
                <div className="flex justify-center">
                  <button
                    type="button"
                    onClick={() => messagesQuery.fetchNextPage()}
                    disabled={messagesQuery.isFetchingNextPage}
                    className="rounded-full border border-[#D0D5DD] px-4 py-2 text-sm text-[#344054] disabled:opacity-60"
                  >
                    {messagesQuery.isFetchingNextPage ? 'Загрузка...' : 'Загрузить старые сообщения'}
                  </button>
                </div>
              ) : null}

              {messagesQuery.isLoading ? (
                <div className="flex h-full items-center justify-center text-sm text-[#667085]">
                  Загрузка сообщений...
                </div>
              ) : null}

              {!messagesQuery.isLoading && messages.length === 0 ? (
                <div className="flex h-full items-center justify-center text-sm text-[#667085]">
                  Сообщений пока нет.
                </div>
              ) : null}

              {messages.map((message) => {
                const mine =
                  message.sender_id === currentUser?.id ||
                  ('optimistic' in message && Boolean(message.optimistic));
                return (
                  <div
                    key={message.id}
                    className={`flex ${mine ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[78%] rounded-[22px] px-4 py-3 ${
                        mine
                          ? 'bg-[#0036A5] text-white'
                          : 'border border-[#EAECF0] bg-[#F8FAFC] text-[#101828]'
                      }`}
                    >
                      <div className="whitespace-pre-wrap text-sm leading-6">{message.content}</div>
                      <div
                        className={`mt-2 flex items-center gap-1 text-[11px] ${
                          mine ? 'justify-end text-white/80' : 'text-[#667085]'
                        }`}
                      >
                        <span>{formatDateTime(message.created_at)}</span>
                        {mine ? <StatusIcon status={message.delivery_status} /> : null}
                        {'error' in message && message.error ? (
                          <span className="ml-1 text-[#FDA29B]">Ошибка</span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <form onSubmit={submitMessage} className="border-t border-[#EAECF0] px-5 py-4">
              <div className="flex items-end gap-3">
                <textarea
                  value={messageInput}
                  onChange={(event) => setMessageInput(event.target.value)}
                  placeholder="Введите сообщение"
                  rows={2}
                  className="min-h-12 flex-1 resize-none rounded-[18px] border border-[#D0D5DD] px-4 py-3 text-sm outline-none focus:border-[#0B43B8]"
                />
                <button
                  type="submit"
                  disabled={
                    !messageInput.trim() ||
                    sendMessageMutation.isPending ||
                    selectedSession.status === 'closed'
                  }
                  className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#0036A5] text-white disabled:opacity-60"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex h-full min-h-[720px] flex-col items-center justify-center px-6 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#E8F0FF] text-[#0B43B8]">
              <MessageCircle className="h-8 w-8" />
            </div>
            <h2 className="mt-4 text-xl font-semibold text-[#101828]">Выберите чат</h2>
            <p className="mt-2 max-w-md text-sm text-[#667085]">
              Откройте диалог из списка слева или начните переписку с владельцем из карточки объявления.
            </p>
          </div>
        )}
      </section>
        </>
      ) : null}
    </div>
  );
}
