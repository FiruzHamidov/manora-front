'use client';

import { ClipboardEvent, FormEvent, KeyboardEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMask } from '@react-input/mask';
import Logo from '@/icons/Logo';
import { extractApiErrorMessage, extractFieldErrors } from '@/services/login/api';
import {
  resolveAuthRouteByCode,
  useCompleteProfileMutation,
  useLoginMutation,
  useRegisterMutation,
  useSendSmsMutation,
  useVerifySmsMutation,
} from '@/services/login/hooks';
import type { AuthMode, RegisterRequest } from '@/services/login/types';

const CODE_LENGTH = 6;
const RESEND_TIMEOUT_SECONDS = 60;

type LoginModalProps = {
  onClose?: () => void;
  initialView?: 'login' | 'register';
};

function normalizePhone(rawPhone: string): string | null {
  const digits = rawPhone.replace(/\D/g, '');

  if (digits.length !== 12 || !digits.startsWith('992')) {
    return null;
  }

  return `+${digits}`;
}

const createEmptyRegisterForm = (): RegisterRequest => ({
  name: '',
  phone: '',
  email: '',
  password: '',
  description: '',
  birthday: '',
});

export default function LoginModal({ onClose, initialView = 'login' }: LoginModalProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [view, setView] = useState<'login' | 'register'>(initialView);
  const [mode, setMode] = useState<AuthMode>('sms');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [codeDigits, setCodeDigits] = useState<string[]>(Array(CODE_LENGTH).fill(''));
  const [smsSent, setSmsSent] = useState(false);
  const [error, setError] = useState('');
  const [resendSecondsLeft, setResendSecondsLeft] = useState(0);

  const [registerStep, setRegisterStep] = useState<'account' | 'profile'>('account');
  const [registerForm, setRegisterForm] = useState<RegisterRequest>(createEmptyRegisterForm);
  const [registerError, setRegisterError] = useState('');
  const [registerFieldErrors, setRegisterFieldErrors] = useState<Record<string, string[]>>({});
  const [profileError, setProfileError] = useState('');
  const [profileFieldErrors, setProfileFieldErrors] = useState<Record<string, string[]>>({});

  const sendSmsMutation = useSendSmsMutation();
  const verifySmsMutation = useVerifySmsMutation();
  const passwordLoginMutation = useLoginMutation();
  const registerMutation = useRegisterMutation({
    redirect: false,
    closeModal: false,
    onSuccess: (response) => {
      const nextCode = response.auth_state?.code;
      if (nextCode === 'PROFILE_REQUIRED') {
        setRegisterStep('profile');
        return;
      }

      close();
      window.location.href = resolveAuthRouteByCode(nextCode);
    },
  });
  const completeProfileMutation = useCompleteProfileMutation({
    redirect: true,
    closeModal: true,
  });

  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const phoneInputRef = useRef<HTMLInputElement | null>(null);
  const loginMaskRef = useMask({
    mask: '(+992) ___ __ __ __',
    replacement: { _: /\d/ },
  });
  const registerMaskRef = useMask({
    mask: '(+992) ___ __ __ __',
    replacement: { _: /\d/ },
  });

  const normalizedPhone = useMemo(() => normalizePhone(phone), [phone]);
  const normalizedRegisterPhone = useMemo(
    () => normalizePhone(registerForm.phone),
    [registerForm.phone]
  );
  const code = useMemo(() => codeDigits.join(''), [codeDigits]);
  const canSendSms = Boolean(normalizedPhone);
  const canVerify = Boolean(normalizedPhone) && code.length === CODE_LENGTH;
  const canLoginByPassword = Boolean(normalizedPhone) && password.trim().length > 0;
  const isRegisterValid = useMemo(() => {
    return Boolean(
      registerForm.name.trim() &&
        normalizedRegisterPhone &&
        registerForm.email.trim() &&
        registerForm.password.trim().length >= 6 &&
        registerForm.birthday
    );
  }, [normalizedRegisterPhone, registerForm.birthday, registerForm.email, registerForm.name, registerForm.password]);
  const isProfileValid = useMemo(() => {
    return Boolean(registerForm.name.trim() && registerForm.email.trim() && registerForm.birthday);
  }, [registerForm.birthday, registerForm.email, registerForm.name]);

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

  const resetSmsState = () => {
    setSmsSent(false);
    setCodeDigits(Array(CODE_LENGTH).fill(''));
    setResendSecondsLeft(0);
  };

  const resetRegisterState = () => {
    setRegisterStep('account');
    setRegisterForm(createEmptyRegisterForm());
    setRegisterError('');
    setRegisterFieldErrors({});
    setProfileError('');
    setProfileFieldErrors({});
  };

  const switchView = (nextView: 'login' | 'register') => {
    setView(nextView);
    setError('');

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

    if (nextMode === 'password') {
      resetSmsState();
      return;
    }

    setPassword('');
    setShowPassword(false);
  };

  const handleSendSms = async () => {
    if (!normalizedPhone) {
      setError('Введите корректный номер телефона');
      return;
    }

    setError('');

    try {
      await sendSmsMutation.mutateAsync({ phone: normalizedPhone });
      setSmsSent(true);
      setCodeDigits(Array(CODE_LENGTH).fill(''));
      setResendSecondsLeft(RESEND_TIMEOUT_SECONDS);
      window.setTimeout(() => inputRefs.current[0]?.focus(), 0);
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
      await verifySmsMutation.mutateAsync({ phone: normalizedPhone, code });
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

  const handleRegisterSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setRegisterError('');
    setRegisterFieldErrors({});

    if (!normalizedRegisterPhone) {
      setRegisterError('Введите корректный номер телефона');
      return;
    }

    try {
      await registerMutation.mutateAsync({
        ...registerForm,
        phone: normalizedRegisterPhone,
        name: registerForm.name.trim(),
        email: registerForm.email.trim(),
        password: registerForm.password.trim(),
        description: registerForm.description.trim(),
      });
    } catch (submitError) {
      const errors = extractFieldErrors(submitError);
      if (Object.keys(errors).length > 0) {
        setRegisterFieldErrors(errors);
      }
      setRegisterError(
        extractApiErrorMessage(submitError, 'Не удалось создать аккаунт. Попробуйте снова.')
      );
    }
  };

  const handleCompleteProfile = async (event: FormEvent) => {
    event.preventDefault();
    setProfileError('');
    setProfileFieldErrors({});

    try {
      await completeProfileMutation.mutateAsync({
        account_type: 'user',
        name: registerForm.name.trim(),
        email: registerForm.email.trim(),
        description: registerForm.description.trim(),
        birthday: registerForm.birthday,
      });
    } catch (submitError) {
      const errors = extractFieldErrors(submitError);
      if (Object.keys(errors).length > 0) {
        setProfileFieldErrors(errors);
      }
      setProfileError(
        extractApiErrorMessage(submitError, 'Не удалось завершить регистрацию. Попробуйте снова.')
      );
    }
  };

  const onCodeChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const next = [...codeDigits];
    next[index] = digit;
    setCodeDigits(next);

    if (digit && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const onCodeKeyDown = (index: number, event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Backspace' && !codeDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const onCodePaste = (event: ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();

    const pastedDigits = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, CODE_LENGTH);
    if (!pastedDigits) {
      return;
    }

    const nextDigits = Array(CODE_LENGTH)
      .fill('')
      .map((_, index) => pastedDigits[index] ?? '');

    setCodeDigits(nextDigits);
    const focusIndex = Math.min(pastedDigits.length, CODE_LENGTH - 1);
    inputRefs.current[focusIndex]?.focus();
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

  const modalWidthClass = view === 'register' ? 'max-w-[720px]' : 'max-w-[400px]';

  return (
    <div className="fixed inset-0 z-[120]">
      <div className="absolute inset-0 bg-black/45" onClick={close} />

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-6">
        <div className={`w-full ${modalWidthClass} rounded-[24px] bg-[#F5F6F8] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.3)] md:p-8`}>
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

          <div className="mx-auto mb-6 grid w-full max-w-[360px] grid-cols-2 gap-2 rounded-[12px] bg-[#E2E8F0] p-1">
            <button
              type="button"
              onClick={() => switchView('login')}
              className={`h-[44px] rounded-[10px] text-[15px] font-medium transition ${
                view === 'login' ? 'bg-white text-[#0B4FD0] shadow-sm' : 'text-[#475569]'
              }`}
            >
              Вход
            </button>
            <button
              type="button"
              onClick={() => switchView('register')}
              className={`h-[44px] rounded-[10px] text-[15px] font-medium transition ${
                view === 'register' ? 'bg-white text-[#0B4FD0] shadow-sm' : 'text-[#475569]'
              }`}
            >
              Регистрация
            </button>
          </div>

          {view === 'login' ? (
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
                  onChange={(event) => {
                    if (smsSent) {
                      resetSmsState();
                    }
                    setPhone(event.target.value);
                    setError('');
                  }}
                  placeholder="(+992) 900 00 00 00"
                  className="h-[50px] w-full rounded-[10px] border border-[#CDD5E1] bg-white px-3 text-[20px] text-[#0F172A] outline-none focus:border-[#8CA6D9]"
                />
              </div>

              {!(mode === 'sms' && smsSent) ? (
                <div className="mt-4 grid grid-cols-2 gap-2 rounded-[10px] bg-[#E2E8F0] p-1">
                  <button
                    type="button"
                    onClick={() => handleModeChange('sms')}
                    className={`h-[44px] rounded-[8px] text-[15px] font-medium transition ${
                      mode === 'sms' ? 'bg-white text-[#0B4FD0] shadow-sm' : 'text-[#475569]'
                    }`}
                  >
                    Войти по СМС
                  </button>
                  <button
                    type="button"
                    onClick={() => handleModeChange('password')}
                    className={`h-[44px] rounded-[8px] text-[15px] font-medium transition ${
                      mode === 'password' ? 'bg-white text-[#0B4FD0] shadow-sm' : 'text-[#475569]'
                    }`}
                  >
                    Войти по паролю
                  </button>
                </div>
              ) : (
                <div className="mt-4 flex items-center justify-between gap-3 rounded-[10px] bg-[#EAF0FA] px-4 py-3">
                  <button
                    type="button"
                    onClick={handleBackToMethodSelection}
                    className="text-[15px] font-medium text-[#0B4FD0]"
                  >
                    Назад
                  </button>
                  <button
                    type="button"
                    onClick={handleChangePhone}
                    className="text-[15px] font-medium text-[#0B4FD0]"
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
                              inputRefs.current[index] = element;
                            }}
                            inputMode="numeric"
                            value={codeDigits[index]}
                            onChange={(event) => onCodeChange(index, event.target.value)}
                            onKeyDown={(event) => onCodeKeyDown(index, event)}
                            onPaste={onCodePaste}
                            className="h-[50px] w-[40px] rounded-[8px] border border-[#CDD5E1] bg-white text-center text-[24px] text-[#0F172A] outline-none focus:border-[#8CA6D9]"
                            maxLength={1}
                          />
                        ))}
                      </div>

                      <button
                        type="submit"
                        disabled={!canVerify || verifySmsMutation.isPending}
                        className="mt-5 h-[50px] w-full rounded-[10px] bg-[#0B4FD0] text-[20px] font-medium text-white disabled:bg-[#CBD5E1] disabled:text-[#6B7280]"
                      >
                        {verifySmsMutation.isPending ? 'Входим...' : 'Войти'}
                      </button>

                      <button
                        type="button"
                        onClick={handleSendSms}
                        disabled={resendSecondsLeft > 0 || sendSmsMutation.isPending}
                        className="mt-3 w-full text-center text-[16px] font-medium text-[#0B4FD0] disabled:cursor-not-allowed disabled:text-[#94A3B8]"
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
                      className="mt-5 h-[50px] w-full rounded-[10px] bg-[#0B4FD0] text-[20px] font-medium text-white disabled:bg-[#8CA6D9]"
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
                      }}
                      placeholder="Пароль"
                      className="h-[50px] w-full rounded-[10px] border border-[#CDD5E1] bg-white px-3 pr-20 text-[18px] text-[#0F172A] outline-none focus:border-[#8CA6D9]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[14px] font-medium text-[#0B4FD0]"
                    >
                      {showPassword ? 'Скрыть' : 'Показать'}
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={!canLoginByPassword || passwordLoginMutation.isPending}
                    className="mt-5 h-[50px] w-full rounded-[10px] bg-[#0B4FD0] text-[20px] font-medium text-white disabled:bg-[#8CA6D9]"
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
                  className="font-medium text-[#0B4FD0] underline underline-offset-2"
                >
                  Зарегистрироваться
                </button>
              </p>

              {error ? <div className="mt-3 text-center text-[16px] text-red-600">{error}</div> : null}
            </form>
          ) : registerStep === 'account' ? (
            <form onSubmit={handleRegisterSubmit}>
              <div className="text-center">
                <div className="inline-flex rounded-full bg-[#EAF2FF] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#0B43B8]">
                  Шаг 1
                </div>
                <h1 className="mt-4 text-2xl font-black text-[#0F172A] md:text-3xl">Создайте аккаунт</h1>
                <p className="mt-3 text-sm leading-6 text-[#52607A] md:text-base">
                  Заполните основные данные. Если понадобится, сразу перейдём ко второму шагу и завершим профиль.
                </p>
              </div>

              <div className="mt-8 grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#334155]">Имя</label>
                  <input
                    value={registerForm.name}
                    onChange={(event) => {
                      setRegisterForm((prev) => ({ ...prev, name: event.target.value }));
                      setRegisterFieldErrors((prev) => ({ ...prev, name: [] }));
                      setRegisterError('');
                    }}
                    className="h-12 w-full rounded-2xl border border-[#CBD5E1] bg-white px-4 text-sm outline-none transition focus:border-[#0B43B8]"
                    placeholder="Иван"
                  />
                  {registerFieldErrors.name?.[0] ? <p className="mt-1 text-xs text-red-600">{registerFieldErrors.name[0]}</p> : null}
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#334155]">Телефон</label>
                  <input
                    ref={registerMaskRef}
                    type="tel"
                    value={registerForm.phone}
                    onChange={(event) => {
                      setRegisterForm((prev) => ({ ...prev, phone: event.target.value }));
                      setRegisterFieldErrors((prev) => ({ ...prev, phone: [] }));
                      setRegisterError('');
                    }}
                    className="h-12 w-full rounded-2xl border border-[#CBD5E1] bg-white px-4 text-sm outline-none transition focus:border-[#0B43B8]"
                    placeholder="(+992) 900 00 00 00"
                  />
                  {registerFieldErrors.phone?.[0] ? <p className="mt-1 text-xs text-red-600">{registerFieldErrors.phone[0]}</p> : null}
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#334155]">Email</label>
                  <input
                    type="email"
                    value={registerForm.email}
                    onChange={(event) => {
                      setRegisterForm((prev) => ({ ...prev, email: event.target.value }));
                      setRegisterFieldErrors((prev) => ({ ...prev, email: [] }));
                      setRegisterError('');
                    }}
                    className="h-12 w-full rounded-2xl border border-[#CBD5E1] bg-white px-4 text-sm outline-none transition focus:border-[#0B43B8]"
                    placeholder="ivan@example.com"
                  />
                  {registerFieldErrors.email?.[0] ? <p className="mt-1 text-xs text-red-600">{registerFieldErrors.email[0]}</p> : null}
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#334155]">Пароль</label>
                  <input
                    type="password"
                    value={registerForm.password}
                    onChange={(event) => {
                      setRegisterForm((prev) => ({ ...prev, password: event.target.value }));
                      setRegisterFieldErrors((prev) => ({ ...prev, password: [] }));
                      setRegisterError('');
                    }}
                    className="h-12 w-full rounded-2xl border border-[#CBD5E1] bg-white px-4 text-sm outline-none transition focus:border-[#0B43B8]"
                    placeholder="Минимум 6 символов"
                  />
                  {registerFieldErrors.password?.[0] ? <p className="mt-1 text-xs text-red-600">{registerFieldErrors.password[0]}</p> : null}
                </div>

                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-semibold text-[#334155]">О себе</label>
                  <textarea
                    value={registerForm.description}
                    onChange={(event) => {
                      setRegisterForm((prev) => ({ ...prev, description: event.target.value }));
                      setRegisterFieldErrors((prev) => ({ ...prev, description: [] }));
                      setRegisterError('');
                    }}
                    className="min-h-[120px] w-full rounded-2xl border border-[#CBD5E1] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#0B43B8]"
                    placeholder="Необязательно"
                  />
                  {registerFieldErrors.description?.[0] ? <p className="mt-1 text-xs text-red-600">{registerFieldErrors.description[0]}</p> : null}
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#334155]">Дата рождения</label>
                  <input
                    type="date"
                    value={registerForm.birthday}
                    onChange={(event) => {
                      setRegisterForm((prev) => ({ ...prev, birthday: event.target.value }));
                      setRegisterFieldErrors((prev) => ({ ...prev, birthday: [] }));
                      setRegisterError('');
                    }}
                    className="h-12 w-full rounded-2xl border border-[#CBD5E1] bg-white px-4 text-sm outline-none transition focus:border-[#0B43B8]"
                  />
                  {registerFieldErrors.birthday?.[0] ? <p className="mt-1 text-xs text-red-600">{registerFieldErrors.birthday[0]}</p> : null}
                </div>

                <div className="flex items-end">
                  <div className="w-full rounded-2xl border border-dashed border-[#BFDBFE] bg-[#F8FBFF] px-4 py-3 text-sm text-[#33507A]">
                    После регистрации вы сразу попадёте к завершению профиля.
                  </div>
                </div>
              </div>

              {registerError ? (
                <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {registerError}
                </div>
              ) : null}

              <div className="mt-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <button
                  type="submit"
                  disabled={!isRegisterValid || registerMutation.isPending}
                  className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-[#0B43B8] px-6 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:bg-[#9DB7E9] md:w-auto"
                >
                  {registerMutation.isPending ? 'Создаём аккаунт...' : 'Продолжить'}
                </button>

                <p className="text-center text-sm text-[#6B7280] md:text-right">
                  Уже есть аккаунт?{' '}
                  <button
                    type="button"
                    onClick={() => switchView('login')}
                    className="font-semibold text-[#0B4FD0] underline underline-offset-2"
                  >
                    Войти
                  </button>
                </p>
              </div>
            </form>
          ) : (
            <form onSubmit={handleCompleteProfile}>
              <div className="text-center">
                <div className="inline-flex rounded-full bg-[#EAF2FF] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#0B43B8]">
                  Шаг 2
                </div>
                <h1 className="mt-4 text-2xl font-black text-[#0F172A] md:text-3xl">Завершите профиль</h1>
                <p className="mt-3 text-sm leading-6 text-[#52607A] md:text-base">
                  Осталось заполнить анкету. После этого откроется личный кабинет.
                </p>
              </div>

              <div className="mt-8 grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#334155]">Имя</label>
                  <input
                    value={registerForm.name}
                    onChange={(event) => {
                      setRegisterForm((prev) => ({ ...prev, name: event.target.value }));
                      setProfileFieldErrors((prev) => ({ ...prev, name: [] }));
                      setProfileError('');
                    }}
                    className="h-12 w-full rounded-2xl border border-[#CBD5E1] bg-white px-4 text-sm outline-none transition focus:border-[#0B43B8]"
                    placeholder="Иван"
                  />
                  {profileFieldErrors.name?.[0] ? <p className="mt-1 text-xs text-red-600">{profileFieldErrors.name[0]}</p> : null}
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#334155]">Email</label>
                  <input
                    type="email"
                    value={registerForm.email}
                    onChange={(event) => {
                      setRegisterForm((prev) => ({ ...prev, email: event.target.value }));
                      setProfileFieldErrors((prev) => ({ ...prev, email: [] }));
                      setProfileError('');
                    }}
                    className="h-12 w-full rounded-2xl border border-[#CBD5E1] bg-white px-4 text-sm outline-none transition focus:border-[#0B43B8]"
                    placeholder="ivan@example.com"
                  />
                  {profileFieldErrors.email?.[0] ? <p className="mt-1 text-xs text-red-600">{profileFieldErrors.email[0]}</p> : null}
                </div>

                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-semibold text-[#334155]">О себе</label>
                  <textarea
                    value={registerForm.description}
                    onChange={(event) => {
                      setRegisterForm((prev) => ({ ...prev, description: event.target.value }));
                      setProfileFieldErrors((prev) => ({ ...prev, description: [] }));
                      setProfileError('');
                    }}
                    className="min-h-[120px] w-full rounded-2xl border border-[#CBD5E1] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#0B43B8]"
                    placeholder="Коротко расскажите о себе"
                  />
                  {profileFieldErrors.description?.[0] ? <p className="mt-1 text-xs text-red-600">{profileFieldErrors.description[0]}</p> : null}
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#334155]">Дата рождения</label>
                  <input
                    type="date"
                    value={registerForm.birthday}
                    onChange={(event) => {
                      setRegisterForm((prev) => ({ ...prev, birthday: event.target.value }));
                      setProfileFieldErrors((prev) => ({ ...prev, birthday: [] }));
                      setProfileError('');
                    }}
                    className="h-12 w-full rounded-2xl border border-[#CBD5E1] bg-white px-4 text-sm outline-none transition focus:border-[#0B43B8]"
                  />
                  {profileFieldErrors.birthday?.[0] ? <p className="mt-1 text-xs text-red-600">{profileFieldErrors.birthday[0]}</p> : null}
                </div>

                <div className="flex items-end">
                  <div className="w-full rounded-2xl border border-dashed border-[#BFDBFE] bg-[#F8FBFF] px-4 py-3 text-sm text-[#33507A]">
                    После отправки анкеты вы попадёте в личный кабинет.
                  </div>
                </div>
              </div>

              {profileError ? (
                <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {profileError}
                </div>
              ) : null}

              <div className="mt-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <button
                  type="button"
                  onClick={() => setRegisterStep('account')}
                  className="inline-flex h-12 items-center justify-center rounded-2xl border border-[#CBD5E1] px-6 text-sm font-semibold text-[#0F172A]"
                >
                  Назад
                </button>
                <button
                  type="submit"
                  disabled={!isProfileValid || completeProfileMutation.isPending}
                  className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-[#0B43B8] px-6 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:bg-[#9DB7E9] md:w-auto"
                >
                  {completeProfileMutation.isPending ? 'Сохраняем...' : 'Сохранить и перейти в кабинет'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
