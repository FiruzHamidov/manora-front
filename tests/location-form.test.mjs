import assert from 'node:assert/strict';
import test from 'node:test';
import {
  ADDRESS_REQUIRED_MESSAGE,
  getAddressValidationError,
} from '../services/add-post/location-form.ts';

test('requires an address when adding a listing', () => {
  assert.equal(getAddressValidationError(''), ADDRESS_REQUIRED_MESSAGE);
  assert.equal(getAddressValidationError('   '), ADDRESS_REQUIRED_MESSAGE);
});

test('allows continuing without map coordinates when an address is present', () => {
  assert.equal(getAddressValidationError('Душанбе, улица Айни, 48'), undefined);
});
