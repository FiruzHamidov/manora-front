import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import {
  filterOptionsExcludingId,
  normalizeDictionaryList,
  parseDictionaryError,
} from '../services/dictionaries/utils.ts';

test('normalizeDictionaryList supports array and wrapped payloads', () => {
  const asArray = normalizeDictionaryList([{ id: 1 }, { id: 2 }]);
  assert.deepEqual(asArray, [{ id: 1 }, { id: 2 }]);

  const asData = normalizeDictionaryList({ data: [{ id: 3 }] });
  assert.deepEqual(asData, [{ id: 3 }]);

  const asItems = normalizeDictionaryList({ items: [{ id: 4 }] });
  assert.deepEqual(asItems, [{ id: 4 }]);

  assert.deepEqual(normalizeDictionaryList(undefined), []);
});

test('filterOptionsExcludingId excludes current record for parent select', () => {
  const values = [
    { id: 1, name: 'A' },
    { id: 2, name: 'B' },
    { id: 3, name: 'C' },
  ];

  const filtered = filterOptionsExcludingId(values, 2);
  assert.equal(filtered.length, 2);
  assert.deepEqual(
    filtered.map((item) => item.id),
    [1, 3]
  );
});

test('parseDictionaryError extracts messages and field errors', () => {
  const validationError = {
    response: {
      status: 422,
      data: {
        message: 'Validation failed',
        errors: {
          slug: ['The slug already exists.'],
          name: ['The name is required.'],
        },
      },
    },
  };

  const parsedValidation = parseDictionaryError(validationError);
  assert.equal(parsedValidation.status, 422);
  assert.equal(parsedValidation.message, 'Validation failed');
  assert.deepEqual(parsedValidation.fieldErrors.slug, ['The slug already exists.']);
  assert.deepEqual(parsedValidation.fieldErrors.name, ['The name is required.']);

  const conflictError = {
    response: {
      status: 409,
      data: {
        message: 'Запись используется в объявлениях',
      },
    },
  };
  const parsedConflict = parseDictionaryError(conflictError);
  assert.equal(parsedConflict.status, 409);
  assert.equal(parsedConflict.message, 'Запись используется в объявлениях');

  const forbiddenError = {
    response: {
      status: 403,
      data: {
        error: 'Недостаточно прав',
      },
    },
  };
  const parsedForbidden = parseDictionaryError(forbiddenError);
  assert.equal(parsedForbidden.status, 403);
  assert.equal(parsedForbidden.message, 'Недостаточно прав');
  assert.deepEqual(parsedForbidden.fieldErrors, {});
});

import { dictionaryDraft, dictionaryEditPayload, isResidentialDictionary } from '../services/dictionaries/residential-editor.ts';

test('residential editor keeps the original revision and sends explicit field clearing without extra fields', () => {
  const record = { id: 5, version: 7, name: 'Company', phone: '123', founded_year: 2001, total_projects: 0, moderation_status: 'pending' };
  const draft = dictionaryDraft('developers', record);
  draft.phone = '';
  draft.version = '99';
  draft.unrelated = 'not allowed';
  const payload = dictionaryEditPayload('developers', draft, { version: 7, usage_token: 'original snapshot', reason: ' Verified change ', expected_user_id: 12 });
  assert.equal(payload.phone, null);
  assert.equal(payload.founded_year, '2001');
  assert.equal(payload.total_projects, '0');
  assert.equal(payload.version, 7);
  assert.equal(payload.usage_token, 'original snapshot');
  assert.equal(payload.reason, 'Verified change');
  assert.equal(payload.expected_user_id, 12);
  assert.equal(payload.unrelated, undefined);
  assert.equal(record.phone, '123');
});

test('stage editor preserves zero ordering and inactive state, only known dictionaries use this editor', () => {
  const draft = dictionaryDraft('construction-stages', { id: 1, version: 1, name: 'Stage', slug: 'stage', sort_order: 0, is_active: false });
  const payload = dictionaryEditPayload('construction-stages', draft, { version: 1, usage_token: 'token', reason: 'Checked', expected_user_id: 1 });
  assert.equal(payload.sort_order, '0');
  assert.equal(payload.is_active, '0');
  assert.equal(isResidentialDictionary('construction-stages'), true);
  assert.equal(isResidentialDictionary('toString'), false);
  assert.equal(isResidentialDictionary('locations'), false);
});

import { changeDictionarySelection, dictionarySelectionIds, loadDictionarySelection } from '../services/dictionaries/selection.ts';

