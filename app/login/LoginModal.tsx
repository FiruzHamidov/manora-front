'use client';

import {ClipboardEvent, FormEvent, KeyboardEvent, useEffect, useMemo, useRef, useState} from 'react';
import Link from 'next/link';
import {useRouter} from 'next/navigation';
import {useMask} from '@react-input/mask';
import Logo from '@/icons/Logo';
import {useLoginMutation, useSendSmsMutation, useVerifySmsMutation} from '@/services/login/hooks';
import type {AuthMode} from '@/services/login/types';

const CODE_LENGTH = 6;
const RESEND_TIMEOUT_SECONDS = 60;

type LoginModalProps = {
    onClose?: () => void;
};

type ApiErrorShape = {
    response?: {
        data?: {
            message?: string;
            errors?: Record<string, string[] | string>;
        };
    };
};

function normalizePhone(rawPhone: string): string | null {
    const digits = rawPhone.replace(/\D/g, '');

    if (digits.length !== 12 || !digits.startsWith('992')) {
        return null;
    }

    return `+${digits}`;
}

function extractApiErrorMessage(error: unknown, fallback: string): string {
    const apiError = error as ApiErrorShape;
    const payload = apiError.response?.data;

    if (payload?.message) {
        return payload.message;
    }

    const firstFieldError = payload?.errors
        ? Object.values(payload.errors).flatMap((value) => (Array.isArray(value) ? value : [value]))[0]
        : undefined;

    return typeof firstFieldError === 'string' && firstFieldError.length > 0 ? firstFieldError : fallback;
}

