import assert from 'node:assert/strict';
import test from 'node:test';
import { unitDraft, unitPayload, applyLayoutDefaults, rebaseUnitDraft, unitConflictChanges } from '../services/new-buildings/unit-form.ts';

test('empty lot draft has no fabricated rooms, area, floor, view or coordinates', () => {
  const payload = unitPayload(unitDraft());
  for (const field of ['rooms', 'area', 'floor', 'bathrooms', 'window_view', 'block_id', 'entrance_id', 'layout_id', 'position_on_floor']) assert.equal(payload[field], null);
  assert.equal(payload.publication_status, 'draft');
  assert.equal(payload.total_price, null);
});

test('explicit studio and exact decimal quote survive form serialization', () => {
  const draft = { ...unitDraft(), rooms: '0', area: '45,01', pricing_basis: 'total', on_request: false, amount: '9007199254740.01', version: 7 };
  const payload = unitPayload(draft);
  assert.equal(payload.rooms, 0);
  assert.equal(payload.area, '45.01');
  assert.equal(payload.total_price, '9007199254740.01');
  assert.equal(payload.price_per_sqm, undefined);
  assert.equal(payload.version, 7);
  assert.throws(() => unitPayload({ ...draft, floor: '1.5' }));
  assert.throws(() => unitPayload({ ...draft, amount: '' }));
});

test('layout defaults only fill empty fields on an explicit action', () => {
  const original = { ...unitDraft(), area: '31.25', amount: '270000.00', rooms: '0' };
  const layout = { rooms: 2, area: '45.00', living_area: '30.00', kitchen_area: '9.00' };
  const result = applyLayoutDefaults(original, layout);
  assert.equal(result.area, '31.25');
  assert.equal(result.rooms, '0');
  assert.equal(result.amount, original.amount);
  assert.equal(result.living_area, '30.00');
  assert.equal(original.living_area, '');
  layout.living_area = '35.00';
  assert.equal(result.living_area, '30.00');
});

const revision = (overrides = {}) => ({ id: 7, new_building_id: 1, version: 1,
  description: 'Исходное описание', rooms: 2, area: '50.01', pricing_basis: 'total',
  total_price: '400000.01', price_per_sqm: '7998.40', publication_status: 'pending',
  availability_status: 'available', block_id: 1, entrance_id: 10, floor: 4, position_on_floor: 2,
  number: '42', ...overrides });

test('confirmed rebase keeps untouched remote fields and only carries local edits', () => {
  const base = unitDraft(revision());
  const draft = { ...base, description: 'Моё описание', reason: 'Проверено сотрудником' };
  const latest = revision({ version: 2, description: 'Описание другого сотрудника', total_price: '450000.03', availability_status: 'reserved' });
  const result = rebaseUnitDraft(base, draft, latest);
  const payload = unitPayload(result);
  assert.equal(payload.version, 2);
  assert.equal(payload.description, draft.description);
  assert.equal(payload.total_price, '450000.03');
  assert.equal(payload.availability_status, 'reserved');
  assert.equal(payload.reason, draft.reason);
  assert.equal(draft.version, 1);
  assert.equal(base.description, 'Исходное описание');
  const changes = unitConflictChanges(base, draft, latest);
  assert.equal(changes.find(row => row.key === 'description').keepLocal, true);
  assert.equal(changes.find(row => row.key === 'amount').keepLocal, false);
  assert.equal(changes.find(row => row.key === 'description').current, latest.description);
});

test('price basis and amount stay together when both editors change pricing', () => {
  const base = unitDraft(revision());
  const draft = { ...base, amount: '9007199254740.01' };
  const latest = revision({ version: 2, pricing_basis: 'per_sqm', price_per_sqm: '12000.03' });
  const result = unitPayload(rebaseUnitDraft(base, draft, latest));
  assert.equal(result.pricing_basis, 'total');
  assert.equal(result.total_price, draft.amount);
  assert.equal(result.price_per_sqm, undefined);
  const requested = unitPayload(rebaseUnitDraft(base, { ...base, on_request: true }, latest));
  assert.equal(requested.pricing_basis, 'total');
  assert.equal(requested.total_price, null);
});