test('dictionary multi-selection preserves off-page IDs and removes only the explicit choice', () => {
  const selected = ['2', 122];
  assert.deepEqual(changeDictionarySelection(selected, 3, true), [2, 122, 3]);
  assert.deepEqual(changeDictionarySelection(selected, 2, true), [122]);
  assert.deepEqual(changeDictionarySelection(selected, 3, false), [3]);
  assert.deepEqual(selected, ['2', 122]);
  assert.deepEqual(dictionarySelectionIds([0, '2', 2, -1, 'bad', 122]), [2, 122]);
});

test('selected dictionary names load beyond 100 IDs in bounded chunks without fetching unrelated rows', async () => {
  const selected = Array.from({ length: 121 }, (_, index) => index + 1);
  const calls = [];
  const result = await loadDictionarySelection(selected, async ids => {
    calls.push(ids);
    return [...ids.map(id => ({ id, name: 'Item ' + id })), { id: 9999, name: 'Unrequested' }];
  });
  assert.deepEqual(calls.map(ids => ids.length), [100, 21]);
  assert.deepEqual(result.map(record => record.id), selected);
});

test('missing names and failed lookup never erase selected dictionary IDs', async () => {
  const selected = [4, 122];
  assert.deepEqual(await loadDictionarySelection(selected, async () => [{ id: 122, name: 'Available' }]), [{ id: 122, name: 'Available' }]);
  await assert.rejects(loadDictionarySelection(selected, async () => { throw new Error('Network unavailable'); }), /Network unavailable/);
  assert.deepEqual(selected, [4, 122]);
  let calls = 0;
  assert.deepEqual(await loadDictionarySelection([], async () => { calls++; return []; }), []);
  assert.equal(calls, 0);
});

import { dictionaryListPath, isVersionedDictionary, versionedDictionaryPaths } from '../services/dictionaries/residential-editor.ts';

test('geography editor preserves coordinates, clears optional fields and maps district city to the API contract', () => {
  const command = { version: 3, usage_token: 'original', reason: ' Verified geography ', expected_user_id: 2 };
  const city = dictionaryDraft('locations', { id: 1, version: 3, city: 'City', district: 'Legacy', latitude: -38.1, longitude: 0 });
  city.district = '';
  assert.deepEqual(dictionaryEditPayload('locations', city, command), {
    city: 'City', district: null, latitude: '-38.1', longitude: '0', ...command, reason: 'Verified geography',
  });
  const district = dictionaryDraft('districts', { id: 2, version: 3, name: 'Area', location_id: 15 });
  district.location_id = '27';
  district.version = '99';
  assert.deepEqual(dictionaryEditPayload('districts', district, command), {
    name: 'Area', city_id: '27', ...command, reason: 'Verified geography',
  });
  assert.equal(dictionaryListPath('locations'), '/admin/dictionaries/geography');
  assert.equal(dictionaryListPath('districts'), '/admin/dictionaries/geography');
  assert.equal(versionedDictionaryPaths.districts, '/admin/dictionaries/geography/districts');
  assert.equal(isVersionedDictionary('districts'), true);
  assert.equal(isVersionedDictionary('toString'), false);
});

const deleteDialogSource = await readFile(new URL('../app/admin/dictionaries/_components/DictionaryDeleteDialog.tsx', import.meta.url), 'utf8');
const dictionaryManagerSource = await readFile(new URL('../app/admin/dictionaries/_components/DictionaryManager.tsx', import.meta.url), 'utf8');
const residentialListSource = await readFile(new URL('../app/admin/new-buildings/_components/ResidentialDictionaryList.tsx', import.meta.url), 'utf8');
const developersSource = await readFile(new URL('../app/admin/new-buildings/developers/page.tsx', import.meta.url), 'utf8');
const branchesSource = await readFile(new URL('../app/admin/branches/page.tsx', import.meta.url), 'utf8');

test('every dictionary deletion surface uses the atomic usage replacement dialog', () => {
  for (const source of [dictionaryManagerSource, residentialListSource, developersSource, branchesSource]) {
    assert.match(source, /DictionaryDeleteDialog/);
  }
  assert.match(deleteDialogSource, /dictionariesApi\.usage\(resource, target\.id, userId\)/);
  assert.match(deleteDialogSource, /current\.replacements\.some\(item => item\.id === Number\(replacementId\)\)/);
  assert.match(deleteDialogSource, /usage_token: current\.usage_token/);
  assert.match(deleteDialogSource, /request_key: crypto\.randomUUID\(\)/);
  assert.match(deleteDialogSource, /status && status >= 400 && status < 500/);
  assert.match(deleteDialogSource, /setNeedsRefresh\(true\)/);
  assert.match(deleteDialogSource, /remove\.mutate\(pendingCommand\)/);
  assert.match(deleteDialogSource, /<dialog/);
  assert.match(deleteDialogSource, /showModal\(\)/);
});
