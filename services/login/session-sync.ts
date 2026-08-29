import { AUTH_TOKEN_STORAGE_KEY } from '../../config/api.ts';

/** A late 401 from the previous session must not log out the new account. */
export function belongsToCurrentSession(authorization: unknown, token: string | null): boolean {
  return !!token && authorization === `Bearer ${token}`;
}

/** Another tab changed the session. Never carry its cached user or forms over. */
export function subscribeSessionChanges(
  reset: () => void,
  source: Pick<Window, 'localStorage' | 'addEventListener' | 'removeEventListener'> = window,
): () => void {
  const changed = (event: StorageEvent) => {
    if (event.storageArea !== source.localStorage) return;
    if (event.key === null || (event.key === AUTH_TOKEN_STORAGE_KEY && event.oldValue !== event.newValue)) reset();
  };
  source.addEventListener('storage', changed);
  return () => source.removeEventListener('storage', changed);
}
