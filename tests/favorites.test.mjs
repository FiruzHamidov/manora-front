import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { favoriteKey, validFavoriteTarget } from '../services/favorites/types.ts';

const source = (await readFile(new URL('../services/favorites/guest.ts', import.meta.url), 'utf8'))
  .replace("from './types'", 'from ' + JSON.stringify(new URL('../services/favorites/types.ts', import.meta.url).href));
const ts = await import('typescript');
const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
const guest = await import('data:text/javascript;base64,' + Buffer.from(js).toString('base64'));
const target = (type = 'property', id = 1, source = 'local') => ({ type, id, source });

test('favorite identity separates type and source without accepting arbitrary entity names', () => {
  assert.equal(new Set(['property', 'new_building', 'developer_unit', 'car'].map(type => favoriteKey(target(type)))).size, 4);
  assert.notEqual(favoriteKey(target()), favoriteKey(target('property', 1, 'aura')));
  for (const value of [target('constructor'), target('__proto__'), target('developer_unit', 1, 'aura'), target('property', 1.1), target('property', 0), target('property', Number.MAX_SAFE_INTEGER + 1), target('property', 1, 'other'), null]) assert.equal(validFavoriteTarget(value), false);
});

test('guest add/remove and roundtrip preserve independent targets and enforce the limit', () => {
  let entries = [];
  for (const type of ['property', 'new_building', 'developer_unit']) entries = guest.changeGuestFavorites(entries, target(type), true, type);
  entries = guest.changeGuestFavorites(entries, target('new_building'), true, 'new-revision');
  assert.equal(entries.length, 3);
  assert.deepEqual(guest.parseGuestFavorites(guest.serializeGuestFavorites(entries)), { entries, error: null });
  entries = guest.changeGuestFavorites(entries, target('property'), false, 'remove');
  assert.deepEqual(entries.map(entry => entry.target.type).sort(), ['developer_unit', 'new_building']);
  const full = Array.from({ length: 100 }, (_, i) => ({ target: target('property', i + 1), revision: String(i) }));
  assert.throws(() => guest.changeGuestFavorites(full, target('new_building'), true, 'new'), /100/);
  assert.equal(guest.changeGuestFavorites(full, target(), false, 'remove').length, 99);
});

test('merge acknowledgement removes only the exact sent revision and keeps temporary failures', () => {
  const sent = [
    { target: target(), revision: 'one' }, { target: target('new_building'), revision: 'two' },
    { target: target('developer_unit'), revision: 'three' },
  ];
  const results = [ { ...target(), result: 'saved' }, { ...target('new_building'), result: 'unavailable' }, { ...target('developer_unit'), result: 'temporarily_unavailable' } ];
  assert.deepEqual(guest.acknowledgeGuestMerge(sent, sent, results), [sent[2]]);
  const current = [{ ...sent[0], revision: 'added-again' }, ...sent.slice(1), { target: target('car'), revision: 'later' }];
  assert.deepEqual(guest.acknowledgeGuestMerge(current, sent, results), [current[0], current[2], current[3]]);
  assert.deepEqual(guest.acknowledgeGuestMerge(current, sent, []), current);
});

test('malformed or unavailable guest storage is reported without overwriting saved bytes', async () => {
  for (const raw of ['bad', '{}', '{"version":2,"entries":[]}', JSON.stringify({ version: 1, entries: [{ target: target('user'), revision: 'x' }] })]) assert.ok(guest.parseGuestFavorites(raw).error);
  assert.deepEqual(guest.parseGuestFavorites(''), { entries: [], error: null });
  let writes = 0;
  globalThis.window = { localStorage: { getItem: () => 'corrupt', setItem: () => { writes++; } }, dispatchEvent: () => {} };
  const restore = mockLocks();
  try { await assert.rejects(guest.updateGuestFavorites(() => []), /прочитать/); assert.equal(writes, 0); }
  finally { delete globalThis.window; restore(); }
});


function mockLocks() {
  const original = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
  let tail = Promise.resolve();
  Object.defineProperty(globalThis, 'navigator', { configurable: true, value: { locks: {
    request(_name, _options, callback) {
      const next = tail.then(callback); tail = next.catch(() => {}); return next;
    },
  } } });
  return () => { if (original) Object.defineProperty(globalThis, 'navigator', original); else delete globalThis.navigator; };
}
function mockStorage() {
  let raw = '';
  globalThis.window = { localStorage: { getItem: () => raw, setItem: (_key, value) => { raw = value; } }, dispatchEvent: () => {} };
  return () => guest.parseGuestFavorites(raw).entries;
}

test('concurrent guest writers read after acquiring the shared lock and preserve both targets', async () => {
  const restore = mockLocks(), entries = mockStorage();
  try {
    await Promise.all([
      guest.updateGuestFavorites(rows => guest.changeGuestFavorites(rows, target(), true, 'a')),
      guest.updateGuestFavorites(rows => guest.changeGuestFavorites(rows, target('new_building'), true, 'b')),
    ]);
    assert.deepEqual(entries().map(row => row.target.type), ['property', 'new_building']);
  } finally { restore(); delete globalThis.window; }
});

test('queued merges reread acknowledged storage and do not resurrect a removed account favorite', async () => {
  const restore = mockLocks(), entries = mockStorage();
  try {
    await guest.updateGuestFavorites(rows => guest.changeGuestFavorites(rows, target(), true, 'a'));
    const server = new Set(); let requests = 0;
    const merge = () => guest.withGuestFavoritesLock(async store => {
      const sent = store.read().entries;
      for (const row of sent) { await Promise.resolve(); requests++; server.add(favoriteKey(row.target)); }
      store.update(current => guest.acknowledgeGuestMerge(current, sent, sent.map(row => ({ ...row.target, result: 'saved' }))));
    });
    await Promise.all([merge(), guest.withGuestFavoritesLock(async () => { server.delete(favoriteKey(target())); }), merge()]);
    assert.equal(requests, 1); assert.equal(server.size, 0); assert.deepEqual(entries(), []);
    // A failed merge releases its lock without clearing unsent records.
    await guest.updateGuestFavorites(rows => guest.changeGuestFavorites(rows, target(), true, 'retry'));
    await assert.rejects(guest.withGuestFavoritesLock(async () => { throw new Error('offline'); }), /offline/);
    assert.equal(entries().length, 1);
    await merge(); assert.equal(server.size, 1); assert.deepEqual(entries(), []);
  } finally { restore(); delete globalThis.window; }
});

const filterSource = (await readFile(new URL('../services/favorites/filter.ts', import.meta.url), 'utf8'));
const filterJS = ts.transpileModule(filterSource, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
const { filterGuestFavorites } = await import('data:text/javascript;base64,' + Buffer.from(filterJS).toString('base64'));
test('guest deal counts precede pagination, retain unknown items, and combine with target type', () => {
  const rows = Array.from({ length: 45 }, (_, i) => ({ ...target('property', i + 1), state: 'visible', item: { offer_type: i < 23 ? 'rent' : 'sale' } }));
  rows.push({ ...target('property', 90), state: 'temporarily_unavailable', item: null });
  rows.push({ ...target('new_building'), state: 'unavailable', item: null });
  const result = filterGuestFavorites(rows, 2, undefined, 'rent');
  assert.equal(result.data.length, 3); assert.equal(result.meta.total, 23);
  assert.deepEqual(result.meta.deals, { sale: 23, rent: 23, unknown: 1 });
  assert.equal(filterGuestFavorites(rows, 1, 'new_building', 'sale').meta.total, 1);
  assert.equal(filterGuestFavorites(rows, 1, 'property', 'unknown').data[0].id, 90);
});
