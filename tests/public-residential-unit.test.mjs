import { videoFrameBlocked, videoLinks } from '../services/new-buildings/videos.ts';
import { residentialDateInput, residentialDateLabel } from '../services/new-buildings/dates.ts';
import { QueryClient, QueryObserver } from '@tanstack/react-query';
import { invalidatePublicInventory } from '../services/new-buildings/invalidate-public-inventory.ts';
import { refreshManagedConflict } from '../services/new-buildings/managed-conflict.ts';
import { serverLoadObservation, observeResidentialServerLoad } from '../services/new-buildings/server-observation.ts';
import { residentialEvents, residentialEventPayload, sendResidentialEvent, analyticsPage, residentialFreshness, measureResidentialLoad, residentialResourceFailure } from '../services/new-buildings/analytics.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { formatResidentialDecimal, unitFloorLabel, unitPrimaryActionLabel, unitTitle, unitPrice, unitCoordinates, unitIntents, unitFilterContext, unitSelectionHref, quoteFromConflict, sameUnitQuote } from '../services/new-buildings/public-unit.ts';
import { fetchPublicUnit, fetchSimilarUnits, PublicUnitError } from '../services/new-buildings/public-unit-api.ts';
import { publicUnitPreflight, publicBuildingPreflight } from '../services/new-buildings/public-unit-preflight.ts';
import { fetchPublicBuilding, fetchBuildingGallery, fetchPublicMasterplan, fetchPublicNearbyPlaces, fetchPublicVideos, PublicBuildingError } from '../services/new-buildings/public-building-api.ts';
import { nearbyDistance } from '../services/new-buildings/nearby-places.ts';
import { buildingLocationMarkers, hasReadyMapTile } from '../services/new-buildings/building-location-map.ts';
import { fetchPaymentPrograms, fetchPaymentUnits, calculatePayment, PaymentProgramError } from '../services/new-buildings/payment-program-api.ts';
import { paymentTargetState } from '../services/new-buildings/payment-programs.ts';
import { observeContactSections } from '../services/new-buildings/contact-bar.ts';
import { fetchBuildingReviews } from '../services/new-buildings/reviews.ts';
import { buildingSections, buildingUpdatedLabel, residentialInventoryLabel } from '../services/new-buildings/public-building.ts';
import { readUnitSelection, selectionQuery, selectionNavigation, unitApiQuery, changeSelection, toggleSelectionValue, selectionValues } from '../services/new-buildings/unit-selection.ts';
import { fetchUnitSelection } from '../services/new-buildings/unit-selection-api.ts';
import { residentialV2Enabled, residentialV2OnlyPath, residentialRolloutHref, residentialRolloutUnavailableHtml } from '../services/new-buildings/rollout.ts';

test('contact bar stays hidden while any form section is visible across partial observer updates', t => {
  let notify, disconnected = false;
  const observed = [], states = [], contact = {}, purchase = {}, reviews = {};
  const original = Object.getOwnPropertyDescriptor(globalThis, 'IntersectionObserver');
  t.after(() => {
    if (original) Object.defineProperty(globalThis, 'IntersectionObserver', original);
    else delete globalThis.IntersectionObserver;
  });
  Object.defineProperty(globalThis, 'IntersectionObserver', { configurable: true, value: class {
    constructor(callback) { notify = callback; }
    observe(target) { observed.push(target); }
    disconnect() { disconnected = true; }
  } });
  const stop = observeContactSections([contact, null, purchase, reviews], value => states.push(value));
  assert.deepEqual(observed, [contact, purchase, reviews]);
  assert.deepEqual(states, [false]);
  notify([contact, purchase, reviews].map(target => ({ target, isIntersecting: false })));
  notify([{ target: purchase, isIntersecting: true }]);
  notify([{ target: contact, isIntersecting: true }, { target: purchase, isIntersecting: false }]);
  notify([{ target: reviews, isIntersecting: true }]);
  notify([{ target: contact, isIntersecting: false }]);
  notify([{ target: reviews, isIntersecting: false }]);
  assert.deepEqual(states, [false, true, false, false, false, false, true]);
  stop();
  assert.equal(disconnected, true);
});

test('selected payment lot requires its own fresh identity and version even when cached data survives an error', () => {
  const target = { id: 2, version: 6, total_price: '400000.01', discount_price: null, currency: 'TJS', availability_status: 'available' };
  for (const [current, failed] of [[null, false], [target, true], [{ ...target, id: 3 }, false], [{ ...target, version: 5 }, false]]) {
    assert.deepEqual(paymentTargetState(target, current, failed), { unavailable: true, changed: null });
  }
  assert.deepEqual(paymentTargetState(target, { ...target }), { unavailable: false, changed: null });
  assert.equal(target.version, 6);
  // A manual estimate for a building-wide program does not depend on candidate loading.
  assert.deepEqual(paymentTargetState(null, null, true), { unavailable: false, changed: null });
});

test('primary unit action uses the same status-specific intent vocabulary as the form', () => {
  assert.equal(unitPrimaryActionLabel('available'), 'Уточнить наличие');
  assert.equal(unitPrimaryActionLabel('reserved'), 'Сообщить, если освободится');
  assert.equal(unitPrimaryActionLabel('sold'), 'Подобрать похожую');
});

test('payment quote changes require explicit acceptance independently of the candidates page', () => {
  const target = { id: 2, version: 6, total_price: '400000.01', discount_price: null, currency: 'TJS', availability_status: 'available' };
  for (const current of [{ ...target, version: 7, total_price: '450000.01' }, { ...target, version: 7, availability_status: 'sold' }, { ...target, version: 7, discount_price: '399999.99' }]) {
    assert.deepEqual(paymentTargetState(target, current), { unavailable: false, changed: current });
    assert.deepEqual(paymentTargetState(current, current), { unavailable: false, changed: null });
  }
});

test('verification calendar date survives UTC serialization and repeated editor saves', () => {
  const apiValue = '2026-08-28T19:00:00.000000Z';
  assert.equal(residentialDateInput(apiValue), '2026-08-29');
  assert.equal(residentialDateLabel(apiValue), '29.08.2026');
  const date = residentialDateInput(apiValue);
  assert.equal(residentialDateInput(`${date}T00:00:00+05:00`), date);
  assert.equal(residentialDateInput('2026-08-28T18:59:59Z'), '2026-08-28');
  assert.equal(residentialDateInput('2026-12-31T19:00:00Z'), '2027-01-01');
  assert.equal(residentialDateLabel('2024-02-28T19:00:00Z'), '29.02.2024');
  assert.equal(residentialDateInput('2026-08-29'), '2026-08-29');
});

test('missing or invalid verification dates do not invent an input value or public date', () => {
  for (const value of [null, undefined, '', 'not-a-date']) {
    assert.equal(residentialDateInput(value), '');
    assert.equal(residentialDateLabel(value), null);
  }
});

test('committed inventory refreshes active public projections and marks inactive matching data stale', async () => {
  const cache = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
  const keys = [['public-building', 12], ['public-unit', 12, 7], ['residential-selection', 12, 'units', 'rooms=2'],
    ['residential-selection', 12, 'unit-facets', 'rooms=2'], ['residential-selection', 12, 'availability-grid', ''],
    ['public-building-gallery', 12, 4], ['public-unit-drawings', 12, 7, 4], ['public-masterplan', 12, 4],
    ['residential-catalog', '', ''], ['residential-catalog', 'map', 'rooms=2'], ['similar-units', 99, 8],
    ['public-payment-programs', 12], ['payment-units', 8, 1]];
  const unrelated = [['public-building', 99], ['public-unit', 99, 8], ['residential-selection', 99, 'units', ''],
    ['public-building-gallery', 99, 4], ['public-unit-drawings', 99, 8, 4], ['public-masterplan', 99, 4], ['profile', 1]];
  const inactive = ['public-unit', 12, 9];
  const subscriptions = [];
  let version = 1;
  try {
    for (const key of [...keys, ...unrelated, inactive]) cache.setQueryData(key, { version: 1 });
    for (const queryKey of keys) subscriptions.push(new QueryObserver(cache, { queryKey, staleTime: Infinity,
      queryFn: async () => ({ version }) }).subscribe(() => {}));
    version = 2;
    await invalidatePublicInventory(cache, 12);
    for (const key of keys) assert.equal(cache.getQueryData(key).version, 2, JSON.stringify(key));
    for (const key of unrelated) {
      assert.equal(cache.getQueryData(key).version, 1);
      assert.equal(cache.getQueryState(key).isInvalidated, false);
    }
    assert.equal(cache.getQueryData(inactive).version, 1);
    assert.equal(cache.getQueryState(inactive).isInvalidated, true);
  } finally { subscriptions.forEach(unsubscribe => unsubscribe()); cache.clear(); }
});

