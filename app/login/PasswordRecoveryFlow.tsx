'use client';

import {
  ClipboardEvent,
  FormEvent,
  KeyboardEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useMask } from '@react-input/mask';
import {
  useRequestPasswordResetMutation,
  useResetPasswordMutation,
  useVerifyPasswordResetMutation,
} from '@/services/login/hooks';
import {
  getStandalonePasswordRecoveryError,
  formatTajikPhoneForMask,
  normalizeTajikPhone,
  parsePasswordRecoveryError,
  PASSWORD_RECOVERY_CODE_LENGTH,
  PASSWORD_RECOVERY_RESEND_SECONDS,
  validateResetPasswords,
} from '@/services/login/password-recovery';
import type { FieldErrors } from '@/services/login/types';

type RecoveryStep = 'phone' | 'code' | 'password';

type PasswordRecoveryFlowProps = {
  initialPhone?: string;
  onCancel: () => void;
  onComplete: (phone: string) => void;
};

const emptyCode = (): string[] =>
  Array(PASSWORD_RECOVERY_CODE_LENGTH).fill('');

export default function PasswordRecoveryFlow({
  initialPhone = '',
  onCancel,
  onComplete,
}: PasswordRecoveryFlowProps) {
  const [step, setStep] = useState<RecoveryStep>('phone');
  const [phone, setPhone] = useState(() => formatTajikPhoneForMask(initialPhone));
  const [codeDigits, setCodeDigits] = useState<string[]>(emptyCode);
  const [verifiedPhone, setVerifiedPhone] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const requestMutation = useRequestPasswordResetMutation();
  const verifyMutation = useVerifyPasswordResetMutation();
  const resetMutation = useResetPasswordMutation();
  const codeInputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const phoneMaskRef = useMask({
    mask: '(+992) ___ __ __ __',
    replacement: { _: /\d/ },
  });

  const normalizedPhone = useMemo(() => normalizeTajikPhone(phone), [phone]);
  const code = useMemo(() => codeDigits.join(''), [codeDigits]);
  const standaloneError = useMemo(
    () => getStandalonePasswordRecoveryError(error, fieldErrors),
    [error, fieldErrors]
  );
  const isBusy =
    requestMutation.isPending || verifyMutation.isPending || resetMutation.isPending;

  useEffect(() => {
    if (secondsLeft <= 0) return;

    const timerId = window.setInterval(() => {
      setSecondsLeft((current) => {
        if (current <= 1) {
          window.clearInterval(timerId);
          return 0;
        }
        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(timerId);
  }, [secondsLeft]);

  const clearFeedback = () => {
    setMessage('');
    setError('');
    setFieldErrors({});
  };

  const handlePhonePaste = (event: ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setPhone(formatTajikPhoneForMask(event.clipboardData.getData('text')));
    clearFeedback();
  };

  const requestCode = async (isResend = false) => {
    if (!normalizedPhone) {
      setFieldErrors({ phone: ['Введите корректный номер телефона'] });
      return;
    }

    clearFeedback();

    try {
      const response = await requestMutation.mutateAsync({ phone: normalizedPhone });
      setMessage(response.message);
      setCodeDigits(emptyCode());
      setResetToken('');
      setVerifiedPhone('');
      setStep('code');
      setSecondsLeft(PASSWORD_RECOVERY_RESEND_SECONDS);
      window.setTimeout(() => codeInputRefs.current[0]?.focus(), 0);
    } catch (requestError) {
      const parsed = parsePasswordRecoveryError(
        requestError,
        isResend ? 'Не удалось отправить код повторно.' : 'Не удалось отправить SMS-код.'
      );
      setError(parsed.message);
      setFieldErrors(parsed.fieldErrors);
      if (parsed.status === 429 && parsed.retryAfter) {
        setSecondsLeft(Math.ceil(parsed.retryAfter));
      }
    }
  };

  const verifyCode = async (event: FormEvent) => {
    event.preventDefault();

    if (!normalizedPhone) {
      setStep('phone');
      setFieldErrors({ phone: ['Введите корректный номер телефона'] });
      return;
    }

    if (code.length !== PASSWORD_RECOVERY_CODE_LENGTH) {
      setFieldErrors({ code: ['Введите шестизначный код из SMS'] });
      return;
    }

    clearFeedback();

    try {
      const response = await verifyMutation.mutateAsync({
        phone: normalizedPhone,
        code,
      });
      setResetToken(response.reset_token);
      setVerifiedPhone(response.phone);
      setPassword('');
      setPasswordConfirmation('');
      setStep('password');
    } catch (verifyError) {
      const parsed = parsePasswordRecoveryError(
        verifyError,
        'Не удалось подтвердить SMS-код.'
      );
      setError(parsed.message);
      setFieldErrors(parsed.fieldErrors);
    }
  };

  const submitNewPassword = async (event: FormEvent) => {
    event.preventDefault();

    const validation = validateResetPasswords(password, passwordConfirmation);
    if (validation.password || validation.passwordConfirmation) {
      setFieldErrors({
        password: validation.password ? [validation.password] : [],
        password_confirmation: validation.passwordConfirmation
          ? [validation.passwordConfirmation]
          : [],
      });
      return;
    }

    if (!verifiedPhone || !resetToken) {
      setStep('code');
      setError('Подтвердите SMS-код повторно.');
      return;
    }

    clearFeedback();

    try {
      await resetMutation.mutateAsync({
        phone: verifiedPhone,
        reset_token: resetToken,
        password,
        password_confirmation: passwordConfirmation,
      });
      setResetToken('');
      onComplete(verifiedPhone);
    } catch (resetError) {
      const parsed = parsePasswordRecoveryError(
        resetError,
        'Не удалось изменить пароль.'
      );
      setError(parsed.message);
      setFieldErrors(parsed.fieldErrors);

      if (parsed.fieldErrors.reset_token?.length) {
        setResetToken('');
      }
    }
  };

  const changePhone = () => {
    clearFeedback();
    setStep('phone');
    setCodeDigits(emptyCode());
    setResetToken('');
    setVerifiedPhone('');
    setSecondsLeft(0);
  };

  const handleCodeChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    setCodeDigits((current) => {
      const next = [...current];
      next[index] = digit;
      return next;
    });
    setFieldErrors((current) => ({ ...current, code: [] }));
    setError('');

    if (digit && index < PASSWORD_RECOVERY_CODE_LENGTH - 1) {
      codeInputRefs.current[index + 1]?.focus();
    }
  };

  const handleCodeKeyDown = (
    index: number,
    event: KeyboardEvent<HTMLInputElement>
  ) => {
    if (event.key === 'Backspace' && !codeDigits[index] && index > 0) {
      codeInputRefs.current[index - 1]?.focus();
    }
  };

  const handleCodePaste = (event: ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();
    const pasted = event.clipboardData
      .getData('text')
      .replace(/\D/g, '')
      .slice(0, PASSWORD_RECOVERY_CODE_LENGTH);
    if (!pasted) return;

    const next = emptyCode().map((_, index) => pasted[index] ?? '');
    setCodeDigits(next);
    setFieldErrors((current) => ({ ...current, code: [] }));
    codeInputRefs.current[Math.min(pasted.length, PASSWORD_RECOVERY_CODE_LENGTH - 1)]?.focus();
  };

  const renderFeedback = () => (
    <div aria-live="polite">
      {message ? (
        <div className="mt-4 rounded-[10px] border border-[#BFE8D7] bg-[#EFFAF5] px-4 py-3 text-sm text-[#006341]">
          {message}
        </div>
      ) : null}
      {standaloneError ? (
        <div className="mt-4 rounded-[10px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {standaloneError}
        </div>
      ) : null}
    </div>
  );

  if (step === 'phone') {
    return (
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void requestCode();
        }}
      >
        <h1 className="text-center text-[20px] font-bold text-[#111827]">
          Восстановление пароля
        </h1>
        <p className="mt-3 text-center text-[15px] leading-6 text-[#6B7280]">
          Введите номер телефона аккаунта. Мы отправим шестизначный код подтверждения.
        </p>

        <div className="mt-5">
          <label htmlFor="recovery-phone" className="mb-2 block text-sm font-medium text-[#334155]">
            Телефон
          </label>
          <input
            id="recovery-phone"
            ref={phoneMaskRef}
            autoFocus
            type="tel"
            value={phone}
            onPasteCapture={handlePhonePaste}
            onChange={(event) => {
              setPhone(event.target.value);
              clearFeedback();
            }}
            placeholder="(+992) 900 00 00 00"
            autoComplete="tel"
            aria-invalid={Boolean(fieldErrors.phone?.length)}
            aria-describedby={fieldErrors.phone?.length ? 'recovery-phone-error' : undefined}
            className="h-[50px] w-full rounded-[10px] border border-[#CDD5E1] bg-white px-3 text-[20px] text-[#0F172A] outline-none focus:border-[#006341]"
          />
          {fieldErrors.phone?.[0] ? (
            <p id="recovery-phone-error" className="mt-1 text-xs text-red-600">
              {fieldErrors.phone[0]}
            </p>
          ) : null}
        </div>

        {renderFeedback()}

        <button
          type="submit"
          disabled={!normalizedPhone || secondsLeft > 0 || requestMutation.isPending}
          className="mt-5 h-[50px] w-full rounded-[10px] bg-[#006341] text-[18px] font-medium text-white disabled:cursor-not-allowed disabled:bg-[#8FCDB3]"
        >
          {requestMutation.isPending
            ? 'Отправляем код...'
            : secondsLeft > 0
              ? `Повторить через ${secondsLeft} сек`
              : 'Получить код'}
        </button>

        <button
          type="button"
          onClick={onCancel}
          disabled={isBusy}
          className="mt-4 w-full text-center text-[15px] font-medium text-[#006341] disabled:text-[#94A3B8]"
        >
          Вернуться ко входу
        </button>
      </form>
    );
  }

  if (step === 'code') {
    return (
      <form onSubmit={verifyCode}>
        <h1 className="text-center text-[20px] font-bold text-[#111827]">
          Введите код из SMS
        </h1>
        <p className="mt-3 text-center text-[15px] leading-6 text-[#6B7280]">
          Код отправлен на {normalizedPhone ?? 'указанный номер'}
        </p>

        <div className="mt-4 flex items-center justify-between rounded-[10px] bg-[#EFFAF5] px-4 py-3">
          <button type="button" onClick={onCancel} className="text-sm font-medium text-[#006341]">
            Назад ко входу
          </button>
          <button type="button" onClick={changePhone} className="text-sm font-medium text-[#006341]">
            Изменить номер
          </button>
        </div>

        <div className="mt-5 flex justify-center gap-2">
          {Array.from({ length: PASSWORD_RECOVERY_CODE_LENGTH }).map((_, index) => (
            <input
              key={index}
              ref={(element) => {
                codeInputRefs.current[index] = element;
              }}
              aria-label={`Цифра кода ${index + 1}`}
              inputMode="numeric"
              autoComplete={index === 0 ? 'one-time-code' : 'off'}
              value={codeDigits[index]}
              onChange={(event) => handleCodeChange(index, event.target.value)}
              onKeyDown={(event) => handleCodeKeyDown(index, event)}
              onPaste={handleCodePaste}
              maxLength={1}
              className="h-[50px] w-[40px] rounded-[8px] border border-[#CDD5E1] bg-white text-center text-[24px] text-[#0F172A] outline-none focus:border-[#006341]"
            />
          ))}
        </div>
        {fieldErrors.code?.[0] ? (
          <p className="mt-2 text-center text-xs text-red-600">{fieldErrors.code[0]}</p>
        ) : null}

        {renderFeedback()}

        <button
          type="submit"
          disabled={code.length !== PASSWORD_RECOVERY_CODE_LENGTH || verifyMutation.isPending}
          className="mt-5 h-[50px] w-full rounded-[10px] bg-[#006341] text-[18px] font-medium text-white disabled:cursor-not-allowed disabled:bg-[#8FCDB3]"
        >
          {verifyMutation.isPending ? 'Проверяем код...' : 'Подтвердить код'}
        </button>

        <button
          type="button"
          onClick={() => void requestCode(true)}
          disabled={secondsLeft > 0 || requestMutation.isPending}
          className="mt-4 w-full text-center text-[15px] font-medium text-[#006341] disabled:cursor-not-allowed disabled:text-[#94A3B8]"
        >
          {requestMutation.isPending
            ? 'Отправляем код...'
            : secondsLeft > 0
              ? `Отправить повторно через ${secondsLeft} сек`
              : 'Отправить код повторно'}
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={submitNewPassword}>
      <h1 className="text-center text-[20px] font-bold text-[#111827]">
        Создайте новый пароль
      </h1>
      <p className="mt-3 text-center text-[15px] leading-6 text-[#6B7280]">
        Минимум 6 символов. После изменения все активные сессии будут завершены.
      </p>

      <div className="mt-5">
        <label htmlFor="recovery-password" className="mb-2 block text-sm font-medium text-[#334155]">
          Новый пароль
        </label>
        <input
          id="recovery-password"
          autoFocus
          type={showPasswords ? 'text' : 'password'}
          value={password}
          onChange={(event) => {
            setPassword(event.target.value);
            setFieldErrors((current) => ({ ...current, password: [] }));
          }}
          autoComplete="new-password"
          aria-invalid={Boolean(fieldErrors.password?.length)}
          className="h-[50px] w-full rounded-[10px] border border-[#CDD5E1] bg-white px-3 text-[17px] text-[#0F172A] outline-none focus:border-[#006341]"
        />
        {fieldErrors.password?.[0] ? (
          <p className="mt-1 text-xs text-red-600">{fieldErrors.password[0]}</p>
        ) : null}
      </div>

      <div className="mt-4">
        <label htmlFor="recovery-password-confirmation" className="mb-2 block text-sm font-medium text-[#334155]">
          Повторите пароль
        </label>
        <input
          id="recovery-password-confirmation"
          type={showPasswords ? 'text' : 'password'}
          value={passwordConfirmation}
          onChange={(event) => {
            setPasswordConfirmation(event.target.value);
            setFieldErrors((current) => ({ ...current, password_confirmation: [] }));
          }}
          autoComplete="new-password"
          aria-invalid={Boolean(fieldErrors.password_confirmation?.length)}
          className="h-[50px] w-full rounded-[10px] border border-[#CDD5E1] bg-white px-3 text-[17px] text-[#0F172A] outline-none focus:border-[#006341]"
        />
        {fieldErrors.password_confirmation?.[0] ? (
          <p className="mt-1 text-xs text-red-600">
            {fieldErrors.password_confirmation[0]}
          </p>
        ) : null}
      </div>

      <button
        type="button"
        onClick={() => setShowPasswords((current) => !current)}
        className="mt-3 text-sm font-medium text-[#006341]"
      >
        {showPasswords ? 'Скрыть пароли' : 'Показать пароли'}
      </button>

      {fieldErrors.reset_token?.[0] ? (
        <div className="mt-4 rounded-[10px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {fieldErrors.reset_token[0]}
        </div>
      ) : null}
      {renderFeedback()}

      <button
        type="submit"
        disabled={password.length < 6 || !passwordConfirmation || resetMutation.isPending}
        className="mt-5 h-[50px] w-full rounded-[10px] bg-[#006341] text-[18px] font-medium text-white disabled:cursor-not-allowed disabled:bg-[#8FCDB3]"
      >
        {resetMutation.isPending ? 'Сохраняем пароль...' : 'Изменить пароль'}
      </button>

      <button
        type="button"
        onClick={onCancel}
        disabled={isBusy}
        className="mt-4 w-full text-center text-[15px] font-medium text-[#006341] disabled:text-[#94A3B8]"
      >
        Вернуться ко входу
      </button>
    </form>
  );
}
