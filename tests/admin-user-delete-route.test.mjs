import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const apiSource = await readFile(new URL('../services/users/api.ts', import.meta.url), 'utf8');
const pageSource = await readFile(new URL('../app/admin/users/page.tsx', import.meta.url), 'utf8');
const dialogSource = await readFile(
  new URL('../app/admin/users/_components/DeleteUserDialog.tsx', import.meta.url),
  'utf8'
);
const detailSource = await readFile(
  new URL('../app/admin/users/[id]/page.tsx', import.meta.url),
  'utf8'
);

test('admin user deletion uses the explicit admin endpoint', () => {
  assert.match(apiSource, /axios\.delete\(`\/admin\/users\/\$\{id\}`/);
  assert.doesNotMatch(apiSource, /axios\.delete\(`\/user\/\$\{id\}`/);
});

test('admin cannot request deletion of the current account', () => {
  assert.match(pageSource, /u\.id === currentUser\?\.id/);
  assert.match(pageSource, /Нельзя удалить собственный аккаунт/);
  assert.match(pageSource, /disabled=\{u\.id === currentUser\?\.id\}/);
  assert.match(detailSource, /disabled=\{user\.id === currentUser\?\.id\}/);
  assert.match(detailSource, /router\.replace\(['"]\/admin\/users['"]\)/);
});

test('delete confirmation is exposed as an accessible dialog', () => {
  assert.match(dialogSource, /role="dialog"/);
  assert.match(dialogSource, /aria-modal="true"/);
  assert.match(dialogSource, /aria-labelledby="delete-user-title"/);
});