test('every building block and structure mutation reaches the common public convergence boundary', () => {
  const hooks = readFileSync(new URL('../services/new-buildings/hooks.ts', import.meta.url), 'utf8');
  const structure = readFileSync(new URL('../services/new-buildings/structure.ts', import.meta.url), 'utf8');
  const block = (source, declaration) => {
    const starts = [`export const ${declaration}`, `export function ${declaration}`]
      .map(pattern => source.indexOf(pattern)).filter(index => index >= 0);
    const start = starts.length ? Math.min(...starts) : -1;
    assert.notEqual(start, -1, declaration);
    const ends = ['\nexport const ', '\nexport function '].map(pattern => source.indexOf(pattern, start + 1)).filter(index => index >= 0);
    const end = ends.length ? Math.min(...ends) : -1;
    return source.slice(start, end < 0 ? undefined : end);
  };
  for (const mutation of ['useCreateNewBuilding', 'useUpdateNewBuilding', 'useDeleteNewBuilding',
    'useAttachFeature', 'useDetachFeature', 'useCreateBuildingBlock', 'useUpdateBuildingBlock', 'useDeleteBuildingBlock']) {
    assert.match(block(hooks, mutation), /invalidatePublicInventory/, mutation);
  }
  for (const mutation of ['useSaveStructure', 'useChangeDrawing', 'useSaveGridSpace', 'useSaveFloorRegion']) {
    assert.match(block(structure, mutation), /invalidateStructure/, mutation);
    assert.match(block(structure, mutation), /refreshManagedConflict/, mutation + ' conflict');
  }
  for (const mutation of ['useUpdateNewBuilding', 'useDeleteNewBuilding', 'useAttachFeature', 'useDetachFeature',
    'useUpdateBuildingBlock', 'useDeleteBuildingBlock', 'useUpdateBuildingUnit', 'useDeleteBuildingUnit',
    'useUploadUnitPhoto', 'useDeleteUnitPhoto', 'useReorderUnitPhotos', 'useSetUnitPhotoCover',
    'useUploadNewBuildingPhoto', 'useDeleteNewBuildingPhoto', 'useReorderNewBuildingPhotos', 'useSetNewBuildingPhotoCover']) {
    assert.match(block(hooks, mutation), /refreshManagedConflict/, mutation + ' conflict');
  }
  assert.match(structure, /function invalidateStructure[\s\S]*invalidatePublicInventory\(cache, buildingId\)/);
});

test('managed conflict refreshes authoritative editor snapshots only for HTTP 409', async () => {
  const cache = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
  const affected = [['manage-new-buildings', 12], ['new-buildings', 12, 'units', 7], ['residential-structure', 12, 'layouts']];
  const unrelated = ['new-buildings', 99];
  for (const key of [...affected, unrelated]) cache.setQueryData(key, { version: 1 });
  assert.equal(await refreshManagedConflict({ isAxiosError: true, response: { status: 422 } }, cache, 12), false);
  for (const key of affected) assert.equal(cache.getQueryState(key).isInvalidated, false);
  assert.equal(await refreshManagedConflict({ isAxiosError: true, response: { status: 409 } }, cache, 12), true);
  for (const key of affected) assert.equal(cache.getQueryState(key).isInvalidated, true, JSON.stringify(key));
  assert.equal(cache.getQueryState(unrelated).isInvalidated, false);
  cache.clear();
});

test('public refresh cannot let an earlier in-flight response replace the committed revision', async () => {
  const cache = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
  const key = ['public-unit', 12, 7];
  cache.setQueryData(key, { version: 1 });
  const pending = [];
  const observer = new QueryObserver(cache, { queryKey: key, queryFn: ({ signal }) => new Promise(resolve => pending.push({ resolve, signal })) });
  const unsubscribe = observer.subscribe(() => {});
  try {
    assert.equal(pending.length, 1);
    const refreshing = invalidatePublicInventory(cache, 12);
    assert.equal(pending.length, 2);
    assert.equal(pending[0].signal.aborted, true);
    pending[1].resolve({ version: 2 });
    await refreshing;
    pending[0].resolve({ version: 1 });
    await Promise.resolve(); await Promise.resolve();
    assert.deepEqual(cache.getQueryData(key), { version: 2 });
  } finally { unsubscribe(); cache.clear(); }
});

test('failed public refresh keeps old data marked as error and can recover without undoing the mutation', async () => {
  const cache = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
  const key = ['public-building', 12], failure = new Error('Unavailable');
  let offline = true;
  cache.setQueryData(key, { version: 1 });
  const observer = new QueryObserver(cache, { queryKey: key, staleTime: Infinity,
    queryFn: async () => { if (offline) throw failure; return { version: 2 }; } });
  const unsubscribe = observer.subscribe(() => {});
  try {
    await invalidatePublicInventory(cache, 12);
    assert.deepEqual(cache.getQueryData(key), { version: 1 });
    assert.equal(cache.getQueryState(key).status, 'error');
    assert.equal(cache.getQueryState(key).error, failure);
    offline = false;
    await invalidatePublicInventory(cache, 12);
    assert.deepEqual(cache.getQueryData(key), { version: 2 });
    assert.equal(cache.getQueryState(key).status, 'success');
  } finally { unsubscribe(); cache.clear(); }
});

test('server observations allow only bounded operational fields without coercing private objects', () => {
  const context = { surface: 'unit', phase: 'ssr', building_id: 12, unit_id: 7,
    phone: '992900123456', url: '/?signature=private', error: new Error('Private'), search: 'Private' };
  assert.deepEqual(serverLoadObservation(context, 12.6, 503), {
    event: 'residential.server.load_result', surface: 'unit', phase: 'ssr', building_id: 12, unit_id: 7,
    duration_ms: 13, http_status: 503, outcome: 'error',
  });
  const privateObject = { toString() { throw new Error('Must not coerce'); } };
  assert.equal(serverLoadObservation({ ...context, surface: privateObject }, 1, 200), null);
  assert.equal(serverLoadObservation({ ...context, phase: privateObject }, 1, 200), null);
  for (const [duration, bounded] of [[-1, 0], [Infinity, 0], [NaN, 0], [100000, 60000]]) {
    const entry = serverLoadObservation({ ...context, building_id: '12', unit_id: 1e15 }, duration, 200.5);
    assert.equal(entry.duration_ms, bounded); assert.equal(entry.http_status, 0); assert.equal(entry.outcome, 'error');
    assert.equal('building_id' in entry, false); assert.equal('unit_id' in entry, false);
  }
});

test('server observation preserves result and error identity including logger failures', async () => {
  const context = { surface: 'building', phase: 'ssr', building_id: 12 };
  const entries = [];
  const emit = entry => entries.push(entry);
  const value = { id: 12, private: 'Not logged' };
  assert.equal(await observeResidentialServerLoad(context, async () => value, emit), value);
  const response = new Response(null, { status: 503 });
  assert.equal(await observeResidentialServerLoad({ surface: 'catalog', phase: 'sitemap' }, async () => response, emit), response);
  assert.equal(await observeResidentialServerLoad({ surface: 'unit', phase: 'preflight' }, async () => 404, emit), 404);
  const error = Object.assign(new Error('Private credentials'), { status: 502 });
  await assert.rejects(observeResidentialServerLoad(context, async () => { throw error; }, emit), e => e === error);
  assert.deepEqual(entries.map(e => [e.http_status, e.outcome]), [[200, 'success'], [503, 'error'], [404, 'error'], [502, 'error']]);
  assert.doesNotMatch(JSON.stringify(entries), /Private|credentials|Not logged/);
  const brokenLogger = () => { throw new Error('Logger unavailable'); };
  assert.equal(await observeResidentialServerLoad(context, async () => value, brokenLogger), value);
  await assert.rejects(observeResidentialServerLoad(context, async () => { throw error; }, brokenLogger), e => e === error);
  const hostileError = { get status() { throw new Error('Getter'); } };
  await assert.rejects(observeResidentialServerLoad(context, async () => { throw hostileError; }, emit), e => e === hostileError);
});

test('server observation does not emit logs in the browser', async () => {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'window');
  Object.defineProperty(globalThis, 'window', { configurable: true, value: {} });
  try {
    let calls = 0;
    assert.equal(await observeResidentialServerLoad({ surface: 'unit', phase: 'ssr' }, async () => { calls++; return 200; },
      () => assert.fail('Server logger must not run in a browser')), 200);
    assert.equal(calls, 1);
  } finally {
    if (descriptor) Object.defineProperty(globalThis, 'window', descriptor);
    else delete globalThis.window;
  }
});

