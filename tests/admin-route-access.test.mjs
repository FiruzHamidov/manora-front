import assert from 'node:assert/strict';
import test from 'node:test';
import {
  canAccessAdminPath,
  getRoleSlugFromUserDataCookie,
  isListingModeratorRole,
} from '../constants/roles.ts';

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

test('specialized roles remain limited to their allowed admin sections', () => {
  assert.equal(canAccessAdminPath('/admin/new-buildings', 'developer'), true);
  assert.equal(canAccessAdminPath('/admin/users', 'developer'), false);
  assert.equal(canAccessAdminPath('/admin/stories', 'moderator'), true);
  assert.equal(canAccessAdminPath('/admin/users', 'moderator'), false);
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
