'use client';

import { ClipboardEvent, FormEvent, KeyboardEvent, MutableRefObject, useEffect, useMemo, useRef, useState } from 'react';
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
  useVerifyLoginSmsMutation,
  useVerifyRegistrationSmsMutation,
} from '@/services/login/hooks';
import type { AccountType, AuthMode } from '@/services/login/types';

const CODE_LENGTH = 6;
const RESEND_TIMEOUT_SECONDS = 60;

type LoginModalProps = {
  onClose?: () => void;
  initialView?: 'login' | 'register';
};

type RegisterStep = 'phone' | 'code' | 'account' | 'profile';

type RegistrationDraft = {
  name: string;
  phone: string;
  email: string;
  password: string;
  description: string;
  birthday: string;
};

function normalizePhone(rawPhone: string): string | null {
  const digits = rawPhone.replace(/\D/g, '');

  if (digits.length !== 12 || !digits.startsWith('992')) {
    return null;
  }

  return `+${digits}`;
}

const createEmptyRegisterForm = (): RegistrationDraft => ({
  name: '',
  phone: '',
  email: '',
  password: '',
  description: '',
  birthday: '',
});

const ACCOUNT_TYPE_OPTIONS: Array<{
  value: Exclude<AccountType, null>;
  title: string;
  description: string;
}> = [
  {
    value: 'user',
    title: 'Владелец или покупатель',
    description: 'Частный клиент, который продаёт, сдаёт, покупает или ищет объект.',
  },
  {
    value: 'realtor',
    title: 'Агент',
    description: 'Риелтор или брокер. Можно указать агентство и номер лицензии.',
  },
  {
    value: 'developer',
    title: 'Застройщик',
    description: 'Компания-застройщик или её представитель.',
  },
];

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
  const [resendSecondsLeft, setResendSecondsLeft] = useState(0);

  const [registerStep, setRegisterStep] = useState<RegisterStep>('phone');
  const [registerForm, setRegisterForm] = useState<RegistrationDraft>(createEmptyRegisterForm);
  const [registerCodeDigits, setRegisterCodeDigits] = useState<string[]>(Array(CODE_LENGTH).fill(''));
  const [registerResendSecondsLeft, setRegisterResendSecondsLeft] = useState(0);
  const [verificationToken, setVerificationToken] = useState('');
  const [normalizedVerifiedPhone, setNormalizedVerifiedPhone] = useState('');
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [registerAccountType, setRegisterAccountType] = useState<Exclude<AccountType, null>>('user');
  const [companyName, setCompanyName] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [registerError, setRegisterError] = useState('');
  const [registerFieldErrors, setRegisterFieldErrors] = useState<Record<string, string[]>>({});
  const [profileError, setProfileError] = useState('');
  const [profileFieldErrors, setProfileFieldErrors] = useState<Record<string, string[]>>({});

  const sendSmsMutation = useSendSmsMutation();
  const verifyLoginSmsMutation = useVerifyLoginSmsMutation();
  const verifyRegistrationSmsMutation = useVerifyRegistrationSmsMutation();
  const passwordLoginMutation = useLoginMutation();
  const registerMutation = useRegisterMutation({
    redirect: false,
    closeModal: false,
    onSuccess: (response) => {
      const nextCode = response.auth_state?.code;
      setVerificationToken('');

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

  const normalizedPhone = useMemo(() => normalizePhone(phone), [phone]);
  const normalizedRegisterPhone = useMemo(
    () => normalizePhone(registerForm.phone),
    [registerForm.phone]
  );
  const verifiedOrEnteredPhone = normalizedVerifiedPhone || normalizedRegisterPhone;
  const loginCode = useMemo(() => loginCodeDigits.join(''), [loginCodeDigits]);
  const registerCode = useMemo(() => registerCodeDigits.join(''), [registerCodeDigits]);
  const canSendSms = Boolean(normalizedPhone);
  const canVerify = Boolean(normalizedPhone) && loginCode.length === CODE_LENGTH;
  const canLoginByPassword = Boolean(normalizedPhone) && password.trim().length > 0;
  const canRequestRegisterSms = Boolean(normalizedRegisterPhone);
  const canVerifyRegisterSms = Boolean(normalizedRegisterPhone) && registerCode.length === CODE_LENGTH;
  const isRegisterValid = useMemo(() => {
    return Boolean(
      registerForm.name.trim() &&
        verifiedOrEnteredPhone &&
        registerForm.password.trim().length >= 6 &&
        verificationToken &&
        isPhoneVerified
    );
  }, [isPhoneVerified, registerForm.name, registerForm.password, verificationToken, verifiedOrEnteredPhone]);
  const isProfileValid = useMemo(() => {
    if (!registerForm.name.trim()) {
      return false;
    }

    if (registerAccountType === 'developer') {
      return Boolean(companyName.trim());
    }

    return true;
  }, [companyName, registerAccountType, registerForm.name]);

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

  const clearRegistrationVerification = () => {
    setVerificationToken('');
    setNormalizedVerifiedPhone('');
    setIsPhoneVerified(false);
    setRegisterCodeDigits(Array(CODE_LENGTH).fill(''));
    setRegisterResendSecondsLeft(0);
    setRegisterFieldErrors((prev) => ({
      ...prev,
      phone: [],
      code: [],
      verification_token: [],
    }));
  };

  const expireRegistrationVerification = () => {
    setVerificationToken('');
    setNormalizedVerifiedPhone('');
    setIsPhoneVerified(false);
    setRegisterCodeDigits(Array(CODE_LENGTH).fill(''));
    setRegisterResendSecondsLeft(0);
  };

  const resetRegisterState = () => {
    setRegisterStep('phone');
    setRegisterForm(createEmptyRegisterForm());
    setRegisterCodeDigits(Array(CODE_LENGTH).fill(''));
    setRegisterResendSecondsLeft(0);
    setVerificationToken('');
    setNormalizedVerifiedPhone('');
    setIsPhoneVerified(false);
    setRegisterAccountType('user');
    setCompanyName('');
    setLicenseNumber('');
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
    const nextNormalizedPhone = normalizePhone(value);
    const phoneChanged = Boolean(normalizedVerifiedPhone && nextNormalizedPhone !== normalizedVerifiedPhone);

    setRegisterForm((prev) => ({ ...prev, phone: value }));
    setRegisterFieldErrors((prev) => ({ ...prev, phone: [], verification_token: [] }));
    setRegisterError('');

    if (phoneChanged) {
      clearRegistrationVerification();
    }
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
      const response = await verifyRegistrationSmsMutation.mutateAsync({
        phone: normalizedRegisterPhone,
        code: registerCode,
        scenario: 'registration',
      });
      setVerificationToken(response.verification_token);
      setNormalizedVerifiedPhone(response.phone);
      setIsPhoneVerified(true);
      setRegisterStep('account');
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

  const handleRegisterSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setRegisterError('');
    setRegisterFieldErrors({});

    if (!verifiedOrEnteredPhone || !verificationToken || !isPhoneVerified) {
      setRegisterStep('code');
      setRegisterError('Подтвердите номер телефона перед регистрацией.');
      setRegisterFieldErrors({
        verification_token: ['Подтвердите номер телефона перед регистрацией.'],
      });
      return;
    }

    try {
      await registerMutation.mutateAsync({
        phone: verifiedOrEnteredPhone,
        name: registerForm.name.trim(),
        email: registerForm.email.trim() || null,
        password: registerForm.password.trim(),
        description: registerForm.description.trim(),
        birthday: registerForm.birthday,
        verification_token: verificationToken,
      });
    } catch (submitError) {
      const errors = extractFieldErrors(submitError);
      if (Object.keys(errors).length > 0) {
        setRegisterFieldErrors(errors);
      }

      if (errors.verification_token?.length) {
        expireRegistrationVerification();
        setRegisterStep('code');
      }

      const message = extractApiErrorMessage(
        submitError,
        'Не удалось создать аккаунт. Попробуйте снова.'
      );
      setRegisterError(Object.keys(errors).length > 0 ? '' : message);
    }
  };

  const handleCompleteProfile = async (event: FormEvent) => {
    event.preventDefault();
    setProfileError('');
    setProfileFieldErrors({});

    try {
      await completeProfileMutation.mutateAsync({
        account_type: registerAccountType,
        name: registerForm.name.trim(),
        email: registerForm.email.trim() || null,
        description: registerForm.description.trim() || null,
        birthday: registerForm.birthday || null,
        company_name: companyName.trim() || null,
        license_number: licenseNumber.trim() || null,
      });
    } catch (submitError) {
      const errors = extractFieldErrors(submitError);
      if (Object.keys(errors).length > 0) {
        setProfileFieldErrors(errors);
      }
      const message = extractApiErrorMessage(
        submitError,
        'Не удалось завершить регистрацию. Попробуйте снова.'
      );
      setProfileError(Object.keys(errors).length > 0 ? '' : message);
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

  const modalWidthClass = view === 'register' ? 'max-w-[720px]' : 'max-w-[400px]';

  return (
    <div className="fixed inset-0 z-[120] overflow-y-auto">
      <div className="absolute inset-0 bg-black/45" onClick={close} />

      <div className="relative z-10 flex min-h-full items-start justify-center px-4 py-4 sm:min-h-screen sm:items-center sm:py-6">
        <div
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
                              loginInputRefs.current[index] = element;
                            }}
                            inputMode="numeric"
                            value={loginCodeDigits[index]}
                            onChange={(event) =>
                              onCodeChange(index, event.target.value, loginCodeDigits, setLoginCodeDigits, loginInputRefs)
                            }
                            onKeyDown={(event) => onCodeKeyDown(index, event, loginCodeDigits, loginInputRefs)}
                            onPaste={(event) => onCodePaste(event, setLoginCodeDigits, loginInputRefs)}
                            className="h-[50px] w-[40px] rounded-[8px] border border-[#CDD5E1] bg-white text-center text-[24px] text-[#0F172A] outline-none focus:border-[#8CA6D9]"
                            maxLength={1}
                          />
                        ))}
                      </div>

                      <button
                        type="submit"
                        disabled={!canVerify || verifyLoginSmsMutation.isPending}
                        className="mt-5 h-[50px] w-full rounded-[10px] bg-[#0B4FD0] text-[20px] font-medium text-white disabled:bg-[#CBD5E1] disabled:text-[#6B7280]"
                      >
                        {verifyLoginSmsMutation.isPending ? 'Входим...' : 'Войти'}
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
          ) : registerStep === 'phone' ? (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                void handleSendRegisterSms();
              }}
            >
              <div className="text-center">
                <div className="inline-flex rounded-full bg-[#EAF2FF] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#0B43B8]">
                  Шаг 1
                </div>
                <h1 className="mt-4 text-2xl font-black text-[#0F172A] md:text-3xl">Подтвердите номер</h1>
                <p className="mt-3 text-sm leading-6 text-[#52607A] md:text-base">
                  Для регистрации нужно подтвердить телефон по SMS. Этот код используется только для создания нового аккаунта.
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
                  onChange={(event) => handleRegisterPhoneChange(event.target.value)}
                  className="h-12 w-full rounded-2xl border border-[#CBD5E1] bg-white px-4 text-sm outline-none transition focus:border-[#0B43B8]"
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
                  className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-[#0B43B8] px-6 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:bg-[#9DB7E9] md:w-auto"
                >
                  {sendSmsMutation.isPending ? 'Отправляем код...' : 'Получить код'}
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
          ) : registerStep === 'code' ? (
            <form onSubmit={handleVerifyRegisterSms}>
              <div className="text-center">
                <div className="inline-flex rounded-full bg-[#EAF2FF] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#0B43B8]">
                  Шаг 2
                </div>
                <h1 className="mt-4 text-2xl font-black text-[#0F172A] md:text-3xl">Введите код из SMS</h1>
                <p className="mt-3 text-sm leading-6 text-[#52607A] md:text-base">
                  Код отправлен на {normalizedRegisterPhone ?? 'указанный номер'}. После подтверждения можно будет продолжить регистрацию.
                </p>
              </div>

              <div className="mt-6 flex items-center justify-between gap-3 rounded-[10px] bg-[#EAF0FA] px-4 py-3">
                <button
                  type="button"
                  onClick={() => {
                    setRegisterStep('phone');
                    setRegisterError('');
                  }}
                  className="text-[15px] font-medium text-[#0B4FD0]"
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
                  className="text-[15px] font-medium text-[#0B4FD0]"
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
                    className="h-[50px] w-[40px] rounded-[8px] border border-[#CDD5E1] bg-white text-center text-[24px] text-[#0F172A] outline-none focus:border-[#8CA6D9]"
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
                  className="h-12 w-full rounded-2xl bg-[#0B43B8] px-6 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:bg-[#9DB7E9]"
                >
                  {verifyRegistrationSmsMutation.isPending ? 'Подтверждаем...' : 'Подтвердить номер'}
                </button>

                <button
                  type="button"
                  onClick={handleSendRegisterSms}
                  disabled={registerResendSecondsLeft > 0 || sendSmsMutation.isPending}
                  className="mt-3 w-full text-center text-sm font-medium text-[#0B4FD0] disabled:cursor-not-allowed disabled:text-[#94A3B8]"
                >
                  {sendSmsMutation.isPending
                    ? 'Отправка...'
                    : registerResendSecondsLeft > 0
                      ? `Отправить повторно через ${registerResendSecondsLeft} сек`
                      : 'Отправить повторно'}
                </button>
              </div>
            </form>
          ) : registerStep === 'account' ? (
            <form onSubmit={handleRegisterSubmit}>
              <div className="text-center">
                <div className="inline-flex rounded-full bg-[#EAF2FF] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#0B43B8]">
                  Шаг 3
                </div>
                <h1 className="mt-4 text-2xl font-black text-[#0F172A] md:text-3xl">Создайте аккаунт</h1>
                <p className="mt-3 text-sm leading-6 text-[#52607A] md:text-base">
                  Заполните основные данные. Регистрация завершится только после проверки телефона и следующего `auth_state`.
                </p>
              </div>

              <div className="mt-6 rounded-2xl border border-[#BFDBFE] bg-[#F8FBFF] px-4 py-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="text-sm font-semibold text-[#0F172A]">Подтверждённый номер</div>
                    <p className="mt-1 text-sm text-[#33507A]">{normalizedVerifiedPhone || normalizedRegisterPhone}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      clearRegistrationVerification();
                      setRegisterStep('phone');
                      setRegisterError('');
                      window.setTimeout(() => registerPhoneInputRef.current?.focus(), 0);
                    }}
                    className="inline-flex h-10 items-center justify-center rounded-2xl border border-[#B7C7E7] px-4 text-sm font-semibold text-[#0B43B8]"
                  >
                    Изменить номер
                  </button>
                </div>
                {registerFieldErrors.phone?.[0] ? (
                  <p className="mt-3 text-xs text-red-600">{registerFieldErrors.phone[0]}</p>
                ) : null}
                {registerFieldErrors.verification_token?.[0] ? (
                  <p className="mt-3 text-xs text-red-600">{registerFieldErrors.verification_token[0]}</p>
                ) : null}
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

                <div className="flex items-end md:col-span-2">
                  <div className="w-full rounded-2xl border border-dashed border-[#BFDBFE] bg-[#F8FBFF] px-4 py-3 text-sm text-[#33507A]">
                    После создания аккаунта мы откроем следующий обязательный шаг. В кабинет можно попасть только когда `auth_state.code === OK`.
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
                  type="button"
                  onClick={() => setRegisterStep('code')}
                  className="inline-flex h-12 items-center justify-center rounded-2xl border border-[#CBD5E1] px-6 text-sm font-semibold text-[#0F172A]"
                >
                  Назад
                </button>
                <button
                  type="submit"
                  disabled={!isRegisterValid || registerMutation.isPending}
                  className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-[#0B43B8] px-6 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:bg-[#9DB7E9] md:w-auto"
                >
                  {registerMutation.isPending ? 'Создаём аккаунт...' : 'Продолжить'}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleCompleteProfile}>
              <div className="text-center">
                <div className="inline-flex rounded-full bg-[#EAF2FF] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#0B43B8]">
                  Шаг 4
                </div>
                <h1 className="mt-4 text-2xl font-black text-[#0F172A] md:text-3xl">Завершите профиль</h1>
                <p className="mt-3 text-sm leading-6 text-[#52607A] md:text-base">
                  Выберите тип аккаунта и заполните анкету. Если статус будет не `OK`, мы переведём вас на соответствующий onboarding screen.
                </p>
              </div>

              <div className="mt-8 grid gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-semibold text-[#334155]">Тип аккаунта</label>
                  <div className="grid gap-3 md:grid-cols-3">
                    {ACCOUNT_TYPE_OPTIONS.map((option) => {
                      const isActive = registerAccountType === option.value;

                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => {
                            setRegisterAccountType(option.value);
                            setProfileFieldErrors((prev) => ({
                              ...prev,
                              account_type: [],
                              company_name: [],
                              license_number: [],
                            }));
                            setProfileError('');
                          }}
                          className={`rounded-2xl border px-4 py-4 text-left transition ${
                            isActive
                              ? 'border-[#0B43B8] bg-[#EFF5FF] shadow-[0_10px_30px_rgba(11,67,184,0.12)]'
                              : 'border-[#CBD5E1] bg-white hover:border-[#94A3B8]'
                          }`}
                        >
                          <div className="text-sm font-semibold text-[#0F172A]">{option.title}</div>
                          <p className="mt-2 text-xs leading-5 text-[#52607A]">{option.description}</p>
                        </button>
                      );
                    })}
                  </div>
                  {profileFieldErrors.account_type?.[0] ? (
                    <p className="mt-1 text-xs text-red-600">{profileFieldErrors.account_type[0]}</p>
                  ) : null}
                </div>

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

                {(registerAccountType === 'realtor' || registerAccountType === 'developer') ? (
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-[#334155]">
                      {registerAccountType === 'developer' ? 'Название компании' : 'Агентство или компания'}
                    </label>
                    <input
                      value={companyName}
                      onChange={(event) => {
                        setCompanyName(event.target.value);
                        setProfileFieldErrors((prev) => ({ ...prev, company_name: [] }));
                        setProfileError('');
                      }}
                      className="h-12 w-full rounded-2xl border border-[#CBD5E1] bg-white px-4 text-sm outline-none transition focus:border-[#0B43B8]"
                      placeholder={registerAccountType === 'developer' ? 'Manora Development' : 'Название агентства'}
                    />
                    {profileFieldErrors.company_name?.[0] ? (
                      <p className="mt-1 text-xs text-red-600">{profileFieldErrors.company_name[0]}</p>
                    ) : null}
                  </div>
                ) : null}

                {registerAccountType === 'realtor' ? (
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-[#334155]">Номер лицензии</label>
                    <input
                      value={licenseNumber}
                      onChange={(event) => {
                        setLicenseNumber(event.target.value);
                        setProfileFieldErrors((prev) => ({ ...prev, license_number: [] }));
                        setProfileError('');
                      }}
                      className="h-12 w-full rounded-2xl border border-[#CBD5E1] bg-white px-4 text-sm outline-none transition focus:border-[#0B43B8]"
                      placeholder="Необязательно"
                    />
                    {profileFieldErrors.license_number?.[0] ? (
                      <p className="mt-1 text-xs text-red-600">{profileFieldErrors.license_number[0]}</p>
                    ) : null}
                  </div>
                ) : null}

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
                    После отправки анкеты профиль будет сохранён как{' '}
                    <span className="font-semibold">
                      {ACCOUNT_TYPE_OPTIONS.find((option) => option.value === registerAccountType)?.title.toLowerCase()}
                    </span>.
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
                  {completeProfileMutation.isPending ? 'Сохраняем...' : 'Сохранить и перейти дальше'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
