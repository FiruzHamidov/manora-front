import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getRepairTypeValidationError,
  normalizeRepairTypeId,
  REPAIR_TYPE_REQUIRED_MESSAGE,
  withRequiredRepairType,
} from '../services/add-post/repair-type-form.ts';

test('normalizes the existing repair_type_id for edit mode', () => {
  assert.equal(normalizeRepairTypeId(42), '42');
  assert.equal(normalizeRepairTypeId(' 42 '), '42');
});

test('requires a repair type before property submission', () => {
  assert.equal(getRepairTypeValidationError(''), REPAIR_TYPE_REQUIRED_MESSAGE);
  assert.equal(getRepairTypeValidationError(null), REPAIR_TYPE_REQUIRED_MESSAGE);
  assert.equal(getRepairTypeValidationError('42'), undefined);
});

test('uses the API repair type id as repair_type_id without changing other fields', () => {
  const payload = withRequiredRepairType(
    {
      title: 'Квартира',
      document_type: 'certificate',
    },
    73
  );

  assert.deepEqual(payload, {
    title: 'Квартира',
    document_type: 'certificate',
    repair_type_id: '73',
  });
});

test('does not allow submission without repair_type_id', () => {
  assert.throws(
    () => withRequiredRepairType({ title: 'Квартира' }, ' '),
    new RegExp(REPAIR_TYPE_REQUIRED_MESSAGE)
  );
});
