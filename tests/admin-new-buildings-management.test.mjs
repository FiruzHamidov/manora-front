import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const pageSource = await readFile(
  new URL('../app/admin/new-buildings/page.tsx', import.meta.url),
  'utf8'
);
const hooksSource = await readFile(
  new URL('../services/new-buildings/hooks.ts', import.meta.url),
  'utf8'
);

test('admin new-buildings list uses the protected management collection', () => {
  assert.match(pageSource, /useManagedNewBuildings/);
  assert.doesNotMatch(pageSource, /\buseNewBuildings\b/);
  assert.match(
    hooksSource,
    /axios\.get<Paginated<NewBuilding>>\(\s*["']\/manage\/new-buildings["']/
  );
});
