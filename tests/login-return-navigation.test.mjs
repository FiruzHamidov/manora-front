import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const hooksSource = await readFile(
  new URL('../services/login/hooks.ts', import.meta.url),
  'utf8'
);
const modalSource = await readFile(
  new URL('../app/login/LoginModal.tsx', import.meta.url),
  'utf8'
);
const gateSource = await readFile(
  new URL('../app/_components/auth/AuthGateMount.tsx', import.meta.url),
  'utf8'
);

test('successful login refreshes the current page instead of opening profile', () => {
  assert.match(hooksSource, /OK:\s*["']\/["']/);
  assert.match(hooksSource, /Вы успешно вошли в Manora/);
  assert.match(hooksSource, /setTimeout\(\(\) => router\.refresh\(\), 0\)/);
  assert.doesNotMatch(hooksSource, /OK:\s*["']\/profile["']/);
});

test('login modal returns to its origin or home after authentication', () => {
  assert.match(modalSource, /window\.history\.length > 1/);
  assert.match(modalSource, /router\.back\(\)/);
  assert.match(modalSource, /router\.push\(['"]\/['"]\)/);
});

test('authenticated gate pages return to home instead of profile', () => {
  assert.match(gateSource, /GATE_ROUTES\.has\(pathname\)/);
  assert.match(gateSource, /router\.replace\(['"]\/['"]\)/);
  assert.doesNotMatch(gateSource, /router\.replace\(['"]\/profile['"]\)/);
});
