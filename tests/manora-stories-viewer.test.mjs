import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const source = await readFile(
  new URL('../app/_components/manora/ManoraStories.tsx', import.meta.url),
  'utf8'
);

test('story viewer is portaled outside the filtered header stacking context', () => {
  assert.match(source, /import \{ createPortal \} from 'react-dom'/);
  assert.match(source, /return createPortal\(/);
  assert.match(source, /document\.body\s*\n\s*\);/);
});

test('story viewer restores the previous page scroll state after closing', () => {
  assert.match(source, /const previousOverflow = document\.body\.style\.overflow/);
  assert.match(source, /document\.body\.style\.overflow = previousOverflow/);
});
