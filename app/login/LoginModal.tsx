'use client';

import { ClipboardEvent, FormEvent, KeyboardEvent, MutableRefObject, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMask } from '@react-input/mask';
import Logo from '@/icons/Logo';
import PasswordRecoveryFlow from './PasswordRecoveryFlow';
import { extractApiErrorMessage, extractFieldErrors } from '@/services/login/api';
import {
  formatTajikPhoneForMask,
  normalizeTajikPhone,
} from '@/services/login/password-recovery';
import {
  useLoginMutation,
  useSendSmsMutation,
  useVerifyLoginSmsMutation,
  useVerifyRegistrationSmsMutation,
} from '@/services/login/hooks';
import type { AuthMode } from '@/services/login/types';

const CODE_LENGTH = 6;
const RESEND_TIMEOUT_SECONDS = 60;

type LoginModalProps = {
  onClose?: () => void;
  initialView?: 'login' | 'register';
};

type RegisterStep = 'phone' | 'code';

type RegistrationDraft = { phone: string };

const createEmptyRegisterForm = (): RegistrationDraft => ({
  phone: '',
});

export default function LoginModal({ onClose, initialView = 'login' }: LoginModalProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [view, setView] = useState<'login' | 'register'>(initialView);
  const [mode, setMode] = useState<AuthMode>('sms');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginCodeDigits, setLoginCodeDigits] = useState<string[]>(Array(CODE_LENGTH).fill(''));
  const [smsSent, setSmsSent] = useState(false);
  const [error, setError] = useState('');
  const [loginSuccessMessage, setLoginSuccessMessage] = useState('');
  const [isRecoveringPassword, setIsRecoveringPassword] = useState(false);
  const [resendSecondsLeft, setResendSecondsLeft] = useState(0);

  const [registerStep, setRegisterStep] = useState<RegisterStep>('phone');
  const [registerForm, setRegisterForm] = useState<RegistrationDraft>(createEmptyRegisterForm);
  const [registerCodeDigits, setRegisterCodeDigits] = useState<string[]>(Array(CODE_LENGTH).fill(''));
  const [registerResendSecondsLeft, setRegisterResendSecondsLeft] = useState(0);
  const [registerError, setRegisterError] = useState('');
  const [registerFieldErrors, setRegisterFieldErrors] = useState<Record<string, string[]>>({});

  const sendSmsMutation = useSendSmsMutation();
  const verifyLoginSmsMutation = useVerifyLoginSmsMutation();
  const verifyRegistrationSmsMutation = useVerifyRegistrationSmsMutation();
  const passwordLoginMutation = useLoginMutation();

  const loginInputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const registerInputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const phoneInputRef = useRef<HTMLInputElement | null>(null);
  const registerPhoneInputRef = useRef<HTMLInputElement | null>(null);
  const loginMaskRef = useMask({
    mask: '(+992) ___ __ __ __',
    replacement: { _: /\d/ },
  });
  const registerMaskRef = useMask({
    mask: '(+992) ___ __ __ __',
    replacement: { _: /\d/ },
  });

  const normalizedPhone = useMemo(() => normalizeTajikPhone(phone), [phone]);
  const normalizedRegisterPhone = useMemo(
    () => normalizeTajikPhone(registerForm.phone),
    [registerForm.phone]
  );
  const loginCode = useMemo(() => loginCodeDigits.join(''), [loginCodeDigits]);
  const registerCode = useMemo(() => registerCodeDigits.join(''), [registerCodeDigits]);
  const canSendSms = Boolean(normalizedPhone);
  const canVerify = Boolean(normalizedPhone) && loginCode.length === CODE_LENGTH;
  const canLoginByPassword = Boolean(normalizedPhone) && password.trim().length > 0;
  const canRequestRegisterSms = Boolean(normalizedRegisterPhone);
  const canVerifyRegisterSms = Boolean(normalizedRegisterPhone) && registerCode.length === CODE_LENGTH;

  useEffect(() => {
    const requestedView = searchParams.get('mode') === 'register' ? 'register' : initialView;
    setView(requestedView);
  }, [initialView, searchParams]);

  useEffect(() => {
    if (resendSecondsLeft <= 0) {
      return;
    }

    const timerId = window.setInterval(() => {
      setResendSecondsLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(timerId);
          return 0;
        }

        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(timerId);
  }, [resendSecondsLeft]);

  useEffect(() => {
    if (registerResendSecondsLeft <= 0) {
      return;
    }

    const timerId = window.setInterval(() => {
      setRegisterResendSecondsLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(timerId);
          return 0;
        }

        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(timerId);
  }, [registerResendSecondsLeft]);

  const resetSmsState = () => {
    setSmsSent(false);
    setLoginCodeDigits(Array(CODE_LENGTH).fill(''));
    setResendSecondsLeft(0);
  };

  const handleLoginPhonePaste = (event: ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();
    event.stopPropagation();

    if (smsSent) {
      resetSmsState();
    }

    setPhone(formatTajikPhoneForMask(event.clipboardData.getData('text')));
    setError('');
    setLoginSuccessMessage('');
  };

  const clearRegistrationVerification = () => {
    setRegisterCodeDigits(Array(CODE_LENGTH).fill(''));
    setRegisterResendSecondsLeft(0);
    setRegisterFieldErrors((prev) => ({
      ...prev,
      phone: [],
      code: [],
      verification_token: [],
    }));
  };

  const resetRegisterState = () => {
    setRegisterStep('phone');
    setRegisterForm(createEmptyRegisterForm());
    setRegisterCodeDigits(Array(CODE_LENGTH).fill(''));
    setRegisterResendSecondsLeft(0);
    setRegisterError('');
    setRegisterFieldErrors({});
  };

  const switchView = (nextView: 'login' | 'register') => {
    setView(nextView);
    setError('');
    setLoginSuccessMessage('');
    setIsRecoveringPassword(false);

    if (nextView === 'login') {
      resetRegisterState();
      return;
    }

    resetSmsState();
    setPassword('');
    setShowPassword(false);
  };

  const handleBackToMethodSelection = () => {
    resetSmsState();
    setError('');
  };

  const handleChangePhone = () => {
    resetSmsState();
    setError('');
    window.setTimeout(() => phoneInputRef.current?.focus(), 0);
  };

  const handleModeChange = (nextMode: AuthMode) => {
    setMode(nextMode);
    setError('');
    setLoginSuccessMessage('');

    if (nextMode === 'password') {
      resetSmsState();
      return;
    }

    setPassword('');
    setShowPassword(false);
  };

  const openPasswordRecovery = () => {
    setError('');
    setLoginSuccessMessage('');
    setPassword('');
    setShowPassword(false);
    setIsRecoveringPassword(true);
  };

  const closePasswordRecovery = () => {
    setIsRecoveringPassword(false);
    setMode('password');
    setError('');
  };

  const completePasswordRecovery = (recoveryPhone: string) => {
    setPhone(formatTajikPhoneForMask(recoveryPhone));
    setPassword('');
    setShowPassword(false);
    setMode('password');
    setError('');
    setIsRecoveringPassword(false);
    setLoginSuccessMessage('Пароль успешно изменён');
  };

  const handleSendSms = async () => {
    if (!normalizedPhone) {
      setError('Введите корректный номер телефона');
      return;
    }

    setError('');

    try {
      await sendSmsMutation.mutateAsync({ phone: normalizedPhone, scenario: 'login' });
      setSmsSent(true);
      setLoginCodeDigits(Array(CODE_LENGTH).fill(''));
      setResendSecondsLeft(RESEND_TIMEOUT_SECONDS);
      window.setTimeout(() => loginInputRefs.current[0]?.focus(), 0);
    } catch (sendError) {
      setError(extractApiErrorMessage(sendError, 'Не удалось отправить SMS-код'));
    }
  };

  const handleVerifySms = async (event: FormEvent) => {
    event.preventDefault();

    if (!normalizedPhone) {
      setError('Введите корректный номер телефона');
      return;
    }

    setError('');

    try {
      await verifyLoginSmsMutation.mutateAsync({
        phone: normalizedPhone,
        code: loginCode,
        scenario: 'login',
      });
      close();
    } catch (verifyError) {
      setError(extractApiErrorMessage(verifyError, 'Не удалось войти по SMS-коду'));
    }
  };

  const handlePasswordLogin = async (event: FormEvent) => {
    event.preventDefault();

    if (!normalizedPhone) {
      setError('Введите корректный номер телефона');
      return;
    }

    setError('');

    try {
      await passwordLoginMutation.mutateAsync({
        phone: normalizedPhone,
        password: password.trim(),
      });
      close();
    } catch (loginError) {
      setError(extractApiErrorMessage(loginError, 'Не удалось войти по паролю'));
    }
  };

  const handleRegisterPhoneChange = (value: string) => {
    setRegisterForm((prev) => ({ ...prev, phone: value }));
    setRegisterFieldErrors((prev) => ({ ...prev, phone: [], verification_token: [] }));
    setRegisterError('');
  };

  const handleRegisterPhonePaste = (event: ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();
    event.stopPropagation();
    handleRegisterPhoneChange(
      formatTajikPhoneForMask(event.clipboardData.getData('text'))
    );
  };

  const handleSendRegisterSms = async () => {
    if (!normalizedRegisterPhone) {
      setRegisterError('Введите корректный номер телефона');
      return;
    }

    setRegisterError('');
    setRegisterFieldErrors({});

    try {
      await sendSmsMutation.mutateAsync({
        phone: normalizedRegisterPhone,
        scenario: 'registration',
      });
      clearRegistrationVerification();
      setRegisterStep('code');
      setRegisterResendSecondsLeft(RESEND_TIMEOUT_SECONDS);
      window.setTimeout(() => registerInputRefs.current[0]?.focus(), 0);
    } catch (sendError) {
      const errors = extractFieldErrors(sendError);
      if (Object.keys(errors).length > 0) {
        setRegisterFieldErrors(errors);
      }
      const message = extractApiErrorMessage(sendError, 'Не удалось отправить SMS-код');
      setRegisterError(Object.keys(errors).length > 0 ? '' : message);
    }
  };

  const handleVerifyRegisterSms = async (event: FormEvent) => {
    event.preventDefault();

    if (!normalizedRegisterPhone) {
      setRegisterError('Введите корректный номер телефона');
      return;
    }

    setRegisterError('');
    setRegisterFieldErrors((prev) => ({
      ...prev,
      code: [],
      verification_token: [],
    }));

    try {
      await verifyRegistrationSmsMutation.mutateAsync({
        phone: normalizedRegisterPhone,
        code: registerCode,
        scenario: 'registration',
      });
      close();
    } catch (verifyError) {
      const errors = extractFieldErrors(verifyError);
      if (Object.keys(errors).length > 0) {
        setRegisterFieldErrors((prev) => ({
          ...prev,
          ...errors,
        }));
      }
      const message = extractApiErrorMessage(
        verifyError,
        'Не удалось подтвердить номер. Запросите код повторно.'
      );
      setRegisterError(Object.keys(errors).length > 0 ? '' : message);
    }
  };


  const onCodeChange = (
    index: number,
    value: string,
    digits: string[],
    setDigits: (value: string[] | ((prev: string[]) => string[])) => void,
    refs: MutableRefObject<Array<HTMLInputElement | null>>
  ) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[index] = digit;
    setDigits(next);

    if (digit && index < CODE_LENGTH - 1) {
      refs.current[index + 1]?.focus();
    }
  };

  const onCodeKeyDown = (
    index: number,
    event: KeyboardEvent<HTMLInputElement>,
    digits: string[],
    refs: MutableRefObject<Array<HTMLInputElement | null>>
  ) => {
    if (event.key === 'Backspace' && !digits[index] && index > 0) {
      refs.current[index - 1]?.focus();
    }
  };

  const onCodePaste = (
    event: ClipboardEvent<HTMLInputElement>,
    setDigits: (value: string[] | ((prev: string[]) => string[])) => void,
    refs: MutableRefObject<Array<HTMLInputElement | null>>
  ) => {
    event.preventDefault();

    const pastedDigits = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, CODE_LENGTH);
    if (!pastedDigits) {
      return;
    }

    const nextDigits = Array(CODE_LENGTH)
      .fill('')
      .map((_, index) => pastedDigits[index] ?? '');

    setDigits(nextDigits);
    const focusIndex = Math.min(pastedDigits.length, CODE_LENGTH - 1);
    refs.current[focusIndex]?.focus();
  };

  const close = () => {
    if (onClose) {
      onClose();
      return;
    }

    if (window.history.length > 1) {
      router.back();
      return;
    }

    router.push('/');
  };

  const modalWidthClass = 'max-w-[400px]';

  return (
    <div className="fixed inset-0 z-[120] overflow-y-auto">
      <div
        className="absolute inset-0 bg-black/45"
        onClick={close}
      />

      <div className="relative z-10 flex min-h-full items-start justify-center px-4 py-4 sm:min-h-screen sm:items-center sm:py-6">
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Авторизация"
          className={`max-h-[calc(100dvh-2rem)] w-full overflow-y-auto rounded-[24px] bg-[#F5F6F8] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.3)] overscroll-contain ${modalWidthClass} md:p-8 sm:max-h-[calc(100dvh-3rem)]`}
        >
          <div className="mb-2 flex justify-end">
              <button
                type="button"
                onClick={close}
                aria-label="Закрыть"
                className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#D5DBE4] text-white"
              >
                ×
              </button>
          </div>

          <div className="mb-5 flex justify-center">
            <Logo className="h-[40px] w-[200px]" />
          </div>

          {!isRecoveringPassword ? (
            <div className="mx-auto mb-6 grid w-full max-w-[360px] grid-cols-2 gap-2 rounded-[12px] bg-[#E6F3EC] p-1">
              <button
                type="button"
                onClick={() => switchView('login')}
                className={`h-[44px] rounded-[10px] text-[15px] font-medium transition ${
                  view === 'login' ? 'bg-white text-[#006341] shadow-sm' : 'text-[#475569]'
                }`}
              >
                Вход
              </button>
              <button
                type="button"
                onClick={() => switchView('register')}
                className={`h-[44px] rounded-[10px] text-[15px] font-medium transition ${
                  view === 'register' ? 'bg-white text-[#006341] shadow-sm' : 'text-[#475569]'
                }`}
              >
                Регистрация
              </button>
            </div>
          ) : null}

          {view === 'login' && isRecoveringPassword ? (
            <PasswordRecoveryFlow
              initialPhone={phone}
              onCancel={closePasswordRecovery}
              onComplete={completePasswordRecovery}
            />
          ) : view === 'login' ? (
            <form onSubmit={mode === 'sms' && smsSent ? handleVerifySms : handlePasswordLogin}>
              <h1 className="text-center text-[18px] font-bold text-[#111827]">Войти в личный кабинет</h1>
              <p className="mt-3 text-center text-[16px] text-[#6B7280]">Введите номер телефона и выберите способ входа</p>

              <div className="mt-4">
                <input
                  autoFocus
                  ref={(node) => {
                    phoneInputRef.current = node;
                    if (node) {
                      loginMaskRef.current = node;
                    }
                  }}
                  type="tel"
                  value={phone}
                  onPasteCapture={handleLoginPhonePaste}
                  onChange={(event) => {
                    if (smsSent) {
                      resetSmsState();
                    }
                    setPhone(event.target.value);
                    setError('');
                    setLoginSuccessMessage('');
                  }}
                  placeholder="(+992) 900 00 00 00"
                  className="h-[50px] w-full rounded-[10px] border border-[#CDD5E1] bg-white px-3 text-[20px] text-[#0F172A] outline-none focus:border-[#006341]"
                />
              </div>

              {!(mode === 'sms' && smsSent) ? (
                <div className="mt-4 grid grid-cols-2 gap-2 rounded-[10px] bg-[#E6F3EC] p-1">
                  <button
                    type="button"
                    onClick={() => handleModeChange('sms')}
                    className={`h-[44px] rounded-[8px] text-[15px] font-medium transition ${
                      mode === 'sms' ? 'bg-white text-[#006341] shadow-sm' : 'text-[#475569]'
                    }`}
                  >
                    Войти по СМС
                  </button>
                  <button
                    type="button"
                    onClick={() => handleModeChange('password')}
                    className={`h-[44px] rounded-[8px] text-[15px] font-medium transition ${
                      mode === 'password' ? 'bg-white text-[#006341] shadow-sm' : 'text-[#475569]'
                    }`}
                  >
                    Войти по паролю
                  </button>
                </div>
              ) : (
                <div className="mt-4 flex items-center justify-between gap-3 rounded-[10px] bg-[#EFFAF5] px-4 py-3">
                  <button
                    type="button"
                    onClick={handleBackToMethodSelection}
                    className="text-[15px] font-medium text-[#006341]"
                  >
                    Назад
                  </button>
                  <button
                    type="button"
                    onClick={handleChangePhone}
                    className="text-[15px] font-medium text-[#006341]"
                  >
                    Изменить номер
                  </button>
                </div>
              )}

              {mode === 'sms' ? (
                <>
                  {smsSent ? (
                    <>
                      <p className="mt-4 text-center text-[15px] text-[#6B7280]">
                        Введите код из SMS, отправленный на {normalizedPhone ?? 'указанный номер'}
                      </p>

                      <div className="mt-4 flex justify-center gap-2">
                        {Array.from({ length: CODE_LENGTH }).map((_, index) => (
                          <input
                            key={index}
                            ref={(element) => {
                              loginInputRefs.current[index] = element;
                            }}
                            inputMode="numeric"
                            value={loginCodeDigits[index]}
                            onChange={(event) =>
                              onCodeChange(index, event.target.value, loginCodeDigits, setLoginCodeDigits, loginInputRefs)
                            }
                            onKeyDown={(event) => onCodeKeyDown(index, event, loginCodeDigits, loginInputRefs)}
                            onPaste={(event) => onCodePaste(event, setLoginCodeDigits, loginInputRefs)}
                            className="h-[50px] w-[40px] rounded-[8px] border border-[#CDD5E1] bg-white text-center text-[24px] text-[#0F172A] outline-none focus:border-[#006341]"
                            maxLength={1}
                          />
                        ))}
                      </div>

                      <button
                        type="submit"
                        disabled={!canVerify || verifyLoginSmsMutation.isPending}
                        className="mt-5 h-[50px] w-full rounded-[10px] bg-[#006341] text-[20px] font-medium text-white disabled:bg-[#CBD5E1] disabled:text-[#6B7280]"
                      >
                        {verifyLoginSmsMutation.isPending ? 'Входим...' : 'Войти'}
                      </button>

                      <button
                        type="button"
                        onClick={handleSendSms}
                        disabled={resendSecondsLeft > 0 || sendSmsMutation.isPending}
                        className="mt-3 w-full text-center text-[16px] font-medium text-[#006341] disabled:cursor-not-allowed disabled:text-[#94A3B8]"
                      >
                        {sendSmsMutation.isPending
                          ? 'Отправка...'
                          : resendSecondsLeft > 0
                            ? `Отправить повторно через ${resendSecondsLeft} сек`
                            : 'Отправить повторно'}
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSendSms}
                      disabled={!canSendSms || sendSmsMutation.isPending}
                      className="mt-5 h-[50px] w-full rounded-[10px] bg-[#006341] text-[20px] font-medium text-white disabled:bg-[#8FCDB3]"
                    >
                      {sendSmsMutation.isPending ? 'Отправка...' : 'Получить код'}
                    </button>
                  )}
                </>
              ) : (
                <>
                  <div className="relative mt-4">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(event) => {
                        setPassword(event.target.value);
                        setError('');
                        setLoginSuccessMessage('');
                      }}
                      placeholder="Пароль"
                      className="h-[50px] w-full rounded-[10px] border border-[#CDD5E1] bg-white px-3 pr-20 text-[18px] text-[#0F172A] outline-none focus:border-[#006341]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[14px] font-medium text-[#006341]"
                    >
                      {showPassword ? 'Скрыть' : 'Показать'}
                    </button>
                  </div>

                  <div className="mt-3 flex justify-end">
                    <button
                      type="button"
                      onClick={openPasswordRecovery}
                      className="text-[15px] font-medium text-[#006341] underline underline-offset-2"
                    >
                      Забыли пароль?
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={!canLoginByPassword || passwordLoginMutation.isPending}
                    className="mt-5 h-[50px] w-full rounded-[10px] bg-[#006341] text-[20px] font-medium text-white disabled:bg-[#8FCDB3]"
                  >
                    {passwordLoginMutation.isPending ? 'Входим...' : 'Войти'}
                  </button>
                </>
              )}

              <p className="mt-4 text-center text-[15px] text-[#6B7280]">
                Нет аккаунта?{' '}
                <button
                  type="button"
                  onClick={() => switchView('register')}
                  className="font-medium text-[#006341] underline underline-offset-2"
                >
                  Зарегистрироваться
                </button>
              </p>

              {loginSuccessMessage ? (
                <div
                  role="status"
                  className="mt-4 rounded-[10px] border border-[#BFE8D7] bg-[#EFFAF5] px-4 py-3 text-center text-[15px] text-[#006341]"
                >
                  {loginSuccessMessage}
                </div>
              ) : null}
              {error ? <div className="mt-3 text-center text-[16px] text-red-600">{error}</div> : null}
            </form>
          ) : registerStep === 'phone' ? (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                void handleSendRegisterSms();
              }}
            >
              <div className="text-center">
                <div className="inline-flex rounded-full bg-[#EFFAF5] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#006341]">
                  Шаг 1
                </div>
                <h1 className="mt-4 text-2xl font-black text-[#0F172A] md:text-3xl">Подтвердите номер</h1>
                <p className="mt-3 text-sm leading-6 text-[#52607A] md:text-base">
                  Введите номер телефона. После подтверждения SMS-кода аккаунт будет создан, и вы сразу войдёте.
                </p>
              </div>

              <div className="mx-auto mt-8 max-w-[420px]">
                <label className="mb-2 block text-sm font-semibold text-[#334155]">Телефон</label>
                <input
                  ref={(node) => {
                    registerPhoneInputRef.current = node;
                    if (node) {
                      registerMaskRef.current = node;
                    }
                  }}
                  autoFocus
                  type="tel"
                  value={registerForm.phone}
                  onPasteCapture={handleRegisterPhonePaste}
                  onChange={(event) => handleRegisterPhoneChange(event.target.value)}
                  className="h-12 w-full rounded-2xl border border-[#CBD5E1] bg-white px-4 text-sm outline-none transition focus:border-[#006341]"
                  placeholder="(+992) 900 00 00 00"
                />
                {registerFieldErrors.phone?.[0] ? (
                  <p className="mt-1 text-xs text-red-600">{registerFieldErrors.phone[0]}</p>
                ) : null}
              </div>

              {registerError ? (
                <div className="mx-auto mt-4 max-w-[420px] rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {registerError}
                </div>
              ) : null}

              <div className="mx-auto mt-6 flex max-w-[420px] flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <button
                  type="submit"
                  disabled={!canRequestRegisterSms || sendSmsMutation.isPending}
                  className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-[#006341] px-6 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:bg-[#8FCDB3] md:w-auto"
                >
                  {sendSmsMutation.isPending ? 'Отправляем код...' : 'Получить код'}
                </button>

                <p className="text-center text-sm text-[#6B7280] md:text-right">
                  Уже есть аккаунт?{' '}
                  <button
                    type="button"
                    onClick={() => switchView('login')}
                    className="font-semibold text-[#006341] underline underline-offset-2"
                  >
                    Войти
                  </button>
                </p>
              </div>
            </form>
          ) : registerStep === 'code' ? (
            <form onSubmit={handleVerifyRegisterSms}>
              <div className="text-center">
                <div className="inline-flex rounded-full bg-[#EFFAF5] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#006341]">
                  Шаг 2
                </div>
                <h1 className="mt-4 text-2xl font-black text-[#0F172A] md:text-3xl">Введите код из SMS</h1>
                <p className="mt-3 text-sm leading-6 text-[#52607A] md:text-base">
                  Код отправлен на {normalizedRegisterPhone ?? 'указанный номер'}. После подтверждения вы сразу войдёте в аккаунт.
                </p>
              </div>

              <div className="mt-6 flex items-center justify-between gap-3 rounded-[10px] bg-[#EFFAF5] px-4 py-3">
                <button
                  type="button"
                  onClick={() => {
                    setRegisterStep('phone');
                    setRegisterError('');
                  }}
                  className="text-[15px] font-medium text-[#006341]"
                >
                  Назад
                </button>
                <button
                  type="button"
                  onClick={() => {
                    clearRegistrationVerification();
                    setRegisterStep('phone');
                    setRegisterError('');
                    window.setTimeout(() => registerPhoneInputRef.current?.focus(), 0);
                  }}
                  className="text-[15px] font-medium text-[#006341]"
                >
                  Изменить номер
                </button>
              </div>

              <div className="mt-6 flex justify-center gap-2">
                {Array.from({ length: CODE_LENGTH }).map((_, index) => (
                  <input
                    key={index}
                    ref={(element) => {
                      registerInputRefs.current[index] = element;
                    }}
                    inputMode="numeric"
                    value={registerCodeDigits[index]}
                    onChange={(event) =>
                      onCodeChange(index, event.target.value, registerCodeDigits, setRegisterCodeDigits, registerInputRefs)
                    }
                    onKeyDown={(event) => onCodeKeyDown(index, event, registerCodeDigits, registerInputRefs)}
                    onPaste={(event) => onCodePaste(event, setRegisterCodeDigits, registerInputRefs)}
                    className="h-[50px] w-[40px] rounded-[8px] border border-[#CDD5E1] bg-white text-center text-[24px] text-[#0F172A] outline-none focus:border-[#006341]"
                    maxLength={1}
                  />
                ))}
              </div>

              {registerFieldErrors.code?.[0] ? (
                <p className="mt-3 text-center text-sm text-red-600">{registerFieldErrors.code[0]}</p>
              ) : null}
              {registerFieldErrors.verification_token?.[0] ? (
                <p className="mt-3 text-center text-sm text-red-600">{registerFieldErrors.verification_token[0]}</p>
              ) : null}
              {registerError ? (
                <div className="mx-auto mt-4 max-w-[520px] rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {registerError}
                </div>
              ) : null}

              <div className="mx-auto mt-6 max-w-[420px]">
                <button
                  type="submit"
                  disabled={!canVerifyRegisterSms || verifyRegistrationSmsMutation.isPending}
                  className="h-12 w-full rounded-2xl bg-[#006341] px-6 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:bg-[#8FCDB3]"
                >
                  {verifyRegistrationSmsMutation.isPending ? 'Входим...' : 'Подтвердить и войти'}
                </button>

                <button
                  type="button"
                  onClick={handleSendRegisterSms}
                  disabled={registerResendSecondsLeft > 0 || sendSmsMutation.isPending}
                  className="mt-3 w-full text-center text-sm font-medium text-[#006341] disabled:cursor-not-allowed disabled:text-[#94A3B8]"
                >
                  {sendSmsMutation.isPending
                    ? 'Отправка...'
                    : registerResendSecondsLeft > 0
                      ? `Отправить повторно через ${registerResendSecondsLeft} сек`
                      : 'Отправить повторно'}
                </button>
              </div>
            </form>
          ) : null}
        </div>
      </div>
    </div>
  );
}
