import { format } from '@react-input/mask';
import type { FieldErrors } from './types';

export const PASSWORD_RECOVERY_ENDPOINTS = {
  forgot: '/password/forgot',
  verify: '/password/verify',
  reset: '/password/reset',
} as const;

export const PASSWORD_RECOVERY_CODE_LENGTH = 6;
export const PASSWORD_RECOVERY_RESEND_SECONDS = 60;

const TAJIK_PHONE_MASK_OPTIONS = {
  mask: '(+992) ___ __ __ __',
  replacement: { _: /\d/ },
};

export type PasswordRecoveryError = {
  status?: number;
  message: string;
  fieldErrors: FieldErrors;
  retryAfter?: number;
};

export type PasswordValidationResult = {
  password?: string;
  passwordConfirmation?: string;
};

export const getStandalonePasswordRecoveryError = (
  message: string,
  fieldErrors: FieldErrors
): string => {
  const normalizedMessage = message.trim();
  if (!normalizedMessage) return '';

  const duplicatesFieldError = Object.values(fieldErrors).some((messages) =>
    messages.some((fieldMessage) => fieldMessage.trim() === normalizedMessage)
  );

  return duplicatesFieldError ? '' : message;
};

export const normalizeTajikPhone = (rawPhone: string): string | null => {
  const digits = normalizePhoneForApi(rawPhone);

  if (digits.length !== 12 || !digits.startsWith('992')) {
    return null;
  }

  return digits;
};

export const normalizePhoneForApi = (rawPhone: string): string => {
  const digits = rawPhone.replace(/\D/g, '');

  return digits.length === 9 ? `992${digits}` : digits;
};

export const formatTajikPhoneForMask = (rawPhone: string): string => {
  const digits = rawPhone.replace(/\D/g, '');
  const localDigits = digits.startsWith('992') ? digits.slice(3) : digits;

  return format(localDigits.slice(0, 9), TAJIK_PHONE_MASK_OPTIONS);
};

export const validateResetPasswords = (
  password: string,
  passwordConfirmation: string
): PasswordValidationResult => {
  const errors: PasswordValidationResult = {};

  if (password.length < 6) {
    errors.password = 'Пароль должен содержать минимум 6 символов';
  }

  if (passwordConfirmation !== password) {
    errors.passwordConfirmation = 'Пароли не совпадают';
  }

  return errors;
};

export const parsePasswordRecoveryError = (
  error: unknown,
  fallback: string
): PasswordRecoveryError => {
  const candidate = error as {
    response?: {
      status?: number;
      data?: {
        message?: string;
        errors?: FieldErrors;
        retry_after?: number;
      };
      headers?: Record<string, string | number | undefined>;
    };
  };

  const status = candidate?.response?.status;
  const payload = candidate?.response?.data;
  const retryAfterHeader = Number(candidate?.response?.headers?.['retry-after']);
  const retryAfterPayload = Number(payload?.retry_after);
  const retryAfter = Number.isFinite(retryAfterPayload) && retryAfterPayload > 0
    ? retryAfterPayload
    : Number.isFinite(retryAfterHeader) && retryAfterHeader > 0
      ? retryAfterHeader
      : undefined;

  return {
    status,
    message:
      payload?.message ||
      (status === 429
        ? 'Слишком много запросов. Попробуйте отправить код позже.'
        : status === 422
          ? 'Проверьте введённые данные.'
          : fallback),
    fieldErrors: payload?.errors ?? {},
    retryAfter,
  };
};
