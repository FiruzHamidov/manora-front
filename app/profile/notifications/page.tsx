'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bell, BellRing, CheckCheck, ChevronRight, Inbox } from 'lucide-react';
import { useState } from 'react';
import {
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
  useNotificationsQuery,
} from '@/services/notifications/hooks';
import type { NotificationItem } from '@/services/notifications/types';
import PushNotificationSettings from './push-notification-settings';

const formatDate = (value?: string | null) => {
  if (!value) return '';
  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
};

export default function NotificationsPage() {
  const router = useRouter();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const { data, isLoading, isError, refetch } = useNotificationsQuery(
    filter === 'unread' ? false : undefined
  );
  const markRead = useMarkNotificationReadMutation();
  const markAllRead = useMarkAllNotificationsReadMutation();
  const items = data?.data ?? [];

  const openNotification = async (notification: NotificationItem) => {
    if (!notification.read_at) {
      await markRead.mutateAsync(notification.id);
    }
    if (notification.action_url) router.push(notification.action_url);
  };

  return (
    <section className="mx-auto w-full max-w-4xl pb-10">
      <div className="overflow-hidden rounded-[28px] border border-[#DDE7E2] bg-white shadow-[0_18px_50px_rgba(15,23,42,0.07)]">
        <header className="border-b border-[#E8EEEB] bg-[linear-gradient(135deg,#F2FBF7_0%,#FFFFFF_70%)] px-5 py-6 sm:px-7">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="mb-2 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[#006341] text-white">
                <BellRing className="h-5 w-5" />
              </div>
              <h1 className="text-2xl font-extrabold tracking-tight text-[#111827]">Уведомления</h1>
              <p className="mt-1 text-sm text-[#64748B]">
                Статусы объявлений, сообщения и важные события аккаунта.
              </p>
            </div>
            <button
              type="button"
              onClick={() => markAllRead.mutate()}
              disabled={markAllRead.isPending || items.every((item) => item.read_at)}
              className="inline-flex items-center gap-2 rounded-xl border border-[#CFE2D8] bg-white px-4 py-2.5 text-sm font-semibold text-[#006341] transition hover:bg-[#F0FAF5] disabled:cursor-not-allowed disabled:opacity-45"
            >
              <CheckCheck className="h-4 w-4" />
              Прочитать все
            </button>
          </div>

          <div className="mt-5 inline-flex rounded-xl bg-[#EAF3EF] p-1">
            {([
              ['all', 'Все'],
              ['unread', 'Новые'],
            ] as const).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setFilter(key)}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                  filter === key ? 'bg-white text-[#006341] shadow-sm' : 'text-[#64748B]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </header>

        <PushNotificationSettings />

        <div className="divide-y divide-[#EDF1EF]">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="animate-pulse px-5 py-5 sm:px-7">
                <div className="h-4 w-2/5 rounded bg-[#E7ECEA]" />
                <div className="mt-3 h-3 w-4/5 rounded bg-[#EEF2F0]" />
              </div>
            ))
          ) : isError ? (
            <div className="px-5 py-16 text-center">
              <p className="font-semibold text-[#1F2937]">Не удалось загрузить уведомления</p>
              <button
                type="button"
                onClick={() => refetch()}
                className="mt-3 text-sm font-semibold text-[#006341]"
              >
                Повторить
              </button>
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center px-5 py-16 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F1F7F4] text-[#006341]">
                <Inbox className="h-6 w-6" />
              </span>
              <p className="mt-4 font-semibold text-[#1F2937]">
                {filter === 'unread' ? 'Все уведомления прочитаны' : 'Пока нет уведомлений'}
              </p>
              <p className="mt-1 max-w-sm text-sm text-[#64748B]">
                Здесь появятся результаты модерации и важные события по вашим объявлениям.
              </p>
            </div>
          ) : (
            items.map((notification) => (
              <button
                key={notification.id}
                type="button"
                onClick={() => openNotification(notification)}
                className={`group flex w-full items-start gap-4 px-5 py-5 text-left transition hover:bg-[#F8FBF9] sm:px-7 ${
                  notification.read_at ? 'bg-white' : 'bg-[#F1FAF6]'
                }`}
              >
                <span
                  className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                    notification.read_at
                      ? 'bg-[#F1F5F3] text-[#64748B]'
                      : 'bg-[#006341] text-white'
                  }`}
                >
                  <Bell className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-semibold text-[#172033]">{notification.title}</span>
                    <span className="text-xs text-[#84909F]">
                      {formatDate(notification.last_occurred_at ?? notification.created_at)}
                    </span>
                  </span>
                  <span className="mt-1 block text-sm leading-6 text-[#64748B]">
                    {notification.body}
                  </span>
                </span>
                {notification.action_url ? (
                  <ChevronRight className="mt-2 h-4 w-4 shrink-0 text-[#94A3B8] transition group-hover:translate-x-0.5" />
                ) : null}
              </button>
            ))
          )}
        </div>
      </div>

      <Link href="/profile" className="mt-5 inline-flex text-sm font-semibold text-[#006341]">
        Вернуться в профиль
      </Link>
    </section>
  );
}
