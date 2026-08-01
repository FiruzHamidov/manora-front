import type {
  PublicationListingKind,
  PublicationRefreshErrorDetails,
  PublicationRefreshResponse,
} from './types';

const DEFAULT_ERROR_MESSAGE = 'Не удалось обновить объявление';

export const getPublicationRefreshEndpoint = (
  kind: PublicationListingKind,
  id: string | number
): string =>
  kind === 'car'
    ? `/cars/${id}/refresh-publication`
    : `/properties/${id}/refresh-publication`;

export const getPublicationDate = (
  publishedAt?: string | null,
  createdAt?: string | null
): { value?: string; label: 'Опубликовано' | 'Создано' } => {
  if (publishedAt) return { value: publishedAt, label: 'Опубликовано' };
  return { value: createdAt ?? undefined, label: 'Создано' };
};

export const getRefreshCountdown = (
  nextRefreshAt?: string | null,
  nowMs: number = Date.now()
): { isCoolingDown: boolean; remainingMs: number; label?: string } => {
  if (!nextRefreshAt) {
    return { isCoolingDown: false, remainingMs: 0 };
  }

  const targetMs = new Date(nextRefreshAt).getTime();
  if (!Number.isFinite(targetMs) || targetMs <= nowMs) {
    return { isCoolingDown: false, remainingMs: 0 };
  }

  const remainingMs = targetMs - nowMs;
  const totalMinutes = Math.max(1, Math.ceil(remainingMs / 60_000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const parts: string[] = [];

  if (hours > 0) parts.push(`${hours} ч.`);
  if (minutes > 0 || hours === 0) parts.push(`${minutes} мин.`);

  return {
    isCoolingDown: true,
    remainingMs,
    label: `Можно обновить через ${parts.join(' ')}`,
  };
};

export const resolveNextRefreshAt = (
  nextRefreshAt?: string | null,
  retryAfter?: number,
  nowMs: number = Date.now()
): string | undefined => {
  if (nextRefreshAt && Number.isFinite(new Date(nextRefreshAt).getTime())) {
    return nextRefreshAt;
  }

  if (retryAfter && retryAfter > 0) {
    return new Date(nowMs + retryAfter * 1000).toISOString();
  }

  return undefined;
};

export const getPublicationRefreshSuccessState = (
  response: PublicationRefreshResponse
) => ({
  publishedAt: response.published_at ?? undefined,
  publicationExpiresAt: response.publication_expires_at ?? undefined,
  nextRefreshAt: response.next_refresh_at ?? undefined,
  canRefreshPublication: response.can_refresh_publication,
});

export const parsePublicationRefreshError = (
  error: unknown
): PublicationRefreshErrorDetails => {
  const candidate = error as {
    response?: {
      status?: number;
      data?: {
        message?: string;
        next_refresh_at?: string | null;
        retry_after?: number;
      };
    };
  };
  const status = candidate?.response?.status;
  const data = candidate?.response?.data;

  if (status === 403) {
    return {
      status,
      message: 'У вас нет доступа к этому объявлению',
    };
  }

  return {
    status,
    message:
      typeof data?.message === 'string' && data.message.trim()
        ? data.message
        : DEFAULT_ERROR_MESSAGE,
    nextRefreshAt: data?.next_refresh_at ?? undefined,
    retryAfter:
      typeof data?.retry_after === 'number' ? data.retry_after : undefined,
  };
};
