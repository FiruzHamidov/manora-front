import { favoriteKey, validFavoriteTarget, type FavoriteTarget, type FavoriteMerge } from './types';

export const GUEST_FAVORITES_KEY = 'manora:guest-favorites:v1';
export const GUEST_FAVORITES_EVENT = 'manora:guest-favorites-changed';
export const GUEST_FAVORITES_LIMIT = 100;
export type GuestFavorite = { target: FavoriteTarget; revision: string };
export type GuestFavorites = { entries: GuestFavorite[]; error: string | null };

export function parseGuestFavorites(raw: string): GuestFavorites {
  if (!raw) return { entries: [], error: null };
  try {
    const parsed = JSON.parse(raw);
    if (parsed.version !== 1 || !Array.isArray(parsed.entries) || parsed.entries.length > GUEST_FAVORITES_LIMIT) throw new Error('invalid');
    const unique = new Map<string, GuestFavorite>();
    for (const entry of parsed.entries) {
      if (!validFavoriteTarget(entry?.target) || typeof entry.revision !== 'string' || entry.revision.length > 100 || !entry.revision) throw new Error('invalid');
      unique.set(favoriteKey(entry.target), { target: { type: entry.target.type, id: entry.target.id, source: entry.target.source }, revision: entry.revision });
    }
    return { entries: [...unique.values()], error: null };
  } catch { return { entries: [], error: 'Не удалось прочитать гостевое избранное. Запись не перезаписана.' }; }
}
export function serializeGuestFavorites(entries: GuestFavorite[]): string { return JSON.stringify({ version: 1, entries }); }
export function changeGuestFavorites(entries: GuestFavorite[], target: FavoriteTarget, saved: boolean, revision: string): GuestFavorite[] {
  if (!validFavoriteTarget(target)) throw new Error('Некорректный объект избранного.');
  const other = entries.filter(entry => favoriteKey(entry.target) !== favoriteKey(target));
  if (!saved) return other;
  if (other.length >= GUEST_FAVORITES_LIMIT) throw new Error('Гостевое избранное вмещает 100 объектов. Удалите ненужные или войдите в аккаунт.');
  return [...other, { target, revision }];
}
export function acknowledgeGuestMerge(current: GuestFavorite[], sent: GuestFavorite[], results: FavoriteMerge['results']): GuestFavorite[] {
  const sentRevisions = new Map(sent.map(entry => [favoriteKey(entry.target), entry.revision]));
  const accepted = new Set(results.filter(row => row.result === 'saved' || row.result === 'unavailable').map(favoriteKey));
  return current.filter(entry => !accepted.has(favoriteKey(entry.target)) || sentRevisions.get(favoriteKey(entry.target)) !== entry.revision);
}

export function guestSnapshot(): string {
  if (typeof window === 'undefined') return '';
  try { return window.localStorage.getItem(GUEST_FAVORITES_KEY) ?? ''; }
  catch { return 'storage-unavailable'; }
}
export function subscribeGuestFavorites(notify: () => void): () => void {
  const changed = (event: StorageEvent) => { if (event.key === GUEST_FAVORITES_KEY || event.key === null) notify(); };
  window.addEventListener('storage', changed); window.addEventListener(GUEST_FAVORITES_EVENT, notify);
  return () => { window.removeEventListener('storage', changed); window.removeEventListener(GUEST_FAVORITES_EVENT, notify); };
}
type GuestStore = { read: () => GuestFavorites; update: (update: (entries: GuestFavorite[]) => GuestFavorite[]) => void };
const readStore = () => parseGuestFavorites(guestSnapshot());
function writeLocked(update: (entries: GuestFavorite[]) => GuestFavorite[]): void {
  const state = readStore();
  if (state.error) throw new Error(state.error);
  const next = update(state.entries);
  try { window.localStorage.setItem(GUEST_FAVORITES_KEY, serializeGuestFavorites(next)); }
  catch { throw new Error('Не удалось сохранить избранное в этом браузере. Проверьте доступ к локальному хранилищу.'); }
  window.dispatchEvent(new Event(GUEST_FAVORITES_EVENT));
}

/** Every guest read-modify-write and the complete merge share one cross-tab lock. */
export async function withGuestFavoritesLock<T>(run: (store: GuestStore) => Promise<T>): Promise<T> {
  if (typeof navigator === 'undefined' || !navigator.locks) throw new Error('Браузер не поддерживает безопасное гостевое избранное. Обновите браузер или войдите в аккаунт.');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10_000);
  try {
    return await navigator.locks.request(GUEST_FAVORITES_KEY, { signal: controller.signal }, async () => {
      clearTimeout(timer);
      return run({ read: readStore, update: writeLocked });
    });
  } catch (error) {
    if (controller.signal.aborted) throw new Error('Избранное обновляется в другой вкладке. Повторите через несколько секунд.');
    throw error;
  } finally { clearTimeout(timer); }
}

export async function updateGuestFavorites(update: (entries: GuestFavorite[]) => GuestFavorite[]): Promise<void> {
  await withGuestFavoritesLock(async store => store.update(update));
}
