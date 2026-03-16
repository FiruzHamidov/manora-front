'use client';

import { useEffect } from 'react';
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import { getAuthToken } from '@/utils/axios';
import type {
  ChatKind,
  ChatMessageEvent,
  ChatMessageStatusEvent,
  ChatSessionEvent,
} from '@/services/messaging/types';

declare global {
  interface Window {
    Pusher?: any;
  }
}

type EchoInstance = any;

let echoInstance: EchoInstance | null = null;

const getApiOrigin = () => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'https://back.manora.tj/api';
  return apiUrl.replace(/\/api\/?$/, '');
};

const getEchoConfig = () => {
  const key =
    process.env.NEXT_PUBLIC_REVERB_APP_KEY ||
    process.env.NEXT_PUBLIC_PUSHER_APP_KEY ||
    '';

  if (!key) return null;

  const apiOrigin = getApiOrigin();
  const url = new URL(apiOrigin);
  const forceTLS =
    (process.env.NEXT_PUBLIC_REVERB_SCHEME || url.protocol.replace(':', '')) === 'https';

  return {
    broadcaster: 'pusher' as const,
    key,
    cluster: process.env.NEXT_PUBLIC_PUSHER_APP_CLUSTER,
    wsHost: process.env.NEXT_PUBLIC_REVERB_HOST || process.env.NEXT_PUBLIC_PUSHER_HOST || url.hostname,
    wsPort: Number(process.env.NEXT_PUBLIC_REVERB_PORT || process.env.NEXT_PUBLIC_PUSHER_PORT || (forceTLS ? 443 : 80)),
    wssPort: Number(process.env.NEXT_PUBLIC_REVERB_PORT || process.env.NEXT_PUBLIC_PUSHER_PORT || 443),
    forceTLS,
    enabledTransports: ['ws', 'wss'],
    authEndpoint: `${apiOrigin}/broadcasting/auth`,
    auth: {
      headers: {
        Authorization: `Bearer ${getAuthToken() ?? ''}`,
        Accept: 'application/json',
      },
    },
  };
};

export const getEcho = (): EchoInstance | null => {
  if (typeof window === 'undefined') return null;
  const config = getEchoConfig();
  if (!config) return null;

  if (!window.Pusher) {
    window.Pusher = Pusher;
  }

  if (!echoInstance) {
    echoInstance = new Echo(config as any);
  } else {
    const token = getAuthToken();
    if (token) {
      const connector = echoInstance.connector as any;
      if (connector?.options?.auth?.headers) {
        connector.options.auth.headers.Authorization = `Bearer ${token}`;
      }
    }
  }

  return echoInstance;
};

const getSessionChannelName = (kind: ChatKind, sessionUuid: string) =>
  `${kind}.session.${sessionUuid}`;

type SessionRealtimeHandlers = {
  kind: ChatKind;
  sessionUuid?: string | null;
  onMessage?: (payload: ChatMessageEvent) => void;
  onSessionUpdated?: (payload: ChatSessionEvent) => void;
  onStatusUpdated?: (payload: ChatMessageStatusEvent) => void;
  onReconnect?: () => void;
};

export const useSessionRealtime = ({
  kind,
  sessionUuid,
  onMessage,
  onSessionUpdated,
  onStatusUpdated,
  onReconnect,
}: SessionRealtimeHandlers) => {
  useEffect(() => {
    if (!sessionUuid) return;
    const echo = getEcho();
    if (!echo) return;

    const channel = echo.private(getSessionChannelName(kind, sessionUuid));
    const connector = echo.connector as any;
    const connection = connector?.pusher?.connection;

    const handleConnected = () => {
      onReconnect?.();
    };

    connection?.bind?.('connected', handleConnected);
    channel.listen(`.${kind}.message.sent`, onMessage ?? (() => undefined));
    channel.listen(`.${kind}.session.updated`, onSessionUpdated ?? (() => undefined));
    channel.listen('.chat.message.status.updated', onStatusUpdated ?? (() => undefined));

    return () => {
      connection?.unbind?.('connected', handleConnected);
      channel.stopListening(`.${kind}.message.sent`);
      channel.stopListening(`.${kind}.session.updated`);
      channel.stopListening('.chat.message.status.updated');
      echo.leaveChannel(`private-${getSessionChannelName(kind, sessionUuid)}`);
    };
  }, [kind, onMessage, onReconnect, onSessionUpdated, onStatusUpdated, sessionUuid]);
};

export const useSupportModeratorsRealtime = (
  enabled: boolean,
  onSessionUpdated?: (payload: ChatSessionEvent) => void,
  onReconnect?: () => void
) => {
  useEffect(() => {
    if (!enabled) return;
    const echo = getEcho();
    if (!echo) return;

    const channel = echo.private('support.moderators');
    const connector = echo.connector as any;
    const connection = connector?.pusher?.connection;

    const handleConnected = () => {
      onReconnect?.();
    };

    connection?.bind?.('connected', handleConnected);
    channel.listen('.support.session.updated', onSessionUpdated ?? (() => undefined));

    return () => {
      connection?.unbind?.('connected', handleConnected);
      channel.stopListening('.support.session.updated');
      echo.leaveChannel('private-support.moderators');
    };
  }, [enabled, onReconnect, onSessionUpdated]);
};
