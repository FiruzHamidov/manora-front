import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { QueryClient } from '@tanstack/react-query';
import { belongsToCurrentSession, subscribeSessionChanges } from '../services/login/session-sync.ts';
import { AUTH_TOKEN_STORAGE_KEY } from '../config/api.ts';

const hooksSource = await readFile(
  new URL('../services/login/hooks.ts', import.meta.url),
  'utf8'
);
const modalSource = await readFile(
  new URL('../app/login/LoginModal.tsx', import.meta.url),
  'utf8'
);
const gateSource = await readFile(
  new URL('../app/_components/auth/AuthGateMount.tsx', import.meta.url),
  'utf8'
);

test('successful login refreshes the current page instead of opening profile', () => {
  assert.match(hooksSource, /OK:\s*["']\/["']/);
  assert.match(hooksSource, /Вы успешно вошли в Manora/);
  assert.match(hooksSource, /setTimeout\(\(\) => router\.refresh\(\), 0\)/);
  assert.doesNotMatch(hooksSource, /OK:\s*["']\/profile["']/);
});

test('login modal returns to its origin or home after authentication', () => {
  assert.match(modalSource, /window\.history\.length > 1/);
  assert.match(modalSource, /router\.back\(\)/);
  assert.match(modalSource, /router\.push\(['"]\/['"]\)/);
});

test('authenticated gate pages return to home instead of profile', () => {
  assert.match(gateSource, /GATE_ROUTES\.has\(pathname\)/);
  assert.match(gateSource, /router\.replace\(['"]\/['"]\)/);
  assert.doesNotMatch(gateSource, /router\.replace\(['"]\/profile['"]\)/);
});

function sessionEvents() {
  const listeners = new Set();
  const source = {
    localStorage: {},
    addEventListener: (type, listener) => { assert.equal(type, 'storage'); listeners.add(listener); },
    removeEventListener: (type, listener) => { assert.equal(type, 'storage'); listeners.delete(listener); },
  };
  return { source, emit: (event = {}) => {
    const data = { storageArea: source.localStorage, key: AUTH_TOKEN_STORAGE_KEY, oldValue: 'old-session', newValue: 'new-session', ...event };
    for (const listener of listeners) listener(data);
  } };
}

test('a delayed unauthorized response cannot clear a replacement session', () => {
  assert.equal(belongsToCurrentSession('Bearer current-session', 'current-session'), true);
  assert.equal(belongsToCurrentSession('Bearer previous-session', 'current-session'), false);
  assert.equal(belongsToCurrentSession(undefined, 'current-session'), false);
  assert.equal(belongsToCurrentSession('Bearer previous-session', null), false);
});

test('cross-tab login, logout, replacement and clear reset the session, unrelated storage does not', () => {
  const events = sessionEvents(); let resets = 0;
  const stop = subscribeSessionChanges(() => resets++, events.source);
  events.emit({ oldValue: null }); // login
  events.emit({ newValue: null }); // logout
  events.emit(); // another session/account
  events.emit({ key: null, oldValue: null, newValue: null }); // localStorage.clear
  assert.equal(resets, 4);
  events.emit({ key: 'manora-unit-comparison' });
  events.emit({ key: 'auth_user' }); // ordinary profile refresh is not a new session
  events.emit({ newValue: 'old-session' });
  events.emit({ storageArea: {} }); // sessionStorage or another storage area
  assert.equal(resets, 4);
  stop(); events.emit(); assert.equal(resets, 4);
});

test('session reset discards private caches and prevents an old read from repopulating them', async () => {
  const events = sessionEvents();
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
  client.setQueryData(['user'], { id: 2 });
  client.setQueryData(['favorites', 2], ['private favorite']);
  client.setQueryData(['building-reviews', 30, 'own', 2], { text: 'private draft' });
  let finish, aborted = false;
  const request = client.fetchQuery({ queryKey: ['favorite-keys', 2], queryFn: ({ signal }) => {
    signal.addEventListener('abort', () => { aborted = true; });
    return new Promise(resolve => { finish = resolve; });
  } }).catch(() => null);
  const stop = subscribeSessionChanges(() => client.clear(), events.source);
  events.emit({ newValue: null });
  assert.equal(aborted, true);
  assert.equal(client.getQueryCache().getAll().length, 0);
  finish(['old account result']); await request;
  assert.equal(client.getQueryData(['favorite-keys', 2]), undefined);
  stop(); client.clear();
});
