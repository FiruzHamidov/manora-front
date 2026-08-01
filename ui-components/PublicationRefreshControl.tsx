'use client';

import { useEffect, useRef, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { toast } from 'react-toastify';
import { useRefreshListingPublicationMutation } from '@/services/publication-refresh/hooks';
import {
  getPublicationRefreshSuccessState,
  getRefreshCountdown,
  parsePublicationRefreshError,
  resolveNextRefreshAt,
} from '@/services/publication-refresh/helpers';
import type {
  PublicationListingKind,
  PublicationRefreshFields,
  PublicationRefreshResponse,
} from '@/services/publication-refresh/types';

interface PublicationRefreshControlProps {
  kind: PublicationListingKind;
  listing: PublicationRefreshFields;
  onUpdated?: (listing: PublicationRefreshResponse) => void;
}

export function PublicationRefreshControl({
  kind,
  listing,
  onUpdated,
}: PublicationRefreshControlProps) {
  const mutation = useRefreshListingPublicationMutation();
  const inFlightRef = useRef(false);
  const [nextRefreshAt, setNextRefreshAt] = useState<string | undefined>(
    listing.next_refresh_at ?? undefined
  );
  const [publicationExpiresAt, setPublicationExpiresAt] = useState<
    string | undefined
  >(listing.publication_expires_at ?? undefined);
  const [nowMs, setNowMs] = useState(Date.now());

  useEffect(() => {
    setNextRefreshAt((current) => {
      if (
        current &&
        !listing.next_refresh_at &&
        getRefreshCountdown(current).isCoolingDown
      ) {
        return current;
      }
      return listing.next_refresh_at ?? current;
    });
  }, [listing.next_refresh_at]);

  useEffect(() => {
    setPublicationExpiresAt(listing.publication_expires_at ?? undefined);
  }, [listing.publication_expires_at]);

  const countdown = getRefreshCountdown(nextRefreshAt, nowMs);

  useEffect(() => {
    if (!countdown.isCoolingDown) return;

    const delay = Math.min(countdown.remainingMs, 60_000);
    const timeoutId = window.setTimeout(() => setNowMs(Date.now()), delay);
    return () => window.clearTimeout(timeoutId);
  }, [countdown.isCoolingDown, countdown.remainingMs]);

  const expirationDate = publicationExpiresAt
    ? new Date(publicationExpiresAt)
    : null;
  const expirationLabel =
    expirationDate && !Number.isNaN(expirationDate.getTime())
      ? expirationDate.toLocaleDateString('ru-RU')
      : undefined;

  const handleRefresh = async () => {
    if (
      inFlightRef.current ||
      mutation.isPending ||
      countdown.isCoolingDown
    ) {
      return;
    }

    inFlightRef.current = true;

    try {
      const updated = await mutation.mutateAsync({
        id: listing.id,
        kind,
      });
      const successState = getPublicationRefreshSuccessState(updated);
      setNextRefreshAt(successState.nextRefreshAt);
      setPublicationExpiresAt(successState.publicationExpiresAt);
      setNowMs(Date.now());
      onUpdated?.(updated);
      toast.success('Объявление обновлено и поднято в каталоге');
    } catch (error) {
      const details = parsePublicationRefreshError(error);

      if (details.status === 429) {
        setNextRefreshAt(
          resolveNextRefreshAt(
            details.nextRefreshAt,
            details.retryAfter,
            Date.now()
          )
        );
        setNowMs(Date.now());
      }

      toast.error(details.message);
    } finally {
      inFlightRef.current = false;
    }
  };

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={handleRefresh}
        disabled={mutation.isPending || countdown.isCoolingDown}
        className="inline-flex min-h-9 w-full items-center justify-center gap-2 rounded-lg bg-[#006341] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#07553D] disabled:cursor-not-allowed disabled:bg-[#A8B7B0]"
      >
        <RefreshCw
          className={`h-3.5 w-3.5 ${mutation.isPending ? 'animate-spin' : ''}`}
        />
        {mutation.isPending
          ? 'Обновление…'
          : countdown.label ?? 'Обновить объявление'}
      </button>
      <p className="mt-2 text-xs leading-5 text-[#64748B]">
        Дата публикации обновится, объявление поднимется в каталоге и будет
        активно ещё 14 дней
        {expirationLabel ? ` (до ${expirationLabel})` : ''}.
      </p>
    </div>
  );
}
