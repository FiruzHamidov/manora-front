import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const selectSource = await readFile(
  new URL('../ui-components/SearchableSelect.tsx', import.meta.url),
  'utf8'
);

test('clicking the select control opens its options', () => {
  assert.match(selectSource, /searchable \? \(/);
  assert.match(selectSource, /<Combobox\.Button[\s\S]*id=\{name\}/);
  assert.match(selectSource, /flex min-w-0 flex-1 cursor-pointer/);
});

test('non-searchable selects do not expose a text caret', () => {
  assert.doesNotMatch(selectSource, /readOnly=\{!searchable\}/);
  assert.match(selectSource, /selectedOption\?\.name \?\? placeholder/);
});
