'use client';

import { useEffect } from 'react';
import { toast } from 'react-toastify';
import { useProfile } from '@/services/login/hooks';
import { subscribeToForegroundMessages, syncPushToken } from '@/services/push/client';

export default function PushNotificationMount() {
  const { data: user } = useProfile();

  useEffect(() => {
    if (!user?.id || typeof Notification === 'undefined' || Notification.permission !== 'granted') {
      return;
    }

    syncPushToken(user.id).catch(() => undefined);
  }, [user?.id]);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    subscribeToForegroundMessages((payload) => {
      const title = payload.notification?.title ?? 'Новое уведомление';
      const body = payload.notification?.body;
      toast.info(body ? `${title}: ${body}` : title);
    }).then((handler) => {
      unsubscribe = handler;
    });

    return () => unsubscribe?.();
  }, []);

  return null;
}
