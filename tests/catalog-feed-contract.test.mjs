import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const catalogLinksSource = await readFile(
  new URL('../constants/catalog-links.ts', import.meta.url),
  'utf8'
);
const buyContentSource = await readFile(
  new URL('../app/buy/_components/buy-content.tsx', import.meta.url),
  'utf8'
);
const homeSource = await readFile(new URL('../app/page.tsx', import.meta.url), 'utf8');
const loginModalSource = await readFile(
  new URL('../app/login/LoginModal.tsx', import.meta.url),
  'utf8'
);

test('property catalog uses a sort accepted by the feed API', () => {
  for (const source of [catalogLinksSource, buyContentSource, homeSource]) {
    assert.doesNotMatch(source, /sort(?:=|:\s*|[^\n]*\|\|\s*)['"]listing_type['"]/);
  }
  assert.match(catalogLinksSource, /sort:\s*['"]created_at['"]/);
  assert.match(buyContentSource, /\|\|\s*['"]created_at['"]/);
});

test('home does not block the whole interface while catalog requests load', () => {
  assert.doesNotMatch(homeSource, /ManoraLoading\s+fullscreen/);
  assert.doesNotMatch(homeSource, /Загружаем главную/);
});

test('authentication modal exposes dialog semantics', () => {
  assert.match(loginModalSource, /role="dialog"/);
  assert.match(loginModalSource, /aria-modal="true"/);
  assert.match(loginModalSource, /aria-label="Авторизация"/);
});
