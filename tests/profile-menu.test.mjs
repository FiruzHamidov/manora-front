import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const menuSource = await readFile(
  new URL('../constants/profile-menu.ts', import.meta.url),
  'utf8'
);
const sidebarSource = await readFile(
  new URL('../app/profile/_components/sidebar.tsx', import.meta.url),
  'utf8'
);

test('platform admins see the dictionaries link in the profile menu', () => {
  assert.match(menuSource, /dictionaries:\s*\{[\s\S]*?href: '\/admin\/dictionaries'/);
  assert.match(menuSource, /admin:\s*\[[\s\S]*?'dictionaries'/);
  assert.match(menuSource, /superadmin:\s*\[[\s\S]*?'dictionaries'/);
  assert.match(sidebarSource, /dictionaries:\s*<LibraryBig/);
});

test('non-platform roles do not see the dictionaries link', () => {
  assert.match(menuSource, /key === 'dictionaries'\) return isPlatformAdminRole\(role\)/);
  assert.doesNotMatch(menuSource, /moderator:\s*\[[^\]]*'dictionaries'/);
  assert.doesNotMatch(menuSource, /developer:\s*\[[^\]]*'dictionaries'/);
  assert.doesNotMatch(menuSource, /user:\s*\[[^\]]*'dictionaries'/);
});