export default function LoginModal({onClose}: LoginModalProps) {
    const router = useRouter();

    const [mode, setMode] = useState<AuthMode>('sms');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [codeDigits, setCodeDigits] = useState<string[]>(Array(CODE_LENGTH).fill(''));
    const [smsSent, setSmsSent] = useState(false);
    const [error, setError] = useState('');
    const [resendSecondsLeft, setResendSecondsLeft] = useState(0);

    const sendSmsMutation = useSendSmsMutation();
    const verifySmsMutation = useVerifySmsMutation();
    const passwordLoginMutation = useLoginMutation();

    const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
    const phoneInputRef = useRef<HTMLInputElement | null>(null);
    const maskRef = useMask({
        mask: '(+992) ___ __ __ __',
        replacement: {_: /\d/},
    });

    const normalizedPhone = useMemo(() => normalizePhone(phone), [phone]);
    const code = useMemo(() => codeDigits.join(''), [codeDigits]);
    const isSendingSms = sendSmsMutation.isPending;
    const isVerifyingSms = verifySmsMutation.isPending;
    const isLoggingInByPassword = passwordLoginMutation.isPending;

    const canSendSms = Boolean(normalizedPhone);
    const canVerify = Boolean(normalizedPhone) && code.length === CODE_LENGTH;
    const canLoginByPassword = Boolean(normalizedPhone) && password.trim().length > 0;

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
            await sendSmsMutation.mutateAsync({phone: normalizedPhone});
            setSmsSent(true);
            setCodeDigits(Array(CODE_LENGTH).fill(''));
            setResendSecondsLeft(RESEND_TIMEOUT_SECONDS);
            window.setTimeout(() => inputRefs.current[0]?.focus(), 0);
        } catch (sendError) {
            setError(extractApiErrorMessage(sendError, 'Не удалось отправить SMS-код'));
        }
    };

    const handleVerifySms = async (e: FormEvent) => {
        e.preventDefault();

        if (!normalizedPhone) {
            setError('Введите корректный номер телефона');
            return;
        }

        setError('');

        try {
            await verifySmsMutation.mutateAsync({phone: normalizedPhone, code});
            close();
        } catch (verifyError) {
            setError(extractApiErrorMessage(verifyError, 'Не удалось войти по SMS-коду'));
        }
    };

    const handlePasswordLogin = async (e: FormEvent) => {
        e.preventDefault();

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

    const onCodeChange = (index: number, value: string) => {
        const digit = value.replace(/\D/g, '').slice(-1);
        const next = [...codeDigits];
        next[index] = digit;
        setCodeDigits(next);

        if (digit && index < CODE_LENGTH - 1) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const onCodeKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace' && !codeDigits[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const onCodePaste = (e: ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault();

        const pastedDigits = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, CODE_LENGTH);
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

    return (
        <div className="fixed inset-0 z-[120]">
            <div className="absolute inset-0 bg-black/45"/>

            <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-6">
                <div className="w-full max-w-[400px] rounded-[20px] bg-[#F5F6F8] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.3)]">
                    <div className="mb-2 flex justify-end">
                        <button
                            type="button"
                            onClick={close}
                            aria-label="Закрыть"
                            className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#D5DBE4] text-white"
                        >
                            ×
                        </button>
                    </div>

                    <div className="mb-5 flex justify-center">
                        <Logo className="h-[40px] w-[200px]"/>
                    </div>

                    <form onSubmit={mode === 'sms' && smsSent ? handleVerifySms : handlePasswordLogin}>
                        <h1 className="text-center text-[18px] font-bold text-[#111827]">Войти в личный кабинет</h1>
                        <p className="mt-3 text-center text-[16px] text-[#6B7280]">Введите номер телефона и выберите способ входа</p>

                        <div className="mt-4">
                            <input
                                autoFocus
                                ref={(node) => {
                                    phoneInputRef.current = node;
                                    if (node) {
                                        maskRef.current = node;
                                    }
                                }}
                                type="tel"
                                value={phone}
                                onChange={(e) => {
                                    if (smsSent) {
                                        resetSmsState();
                                    }
                                    setPhone(e.target.value);
                                    setError('');
                                }}
                                placeholder="(+992) 900 00 00 00"
                                className="h-[50px] w-full rounded-[8px] border border-[#CDD5E1] bg-white px-3 text-[20px] text-[#0F172A] outline-none focus:border-[#8CA6D9]"
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
                                            {Array.from({length: CODE_LENGTH}).map((_, index) => (
                                                <input
                                                    key={index}
                                                    ref={(el) => {
                                                        inputRefs.current[index] = el;
                                                    }}
                                                    inputMode="numeric"
                                                    value={codeDigits[index]}
                                                    onChange={(e) => onCodeChange(index, e.target.value)}
                                                    onKeyDown={(e) => onCodeKeyDown(index, e)}
                                                    onPaste={onCodePaste}
                                                    className="h-[50px] w-[40px] rounded-[8px] border border-[#CDD5E1] bg-white text-center text-[24px] text-[#0F172A] outline-none focus:border-[#8CA6D9]"
                                                    maxLength={1}
                                                />
                                            ))}
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={!canVerify || isVerifyingSms}
                                            className="mt-5 h-[50px] w-full rounded-[8px] bg-[#0B4FD0] text-[20px] font-medium text-white disabled:bg-[#CBD5E1] disabled:text-[#6B7280]"
                                        >
                                            {isVerifyingSms ? 'Входим…' : 'Войти'}
                                        </button>

                                        <button
                                            type="button"
                                            onClick={handleSendSms}
                                            disabled={resendSecondsLeft > 0 || isSendingSms}
                                            className="mt-3 w-full text-center text-[16px] font-medium text-[#0B4FD0] disabled:cursor-not-allowed disabled:text-[#94A3B8]"
                                        >
                                            {isSendingSms
                                                ? 'Отправка…'
                                                : resendSecondsLeft > 0
                                                    ? `Отправить повторно через ${resendSecondsLeft} сек`
                                                    : 'Отправить повторно'}
                                        </button>
                                    </>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={handleSendSms}
                                        disabled={!canSendSms || isSendingSms}
                                        className="mt-5 h-[50px] w-full rounded-[8px] bg-[#0B4FD0] text-[20px] font-medium text-white disabled:bg-[#8CA6D9]"
                                    >
                                        {isSendingSms ? 'Отправка…' : 'Получить код'}
                                    </button>
                                )}
                            </>
                        ) : (
                            <>
                                <div className="relative mt-4">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => {
                                            setPassword(e.target.value);
                                            setError('');
                                        }}
                                        placeholder="Пароль"
                                        className="h-[50px] w-full rounded-[8px] border border-[#CDD5E1] bg-white px-3 pr-20 text-[18px] text-[#0F172A] outline-none focus:border-[#8CA6D9]"
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
                                    disabled={!canLoginByPassword || isLoggingInByPassword}
                                    className="mt-5 h-[50px] w-full rounded-[8px] bg-[#0B4FD0] text-[20px] font-medium text-white disabled:bg-[#8CA6D9]"
                                >
                                    {isLoggingInByPassword ? 'Входим…' : 'Войти'}
                                </button>
                            </>
                        )}

                        <p className="mt-3 text-[16px] text-[#6B7280]">
                            Нажимая кнопку, вы соглашаетесь с{' '}
                            <a href="/policy" className="text-[#0B4FD0] underline underline-offset-2">
                                условиями использования.
                            </a>
                        </p>

                        <p className="mt-3 text-center text-[15px] text-[#6B7280]">
                            Нет аккаунта?{' '}
                            <Link href="/register" className="font-medium text-[#0B4FD0] underline underline-offset-2">
                                Зарегистрироваться
                            </Link>
                        </p>

                        {error && <div className="mt-3 text-center text-[16px] text-red-600">{error}</div>}
                    </form>
                </div>
            </div>
        </div>
    );
}
