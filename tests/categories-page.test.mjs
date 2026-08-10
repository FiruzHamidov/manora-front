import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const categoriesSource = await readFile(
  new URL('../app/categories/page.tsx', import.meta.url),
  'utf8'
);

test('categories page contains listing catalogs without service cards', () => {
  assert.match(categoriesSource, /Все категории/);
  assert.match(categoriesSource, /Объявления/);
  assert.match(categoriesSource, /catalogCategories\.map/);
  assert.doesNotMatch(categoriesSource, /const services|services\.map|>Сервисы</);
  assert.doesNotMatch(categoriesSource, /\/repair|\/cleaning|\/document-registration|\/rate-property/);
});