test('placement changes never combine a number or position with a different remote entrance', () => {
  const base = unitDraft(revision());
  const latest = revision({ version: 2, block_id: 2, entrance_id: 20, floor: 8, position_on_floor: 5, number: '88' });
  const draft = { ...base, number: '43' };
  const result = unitPayload(rebaseUnitDraft(base, draft, latest));
  assert.deepEqual([result.block_id, result.entrance_id, result.floor, result.position_on_floor, result.number], [1, 10, 4, 2, '43']);
  assert.equal(unitConflictChanges(base, draft, latest).find(row => row.key === 'entrance_id').keepLocal, true);
});

test('a second conflict uses the accepted baseline and refuses archived or non-new revisions', () => {
  const base = unitDraft(revision());
  const draft = { ...base, description: 'Моё описание' };
  const second = revision({ version: 2, total_price: '450000.03' });
  const firstRebase = rebaseUnitDraft(base, draft, second);
  const result = rebaseUnitDraft(unitDraft(second), firstRebase, revision({ version: 3, total_price: '470000.07' }));
  assert.equal(result.version, 3);
  assert.equal(result.amount, '470000.07');
  assert.equal(result.description, draft.description);
  for (const latest of [revision(), revision({ version: 0 }), revision({ version: 1.5 }), revision({ version: 2, publication_status: 'archived' })]) {
    assert.throws(() => rebaseUnitDraft(base, draft, latest));
  }
});

const { bulkRows, inventoryDiff, batchBusy } = await import('../services/new-buildings/inventory-batches.ts');
test('bulk preview carries selected revisions and exact prices, never a live filter or float', () => {
  const selected = [{ id: 11, version: 4, label: '11' }, { id: 15, version: 7, label: '15' }];
  assert.deepEqual(bulkRows(selected, { enabled: true, basis: 'total', amount: '9007199254740,01', onRequest: false, clearDiscount: true }, 'reserved'), [
    { unit_id: 11, version: 4, pricing_basis: 'total', total_price: '9007199254740.01', discount_price: null, availability_status: 'reserved' },
    { unit_id: 15, version: 7, pricing_basis: 'total', total_price: '9007199254740.01', discount_price: null, availability_status: 'reserved' },
  ]);
  assert.deepEqual(bulkRows([selected[0]], { enabled: true, basis: 'per_sqm', amount: '', onRequest: true, clearDiscount: false }, ''), [
    { unit_id: 11, version: 4, pricing_basis: 'per_sqm', price_per_sqm: null },
  ]);
  for (const amount of ['0', '-1', '1e5', '1.234', '']) assert.throws(() => bulkRows(selected, { enabled: true, basis: 'total', amount, onRequest: false }, ''));
  assert.throws(() => bulkRows([], { enabled: false }, 'reserved'));
  assert.throws(() => bulkRows(Array.from({ length: 501 }, () => selected[0]), { enabled: false }, 'reserved'));
  assert.throws(() => bulkRows(selected, { enabled: false }, ''));
});

test('preview diff distinguishes explicit clears and keeps zero studio visible without invented changes', () => {
  assert.deepEqual(inventoryDiff({ id: 1, version: 2, rooms: 0, total_price: '400000.01' }, { id: 1, version: 3, rooms: 0, total_price: null }), [
    { field: 'total_price', before: '400000.01', after: null },
  ]);
  assert.deepEqual(inventoryDiff(null, { id: null, version: 1, rooms: 0, total_price: null }), [{ field: 'rooms', before: null, after: 0 }]);
  assert.equal(batchBusy('queued_apply'), true);
  assert.equal(batchBusy('applied'), false);
  assert.equal(batchBusy('conflict'), false);
});
