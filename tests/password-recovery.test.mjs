import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getStandalonePasswordRecoveryError,
  formatTajikPhoneForMask,
  normalizePhoneForApi,
  normalizeTajikPhone,
  parsePasswordRecoveryError,
  PASSWORD_RECOVERY_CODE_LENGTH,
  PASSWORD_RECOVERY_ENDPOINTS,
  validateResetPasswords,
} from '../services/login/password-recovery.ts';

test('does not render the same backend error as both field and form feedback', () => {
  const message = 'Неверный или просроченный код.';

  assert.equal(
    getStandalonePasswordRecoveryError(message, { code: [message] }),
    ''
  );
  assert.equal(
    getStandalonePasswordRecoveryError('Сервис временно недоступен.', {
      code: [message],
    }),
    'Сервис временно недоступен.'
  );
});

test('uses the documented password recovery endpoints', () => {
  assert.deepEqual(PASSWORD_RECOVERY_ENDPOINTS, {
    forgot: '/password/forgot',
    verify: '/password/verify',
    reset: '/password/reset',
  });
  assert.equal(PASSWORD_RECOVERY_CODE_LENGTH, 6);
});

test('normalizes valid Tajik phone numbers and rejects incomplete values', () => {
  assert.equal(normalizeTajikPhone('(+992) 900 12 34 56'), '992900123456');
  assert.equal(normalizeTajikPhone('992900123456'), '992900123456');
  assert.equal(normalizeTajikPhone('900123456'), '992900123456');
  assert.equal(normalizeTajikPhone('+992 900 12 34'), null);
  assert.equal(normalizeTajikPhone('+998 900 12 34 56'), null);
});

test('uses one canonical phone format for auth API requests', () => {
  assert.equal(normalizePhoneForApi('918555581'), '992918555581');
  assert.equal(normalizePhoneForApi('992918555581'), '992918555581');
  assert.equal(normalizePhoneForApi('+992 918 555 581'), '992918555581');
});

test('formats backend phone values before initializing the masked input', () => {
  assert.equal(formatTajikPhoneForMask('992918555581'), '(+992) 918 55 55 81');
  assert.equal(formatTajikPhoneForMask('+992918555581'), '(+992) 918 55 55 81');
  assert.equal(formatTajikPhoneForMask('(+992) 918 55 55 81'), '(+992) 918 55 55 81');
});

test('requires a six-character password and matching confirmation', () => {
  assert.deepEqual(validateResetPasswords('12345', '1234'), {
    password: 'Пароль должен содержать минимум 6 символов',
    passwordConfirmation: 'Пароли не совпадают',
  });
  assert.deepEqual(validateResetPasswords('123456', '123456'), {});
});

test('preserves backend validation messages and field errors for HTTP 422', () => {
  const result = parsePasswordRecoveryError(
    {
      response: {
        status: 422,
        data: {
          message: 'Код подтверждения неверен.',
          errors: { code: ['Код подтверждения неверен.'] },
        },
      },
    },
    'Fallback'
  );

  assert.equal(result.status, 422);
  assert.equal(result.message, 'Код подтверждения неверен.');
  assert.deepEqual(result.fieldErrors, { code: ['Код подтверждения неверен.'] });
});

test('reads retry_after from an HTTP 429 response payload', () => {
  const result = parsePasswordRecoveryError(
    {
      response: {
        status: 429,
        data: { message: 'Подождите перед повторной отправкой.', retry_after: 37 },
      },
    },
    'Fallback'
  );

  assert.equal(result.status, 429);
  assert.equal(result.message, 'Подождите перед повторной отправкой.');
  assert.equal(result.retryAfter, 37);
});

test('uses the Retry-After header when an HTTP 429 payload has no retry_after', () => {
  const result = parsePasswordRecoveryError(
    {
      response: {
        status: 429,
        data: {},
        headers: { 'retry-after': '18' },
      },
    },
    'Fallback'
  );

  assert.equal(result.retryAfter, 18);
  assert.equal(result.message, 'Слишком много запросов. Попробуйте отправить код позже.');
});
