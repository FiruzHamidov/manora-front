import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const detailSource = await readFile(
  new URL('../app/admin/new-buildings/[id]/page.tsx', import.meta.url),
  'utf8'
);
const editSource = await readFile(
  new URL('../app/admin/new-buildings/[id]/edit/page.tsx', import.meta.url),
  'utf8'
);
const errorSource = await readFile(
  new URL('../app/admin/new-buildings/_components/ManagedNewBuildingError.tsx', import.meta.url),
  'utf8'
);

test('managed new-building detail and edit expose query errors', () => {
  for (const source of [detailSource, editSource]) {
    assert.match(source, /ManagedNewBuildingError/);
    assert.match(source, /error, refetch, isFetching/);
    assert.match(source, /onRetry=\{\(\) => void refetch\(\)\}/);
  }
});

test('managed new-building error offers retry and back navigation', () => {
  assert.match(errorSource, /role="alert"/);
  assert.match(errorSource, /Повторить/);
  assert.match(errorSource, /\/admin\/new-buildings/);
  assert.match(errorSource, /Новостройка не найдена/);
});