test('residential rollout is default-on while explicit false preserves a safe rollback', () => {
  assert.equal(residentialV2Enabled(undefined), true);
  assert.equal(residentialV2Enabled('true'), true);
  for (const value of ['', 'false', '1', 'TRUE', ' true ']) assert.equal(residentialV2Enabled(value), false);
  for (const path of ['/new-buildings/12/units/7', '/new-buildings/12/units/', '/comparison/units', '/comparison/units/']) assert.equal(residentialV2OnlyPath(path), true);
  for (const path of ['/new-buildings', '/new-buildings/12', '/comparison', '/listings', '/apartment/12', '/admin/new-buildings/12', '/comparison/units-other']) assert.equal(residentialV2OnlyPath(path), false);
  const target = { type: 'unit', id: 7, href: '/new-buildings/12/units/7?rooms=2' };
  assert.equal(residentialRolloutHref(target.href, false), '/new-buildings/12');
  assert.equal(residentialRolloutHref(target.href, true), target.href);
  assert.deepEqual(target, { type: 'unit', id: 7, href: '/new-buildings/12/units/7?rooms=2' });
  for (const href of ['/new-buildings/12?source=aura', '/apartment/7', '/new-buildings/12-other']) assert.equal(residentialRolloutHref(href, false), href);
  assert.match(residentialRolloutUnavailableHtml(), /href="\/new-buildings"/);
  assert.match(residentialRolloutUnavailableHtml(), /noindex/);
});

test('residential telemetry constructs a whitelist payload and never forwards personal values', () => {
  const privateData = { name: 'Private Name', phone: '992900123456', email: 'private@example.test', comment: 'Private comment',
    search: 'Private search', url: '/?phone=992900123456', exception: { message: 'Private error' } };
  for (const event of residentialEvents) {
    assert.deepEqual(residentialEventPayload(event, { surface: 'selection', building_id: 12, unit_id: 7, ...privateData,
      filter_keys: ['rooms', 'search', 'rooms', 'private@example.test', { name: 'Private' }, 'window_view'] }), {
      event, surface: 'selection', building_id: 12, unit_id: 7, filter_keys: ['rooms', 'search', 'window_view'],
    });
  }
  assert.equal(residentialEventPayload('lead_accepted', { surface: 'building' }), null);
  assert.equal(residentialEventPayload('building_view', { surface: { toString: () => 'building', phone: 'private' } }), null);
  assert.deepEqual(residentialEventPayload('load_result', { surface: 'catalog', building_id: '12', unit_id: -1, block_id: 1e15,
    endpoint: { toString: () => 'units' }, outcome: 'Private', duration_ms: 999999, http_status: 200.4,
    data_age_seconds: NaN, verification_age_seconds: Infinity }), { event: 'load_result', surface: 'catalog', duration_ms: 60000, http_status: 200 });
});

test('residential telemetry omits credentials and referrer, is bounded and never retries failures', async () => {
  let calls = 0;
  const transport = async (url, init) => {
    calls++;
    assert.equal(url, 'https://api.example/api/v2/residential/events');
    assert.equal(init.credentials, 'omit'); assert.equal(init.referrerPolicy, 'no-referrer');
    assert.equal(init.cache, 'no-store'); assert.equal(init.keepalive, true);
    assert.ok(init.signal instanceof AbortSignal);
    assert.deepEqual(JSON.parse(init.body), { event: 'building_view', surface: 'building', building_id: 12 });
    return new Response(null, { status: 204 });
  };
  assert.equal(await sendResidentialEvent('https://api.example/api/', 'building_view', { surface: 'building', building_id: 12, phone: 'private' }, transport), true);
  assert.equal(await sendResidentialEvent('https://api.example/api', 'lead_accepted', { surface: 'building' }, transport), false);
  assert.equal(calls, 1);
  for (const status of [429, 503]) {
    assert.equal(await sendResidentialEvent('https://api.example/api', 'building_view', { surface: 'building' }, async () => {
      calls++; return new Response(null, { status });
    }), false);
  }
  assert.equal(await sendResidentialEvent('https://api.example/api', 'building_view', { surface: 'building' }, async () => { calls++; throw new Error('Private'); }), false);
  assert.equal(calls, 4);
});

test('external analytics suppresses private routes, arbitrary slugs and URL parameters', () => {
  for (const path of ['/admin', '/profile/900123456', '/dashboard', '/login?email=private', '/register', '/reset-password/private', '/favorites']) assert.equal(analyticsPage(path), null);
  assert.equal(analyticsPage('/new-buildings/12?phone=900123456#private'), '/new-buildings/12');
  assert.equal(analyticsPage('/new-buildings/12/units/7/'), '/new-buildings/12/units/7');
  for (const path of ['/new-buildings/private@example.test', '/about/team/private', '/search/private', '/new-buildings/12%3Fphone=private']) assert.equal(analyticsPage(path), '/other');
});

test('telemetry separates response age from verified data age without sending raw dates', () => {
  const now = Date.parse('2026-08-28T12:00:00Z');
  assert.deepEqual(residentialFreshness({ meta: { as_of: '2026-08-28T11:59:00Z' }, data_verified_at: '2026-08-27T12:00:00Z' }, now), { data_age_seconds: 60, verification_age_seconds: 86400 });
  assert.deepEqual(residentialFreshness({ as_of: '2026-08-28T13:00:00Z', building: { data_verified_at: 'Private' } }, now), { data_age_seconds: 0 });
  assert.deepEqual(residentialFreshness({ data_verified_at: null }, now), {});
});

test('load observation records timing and status, preserves data and exceptions, and ignores cancellations', async () => {
  const events = [], emit = (event, data) => events.push(residentialEventPayload(event, data));
  const result = { meta: { as_of: new Date().toISOString() }, phone: 'Private' };
  assert.equal(await measureResidentialLoad({ surface: 'selection', endpoint: 'units' }, async () => result, emit), result);
  assert.equal(events[0].outcome, 'success'); assert.ok(events[0].duration_ms >= 0); assert.equal('phone' in events[0], false);
  const error = Object.assign(new Error('Private SQL'), { status: 503 });
  await assert.rejects(measureResidentialLoad({ surface: 'selection' }, async () => { throw error; }, emit), caught => caught === error);
  assert.equal(events[1].http_status, 503); assert.equal(events[1].outcome, 'error'); assert.equal(JSON.stringify(events).includes('Private'), false);
  const controller = new AbortController(); controller.abort();
  await assert.rejects(measureResidentialLoad({ surface: 'catalog' }, async () => { throw error; }, emit, controller.signal), caught => caught === error);
  await measureResidentialLoad({ surface: 'catalog' }, async () => result, emit, controller.signal);
  assert.equal(events.length, 2);
});

test('client observation cannot turn successful loads into failures or replace their original errors', async () => {
  const data = { surface: 'building', endpoint: 'gallery', building_id: 12, phone: 'Private', url: '/?signature=Private' };
  const result = { data: ['Private'] }, original = Object.assign(new Error('Private server error'), { status: 409 });
  let calls = 0;
  const broken = () => { calls++; throw new Error('Logger failed'); };
  assert.equal(await measureResidentialLoad(data, async () => result, broken), result);
  await assert.rejects(measureResidentialLoad(data, async () => { throw original; }, broken), e => e === original);
  assert.equal(calls, 2);
  const hostile = { get status() { throw new Error('Private getter'); } };
  await assert.rejects(measureResidentialLoad(data, async () => { throw hostile; }, broken), e => e === hostile);
  const entries = [];
  await measureResidentialLoad(data, async () => result, (event, payload) => entries.push({ event, ...payload }));
  assert.equal(entries[0].http_status, 200); assert.doesNotMatch(JSON.stringify(entries), /Private|signature|url|phone/);
  const controller = new AbortController();
  await assert.rejects(measureResidentialLoad(data, async () => { controller.abort(); throw original; }, broken, controller.signal), e => e === original);
  assert.equal(calls, 2);
});

