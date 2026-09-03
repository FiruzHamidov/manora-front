'use client';

import { BellRing, LoaderCircle, Smartphone } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { useProfile } from '@/services/login/hooks';
import {
  disablePushNotifications,
  getPushAvailability,
  PushAvailability,
  syncPushToken,
} from '@/services/push/client';

const descriptions: Partial<Record<PushAvailability, string>> = {
  unconfigured: 'Push-уведомления временно недоступны: Firebase ещё не настроен.',
  unsupported: 'Этот браузер не поддерживает push-уведомления.',
  'ios-install-required':
    'На iPhone откройте меню «Поделиться», выберите «На экран Домой», затем запустите Manora с иконки.',
  denied: 'Уведомления заблокированы. Разрешите их в настройках браузера или системы.',
  available: 'Получайте статусы объявлений и важные события, даже когда сайт закрыт.',
  enabled: 'Push-уведомления включены на этом устройстве.',
};

export default function PushNotificationSettings() {
  const { data: user } = useProfile();
  const [status, setStatus] = useState<PushAvailability>('loading');
  const [pending, setPending] = useState(false);

  const refresh = useCallback(async () => {
    setStatus(await getPushAvailability(user?.id));
  }, [user?.id]);

  useEffect(() => {
    refresh().catch(() => setStatus('unsupported'));
  }, [refresh]);

  const enable = async () => {
    if (!user?.id) return;
    setPending(true);
    try {
      await syncPushToken(user.id, true);
      await refresh();
      toast.success('Push-уведомления включены');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Не удалось включить уведомления');
      await refresh();
    } finally {
      setPending(false);
    }
  };

  const disable = async () => {
    setPending(true);
    try {
      await disablePushNotifications();
      await refresh();
      toast.success('Push-уведомления отключены на этом устройстве');
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="border-b border-[#E8EEEB] bg-[#F7FBF9] px-5 py-5 sm:px-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#E3F3EB] text-[#006341]">
            {status === 'ios-install-required' ? (
              <Smartphone className="h-5 w-5" />
            ) : (
              <BellRing className="h-5 w-5" />
            )}
          </span>
          <div>
            <p className="font-semibold text-[#172033]">Push-уведомления</p>
            <p className="mt-1 max-w-xl text-sm leading-5 text-[#64748B]">
              {status === 'loading' ? 'Проверяем поддержку…' : descriptions[status]}
            </p>
          </div>
        </div>

        {status === 'available' || status === 'enabled' ? (
          <button
            type="button"
            onClick={status === 'enabled' ? disable : enable}
            disabled={pending}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#006341] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#004E34] disabled:opacity-60"
          >
            {pending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
            {status === 'enabled' ? 'Отключить' : 'Включить'}
          </button>
        ) : null}
      </div>
    </div>
  );
}
