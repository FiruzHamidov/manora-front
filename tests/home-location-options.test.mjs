import assert from 'node:assert/strict';
import test from 'node:test';
import { orderHomeLocationOptions } from '../services/home/location-options.ts';

test('puts the requested cities first and sorts the rest alphabetically', () => {
  const result = orderHomeLocationOptions([
    { id: 9, name: 'Яван' },
    { id: 5, name: 'Гиссар' },
    { id: 2, name: 'Худжанд' },
    { id: 8, name: 'Исфара' },
    { id: 6, name: 'Рудаки' },
    { id: 1, name: 'Душанбе' },
    { id: 4, name: 'Вахдат' },
    { id: 3, name: 'Бохтар' },
  ]);

  assert.deepEqual(result.map((option) => option.name), [
    'Душанбе',
    'Худжанд',
    'Бохтар',
    'Вахдат',
    'Хисор',
    'Рудаки',
    'Исфара',
    'Яван',
  ]);
});

test('deduplicates Hisor aliases while preserving a valid API id', () => {
  const result = orderHomeLocationOptions([
    { id: 15, name: 'Гиссар' },
    { id: 16, name: 'Хисор' },
  ]);

  assert.deepEqual(result, [{ id: 15, name: 'Хисор' }]);
});
