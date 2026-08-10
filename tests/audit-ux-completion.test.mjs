import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const carsSource = await readFile(new URL('../app/cars/page.tsx', import.meta.url), 'utf8');
const adminBuildingsSource = await readFile(
  new URL('../app/admin/new-buildings/page.tsx', import.meta.url),
  'utf8'
);

test('cars empty state distinguishes filters and offers recovery actions', () => {
  assert.match(carsSource, /CarsEmptyState/);
  assert.match(carsSource, /hasActiveFilters/);
  assert.match(carsSource, /Сбросить фильтры/);
  assert.match(carsSource, /Настроить поиск/);
  assert.match(carsSource, /Автомобилей пока нет/);
});

test('admin new-buildings use mobile cards instead of a clipped table', () => {
  assert.match(adminBuildingsSource, /space-y-3 md:hidden/);
  assert.match(adminBuildingsSource, /hidden overflow-x-auto rounded-2xl border md:block/);
  assert.match(adminBuildingsSource, /<article key=\{nb\.id\}/);
  assert.match(adminBuildingsSource, /Редактировать/);
});
