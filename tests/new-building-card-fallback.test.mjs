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

test('complex contact action leads to the appointed Manora consultant', () => {
  assert.match(cardSource, /#consultant/);
  assert.match(cardSource, /Консультант Manora/);
  assert.doesNotMatch(cardSource, /developerPhone|tel:|ownerUserId/);
});
