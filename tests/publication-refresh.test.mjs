import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getPublicationDate,
  getPublicationRefreshEndpoint,
  getPublicationRefreshSuccessState,
  getRefreshCountdown,
  parsePublicationRefreshError,
  resolveNextRefreshAt,
} from '../services/publication-refresh/helpers.ts';

test('uses the property refresh-publication endpoint for real estate', () => {
  assert.equal(
    getPublicationRefreshEndpoint('property', 101),
    '/properties/101/refresh-publication'
  );
});

test('uses the car refresh-publication endpoint for automobiles', () => {
  assert.equal(
    getPublicationRefreshEndpoint('car', 202),
    '/cars/202/refresh-publication'
  );
});

test('uses timestamps returned by a successful refresh response', () => {
  const state = getPublicationRefreshSuccessState({
    id: 101,
    published_at: '2026-07-27T10:00:00.000Z',
    publication_expires_at: '2026-08-10T10:00:00.000Z',
    next_refresh_at: '2026-07-28T10:00:00.000Z',
    can_refresh_publication: false,
    refresh_available_in: 86_400,
  });

  assert.deepEqual(state, {
    publishedAt: '2026-07-27T10:00:00.000Z',
    publicationExpiresAt: '2026-08-10T10:00:00.000Z',
    nextRefreshAt: '2026-07-28T10:00:00.000Z',
    canRefreshPublication: false,
  });
  assert.deepEqual(
    getPublicationDate(state.publishedAt, '2026-06-01T10:00:00.000Z'),
    { value: state.publishedAt, label: 'Опубликовано' }
  );
});

test('reads next_refresh_at and retry_after from HTTP 429', () => {
  const details = parsePublicationRefreshError({
    response: {
      status: 429,
      data: {
        message: 'Обновление пока недоступно',
        next_refresh_at: '2026-07-28T10:00:00.000Z',
        retry_after: 3600,
      },
    },
  });

  assert.deepEqual(details, {
    status: 429,
    message: 'Обновление пока недоступно',
    nextRefreshAt: '2026-07-28T10:00:00.000Z',
    retryAfter: 3600,
  });
  assert.equal(
    resolveNextRefreshAt(details.nextRefreshAt, details.retryAfter),
    details.nextRefreshAt
  );
});

test('shows the backend message for HTTP 422', () => {
  assert.deepEqual(
    parsePublicationRefreshError({
      response: {
        status: 422,
        data: { message: 'Объявление должно быть одобрено' },
      },
    }),
    {
      status: 422,
      message: 'Объявление должно быть одобрено',
      nextRefreshAt: undefined,
      retryAfter: undefined,
    }
  );
});

test('shows the fixed access message for HTTP 403', () => {
  assert.deepEqual(
    parsePublicationRefreshError({
      response: {
        status: 403,
        data: { message: 'Forbidden' },
      },
    }),
    {
      status: 403,
      message: 'У вас нет доступа к этому объявлению',
    }
  );
});

test('counts down and becomes available when next_refresh_at is reached', () => {
  const now = Date.parse('2026-07-27T10:00:00.000Z');
  const nextRefreshAt = '2026-07-28T09:45:00.000Z';

  assert.deepEqual(getRefreshCountdown(nextRefreshAt, now), {
    isCoolingDown: true,
    remainingMs: 85_500_000,
    label: 'Можно обновить через 23 ч. 45 мин.',
  });
  assert.deepEqual(
    getRefreshCountdown(nextRefreshAt, Date.parse(nextRefreshAt)),
    {
      isCoolingDown: false,
      remainingMs: 0,
    }
  );
});
