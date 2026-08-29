import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { applyCatalogViewport, catalogApiQuery, catalogBuildingHref, catalogNavigation, catalogQuery, catalogViewport, changeCatalog, clearCatalogViewport, readCatalogFilters } from '../services/new-buildings/residential-catalog.ts';
import { CatalogError, fetchCatalog } from '../services/new-buildings/residential-catalog-api.ts';

const residentialCatalogMapSource = await readFile(new URL('../app/new-buildings/_components/ResidentialCatalogMap.tsx', import.meta.url), 'utf8');
const residentialCatalogScreenSource = await readFile(new URL('../app/new-buildings/_components/ResidentialCatalogScreen.tsx', import.meta.url), 'utf8');
const buildingLocationMapSource = await readFile(new URL('../app/new-buildings/_components/BuildingLocationMap.tsx', import.meta.url), 'utf8');
const legacyBuildingLocationSource = await readFile(new URL('../app/new-buildings/[slug]/_components/ComfortNearby.tsx', import.meta.url), 'utf8');
const legacyResidentialCatalogSource = await readFile(new URL('../app/new-buildings/_components/LegacyResidentialCatalog.tsx', import.meta.url), 'utf8');
const legacyOffersSource = await readFile(new URL('../app/new-buildings/[slug]/_components/Offers.tsx', import.meta.url), 'utf8');
const sharedPhotoGallerySource = await readFile(new URL('../ui-components/PhotoGalleryModal.tsx', import.meta.url), 'utf8');

test('residential catalog round-trips known filters without discarding malformed requested ranges', () => {
  const filters = readCatalogFilters(new URLSearchParams('rooms[0]=2&rooms[1]=4%2B&price_max=100,01&area_min=oops&view=map&page=3&sort=price_asc&secret=hidden'));
  assert.deepEqual(filters, { rooms: '2,4+', price_max: '100,01', area_min: 'oops', sort: 'price_asc', page: '3', view: 'map' });
  assert.deepEqual(readCatalogFilters(new URLSearchParams(catalogQuery(filters))), filters);
  assert.equal(new URLSearchParams(catalogApiQuery(filters)).has('view'), false);
  assert.equal(new URLSearchParams(catalogApiQuery(filters)).get('per_page'), '20');
  assert.equal(new URLSearchParams(catalogNavigation('utm_source=share&rooms[]=1&page=7', filters)).get('utm_source'), 'share');
  assert.equal(new URLSearchParams(catalogNavigation('rooms[]=1&page=7', filters)).has('rooms[]'), false);
});

test('catalog filters reset pagination while switching views keeps it and room links retain only unit context', () => {
  const filters = { city: 'Душанбе', district: 'Сино', page: '4', price_max: '900000.01', area_min: '60', rooms: '1', sort: 'completion_asc', bbox: '1,2,3,4' };
  assert.deepEqual(changeCatalog(filters, 'city', 'Худжанд'), { city: 'Худжанд', price_max: '900000.01', area_min: '60', rooms: '1', sort: 'completion_asc', bbox: '1,2,3,4' });
  assert.equal(changeCatalog(filters, 'view', 'map').page, '4');
  assert.equal(changeCatalog(filters, 'sort', 'price_asc').page, undefined);
  const href = new URL(catalogBuildingHref(42, filters, '2'), 'https://example.test');
  assert.equal(href.pathname, '/new-buildings/42');
  assert.equal(href.hash, '#apartments');
  assert.deepEqual(Object.fromEntries(href.searchParams), { area_min: '60', price_max: '900000.01', rooms: '2' });
});

test('map converts lat/lon bounds, wraps the antimeridian and does not invent an empty viewport', () => {
  assert.deepEqual(catalogViewport([[38, 68], [39, 69]], 10.4), { bbox: '68,38,69,39', zoom: '10' });
  assert.deepEqual(catalogViewport([[-10, 170], [10, 190]], 30), { bbox: '170,-10,-170,10', zoom: '20' });
  assert.deepEqual(catalogViewport([[-95, -200], [95, 200]], 1), { bbox: '-180,-90,180,90', zoom: '1' });
  assert.equal(catalogViewport([[0, 0], [0, 1]], 10), null);
  assert.equal(catalogViewport([[0, NaN], [1, 1]], 10), null);
});

