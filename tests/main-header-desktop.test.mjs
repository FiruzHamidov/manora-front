import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const source = await readFile(
  new URL('../app/_components/manora/MainHeader.tsx', import.meta.url),
  'utf8'
);

test('wide desktop header keeps one translucent row while tablet navigation can wrap', () => {
  assert.match(source, /2xl:grid-cols-\[auto_minmax\(0,1fr\)_auto\]/);
  assert.match(source, /md:min-h-\[72px\]/);
  assert.match(source, /md:bg-white\/24/);
  assert.match(source, /md:backdrop-blur-\[3px\]/);
  assert.match(source, /md:bg-white\/60/);
  assert.match(source, /md:backdrop-blur-xl/);
  assert.match(source, /duration-300/);
});

test('home desktop header overlays the hero while other routes stay sticky', () => {
  assert.match(source, /pathname === '\/' \? 'md:fixed md:inset-x-0'/);
  assert.match(source, /sticky top-0/);
});

test('desktop row retains navigation, stories and account actions', () => {
  assert.match(source, /navItems\.map/);
  assert.match(source, /<ManoraStories compact=\{areStoriesCompact\}/);
  assert.match(source, /\+ Объявления/);
  assert.match(source, /Войти/);
});
