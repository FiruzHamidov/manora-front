import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const wizardSource = await readFile(
  new URL('../app/profile/add-post/_components/ListingWizard.tsx', import.meta.url),
  'utf8'
);

test('add listing room presets expose exact values through six plus', () => {
  for (const value of ['1', '2', '3', '4', '5']) {
    assert.match(wizardSource, new RegExp(`\\{ id: '${value}', label: '${value}' \\}`));
  }

  assert.match(wizardSource, /\{ id: '6\+', label: '6\+' \}/);
  assert.doesNotMatch(wizardSource, /\{ id: '4\+', label: '4\+' \}/);
});

test('six plus persists as the backend-compatible lower bound', () => {
  assert.match(wizardSource, /if \(preset === '6\+'\) return 6/);
  assert.match(wizardSource, /if \(rooms >= 6\) return '6\+'/);
});
