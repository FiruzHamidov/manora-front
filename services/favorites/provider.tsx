'use client';

import { useEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { useMe } from '@/services/login/hooks';
import type { User } from '@/services/login/types';
import { FavoritesContext } from './hooks';
import { getFavoriteKeys, addToFavorites, removeFromFavorites, mergeFavorites } from './api';
import { favoriteKey, type FavoriteTarget } from './types';
import { guestSnapshot, subscribeGuestFavorites, parseGuestFavorites, updateGuestFavorites, withGuestFavoritesLock, changeGuestFavorites, acknowledgeGuestMerge } from './guest';

const serverSnapshot = () => '';
const message = (error: unknown): string => {
  if (isAxiosError(error)) {
    if (error.response?.status === 409) return 'Аккаунт изменился. Обновите страницу.';
    if (error.response?.status === 422) return 'Достигнут лимит избранного или часть данных некорректна.';
    return 'Сервис временно недоступен. Повторите позже.';
  }
  return error instanceof Error ? error.message : 'Не удалось обновить избранное.';
};
export function FavoritesProvider({ children }: { children: ReactNode }) {
  const me = useMe(), userId = me.data?.id ?? null, cache = useQueryClient();
  const raw = useSyncExternalStore(subscribeGuestFavorites, guestSnapshot, serverSnapshot);
  const guest = useMemo(() => parseGuestFavorites(raw), [raw]);
  const [busy, setBusy] = useState(false), [mergeError, setMergeError] = useState<string | null>(null), [mergeNotice, setMergeNotice] = useState<string | null>(null);
  const [retry, setRetry] = useState(0), attempted = useRef(''), running = useRef(false);
  const keys = useQuery({ queryKey: ['favorite-keys', userId], queryFn: ({ signal }) => getFavoriteKeys(signal, userId ?? undefined), enabled: !!userId,
    refetchOnWindowFocus: true, refetchInterval: userId ? 30_000 : false });
  const sameUser = (id: number) => cache.getQueryData<User | null>(['user'])?.id === id;
  useEffect(() => {
    if (!userId || guest.error || !guest.entries.length || running.current) return;
    const signature = userId + ':' + retry + ':' + raw;
    if (attempted.current === signature) return;
    attempted.current = signature; running.current = true;
    setBusy(true); setMergeError(null); setMergeNotice(null);
    const capturedUser = userId;
    void (async () => {
      let unavailable = 0, deferred = 0, attemptedRaw = raw;
      try {
        await withGuestFavoritesLock(async store => {
        try {
        const current = store.read();
        if (current.error) throw new Error(current.error);
        const sent = current.entries;
        for (let offset = 0; offset < sent.length; offset += 20) {
          if (cache.getQueryData<User | null>(['user'])?.id !== capturedUser) return;
          const batch = sent.slice(offset, offset + 20), response = await mergeFavorites(batch.map(entry => entry.target), capturedUser);
          if (response.user_id !== capturedUser || cache.getQueryData<User | null>(['user'])?.id !== capturedUser) return;
          store.update(current => acknowledgeGuestMerge(current, batch, response.results));
          unavailable += response.results.filter(row => row.result === 'unavailable').length;
          deferred += response.results.filter(row => row.result === 'temporarily_unavailable').length;
        }
        } finally { attemptedRaw = guestSnapshot(); }
        });
        if (cache.getQueryData<User | null>(['user'])?.id !== capturedUser) return;
        setMergeNotice('Гостевое избранное объединено.' + (unavailable ? ' Недоступных объектов исключено: ' + unavailable + '.' : ''));
        if (deferred) setMergeError('Часть источников временно недоступна. Осталось в браузере: ' + deferred + '. Повторите объединение позже.');
      } catch (error) {
        if (cache.getQueryData<User | null>(['user'])?.id === capturedUser) setMergeError('Объединение не завершено. Неотправленные записи сохранены в браузере. ' + message(error));
      } finally {
        // Prevent an automatic retry loop after partial acknowledgement; explicit retry
        // or a genuinely new guest change can start another attempt.
        attempted.current = capturedUser + ':' + retry + ':' + attemptedRaw;
        await cache.invalidateQueries({ queryKey: ['favorite-keys', capturedUser] });
        await cache.invalidateQueries({ queryKey: ['favorites', capturedUser] });
        running.current = false; setBusy(false);
      }
    })();
  }, [userId, raw, guest, cache, retry, busy]);

  async function change(target: FavoriteTarget, saved: boolean) {
    if (busy || running.current) throw new Error('Дождитесь завершения обновления избранного.');
    if (me.isPending || me.isError) throw new Error('Не удалось определить аккаунт. Обновите страницу.');
    if (!userId) {
      await updateGuestFavorites(entries => changeGuestFavorites(entries, target, saved, crypto.randomUUID()));
      return;
    }
    running.current = true; setBusy(true);
    try {
      const persist = async () => {
        if (!sameUser(userId)) throw new Error('Аккаунт изменился. Обновите страницу.');
        if (saved) await addToFavorites(target, userId); else await removeFromFavorites(target, userId);
      };
      if (navigator.locks) await withGuestFavoritesLock(async store => {
        await persist();
        if (sameUser(userId) && store.read().entries.some(entry => favoriteKey(entry.target) === favoriteKey(target)))
          store.update(entries => entries.filter(entry => favoriteKey(entry.target) !== favoriteKey(target)));
      });
      else await persist();
      if (!sameUser(userId)) return;
      cache.setQueryData<FavoriteTarget[]>(['favorite-keys', userId], old => {
        const next = (old ?? []).filter(item => favoriteKey(item) !== favoriteKey(target));
        return saved ? [...next, target] : next;
      });
      await cache.invalidateQueries({ queryKey: ['favorites', userId] });
    } finally {
      await cache.invalidateQueries({ queryKey: ['favorite-keys', userId] });
      running.current = false; setBusy(false);
    }
  }
  return <FavoritesContext.Provider value={{ targets: userId ? keys.data ?? [] : guest.entries.map(entry => entry.target), guestEntries: guest.entries,
    userId, loading: me.isPending || (!!userId && keys.isPending), busy,
    error: me.isError ? 'Не удалось проверить аккаунт.' : userId ? (keys.isError ? 'Не удалось загрузить избранное аккаунта.' : null) : guest.error,
    mergeError: userId ? mergeError || guest.error : null, mergeNotice: userId ? mergeNotice : null, change,
    refresh: () => { void me.refetch(); if (userId) void keys.refetch(); }, retryMerge: () => setRetry(value => value + 1) }}>{children}</FavoritesContext.Provider>;
}
