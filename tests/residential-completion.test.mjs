import test from 'node:test';
import assert from 'node:assert/strict';
import { formatCompletion, formatCompletionRange } from '../services/new-buildings/completion.ts';

test('completion precision preserves year and quarter without making up a date', () => {
  assert.equal(formatCompletion({ completion_precision: 'year', completion_year: 2028 }), '2028 год');
  assert.equal(formatCompletion({ completion_precision: 'quarter', completion_year: 2028, completion_quarter: 3 }), '3 квартал 2028');
  assert.equal(formatCompletion({ completion_precision: 'date', completion_at: '2028-02-29T00:00:00Z' }), '29.02.2028');
  assert.equal(formatCompletion({ completion_precision: 'unknown', completion_at: '2028-12-31' }), 'Срок не указан');
  assert.equal(formatCompletion({ completion_precision: 'quarter', completion_year: 2028 }), 'Срок не указан');
  assert.equal(formatCompletion({ completion_precision: 'date', completion_at: 'invalid' }), 'Срок не указан');
});

test('catalog completion range keeps period precision and signals unknown block deadlines', () => {
  const year = { completion_precision: 'year', completion_year: 2028 };
  const quarter = { completion_precision: 'quarter', completion_year: 2030, completion_quarter: 2 };
  assert.equal(formatCompletionRange({ from: year, to: year, has_unknown: false }), '2028 год');
  assert.equal(formatCompletionRange({ from: year, to: quarter, has_unknown: true }), '2028 год — 2 квартал 2030; часть сроков не указана');
  assert.equal(formatCompletionRange({ from: null, to: null, has_unknown: true }), 'Срок не указан');
});