test('map viewport changes remain pending until explicitly applied and clearing an area removes its zoom', () => {
  const committed = { view: 'map', city: 'Душанбе', bbox: '68,38,69,39', zoom: '10', page: '4' };
  const pending = catalogViewport([[38.5, 68.5], [39.5, 69.5]], 13.2);
  assert.deepEqual(committed, { view: 'map', city: 'Душанбе', bbox: '68,38,69,39', zoom: '10', page: '4' });
  assert.deepEqual(applyCatalogViewport(committed, pending), { view: 'map', city: 'Душанбе', bbox: '68.5,38.5,69.5,39.5', zoom: '13' });
  assert.deepEqual(clearCatalogViewport(committed), { view: 'map', city: 'Душанбе' });
  assert.doesNotMatch(residentialCatalogMapSource, /onZoom/);
  assert.doesNotMatch(residentialCatalogMapSource, /@pbe\/react-yandex-maps/);
  assert.doesNotMatch(residentialCatalogScreenSource, /mapZoom|setMapZoom/);
  assert.match(residentialCatalogMapSource, /setViewport\(currentBounds \? catalogViewport/);
  assert.match(residentialCatalogMapSource, /onClick=\{\(\) => viewport && onArea\(viewport\)\}/);
  assert.match(residentialCatalogMapSource, /new sdk\.Map/);
  assert.match(residentialCatalogMapSource, /new sdk\.Placemark/);
  assert.doesNotMatch(buildingLocationMapSource, /@pbe\/react-yandex-maps/);
  assert.match(buildingLocationMapSource, /new sdk\.Map/);
  assert.match(buildingLocationMapSource, /new sdk\.Placemark/);
  assert.doesNotMatch(legacyBuildingLocationSource, /@pbe\/react-yandex-maps/);
  assert.match(legacyBuildingLocationSource, /BuildingLocationMap/);
  assert.match(legacyResidentialCatalogSource, /<Dialog open onClose=\{onClose\}/);
  assert.match(legacyResidentialCatalogSource, /<DialogTitle/);
  assert.match(legacyResidentialCatalogSource, /data-autofocus/);
  assert.match(legacyOffersSource, /<Dialog open onClose=\{closeLightbox\}/);
  assert.match(legacyOffersSource, /<DialogTitle/);
  assert.match(legacyOffersSource, /data-autofocus/);
  assert.match(sharedPhotoGallerySource, /<Dialog open=\{isOpen\} onClose=\{onClose\}/);
  assert.match(sharedPhotoGallerySource, /<DialogTitle/);
  assert.match(sharedPhotoGallerySource, /data-autofocus/);
  assert.match(sharedPhotoGallerySource, /onKeyDown=/);
  assert.doesNotMatch(sharedPhotoGallerySource, /document\.addEventListener\(['"]keydown/);
  assert.doesNotMatch(sharedPhotoGallerySource, /document\.body\.style\.overflow/);
  assert.match(residentialCatalogScreenSource, /applyCatalogViewport\(currentFilters\(\), area\)/);
});

test('catalog transport never caches stale availability and exposes field errors and cancellation', async () => {
  let request;
  const transport = async (url, init) => {
    request = { url, init };
    return new Response(JSON.stringify({ errors: { price_max: ['Некорректный диапазон'] } }), { status: 422 });
  };
  await assert.rejects(fetchCatalog('https://example.test/api/', 'map', 'rooms=2', undefined, transport), error =>
    error instanceof CatalogError && error.status === 422 && error.fields.price_max[0] === 'Некорректный диапазон');
  assert.equal(request.url, 'https://example.test/api/v2/new-buildings/map?rooms=2');
  assert.equal(request.init.cache, 'no-store');
  assert.ok(request.init.signal instanceof AbortSignal);
  const controller = new AbortController(); controller.abort();
  const cancelled = new DOMException('Aborted', 'AbortError');
  await assert.rejects(fetchCatalog('https://example.test/api', '', '', controller.signal, async () => { throw cancelled; }), error => error === cancelled);
  await assert.rejects(fetchCatalog('https://example.test/api', '', '', undefined, async () => { throw new Error('private transport detail'); }), error => error instanceof CatalogError && error.status === 503 && !error.message.includes('private'));
});

const catalogLinksSource = await readFile(
  new URL('../constants/catalog-links.ts', import.meta.url),
  'utf8'
);
const buyContentSource = await readFile(
  new URL('../app/buy/_components/buy-content.tsx', import.meta.url),
  'utf8'
);
const homeSource = await readFile(new URL('../app/page.tsx', import.meta.url), 'utf8');
const loginModalSource = await readFile(
  new URL('../app/login/LoginModal.tsx', import.meta.url),
  'utf8'
);

test('property catalog uses a sort accepted by the feed API', () => {
  for (const source of [catalogLinksSource, buyContentSource, homeSource]) {
    assert.doesNotMatch(source, /sort(?:=|:\s*|[^\n]*\|\|\s*)['"]listing_type['"]/);
  }
  assert.match(catalogLinksSource, /sort:\s*['"]published_at['"]/);
  assert.match(buyContentSource, /\|\|\s*['"]published_at['"]/);
  assert.match(buyContentSource, /price_tjs:(?:asc|desc)/);
});

test('home does not block the whole interface while catalog requests load', () => {
  assert.doesNotMatch(homeSource, /ManoraLoading\s+fullscreen/);
  assert.doesNotMatch(homeSource, /Загружаем главную/);
});

test('authentication modal exposes dialog semantics', () => {
  assert.match(loginModalSource, /role="dialog"/);
  assert.match(loginModalSource, /aria-modal="true"/);
  assert.match(loginModalSource, /aria-label="Авторизация"/);
});
