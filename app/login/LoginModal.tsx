'use client';

import {FormEvent, KeyboardEvent, useEffect, useMemo, useRef, useState} from 'react';
import {useRouter} from 'next/navigation';
import {useMask} from '@react-input/mask';
import Logo from '@/icons/Logo';
import {useSendSmsMutation, useVerifySmsMutation} from '@/services/login/hooks';

const CODE_LENGTH = 6;

type LoginModalProps = {
    onClose?: () => void;
};

export default function LoginModal({onClose}: LoginModalProps) {
    const router = useRouter();

    const [phone, setPhone] = useState('');
    const [codeDigits, setCodeDigits] = useState<string[]>(Array(CODE_LENGTH).fill(''));
    const [smsSent, setSmsSent] = useState(false);
    const [error, setError] = useState('');
    const [resendSecondsLeft, setResendSecondsLeft] = useState(0);

    const sendSmsMutation = useSendSmsMutation();
    const verifySmsMutation = useVerifySmsMutation();

    const code = useMemo(() => codeDigits.join(''), [codeDigits]);
    const canSendSms = phone.replace(/\D/g, '').length >= 12;
    const canVerify = code.length === CODE_LENGTH;

    const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

    const inputRef = useMask({
        mask: '(+992) ___ __ __ __',
        replacement: {_: /\d/},
    });

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

    const handleSendSms = async () => {
        setError('');
        const cleanPhone = phone.replace(/\D/g, '').slice(-9);

        try {
            await sendSmsMutation.mutateAsync({phone: cleanPhone});
            setSmsSent(true);
            setCodeDigits(Array(CODE_LENGTH).fill(''));
            setResendSecondsLeft(60);
            setTimeout(() => inputRefs.current[0]?.focus(), 0);
        } catch {
            setError('Ошибка отправки SMS');
        }
    };

    const handleVerifySms = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        const cleanPhone = phone.replace(/\D/g, '').slice(-9);

        try {
            await verifySmsMutation.mutateAsync({phone: cleanPhone, code});
            close();
        } catch {
            setError('Ошибка авторизации');
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

                    {!smsSent ? (
                        <>
                            <h1 className="text-center text-[18px] font-bold text-[#111827]">Войти или создать личный кабинет</h1>
                            <p className="mt-3 text-center text-[18px] text-[#6B7280]">Введите номер телефон</p>

                            <div className="mt-3">
                                <input
                                    autoFocus
                                    ref={inputRef}
                                    type="tel"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    className="h-[50px] w-full rounded-[8px] border border-[#CDD5E1] bg-white px-3 text-[20px] text-[#0F172A] outline-none focus:border-[#8CA6D9]"
                                />
                            </div>

                            <button
                                type="button"
                                onClick={handleSendSms}
                                disabled={!canSendSms || sendSmsMutation.isPending}
                                className="mt-4 h-[50px] w-full rounded-[8px] bg-[#0B4FD0] text-[20px] font-medium text-white disabled:bg-[#8CA6D9]"
                            >
                                {sendSmsMutation.isPending ? 'Отправка…' : 'Продолжить'}
                            </button>

                            <p className="mt-3 text-[16px] text-[#6B7280]">
                                Нажимая кнопку, вы соглашаетесь с{' '}
                                <a href="/policy" className="text-[#0B4FD0] underline underline-offset-2">
                                    условиями использования.
                                </a>
                            </p>
                        </>
                    ) : (
                        <form onSubmit={handleVerifySms}>
                            <h1 className="text-center text-[18px] font-bold text-[#111827]">Введите код из СМС</h1>
                            {/*<p className="mt-3 text-center text-[18px] text-[#6B7280]">Введите код</p>*/}

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
                                        className="h-[50px] w-[40px] rounded-[8px] border border-[#CDD5E1] bg-white text-center text-[24px] text-[#0F172A] outline-none focus:border-[#8CA6D9]"
                                        maxLength={1}
                                    />
                                ))}
                            </div>

                            <button
                                type="submit"
                                disabled={!canVerify || verifySmsMutation.isPending}
                                className="mt-5 h-[50px] w-full rounded-[8px] bg-[#0B4FD0] text-[20px] font-medium text-white disabled:bg-[#CBD5E1] disabled:text-[#6B7280]"
                            >
                                {verifySmsMutation.isPending ? 'Проверка…' : 'Продолжить'}
                            </button>

                            <button
                                type="button"
                                onClick={handleSendSms}
                                disabled={resendSecondsLeft > 0 || sendSmsMutation.isPending}
                                className="mt-3 w-full text-center text-[16px] font-medium text-[#0B4FD0] disabled:cursor-not-allowed disabled:text-[#94A3B8]"
                            >
                                {sendSmsMutation.isPending
                                    ? 'Отправка…'
                                    : resendSecondsLeft > 0
                                        ? `Отправить SMS еще раз через ${resendSecondsLeft} сек`
                                        : 'Отправить SMS еще раз'}
                            </button>
                        </form>
                    )}

                    {error && <div className="mt-3 text-center text-[16px] text-red-600">{error}</div>}
                </div>
            </div>
        </div>
    );
}
