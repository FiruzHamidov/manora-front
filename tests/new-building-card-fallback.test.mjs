import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const cardSource = await readFile(
  new URL('../ui-components/new-buildings/new-buildings-card.tsx', import.meta.url),
  'utf8'
);

test('unknown developers are not linked or marked as verified', () => {
  assert.match(cardSource, /hasKnownDeveloper/);
  assert.match(cardSource, /Застройщик не указан/);
  assert.match(cardSource, /hasKnownDeveloper\s*\?/);
});

test('call action is only rendered when a phone exists', () => {
  assert.match(cardSource, /developerPhone\s*\?/);
  assert.match(cardSource, /href=\{`tel:\$\{developerPhone\}`\}/);
  assert.match(cardSource, /Подробнее/);
});