test('secondary API failures retain actionable status and emit only operational fields', async () => {
  const base = 'https://api.example/api', program = { id: 7, building: { id: 12 } };
  const operations = {
    gallery: transport => fetchBuildingGallery(base, 12, 3, 2, undefined, transport),
    masterplan: transport => fetchPublicMasterplan(base, 12, undefined, transport),
    nearby: transport => fetchPublicNearbyPlaces(base, 12, undefined, transport),
    videos: transport => fetchPublicVideos(base, 12, undefined, transport),
    'payment-programs': transport => fetchPaymentPrograms(base, { buildingId: 12 }, undefined, transport),
    'payment-units': transport => fetchPaymentUnits(base, program, 1, undefined, transport),
    'payment-calculation': transport => calculatePayment(base, program, { program_version: 1, price: '123.45', down_payment: '20', down_payment_mode: 'percent', term_months: 12 }, undefined, transport),
    similar: transport => fetchSimilarUnits(base, '12', '7', undefined, transport),
    reviews: transport => fetchBuildingReviews(base, 12, 1, undefined, transport),
  };
  for (const [endpoint, operation] of Object.entries(operations)) {
    for (const status of [404, 409, 503]) {
      const events = [];
      await assert.rejects(measureResidentialLoad({ surface: 'building', endpoint, building_id: 12, search: 'Private' },
        () => operation(async () => Response.json({ message: 'Private response', token: 'Private' }, { status })),
        (event, payload) => events.push({ event, ...payload })), error => error.status === status);
      assert.equal(events.length, 1);
      assert.equal(events[0].endpoint, endpoint); assert.equal(events[0].http_status, status); assert.equal(events[0].outcome, 'error');
      assert.doesNotMatch(JSON.stringify(events), /Private|token|search|message|price|payment_mode/);
    }
  }
});

test('SDK and player failures report once per attempt without URLs or invented status and timing', () => {
  const events = [], emit = (event, data) => events.push({ event, ...data });
  for (const endpoint of ['map-sdk', 'video-player']) {
    const data = { surface: 'building', building_id: 12, endpoint, url: 'https://private.example/?key=Private', error: new Error('Private') };
    const report = residentialResourceFailure(data, emit);
    report(); report(); report();
    residentialResourceFailure(data, emit)(); // explicit retry is a new attempt
  }
  assert.equal(events.length, 4);
  for (const event of events) {
    assert.deepEqual(Object.keys(event).sort(), ['event', 'surface', 'building_id', 'endpoint', 'outcome', 'http_status'].sort());
    assert.equal(event.outcome, 'error'); assert.equal(event.http_status, 0);
  }
  assert.doesNotMatch(JSON.stringify(events), /Private|https|url|duration/);
  let calls = 0;
  const broken = residentialResourceFailure({ surface: 'catalog', endpoint: 'map-sdk' }, () => { calls++; throw new Error('Offline'); });
  assert.doesNotThrow(() => { broken(); broken(); }); assert.equal(calls, 1);
});

test('payment programme transport preserves exact decimal input and actionable conflicts', async () => {
  await fetchPaymentPrograms('https://api.example/api/', { buildingId: 12, kind: 'mortgage', page: 2 }, undefined, async (url, init) => {
    assert.equal(url, 'https://api.example/api/v2/payment-programs?building_id=12&kind=mortgage&page=2');
    assert.equal(init.cache, 'no-store');
    return Response.json({ data: [], meta: { page: 2, total: 0, last_page: 1 } });
  });
  const input = { program_version: 3, price: '9007199254740.01', down_payment_mode: 'percent', down_payment: '20.01', term_months: 12 };
  await assert.rejects(calculatePayment('https://api.example/api', { id: 7, building: { id: 12 } }, input, undefined, async (url, init) => {
    assert.equal(url, 'https://api.example/api/v2/new-buildings/12/payment-programs/7/calculate');
    assert.equal(init.method, 'POST');
    assert.equal(init.cache, 'no-store');
    assert.deepEqual(JSON.parse(init.body), input);
    return Response.json({ code: 'program_changed', message: 'Условия изменились', current: { program_version: 4 } }, { status: 409 });
  }), error => error instanceof PaymentProgramError && error.code === 'program_changed' && error.current.program_version === 4);
  await assert.rejects(fetchPaymentPrograms('https://api.example/api', {}, undefined, async () => { throw new Error('offline'); }), error => error.status === 503);
});

test('nearby places are independently fetched and distances never invent walking time', async () => {
  const data = { version: 2, places: [] };
  assert.deepEqual(await fetchPublicNearbyPlaces('https://api.example/api/', 12, undefined, async (url, init) => {
    assert.equal(url, 'https://api.example/api/v2/new-buildings/12/nearby-places');
    assert.equal(init.cache, 'no-store');
    assert.ok(init.signal instanceof AbortSignal);
    return Response.json(data);
  }), data);
  await assert.rejects(fetchPublicNearbyPlaces('https://api.example/api', 12, undefined, async () => { throw new Error('offline'); }), error => error.status === 503);
  await assert.rejects(fetchPublicNearbyPlaces('https://api.example/api', 12, undefined, async () => new Response(null, { status: 404 })), error => error.status === 404);
  assert.equal(nearbyDistance({ distance_m: '125.25', distance_method: 'straight_line' }), '125,25 м · По прямой');
  assert.equal(nearbyDistance({ distance_m: '0.00', distance_method: 'measured' }), '0 м · Измерено на местности');
  assert.equal(nearbyDistance({ distance_m: '450', distance_method: 'walking_route' }), '450 м · По пешему маршруту');
  for (const value of [null, '-1', 'NaN']) assert.equal(nearbyDistance({ distance_m: value, distance_method: 'straight_line' }), 'Расстояние не указано');
  assert.equal(nearbyDistance({ distance_m: '12', distance_method: null }), 'Расстояние не указано');
});

test('building map exposes valid POI markers and waits for a rendered provider tile', () => {
  const place = (id, latitude, longitude) => ({ id, latitude, longitude, name: `POI ${id}`, category: 'school', source: 'fixture', distance_m: null, distance_method: null, distance_source: null, verified_at: null });
  assert.deepEqual(buildingLocationMarkers([38.57, 68.78], 'ЖК Manora', [
    place(1, '38.58', '68.79'),
    place(2, null, '68.80'),
    place(3, '91', '68.81'),
    place(4, '38.59', '181'),
  ], 1), [
    { id: null, title: 'ЖК Manora', coordinates: [38.57, 68.78], preset: 'islands#redHomeIcon' },
    { id: 1, title: 'POI 1', coordinates: [38.58, 68.79], preset: 'islands#darkGreenCircleDotIcon' },
  ]);
  assert.equal(buildingLocationMarkers([NaN, 68.78], 'ЖК Manora', [place(1, '38.58', '68.79')]).length, 0);
  assert.equal(hasReadyMapTile(1, 4), true);
  for (const snapshot of [[0, 4], [1, 0], [5, 4], ['bad', 4], [1, undefined]]) {
    assert.equal(hasReadyMapTile(snapshot[0], snapshot[1]), false);
  }
});

test('public building preflight isolates partner IDs and returns real missing/temporary statuses', async () => {
  let calls = 0;
  const transport = async (url, init) => {
    calls++;
    assert.equal(url, 'https://api.example/api/v2/new-buildings/12');
    assert.equal(init.method, 'HEAD');
    assert.equal(init.cache, 'no-store');
    return new Response(null, { status: 204 });
  };
  for (const path of ['/new-buildings', '/new-buildings/12/units/7', '/admin/new-buildings/12']) assert.equal(await publicBuildingPreflight('https://api.example/api', path, null, transport), null);
  assert.equal(await publicBuildingPreflight('https://api.example/api', '/new-buildings/12', 'aura', transport), null);
  assert.equal(await publicBuildingPreflight('https://api.example/api', '/new-buildings/no', null, transport), 404);
  assert.equal(await publicBuildingPreflight('https://api.example/api', '/new-buildings/12', 'invalid', transport), 404);
  assert.equal(calls, 0);
  assert.equal(await publicBuildingPreflight('https://api.example/api/', '/new-buildings/12/', 'local', transport), 200);
  for (const status of [404, 403, 500, 503]) assert.equal(await publicBuildingPreflight('https://api.example/api', '/new-buildings/12', null, async () => new Response(null, { status })), status === 404 ? 404 : 503);
  assert.equal(await publicBuildingPreflight('https://api.example/api', '/new-buildings/12', null, async () => { throw new Error('offline'); }), 503);
});

