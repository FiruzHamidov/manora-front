'use client';

import type { Messaging, MessagePayload } from 'firebase/messaging';
import { notificationsApi } from '@/services/notifications/api';

const TOKEN_STORAGE_KEY = 'manora:firebase-push-token';
const DEVICE_STORAGE_KEY = 'manora:browser-device-id';

type StoredPushToken = {
  backendId: number;
  token: string;
  userId: number;
};

export type PushAvailability =
  | 'loading'
  | 'unconfigured'
  | 'unsupported'
  | 'ios-install-required'
  | 'denied'
  | 'available'
  | 'enabled';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

const isConfigured = () =>
  Boolean(
    firebaseConfig.apiKey &&
      firebaseConfig.projectId &&
      firebaseConfig.messagingSenderId &&
      firebaseConfig.appId &&
      vapidKey
  );

const isIos = () =>
  /iPad|iPhone|iPod/.test(navigator.userAgent) ||
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches ||
  Boolean((navigator as Navigator & { standalone?: boolean }).standalone);

const readStoredToken = (): StoredPushToken | null => {
  try {
    const value = localStorage.getItem(TOKEN_STORAGE_KEY);
    return value ? (JSON.parse(value) as StoredPushToken) : null;
  } catch {
    return null;
  }
};

const getDeviceId = () => {
  const existing = localStorage.getItem(DEVICE_STORAGE_KEY);
  if (existing) return existing;

  const value = crypto.randomUUID();
  localStorage.setItem(DEVICE_STORAGE_KEY, value);
  return value;
};

const getMessagingClient = async (): Promise<Messaging> => {
  const [{ getApp, getApps, initializeApp }, { getMessaging }] = await Promise.all([
    import('firebase/app'),
    import('firebase/messaging'),
  ]);
  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  return getMessaging(app);
};

const getRegistration = () =>
  navigator.serviceWorker.register('/firebase-messaging-sw.js', { scope: '/' });

export const getPushAvailability = async (userId?: number): Promise<PushAvailability> => {
  if (!isConfigured()) return 'unconfigured';
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
  if (isIos() && !isStandalone()) return 'ios-install-required';

  const { isSupported } = await import('firebase/messaging');
  if (!(await isSupported())) return 'unsupported';
  if (Notification.permission === 'denied') return 'denied';

  const stored = readStoredToken();
  return Notification.permission === 'granted' && stored?.userId === userId
    ? 'enabled'
    : 'available';
};

export const syncPushToken = async (userId: number, requestPermission = false) => {
  if (!isConfigured()) throw new Error('Firebase не настроен.');
  if (isIos() && !isStandalone()) {
    throw new Error('На iPhone сначала добавьте Manora на экран «Домой».');
  }

  const { getToken, isSupported } = await import('firebase/messaging');
  if (!(await isSupported())) throw new Error('Этот браузер не поддерживает push-уведомления.');

  const permission = requestPermission ? await Notification.requestPermission() : Notification.permission;
  if (permission !== 'granted') throw new Error('Разрешение на уведомления не предоставлено.');

  const registration = await getRegistration();
  const messaging = await getMessagingClient();
  const token = await getToken(messaging, { vapidKey, serviceWorkerRegistration: registration });
  if (!token) throw new Error('Браузер не выдал токен уведомлений.');

  const previous = readStoredToken();
  if (previous && previous.userId !== userId) {
    await notificationsApi.deleteDeviceToken(previous.backendId).catch(() => undefined);
  }

  const saved = await notificationsApi.registerDeviceToken({
    platform: isIos() ? 'ios' : 'android',
    token,
    device_id: getDeviceId(),
    app_version: process.env.NEXT_PUBLIC_APP_VERSION ?? 'web',
    locale: navigator.language?.slice(0, 16),
  });

  localStorage.setItem(
    TOKEN_STORAGE_KEY,
    JSON.stringify({ backendId: saved.id, token, userId } satisfies StoredPushToken)
  );
};

export const disablePushNotifications = async () => {
  const stored = readStoredToken();
  if (stored) {
    await notificationsApi.deleteDeviceToken(stored.backendId).catch(() => undefined);
  }

  if (isConfigured()) {
    const { deleteToken, isSupported } = await import('firebase/messaging');
    if (await isSupported()) {
      const messaging = await getMessagingClient();
      await deleteToken(messaging).catch(() => false);
    }
  }

  localStorage.removeItem(TOKEN_STORAGE_KEY);
};

export const subscribeToForegroundMessages = async (
  callback: (payload: MessagePayload) => void
) => {
  if (!isConfigured()) return () => undefined;
  const { isSupported, onMessage } = await import('firebase/messaging');
  if (!(await isSupported())) return () => undefined;

  return onMessage(await getMessagingClient(), callback);
};
