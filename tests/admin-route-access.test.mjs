import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import {
  canAccessAdminPath,
  canManageNewBuildings,
  canViewNewBuildings,
  getRoleSlugFromUserDataCookie,
  isListingModeratorRole,
} from '../constants/roles.ts';

const [layoutGateSource, residentialNavSource, residentialListSource,
  residentialDetailSource, residentialPublicationSource, residentialUnitsSource,
  residentialStructureSource] = await Promise.all([
  '../app/_components/layout/HeaderAndFooterGate.tsx',
  '../app/admin/new-buildings/_components/navbar.tsx',
  '../app/admin/new-buildings/page.tsx',
  '../app/admin/new-buildings/[id]/page.tsx',
  '../app/admin/new-buildings/_components/BuildingPublicationPanel.tsx',
  '../app/admin/new-buildings/[id]/units/page.tsx',
  '../app/admin/new-buildings/[id]/structure/page.tsx',
].map(path => readFile(new URL(path, import.meta.url), 'utf8')));

const cookie = (value) => encodeURIComponent(JSON.stringify(value));

test('reads the current nested role object stored after login', () => {
  assert.equal(
    getRoleSlugFromUserDataCookie(cookie({ id: 7, role: { id: 1, slug: 'admin' } })),
    'admin'
  );
  assert.equal(
    getRoleSlugFromUserDataCookie(cookie({ id: 8, role: { id: 2, slug: 'superadmin' } })),
    'superadmin'
  );
});

test('keeps compatibility with legacy string and role_slug cookies', () => {
  assert.equal(getRoleSlugFromUserDataCookie(cookie({ role: 'moderator' })), 'moderator');
  assert.equal(getRoleSlugFromUserDataCookie(cookie({ role_slug: 'developer' })), 'developer');
});

test('fails closed for malformed or unknown role cookies', () => {
  assert.equal(getRoleSlugFromUserDataCookie('%not-json'), 'guest');
  assert.equal(getRoleSlugFromUserDataCookie(cookie({ role: { slug: 'owner' } })), 'guest');
});

test('admin can open users and new-building management pages', () => {
  assert.equal(canAccessAdminPath('/admin/users', 'admin'), true);
  assert.equal(canAccessAdminPath('/admin/new-buildings', 'admin'), true);
  assert.equal(canAccessAdminPath('/admin/new-buildings/42/edit', 'admin'), true);
});

test('admins and superadmins can access dictionaries page', () => {
  assert.equal(canAccessAdminPath('/admin/dictionaries', 'admin'), true);
  assert.equal(canAccessAdminPath('/admin/dictionaries', 'superadmin'), true);
  assert.equal(canAccessAdminPath('/admin/dictionaries', 'moderator'), false);
});

test('developers may add residential dictionary values but cannot open global editors', () => {
  for (const resource of ['developers', 'materials', 'features', 'stages']) {
    const base = '/admin/new-buildings/' + resource;
    assert.equal(canAccessAdminPath(base, 'developer'), true);
    assert.equal(canAccessAdminPath(base + '/create', 'developer'), true);
    assert.equal(canAccessAdminPath(base + '/12/edit', 'developer'), false);
    assert.equal(canAccessAdminPath(base + '/12/edit', 'admin'), true);
    assert.equal(canAccessAdminPath(base + '/create', 'client'), false);
  }
});

test('specialized roles remain limited to their allowed admin sections', () => {
  assert.equal(canAccessAdminPath('/admin/new-buildings', 'developer'), true);
  assert.equal(canAccessAdminPath('/admin/users', 'developer'), false);
  assert.equal(canAccessAdminPath('/admin/stories', 'moderator'), true);
  assert.equal(canAccessAdminPath('/admin/users', 'moderator'), false);
});

test('residential moderators can inspect and moderate without gaining editor routes', () => {
  assert.equal(canViewNewBuildings('moderator'), true);
  assert.equal(canManageNewBuildings('moderator'), false);
  for (const path of ['/admin/new-buildings', '/admin/new-buildings/42',
    '/admin/new-buildings/42/units', '/admin/new-buildings/42/units/7/drawings',
    '/admin/new-buildings/42/floor-plans', '/admin/new-buildings/42/reviews']) {
    assert.equal(canAccessAdminPath(path, 'moderator'), true, path);
    for (const role of ['guest', 'client', 'user', 'developer-unknown', 'agent', 'rop']) {
      assert.equal(canAccessAdminPath(path, role), false, `${path}: ${role}`);
    }
  }
  for (const path of ['/admin/new-buildings/create', '/admin/new-buildings/42/edit',
    '/admin/new-buildings/42/units/create', '/admin/new-buildings/42/units/7/edit',
    '/admin/new-buildings/materials/create', '/admin/new-buildings/materials/7/edit/']) {
    assert.equal(canAccessAdminPath(path, 'moderator'), false, path);
  }
  assert.equal(canViewNewBuildings('developer'), true);
  assert.equal(canManageNewBuildings('developer'), true);
});

test('only moderation roles can choose the publication status', () => {
  assert.equal(isListingModeratorRole('superadmin'), true);
  assert.equal(isListingModeratorRole('admin'), true);
  assert.equal(isListingModeratorRole('moderator'), true);
  assert.equal(isListingModeratorRole('user'), false);
  assert.equal(isListingModeratorRole('client'), false);
  assert.equal(isListingModeratorRole('agent'), false);
  assert.equal(isListingModeratorRole('developer'), false);
});

test('admin workspace excludes public chrome and keeps residential navigation available on mobile', () => {
  assert.match(layoutGateSource, /pathname\?\.startsWith\('\/admin'\)/);
  assert.match(layoutGateSource, /isAdminRoute\s*\?\s*null/);
  assert.match(residentialNavSource, /aria-label="Разделы управления новостройками"/);
  assert.match(residentialNavSource, /overflow-x-auto/);
  assert.doesNotMatch(residentialNavSource, /hidden md:block/);
});

test('residential management screens keep 200-percent reflow inside local boundaries', () => {
  assert.match(residentialListSource, /grid-cols-1[^\n]*sm:grid-cols-2/);
  assert.match(residentialListSource, /flex max-w-full flex-wrap gap-2/);
  assert.match(residentialDetailSource, /flex min-w-0 flex-col items-start/);
  assert.match(residentialPublicationSource, /min-w-0 w-full max-w-full/);
  assert.match(residentialPublicationSource, /max-w-full whitespace-normal break-words/);
  assert.match(residentialStructureSource, /mt-2 block min-w-0 w-full max-w-full rounded border p-2/);
});

test('wide residential inventory remains a named keyboard-focusable local scroller', () => {
  assert.match(residentialUnitsSource, /\[contain:paint\]/);
  assert.match(residentialUnitsSource, /tabIndex=\{0\}/);
  assert.match(residentialUnitsSource, /aria-label="Таблица квартир — прокручивается по горизонтали"/);
  assert.match(residentialUnitsSource, /<table className="min-w-max">/);
});
