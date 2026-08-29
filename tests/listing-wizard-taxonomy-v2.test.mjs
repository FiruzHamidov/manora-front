import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const wizard = readFileSync(
  new URL('../app/profile/add-post/_components/ListingWizard.tsx', import.meta.url),
  'utf8',
);
const propertyApi = readFileSync(
  new URL('../services/properties/api.ts', import.meta.url),
  'utf8',
);
const addPostForm = readFileSync(
  new URL('../hooks/useAddPostForm.ts', import.meta.url),
  'utf8',
);
const catalogFilters = readFileSync(
  new URL('../app/_components/filters.tsx', import.meta.url),
  'utf8',
);
const buyContent = readFileSync(
  new URL('../app/buy/_components/buy-content.tsx', import.meta.url),
  'utf8',
);
const buyMap = readFileSync(
  new URL('../app/buy/_components/BuyMap.tsx', import.meta.url),
  'utf8',
);
const propertyDetailPage = readFileSync(
  new URL('../app/apartment/[slug]/page.tsx', import.meta.url),
  'utf8',
);

test('taxonomy v2 wizard requires landmark, map point and profile minimum photos', () => {
  assert.match(wizard, /nextErrors\.landmark\s*=\s*'Укажите ориентир\.'/);
  assert.match(wizard, /nextErrors\.coordinates\s*=\s*'Укажите точку объекта на карте\.'/);
  assert.match(wizard, /profile\?\.minimum_photos\s*\?\?\s*1/);
  assert.match(wizard, /formData\.form\.photos\.length\s*<\s*minimumPhotos/);
  assert.match(wizard, /required_fields\.includes\('land_size'\)/);
});

test('changing a property profile removes forbidden draft fields before submit', () => {
  assert.match(addPostForm, /PROFILE_SCOPED_FORM_DEFAULTS/);
  assert.match(addPostForm, /if \(allowed\.has\(field\)\) continue/);
  assert.match(addPostForm, /if \(!allowed\.has\('rooms'\)\)/);
  assert.match(wizard, /applyPropertyProfile\(profileFieldCodes\)/);
});

test('property photo input enforces backend format, size and count limits', () => {
  assert.match(addPostForm, /MAX_PROPERTY_PHOTOS\s*=\s*40/);
  assert.match(addPostForm, /MAX_PROPERTY_PHOTO_BYTES\s*=\s*8\s*\*\s*1024\s*\*\s*1024/);
  assert.match(addPostForm, /image\/jpeg/);
  assert.match(addPostForm, /image\/png/);
  assert.match(addPostForm, /image\/webp/);
});

test('public catalog uses source-scoped v2 detail and v2 map routes', () => {
  assert.match(propertyApi, /FEED_PROPERTY_DETAIL}\/\$\{source}\/\$\{id}/);
  assert.match(propertyApi, /FEED_PROPERTIES}\/map/);
  assert.match(propertyDetailPage, /v2\/catalog\/properties\/\$\{source}\/\$\{slug}/);
  assert.doesNotMatch(propertyDetailPage, /feed\/properties/);
  assert.doesNotMatch(propertyApi, /source === ["']aura["'][\s\S]{0,300}PROPERTIES}\/\$\{id}/);
});

test('catalog list, stats and map share the same canonical filter object', () => {
  assert.match(buyContent, /useGetPropertiesInfiniteQuery\(filters\)/);
  assert.match(buyContent, /useGetPropertiesStatsQuery\(filters, true\)/);
  assert.match(buyContent, /<BuyMap items=\{properties\} baseFilters=\{filters\}/);
  assert.match(buyMap, /baseFilters \?\? \{\}/);
  assert.doesNotMatch(buyMap, /roomsFrom:\s*g\(/);
});

test('category-aware catalog filters use canonical v2 parameters', () => {
  for (const parameter of [
    'object_type_codes',
    'land_area_sotka_from',
    'commercial_purpose',
    'power_kw_from',
    'vehicle_capacity_from',
    'renovation_codes',
  ]) {
    assert.match(catalogFilters, new RegExp(parameter));
    assert.match(buyContent, new RegExp(parameter));
  }
});

test('property creation restores a versioned draft and sends a stable idempotency key', () => {
  assert.match(addPostForm, /manora:property-draft:v2/);
  assert.match(addPostForm, /localStorage\.getItem\(PROPERTY_DRAFT_KEY\)/);
  assert.match(addPostForm, /localStorage\.setItem\(PROPERTY_DRAFT_KEY/);
  assert.match(addPostForm, /fd\.set\('_idempotency_key', submissionKey\)/);
  assert.match(wizard, /Восстановили сохранённый черновик/);
});