test('building detail and paged gallery bypass cache, reject mismatched IDs/versions and preserve aborts', async () => {
  const base = 'https://api.example/api/';
  assert.deepEqual(await fetchPublicBuilding(base, '12', undefined, async (url, init) => {
    assert.equal(url, base + 'v2/new-buildings/12');
    assert.equal(init.cache, 'no-store');
    assert.ok(init.signal);
    return Response.json({ id: 12 });
  }), { id: 12 });
  await assert.rejects(fetchPublicBuilding(base, '../12'), error => error instanceof PublicBuildingError && error.status === 404);
  await assert.rejects(fetchPublicBuilding(base, '12', undefined, async () => Response.json({ id: 13 })), error => error.status === 502);
  await assert.rejects(fetchPublicBuilding(base, '12', undefined, async () => { throw new TypeError('offline'); }), error => error.status === 503);
  for (const status of [404, 500]) await assert.rejects(fetchPublicBuilding(base, '12', undefined, async () => new Response(null, { status })), error => error.status === status);
  const gallery = { data: [{ id: 7 }], meta: { version: 3, page: 2 } };
  assert.deepEqual(await fetchBuildingGallery(base, 12, 3, 2, undefined, async (url, init) => {
    assert.equal(url, base + 'v2/new-buildings/12/photos?version=3&page=2&per_page=6');
    assert.equal(init.cache, 'no-store');
    return Response.json(gallery);
  }), gallery);
  await assert.rejects(fetchBuildingGallery(base, 12, 4, 2, undefined, async () => Response.json(gallery)), error => error.status === 409);
  const controller = new AbortController(); controller.abort();
  const abort = new DOMException('Cancelled', 'AbortError');
  await assert.rejects(fetchPublicBuilding(base, '12', controller.signal, async (_, init) => { assert.equal(init.signal.aborted, true); throw abort; }), error => error === abort);
});

test('building navigation omits absent sections; dates prefer edits over creation without inventing recency', () => {
  const empty = { description: null, advantages: [], city: null, address: null, latitude: null, longitude: null };
  assert.deepEqual(buildingSections(empty).map(section => section.id), ['characteristics', 'apartments', 'reviews', 'contacts']);
  assert.deepEqual(buildingSections({ ...empty, has_videos: true, has_payment_programs: true }).map(section => section.id), ['characteristics', 'apartments', 'videos', 'payment-programs', 'reviews', 'contacts']);
  assert.deepEqual(buildingSections({ ...empty, has_masterplan: true }).map(section => section.id), ['characteristics', 'apartments', 'masterplan', 'reviews', 'contacts']);
  assert.deepEqual(buildingSections({ ...empty, has_payment_programs: true }).map(section => section.id), ['characteristics', 'apartments', 'payment-programs', 'reviews', 'contacts']);
  assert.deepEqual(buildingSections({ ...empty, has_nearby_places: true }).map(section => section.id), ['characteristics', 'apartments', 'location', 'reviews', 'contacts']);
  assert.deepEqual(buildingSections({ ...empty, advantages: ['Двор'], latitude: '0', longitude: '0' }).map(section => section.id), ['characteristics', 'apartments', 'description', 'location', 'reviews', 'contacts']);
  assert.equal(buildingUpdatedLabel({ updated_at: '2026-08-28T06:00:00Z', created_at: '2020-01-01', as_of: '2026-08-28T08:00:00Z' }), 'Сегодня');
  assert.equal(buildingUpdatedLabel({ updated_at: null, created_at: '2026-08-27T06:00:00Z', as_of: '2026-08-28T08:00:00Z' }), 'Вчера');
  assert.equal(buildingUpdatedLabel({ updated_at: null, created_at: null, as_of: '2026-08-28' }), null);
  assert.equal(buildingUpdatedLabel({ updated_at: 'invalid', created_at: null, as_of: '2026-08-28' }), null);
  assert.equal(residentialInventoryLabel(0), 'Нет доступных квартир');
  assert.equal(residentialInventoryLabel(12), 'Свободных квартир: 12');
  const next = selectionNavigation('rooms=2&price_max=500000&entrance_id=4&page=7&view=chessboard', changeSelection(readUnitSelection(new URLSearchParams('rooms=2&price_max=500000&entrance_id=4&page=7&view=chessboard')), 'block_id', '3'));
  assert.deepEqual(Object.fromEntries(new URLSearchParams(next)), { rooms: '2', price_max: '500000', view: 'chessboard', block_id: '3' });
});

test('masterplan loads independently without caching and does not substitute an image on failure', async () => {
  const plan = { version: 4, image: { id: 2, alt: 'Генплан' }, blocks: [], regions: [] };
  assert.deepEqual(await fetchPublicMasterplan('https://api.example/api/', 12, undefined, async (url, init) => {
    assert.equal(url, 'https://api.example/api/v2/new-buildings/12/masterplan');
    assert.equal(init.cache, 'no-store');
    assert.ok(init.signal);
    return Response.json(plan);
  }), plan);
  await assert.rejects(fetchPublicMasterplan('https://api.example/api', 12, undefined, async () => new Response(null, { status: 404 })), error => error.status === 404);
  await assert.rejects(fetchPublicMasterplan('https://api.example/api', 12, undefined, async () => { throw new TypeError('offline'); }), error => error.status === 503);
});

test('selection fetch preserves field validation errors, bypasses cache and propagates cancellation', async () => {
  const controller = new AbortController();
  const request = transport => fetchUnitSelection('https://api.example/api/', 1, 'units', unitApiQuery({ rooms: '2' }), controller.signal, transport);
  assert.deepEqual(await request(async (url, init) => {
    assert.equal(url, 'https://api.example/api/v2/new-buildings/1/units?rooms=2&per_page=20');
    assert.equal(init.cache, 'no-store');
    assert.ok(init.signal);
    return Response.json({ data: [] });
  }), { data: [] });
  await assert.rejects(request(async () => Response.json({ errors: { price_max: ['Верхняя граница'] } }, { status: 422 })), error => error.status === 422 && error.fields.price_max[0] === 'Верхняя граница');
  await assert.rejects(request(async () => new Response('', { status: 404 })), error => error.status === 404);
  await assert.rejects(request(async () => { throw new TypeError('offline'); }), error => error.status === 503);
  controller.abort();
  const abort = new DOMException('Cancelled', 'AbortError');
  await assert.rejects(request(async (_url, init) => { assert.equal(init.signal.aborted, true); throw abort; }), error => error === abort);
});

test('selection URL preserves OR arrays, decimal commas, geometry windows and explicit invalid ranges', () => {
  const value = readUnitSelection(new URLSearchParams('rooms[]=0&rooms[]=4%2B&finishing[]=Без отделки&finishing[]=Чистовая, белая&exclude_last_floor=1&price_min=bad&area_min=60&area_max=40&grid_floor_page=2&view=chessboard&token=secret'));
  assert.equal(value.rooms, '0,4+');
  assert.equal(value.price_min, 'bad');
  assert.equal(value.not_last, '1');
  assert.deepEqual(selectionValues(value, 'finishing'), ['Без отделки', 'Чистовая, белая']);
  assert.deepEqual(readUnitSelection(new URLSearchParams(selectionQuery(value))), value);
  const query = new URLSearchParams(unitApiQuery(value));
  assert.equal(query.get('per_page'), '20');
  assert.equal(query.has('view'), false);
  assert.equal(query.has('token'), false);
  const context = unitFilterContext(new URLSearchParams(selectionQuery(value)));
  assert.deepEqual(selectionValues(context, 'finishing'), ['Без отделки', 'Чистовая, белая']);
  assert.equal(context.grid_floor_page, '2');
  assert.equal(context.price_min, undefined);
});

test('filter changes reset pagination and related entrance; view switches preserve all conditions', () => {
  const initial = { block_id: '1', entrance_id: '3', page: '5', grid_floor_page: '2', grid_position_page: '3', not_last: '1', rooms: '2' };
  assert.deepEqual(changeSelection(initial, 'view', 'chessboard'), { ...initial, view: 'chessboard' });
  assert.deepEqual(changeSelection(initial, 'block_id', '2'), { block_id: '2', not_last: '1', rooms: '2' });
  const last = changeSelection(initial, 'only_last', '1');
  assert.equal(last.not_last, undefined);
  assert.equal(last.only_last, '1');
  let options = toggleSelectionValue(initial, 'window_view', 'Двор');
  options = toggleSelectionValue(options, 'window_view', 'Горы');
  options = toggleSelectionValue(options, 'window_view', 'Двор');
  assert.deepEqual(selectionValues(options, 'window_view'), ['Горы']);
  const navigation = new URLSearchParams(selectionNavigation('source=local&rooms[]=2&exclude_last_floor=1&finishing[]=Старая&page=7', { rooms: '3', view: 'list' }));
  assert.deepEqual(Object.fromEntries(navigation), { source: 'local', rooms: '3', view: 'list' });
});

