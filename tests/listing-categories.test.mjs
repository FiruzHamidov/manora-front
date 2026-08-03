import assert from 'node:assert/strict';
import test from 'node:test';
import { LISTING_CATEGORY_CARDS } from '../services/add-post/listing-categories.ts';

test('add listing selector contains only real estate and cars', () => {
  assert.deepEqual(
    LISTING_CATEGORY_CARDS.map(({ id, title }) => ({ id, title })),
    [
      { id: 'secondary', title: 'Недвижимость' },
      { id: 'transport', title: 'Авто' },
    ]
  );
});
