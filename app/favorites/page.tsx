'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useFavoritesState } from '@/services/favorites/hooks';
import { getFavorites, resolveFavorites, refreshFavoriteDeals } from '@/services/favorites/api';
import { favoriteTypes, favoriteKey, type FavoriteResponse, type FavoriteType, type FavoriteDeal } from '@/services/favorites/types';
import { filterGuestFavorites } from '@/services/favorites/filter';
import FavoriteButton from '@/ui-components/favorite-button/favorite-button';
import { unitPrice, formatResidentialDecimal } from '@/services/new-buildings/public-unit';
import { residentialRolloutHref } from '@/services/new-buildings/rollout';

const button = 'inline-flex min-h-11 items-center justify-center rounded-xl border border-green-800 px-3 py-2 text-green-800 disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-800';
export default function Favorites() {
  const favorites = useFavoritesState(), cache = useQueryClient();
  const [type, setType] = useState<FavoriteType | ''>(''), [offer, setOffer] = useState<FavoriteDeal | ''>(''), [page, setPage] = useState(1);
  const [refreshingDeals, setRefreshingDeals] = useState(false), [dealNotice, setDealNotice] = useState<{ userId: number; text: string } | null>(null);
  const guestTargets = useMemo(() => favorites.guestEntries.map(entry => entry.target).reverse(), [favorites.guestEntries]);
  const enabled = !favorites.loading && !favorites.error && !favorites.busy;
  const guestQuery = useQuery({ queryKey: ['guest-favorite-details', guestTargets], enabled: enabled && !favorites.userId,
    queryFn: async ({ signal }) => {
      const rows: FavoriteResponse[] = [];
      for (let offset = 0; offset < guestTargets.length; offset += 20) {
        const batch = guestTargets.slice(offset, offset + 20);
        try { rows.push(...await resolveFavorites(batch, signal)); }
        catch (error) {
          if (signal.aborted) throw error;
          rows.push(...batch.map(target => ({ ...target, state: 'temporarily_unavailable' as const, item: null })));
        }
      }
      return rows;
    }, staleTime: 15_000, refetchOnWindowFocus: true, refetchInterval: 30_000 });
  const accountQuery = useQuery({ queryKey: ['favorites', favorites.userId, type, offer, page], enabled: enabled && !!favorites.userId,
    queryFn: ({ signal }) => getFavorites(page, type || undefined, signal, favorites.userId ?? undefined, offer || undefined),
    refetchOnWindowFocus: true, refetchInterval: 30_000 });
  const query = favorites.userId ? accountQuery : guestQuery;
  const data = favorites.userId ? accountQuery.data : guestQuery.data && filterGuestFavorites(guestQuery.data, page, type || undefined, offer || undefined);
  const partnerIds = (data?.data ?? []).filter(row => row.source === 'aura' && row.type === 'property' && row.favorite_id).map(row => row.favorite_id!);
  async function refreshDeals() {
    const userId = favorites.userId;
    if (!userId) return;
    setRefreshingDeals(true); setDealNotice(null);
    try {
      const result = await refreshFavoriteDeals(partnerIds, userId);
      setDealNotice({ userId, text: `Тип сделки проверен для ${result.checked} объектов.` + (result.deferred ? ` Источник временно недоступен для ${result.deferred}; прежние сведения сохранены.` : '') });
      await cache.invalidateQueries({ queryKey: ['favorites', userId] });
    } catch { setDealNotice({ userId, text: 'Не удалось обновить сведения. Повторите позже.' }); }
    finally { setRefreshingDeals(false); }
  }
  const changedFilter = (next: FavoriteType | '') => { setType(next); setPage(1); };
  return <div className="mx-auto max-w-[1280px] space-y-5 px-3 pb-28 pt-8 sm:px-6">
    <h1 className="text-3xl font-bold">Избранное</h1>
    <p>{favorites.userId ? 'Ваш список доступен только вашему аккаунту.' : 'Сохраняется в этом браузере без входа. После входа записи объединяются без дублей.'}</p>
    <p className="text-sm text-gray-600">Снятые с публикации объекты не раскрывают данные и остаются в списке до вашего удаления. При объединении новые недоступные объекты исключаются; временные ошибки источника сохраняются для повторной попытки.</p>
    {favorites.mergeNotice && <p role="status">{favorites.mergeNotice}</p>}
    {favorites.mergeError && <div role="alert" className="space-y-2 rounded-xl bg-amber-50 p-4"><p>{favorites.mergeError}</p><button className={button} disabled={favorites.busy} onClick={favorites.retryMerge}>Повторить объединение</button></div>}
    {favorites.error && <p role="alert">{favorites.error}</p>}
    <div className="flex flex-wrap gap-2" role="group" aria-label="Тип избранного">
      <button className={button} aria-pressed={!type} onClick={() => changedFilter('')}>Все</button>
      {Object.entries(favoriteTypes).map(([key, label]) => <button key={key} className={button} aria-pressed={type === key} onClick={() => changedFilter(key as FavoriteType)}>{label}</button>)}
    </div>
    <div className="flex flex-wrap gap-2" role="group" aria-label="Тип сделки">
      {([['', 'Все сделки'], ['sale', 'Купить'], ['rent', 'Снять'], ['unknown', 'Не определено']] as const).map(([value, label]) =>
        <button key={value} className={button} aria-pressed={offer === value} onClick={() => { setOffer(value); setPage(1); }}>{label}{data && ` (${value ? data.meta.deals[value] : Object.values(data.meta.deals).reduce((a, b) => a + b, 0)})`}</button>)}
    </div>
    {favorites.userId && <p className="text-sm text-gray-600">Фильтр партнёрских объявлений использует последний проверенный тип сделки. Непроверенные записи находятся в «Не определено». Данные карточек запрашиваются заново.</p>}
    {favorites.userId && partnerIds.length > 0 && <button className={button} disabled={refreshingDeals || favorites.busy || query.isFetching} onClick={() => void refreshDeals()}>Проверить сделки партнёра на этой странице</button>}
    {dealNotice?.userId === favorites.userId && <p role="status">{dealNotice?.text}</p>}
    <button className={button} disabled={favorites.busy || query.isFetching} onClick={() => { favorites.refresh(); void query.refetch(); }}>Обновить избранное</button>
    {favorites.error ? null : favorites.loading || favorites.busy || query.isPending ? <p role="status">{favorites.busy ? 'Обновление избранного…' : 'Загрузка избранного…'}</p>
      : query.isError ? <p role="alert">Не удалось загрузить список. Записи не удалены. Повторите загрузку.</p>
      : data && <>
        <p>Объектов: {data.meta.total}</p>
        {!data.data.length ? <p>В этом разделе пока нет объектов.{page > 1 && ' Вернитесь на предыдущую страницу.'}</p>
          : <div className="grid min-w-0 gap-4 md:grid-cols-2 xl:grid-cols-3">{data.data.map(row => <FavoriteCard key={favoriteKey(row)} row={row} />)}</div>}
        {(data.meta.last_page > 1 || page > 1) && <nav aria-label="Страницы избранного" className="flex flex-wrap items-center gap-3">
          <button className={button} disabled={page <= 1 || query.isFetching} onClick={() => setPage(value => value - 1)}>Назад</button><span>Страница {page} из {data.meta.last_page}</span>
          <button className={button} disabled={page >= data.meta.last_page || query.isFetching} onClick={() => setPage(value => value + 1)}>Далее</button>
        </nav>}
      </>}
  </div>;
}
function FavoriteCard({ row }: { row: FavoriteResponse }) {
  const item = row.state === 'visible' ? row.item : null;
  return <article className="min-w-0 space-y-3 rounded-2xl border bg-white p-4 [overflow-wrap:anywhere]">
    <p className="text-sm text-gray-600">{favoriteTypes[row.type]} · {row.source === 'local' ? 'Manora' : 'Партнёрский каталог'}</p>
    {item ? <>
      <h2 className="text-xl font-semibold"><Link href={residentialRolloutHref(item.href)} className="text-green-800 underline">{item.title}</Link></h2>
      <p>{item.offer_type === 'sale' ? 'Продажа' : item.offer_type === 'rent' ? 'Аренда' : 'Тип сделки не указан'}</p>
      {row.source === 'aura' && row.type === 'property' && row.deal_type !== undefined && row.deal_type !== item.offer_type && <p className="text-sm text-amber-800">Тип сделки изменился. Обновите сведения партнёра для фильтра.</p>}
      {item.subtitle && <p>{item.subtitle}</p>}
      <p className="font-semibold">{item.price === null ? 'Цена по запросу' : (item.price_prefix === 'from' ? 'От ' : '') + (item.currency === 'TJS' ? unitPrice(String(item.price)) : formatResidentialDecimal(String(item.price)) + ' ' + (item.currency ?? ''))}</p>
      {item.availability && <p>{item.availability === 'available' ? 'Свободна' : item.availability === 'reserved' ? 'Забронирована' : 'Продана'}</p>}
      {item.available_count !== undefined && <p>Свободных квартир: {item.available_count}</p>}
      {item.area && <p>{formatResidentialDecimal(item.area)} м²{item.floor !== null && item.floor !== undefined ? ' · Этаж ' + item.floor : ''}</p>}
    </> : <><h2 className="font-semibold">{row.state === 'temporarily_unavailable' ? 'Источник временно недоступен' : 'Объект недоступен'}</h2>
      <p>{row.state === 'temporarily_unavailable' ? 'Это не означает, что объект удалён. Попробуйте обновить список позже.' : 'Объект удалён или снят с публикации. Его данные скрыты.'}</p><p className="text-sm">ID: {row.id}</p></>}
    <FavoriteButton propertyId={row.id} targetType={row.type} source={row.source} label="В избранное" className={button + ' gap-2'} />
  </article>;
}