test('public apartment formatting preserves decimals and distinguishes unknowns from studio and zero', () => {
  assert.equal(formatResidentialDecimal('9007199254740.01'), '9\u00a0007\u00a0199\u00a0254\u00a0740,01');
  assert.equal(formatResidentialDecimal('45.10'), '45,1');
  assert.equal(formatResidentialDecimal(null), 'Не указано');
  assert.equal(unitPrice(null), 'По запросу');
  assert.equal(unitTitle({ rooms: 0, area: '45.01', floor: 0 }), 'Студия, 45,01 м², 0 этаж');
  assert.equal(unitTitle({ rooms: null, area: null, floor: null }), 'Квартира');
  assert.equal(unitFloorLabel({ floor: 8, entrance: { residential_floor_to: 8 } }), '8 из 8');
  assert.equal(unitFloorLabel({ floor: 8, entrance: { residential_floor_to: null } }), '8 · этажность подъезда не указана');
  assert.equal(unitFloorLabel({ floor: 8, entrance: null }), '8 · этажность подъезда не указана');
  assert.equal(unitFloorLabel({ floor: null, entrance: { residential_floor_to: 8 } }), 'Не указан');
  assert.equal(unitCoordinates({ latitude: null, longitude: '68' }), null);
  assert.equal(unitCoordinates({ latitude: '', longitude: '68' }), null);
  assert.deepEqual(unitCoordinates({ latitude: 0, longitude: 0 }), [0, 0]);
  assert.equal(unitCoordinates({ latitude: 91, longitude: 68 }), null);
});

test('only available units offer viewing; conflicts preserve exact terms and reject incomplete snapshots', () => {
  assert.deepEqual(unitIntents('reserved'), ['availability_notification', 'similar_selection']);
  assert.deepEqual(unitIntents('sold'), ['similar_selection']);
  assert.deepEqual(unitIntents('available'), ['availability', 'viewing']);
  const quote = quoteFromConflict({ unit_id: 7, unit_version: 4, total_price: '500000.01', discount_price: '450000.00', currency: 'TJS', availability_status: 'reserved' });
  assert.equal(quote.total_price, '500000.01');
  assert.equal(sameUnitQuote(quote, { ...quote }), true);
  assert.equal(sameUnitQuote(quote, { ...quote, discount_price: '450000.01' }), false);
  assert.equal(sameUnitQuote(quote, { ...quote, version: 5 }), false);
  assert.equal(quoteFromConflict({ unit_id: 7, unit_version: 4 }), null);
});

test('return link and CRM selection discard unrelated parameters and unsafe redirect URLs', () => {
  const filters = unitFilterContext(new URLSearchParams('rooms=0,2&area_min=45,01&include_reserved=1&view=chessboard&page=3&phone=900000001&token=secret&return=https://evil.example&block_id=-1&floor_max=9x'));
  assert.deepEqual(filters, { rooms: '0,2', area_min: '45,01', include_reserved: '1', page: '3', view: 'chessboard' });
  const href = unitSelectionHref(12, { ...filters, source: 'aura', token: 'secret' });
  assert.ok(href.startsWith('/new-buildings/12?'));
  assert.ok(href.endsWith('#apartments'));
  assert.ok(!href.includes('secret') && !href.includes('aura'));
});

test('public fetch is uncached, validates nesting and distinguishes 404, server error and network error', async () => {
  const expected = { id: 7, new_building_id: 12, building: { id: 12 } };
  let requests = 0;
  const transport = async (url, init) => {
    requests++;
    assert.equal(url, 'https://api.example/api/v2/new-buildings/12/units/7');
    assert.equal(init.cache, 'no-store');
    assert.equal(init.headers.Accept, 'application/json');
    assert.ok(init.signal);
    return Response.json(expected);
  };
  assert.deepEqual(await fetchPublicUnit('https://api.example/api/', '12', '7', undefined, transport), expected);
  await assert.rejects(fetchPublicUnit('https://api.example/api', '../12', '7', undefined, transport), error => error instanceof PublicUnitError && error.status === 404);
  assert.equal(requests, 1);
  for (const status of [404, 500, 503]) {
    await assert.rejects(fetchPublicUnit('https://api.example/api', '12', '7', undefined, async () => new Response('', { status })), error => error.status === status);
  }
  await assert.rejects(fetchPublicUnit('https://api.example/api', '12', '7', undefined, async () => Response.json({ ...expected, new_building_id: 13 })), error => error.status === 502);
  await assert.rejects(fetchPublicUnit('https://api.example/api', '12', '7', undefined, async () => { throw new TypeError('offline'); }), TypeError);
});

test('preflight only checks apartment paths and keeps missing and temporary failures distinct', async () => {
  let requests = 0;
  const transport = async (url, init) => {
    requests++;
    assert.equal(url, 'https://api.example/api/v2/new-buildings/12/units/7');
    assert.equal(init.method, 'HEAD');
    assert.equal(init.cache, 'no-store');
    return new Response(null, { status: 204 });
  };
  assert.equal(await publicUnitPreflight('https://api.example/api', '/new-buildings', null, transport), null);
  assert.equal(await publicUnitPreflight('https://api.example/api', '/new-buildings/12/units/7', 'aura', transport), 404);
  assert.equal(await publicUnitPreflight('https://api.example/api', '/new-buildings/a/units/7', null, transport), 404);
  assert.equal(requests, 0);
  assert.equal(await publicUnitPreflight('https://api.example/api', '/new-buildings/12/units/7', null, transport), 200);
  assert.equal(requests, 1);
  for (const status of [404, 403, 500, 503]) {
    assert.equal(await publicUnitPreflight('https://api.example/api', '/new-buildings/12/units/7', null, async () => new Response(null, { status })), status === 404 ? 404 : 503);
  }
  assert.equal(await publicUnitPreflight('https://api.example/api', '/new-buildings/12/units/7', null, async () => { throw new TypeError('offline'); }), 503);
});

test('video CSP failures match only enforced frame restrictions for the current provider origin', () => {
  const embed = 'https://www.youtube-nocookie.com/embed/M7lc1UVf-VE?autoplay=0&playsinline=1';
  const event = { disposition: 'enforce', effectiveDirective: 'frame-src', blockedURI: embed };
  assert.equal(videoFrameBlocked(event, embed), true);
  assert.equal(videoFrameBlocked({ ...event, blockedURI: 'https://www.youtube-nocookie.com' }, embed), true);
  assert.equal(videoFrameBlocked({ ...event, blockedURI: 'https://player.vimeo.com' }, 'https://player.vimeo.com/video/123?autoplay=0&dnt=1'), true);
  for (const changed of [{ disposition: 'report' }, { effectiveDirective: 'script-src-elem' }, { effectiveDirective: 'img-src' },
    { blockedURI: 'https://player.vimeo.com' }, { blockedURI: 'https://www.youtube-nocookie.com.evil.test' },
    { blockedURI: 'http://www.youtube-nocookie.com' }, { blockedURI: '' }, { blockedURI: 'inline' }]) {
    assert.equal(videoFrameBlocked({ ...event, ...changed }, embed), false);
  }
  assert.equal(videoFrameBlocked(event, 'invalid'), false);
});

test('video transport is isolated and iframe sink rejects noncanonical URLs', async () => {
  const video = { provider: 'youtube', source_url: 'https://www.youtube.com/watch?v=M7lc1UVf-VE', embed_url: 'https://www.youtube-nocookie.com/embed/M7lc1UVf-VE?autoplay=0&playsinline=1' };
  assert.deepEqual(videoLinks(video), { source: video.source_url, embed: video.embed_url });
  const vimeo = { provider: 'vimeo', source_url: 'https://vimeo.com/123/5e2d1c1e6d', embed_url: 'https://player.vimeo.com/video/123?h=5e2d1c1e6d&autoplay=0&dnt=1' };
  assert.deepEqual(videoLinks(vimeo), { source: vimeo.source_url, embed: vimeo.embed_url });
  for (const changed of [{ provider: 'other' }, { source_url: 'javascript:alert(1)' }, { source_url: video.source_url + '\n' },
    { embed_url: video.embed_url.replace('autoplay=0', 'autoplay=1') }, { embed_url: 'https://evil.test/embed/M7lc1UVf-VE' },
    { embed_url: video.embed_url.replace('youtube-nocookie.com', 'youtube-nocookie.com.evil.test') }, { embed_url: null }]) assert.equal(videoLinks({ ...video, ...changed }), null);
  assert.equal(videoLinks({ ...vimeo, embed_url: vimeo.embed_url.replace('5e2d1c1e6d', 'aaaaaaaaaa') }), null);
  const result = { version: 3, videos: [video] };
  assert.deepEqual(await fetchPublicVideos('https://api.example/api/', 12, undefined, async (url, init) => {
    assert.equal(url, 'https://api.example/api/v2/new-buildings/12/videos');
    assert.equal(init.cache, 'no-store');
    assert.ok(init.signal instanceof AbortSignal);
    return Response.json(result);
  }), result);
  await assert.rejects(fetchPublicVideos('https://api.example/api', 12, undefined, async () => { throw new Error('offline'); }), error => error.status === 503);
  await assert.rejects(fetchPublicVideos('https://api.example/api', 12, undefined, async () => new Response(null, { status: 404 })), error => error.status === 404);
});


