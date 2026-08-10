import assert from 'node:assert/strict';
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
