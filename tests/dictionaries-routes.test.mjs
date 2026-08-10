import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const overviewSource = await readFile(
  new URL('../app/admin/dictionaries/page.tsx', import.meta.url),
  'utf8'
);
const layoutSource = await readFile(
  new URL('../app/admin/dictionaries/layout.tsx', import.meta.url),
  'utf8'
);
const routeSource = await readFile(
  new URL('../app/admin/dictionaries/[section]/page.tsx', import.meta.url),
  'utf8'
);
const sectionSource = await readFile(
  new URL('../app/admin/dictionaries/_components/DictionariesSectionPage.tsx', import.meta.url),
  'utf8'
);

const sectionRoutes = [
  '/admin/dictionaries/real-estate',
  '/admin/dictionaries/geography',
  '/admin/dictionaries/transport',
  '/admin/dictionaries/organization',
  '/admin/dictionaries/new-buildings',
];

test('dictionary sections have separate navigable routes', () => {
  sectionRoutes.forEach((href) => {
    assert.match(overviewSource, new RegExp(href.replaceAll('/', '\\/')));
    assert.match(layoutSource, new RegExp(href.replaceAll('/', '\\/')));
  });
  assert.match(routeSource, /sectionBySlug/);
  assert.match(routeSource, /notFound\(\)/);
});

test('dictionary section page no longer keeps local tabs', () => {
  assert.doesNotMatch(sectionSource, /setTab|TABS\.map/);
  assert.match(sectionSource, /section === 'Недвижимость'/);
  assert.match(sectionSource, /section === 'География'/);
  assert.match(sectionSource, /section === 'Транспорт'/);
});

test('only the active dictionary group enables its API requests', () => {
  assert.match(sectionSource, /isRealEstate/);
  assert.match(sectionSource, /isGeography/);
  assert.match(sectionSource, /isTransport/);
  assert.match(sectionSource, /useDictionaryEntries\('property-types', undefined, isRealEstate\)/);
  assert.match(sectionSource, /useDictionaryEntries\('locations', undefined, isGeography\)/);
  assert.match(sectionSource, /useDictionaryEntries\('car-brands', undefined, isTransport\)/);
});