const { readFile } = await import('node:fs/promises');
const comparisonSource = (await readFile(new URL('../services/new-buildings/unit-comparison.ts', import.meta.url), 'utf8'))
  .replace("from './completion'", 'from ' + JSON.stringify(new URL('../services/new-buildings/completion.ts', import.meta.url).href))
  .replace("from './public-unit'", 'from ' + JSON.stringify(new URL('../services/new-buildings/public-unit.ts', import.meta.url).href));
const ts = await import('typescript');
const comparisonJS = ts.transpileModule(comparisonSource, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
const comparison = await import('data:text/javascript;base64,' + Buffer.from(comparisonJS).toString('base64'));

test('unit comparison keeps typed nested references, rejects a fifth unit without dropping earlier choices', () => {
  const first = { buildingId: 1, unitId: 1 };
  let units = comparison.changeUnitComparison([], first, true);
  units = comparison.changeUnitComparison(units, first, true);
  assert.equal(units.length, 1);
  for (let id = 2; id <= 4; id++) units = comparison.changeUnitComparison(units, { buildingId: id, unitId: id }, true);
  assert.throws(() => comparison.changeUnitComparison(units, { buildingId: 5, unitId: 5 }, true), /до 4/);
  assert.equal(units.length, 4);
  assert.equal(comparison.changeUnitComparison(units, first, false).length, 3);
  assert.equal(comparison.unitReferenceHref(first), '/new-buildings/1/units/1');
  assert.deepEqual(comparison.parseUnitComparison(JSON.stringify({ version: 1, units })), { units, error: null });
  for (const data of [{ version: 1, units: [{ id: 1, type: 'new_building' }] }, { version: 2, units: [] }, { version: 1, units: [{ buildingId: 1, unitId: -1 }] }]) assert.ok(comparison.parseUnitComparison(JSON.stringify(data)).error);
  assert.ok(comparison.parseUnitComparison('corrupt').error);
});

test('unit comparison covers required fields and compares exact prices, unknowns, studio, completion precision and statuses', () => {
  const first = { building: { title: 'ЖК', completion_precision: 'year', completion_year: 2028 }, block: null, entrance: null,
    effective_total_price: '9007199254740.01', effective_price_per_sqm: '100.10', currency: 'TJS', area: '50.00', rooms: 0, floor: 0, finishing: null, availability_status: 'available' };
  const second = { ...first, area: '50.0', rooms: null, floor: null, effective_total_price: '9007199254740.02', availability_status: 'reserved', block: { name: 'А', completion_precision: 'quarter', completion_year: 2028, completion_quarter: 2 } };
  const all = comparison.unitComparisonRows([first, second], false);
  for (const label of ['Цена', 'Цена за м²', 'Общая площадь', 'Комнаты', 'Этаж', 'Подъезд', 'Сдача', 'Отделка', 'Статус']) assert.ok(all.some(row => row.label === label));
  const differences = comparison.unitComparisonRows([first, second], true);
  assert.deepEqual(differences.map(row => row.key), ['price', 'rooms', 'floor', 'block', 'completion', 'status']);
  assert.deepEqual(differences.find(row => row.key === 'rooms').values, ['Студия', 'Не указаны']);
  assert.deepEqual(differences.find(row => row.key === 'floor').values, ['0', 'Не указан']);
  assert.deepEqual(differences.find(row => row.key === 'completion').values, ['2028 год', '2 квартал 2028']);
  assert.deepEqual(differences.find(row => row.key === 'status').values, ['Свободна', 'Забронирована']);
  assert.equal(comparison.unitComparisonRows([first, { ...first }, { ...first }, { ...first }], true).length, 0);
});

const { residentialCanonical, shareResidential } = await import('../services/new-buildings/sharing.ts');
test('residential sharing rebuilds canonical identity, strips personal parameters and keeps partner identity', async () => {
  const target = { buildingId: 12, unitId: 7 }, site = 'https://manora.tj/path?phone=secret#form';
  const url = 'https://manora.tj/new-buildings/12/units/7';
  assert.equal(residentialCanonical(target, site), url);
  assert.equal(residentialCanonical({ buildingId: 12, source: 'aura' }, site), 'https://manora.tj/new-buildings/12?source=aura');
  for (const bad of [{ buildingId: 0 }, { buildingId: 12, unitId: -1 }, { ...target, source: 'aura' }]) assert.throws(() => residentialCanonical(bad, site));
  let copied = null;
  const clipboard = { writeText: async value => { copied = value; } };
  assert.equal(await shareResidential(target, 'Квартира', { clipboard }, site), 'copied');
  assert.equal(copied, url);
  copied = null;
  assert.equal(await shareResidential(target, 'Квартира', { share: async data => assert.deepEqual(data, { title: 'Квартира', url }), clipboard }, site), 'native');
  assert.equal(copied, null);
  assert.equal(await shareResidential(target, 'Квартира', { share: async () => { throw new DOMException('Cancel', 'AbortError'); }, clipboard }, site), 'cancelled');
  assert.equal(copied, null);
  assert.equal(await shareResidential(target, 'Квартира', { share: async () => { throw new DOMException('Denied', 'NotAllowedError'); }, clipboard }, site), 'copied');
  assert.equal(await shareResidential(target, 'Квартира', {}, site), 'manual');
  assert.equal(await shareResidential(target, 'Квартира', { clipboard: { writeText: async () => { throw new Error('denied'); } } }, site), 'manual');
});

test('similar unit transport keeps nested identity, no-store and rejects reserved or source entries', async () => {
  const expected = { data: [{ id: 8, new_building_id: 13, building: { id: 13 }, availability_status: 'available' }], meta: { building_id: 12, unit_id: 7 } };
  assert.deepEqual(await fetchSimilarUnits('https://api.example/api/', '12', '7', undefined, async (url, init) => {
    assert.equal(url, 'https://api.example/api/v2/new-buildings/12/units/7/similar'); assert.equal(init.cache, 'no-store'); assert.ok(init.signal);
    return Response.json(expected);
  }), expected);
  for (const override of [{ id: 7 }, { availability_status: 'reserved' }, { new_building_id: 14 }]) {
    await assert.rejects(fetchSimilarUnits('https://api.example/api', '12', '7', undefined, async () => Response.json({ ...expected, data: [{ ...expected.data[0], ...override }] })), error => error.status === 502);
  }
  await assert.rejects(fetchSimilarUnits('https://api.example/api', '12', '7', undefined, async () => Response.json({ ...expected, meta: { building_id: 13, unit_id: 7 } })), error => error.status === 502);
  for (const status of [404, 503]) await assert.rejects(fetchSimilarUnits('https://api.example/api', '12', '7', undefined, async () => new Response('', { status })), error => error.status === status);
});

const { ratingLabel, reviewDraft, reviewVersionChanged } = await import('../services/new-buildings/reviews.ts');
test('reviews show honest empty rating and require renewed consent for edited revisions', () => {
  assert.equal(ratingLabel({ count: 0, average: null }), 'Опубликованных отзывов пока нет');
  assert.equal(ratingLabel({ count: 2, average: 4.5 }), '4,5 из 5 · Отзывов: 2');
  const review = { id: 1, version: 2, display_name: 'Автор', text: 'Личный опыт', rating: 3, status: 'published' };
  const draft = reviewDraft(review, 'rules-v1');
  assert.equal(draft.accept_rules, false);
  assert.equal(draft.text, review.text);
  assert.equal(reviewVersionChanged(draft, review), false);
  assert.equal(reviewVersionChanged(draft, { ...review, version: 3 }), true);
  assert.equal(draft.version, 2, 'a refresh cannot silently approve overwriting a newer revision');
  assert.equal(reviewVersionChanged(reviewDraft(null, 'rules-v1'), review), true);
});

test('public reviews bypass cache, paginate and reject invented empty ratings and transport failures', async () => {
  const data = { data: [], rating: { count: 0, average: null }, rules: { version: 'v1', items: ['Правила'] }, meta: { current_page: 2, last_page: 1, total: 0 } };
  assert.deepEqual(await fetchBuildingReviews('https://example.test/api/', 7, 2, undefined, async (url, init) => {
    assert.equal(url, 'https://example.test/api/v2/new-buildings/7/reviews?page=2');
    assert.equal(init.cache, 'no-store');
    assert.ok(init.signal instanceof AbortSignal);
    return Response.json(data);
  }), data);
  await assert.rejects(fetchBuildingReviews('https://example.test/api', 7, 1, undefined, async () => Response.json({ ...data, rating: { count: 0, average: 5 } })), error => error.status === 502);
  await assert.rejects(fetchBuildingReviews('https://example.test/api', 7, 1, undefined, async () => new Response(null, { status: 404 })), error => error.status === 404);
  await assert.rejects(fetchBuildingReviews('https://example.test/api', 7, 1, undefined, async () => { throw new Error('offline'); }), error => error.status === 503);
});

test('review history decodes escaped authored text and remains usable for legacy non-JSON snapshots', async () => {
  const { reviewAuditSnapshot } = await import('../services/new-buildings/reviews.ts');
  const value = '{"text":"\\u041e\\u0442\\u0437\\u044b\\u0432","status":"pending"}';
  assert.equal(reviewAuditSnapshot(value), '{\n  "text": "Отзыв",\n  "status": "pending"\n}');
  assert.equal(reviewAuditSnapshot('Legacy snapshot'), 'Legacy snapshot');
});

const { residentialRobots } = await import('../services/new-buildings/seo.ts');
test('all query variants use noindex for general and Google crawlers, including unknown and empty parameters', () => {
  assert.deepEqual(residentialRobots({}), { index: true, follow: true, googleBot: { index: true, follow: true } });
  for (const search of [{ rooms: '2' }, { page: '1' }, { unknown: '' }, { source: 'local' }, { token: 'private' }]) {
    assert.deepEqual(residentialRobots(search), { index: false, follow: true, googleBot: { index: false, follow: true } });
  }
});

const sitemapSource = (await readFile(new URL('../services/new-buildings/sitemap.ts', import.meta.url), 'utf8'))
  .replace("from './sharing'", 'from ' + JSON.stringify(new URL('../services/new-buildings/sharing.ts', import.meta.url).href));
const sitemapJS = ts.transpileModule(sitemapSource, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
const sitemap = await import('data:text/javascript;base64,' + Buffer.from(sitemapJS).toString('base64'));

test('sitemap index and chunks use canonical identities and stable ranges without personal or external URLs', async () => {
  const site = 'https://manora.tj/path?phone=private#form', base = 'https://api.example/api/';
  const index = await sitemap.residentialSitemapIndex(base, site, async (url, init) => {
    assert.equal(url, base + 'v2/new-buildings/sitemap');
    assert.equal(init.cache, 'no-store'); assert.ok(init.signal);
    return Response.json({ chunk_size: 1000, buildings: [0, 7], units: [0, 1] });
  });
  assert.equal((index.match(/<sitemap>/g) || []).length, 4);
  assert.ok(index.includes('https://manora.tj/sitemaps/residential/buildings/7.xml'));
  assert.equal(index.includes('private'), false);
  const units = await sitemap.residentialSitemapChunk(base, 'units', '1.xml', site, async (url, init) => {
    assert.equal(url, base + 'v2/new-buildings/sitemap/units/1'); assert.equal(init.cache, 'no-store');
    return Response.json({ data: [{ id: 1001, building_id: 7, last_modified: '2026-01-02T12:00:00+05:00', title: 'Must not leak', phone: 'private' }] });
  });
  assert.ok(units.includes('<loc>https://manora.tj/new-buildings/7/units/1001</loc>'));
  assert.ok(units.includes('<lastmod>2026-01-02T07:00:00.000Z</lastmod>'));
  assert.equal(units.includes('private'), false);
  assert.equal(units.includes('Must not leak'), false);
  const empty = await sitemap.residentialSitemapChunk(base, 'buildings', '0.xml', site, async () => Response.json({ data: [] }));
  assert.equal((empty.match(/<url>/g) || []).length, 1);
  assert.ok(empty.includes('<loc>https://manora.tj/new-buildings</loc>'));
  assert.equal(empty.includes('<lastmod>'), false, 'do not invent a modification date');
});

test('sitemap rejects corrupt identities, duplicate ranges, unexpected partition sizes and unavailable upstreams', async () => {
  const base = 'https://api.example/api', site = 'https://manora.tj';
  for (const manifest of [null, { chunk_size: 50, buildings: [0], units: [] }, { chunk_size: 1000, buildings: [1], units: [] },
    { chunk_size: 1000, buildings: [0], units: [0, 0] }, { chunk_size: 1000, buildings: [0], units: [-1] }]) {
    await assert.rejects(sitemap.residentialSitemapIndex(base, site, async () => Response.json(manifest)));
  }
  const row = { id: 1, building_id: 7, last_modified: null };
  for (const data of [[{ ...row, building_id: 0 }], [{ ...row, id: 1001 }], [row, row], [{ ...row, last_modified: 'garbage' }], [{ ...row, last_modified: '2026-01-02Tbad' }], [{ ...row, id: '1' }]]) {
    await assert.rejects(sitemap.residentialSitemapChunk(base, 'units', '0.xml', site, async () => Response.json({ data })));
  }
  for (const [kind, file] of [['unknown', '0.xml'], ['units', '01.xml'], ['units', '-1.xml'], ['units', '1000000000000.xml'], ['units', '1']]) {
    assert.equal(await sitemap.residentialSitemapChunk(base, kind, file, site, async () => { throw new Error('must not fetch'); }), null);
  }
  for (const generate of [() => sitemap.residentialSitemapIndex(base, site, async () => new Response('', { status: 503 })), async () => { throw new TypeError('offline'); }]) {
    const response = await sitemap.sitemapResponse(generate);
    assert.equal(response.status, 503); assert.equal(response.headers.get('Retry-After'), '60');
    assert.equal(response.headers.get('Cache-Control'), 'private, no-store');
    assert.equal((await response.text()).includes('<sitemap'), false);
  }
  assert.equal((await sitemap.sitemapResponse(async () => null)).status, 404);
  const disabled = await sitemap.sitemapResponse(async () => { throw new Error('Disabled sitemap must not read backend'); }, false);
  assert.equal(disabled.status, 404);
  assert.equal(disabled.headers.get('Cache-Control'), 'private, no-store');
  const success = await sitemap.sitemapResponse(async () => '<urlset/>');
  assert.equal(success.status, 200); assert.equal(success.headers.get('Content-Type'), 'application/xml; charset=utf-8');
});


test('responsive media selects preview sources without proxying or exposing the full image initially', async () => {
  const { residentialImageAttributes } = await import('../services/new-buildings/media.ts');
  const base = 'https://back.manora.tj/api/media/residential/building/1';
  const image = { url: base, sources: [1280, 320, 640].map(width => ({ url: base + '?variant=' + width, width, height: width / 2 })) };
  const result = residentialImageAttributes(image, '50vw');
  assert.equal(result.src, base + '?variant=640');
  assert.equal(result.srcSet, [320, 640, 1280].map(width => base + '?variant=' + width + ' ' + width + 'w').join(', '));
  assert.equal(result.sizes, '50vw');
  assert.deepEqual(residentialImageAttributes(image, '100vw', true), { src: base, srcSet: undefined, sizes: undefined });
  assert.deepEqual(residentialImageAttributes({ url: base }, '50vw'), { src: base, srcSet: undefined, sizes: undefined });
  const signed = base + '/preview?expires=123&signature=abc&variant=320&viewer=4';
  assert.equal(residentialImageAttributes({ url: base, sources: [{ url: signed, width: 20, height: 10 }] }, '100vw').src, signed);
  // The API may omit costlier intermediate previews; never fill gaps with display.
  const pruned = residentialImageAttributes({ url: base, sources: [
    { url: base + '?variant=320', width: 320, height: 213 },
    { url: base + '?variant=1920', width: 1920, height: 1280 },
  ] }, '100vw');
  assert.equal(pruned.src, base + '?variant=1920');
  assert.equal(pruned.srcSet, base + '?variant=320 320w, ' + base + '?variant=1920 1920w');
});

test('responsive media rejects malformed descriptors and keeps one source per real width', async () => {
  const { residentialImageAttributes } = await import('../services/new-buildings/media.ts');
  const result = residentialImageAttributes({ url: '/full', sources: [
    { url: '/small?variant=320', width: 160, height: 320 },
    { url: '/duplicate', width: 160, height: 320 },
    { url: 'javascript:alert(1)', width: 100, height: 100 },
    { url: '/image, /another', width: 200, height: 100 },
    { url: '/bad', width: 0, height: 100 },
  ] }, '200px');
  assert.equal(result.src, '/small?variant=320');
  assert.equal(result.srcSet, '/small?variant=320 160w');
});
