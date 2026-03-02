'use client';

import { useEffect, useState } from 'react';
import { getLeadErrorMessage, getSourceUrl, getUtmFromUrl, submitLead } from '@/services/leads/api';

type PaymentType = 'annuity' | 'differentiated';
type Frequency = 'monthly' | 'weekly';

export interface MortgageRequestPayload {
    propertyPrice: number;
    interestRate: number;
    loanTermYears: number;
    paymentType: PaymentType;
    paymentFrequency: Frequency;
    startDate?: string;
    selectedBank?: string | null;
}

export default function MortgageRequestModal({
                                                 open,
                                                 onClose,
                                                 payload,
                                             }: {
    open: boolean;
    onClose: () => void;
    payload: MortgageRequestPayload;
}) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [form, setForm] = useState({
        name: '',
        phone: '',
        message: '',
        requestType: 'mortgage' as const,
    });
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (!open) {
            setForm({ name: '', phone: '', message: '', requestType: 'mortgage' });
            setErrors({});
            setIsSubmitting(false);
        }
    }, [open]);

    useEffect(() => {
        if (typeof document === 'undefined') return;
        const body = document.body;
        const html = document.documentElement;
        const prevOverflow = body.style.overflow;
        const prevTouchAction = body.style.touchAction;
        const prevHtmlOverflow = html.style.overflow;
        const prevHtmlTouchAction = html.style.touchAction;

        if (open) {
            body.style.overflow = 'hidden';
            body.style.touchAction = 'none';
            html.style.overflow = 'hidden';
            html.style.touchAction = 'none';
        } else {
            body.style.overflow = prevOverflow;
            body.style.touchAction = prevTouchAction;
            html.style.overflow = prevHtmlOverflow;
            html.style.touchAction = prevHtmlTouchAction;
        }

        return () => {
            body.style.overflow = prevOverflow;
            body.style.touchAction = prevTouchAction;
            html.style.overflow = prevHtmlOverflow;
            html.style.touchAction = prevHtmlTouchAction;
        };
    }, [open]);

    const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setForm((p) => ({ ...p, [name]: value }));
        setErrors((p) => {
            const copy = { ...p };
            delete copy[name];
            return copy;
        });
    };

    // --- валидация модалки ---
    const validate = () => {
        const t = (s: string) => s.trim();
        const next: Record<string, string> = {};

        if (!t(form.name)) next.name = 'Укажите имя';
        else if (!/^[\p{L}\s'-]{2,}$/u.test(t(form.name))) next.name = 'Имя должно содержать минимум 2 буквы';

        const digits = form.phone.replace(/[^\d+]/g, '');
        if (!t(form.phone)) next.phone = 'Укажите телефон';
        else if (!/^\+?\d{7,15}$/.test(digits)) next.phone = 'Неверный формат телефона';

        if (t(form.message).length > 1000) next.message = 'Сообщение до 1000 символов';

        // if (!payload.selectedBank) next.bank = 'Выберите банк';

        // простая проверка числовых параметров калькулятора
        if (!(payload.propertyPrice > 0)) next.propertyPrice = 'Некорректная стоимость';
        if (!(payload.interestRate >= 0)) next.interestRate = 'Некорректная ставка';
        if (!(payload.loanTermYears > 0)) next.loanTermYears = 'Некорректный срок';

        return next;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isSubmitting) return;

        const next = validate();
        if (Object.keys(next).length) {
            setErrors(next);
            return;
        }

        setIsSubmitting(true);

        const sourceUrl = getSourceUrl();
        const flat = {
            ...form,
            title: 'Заявка на ипотеку',
            pageUrl: sourceUrl,
            bank: payload.selectedBank ?? '',
            propertyPrice: String(payload.propertyPrice),
            interestRate: String(payload.interestRate),
            loanTermYears: String(payload.loanTermYears),
            paymentType: payload.paymentType,
            paymentFrequency: payload.paymentFrequency,
            startDate: payload.startDate ?? '',
        };

        try {
            const result = await submitLead({
                lead: {
                    service_type: 'Ипотека',
                    name: form.name.trim(),
                    phone: form.phone.trim(),
                    comment: form.message?.trim() || undefined,
                    source: 'web-mortgage-calculator',
                    source_url: sourceUrl,
                    utm: getUtmFromUrl(sourceUrl),
                    context: {
                        bank: payload.selectedBank ?? undefined,
                        property_price: payload.propertyPrice,
                        interest_rate: payload.interestRate,
                        loan_term_years: payload.loanTermYears,
                        payment_type: payload.paymentType,
                        payment_frequency: payload.paymentFrequency,
                        start_date: payload.startDate ?? undefined,
                    },
                },
                telegram: flat,
            });
            if (!result.ok) {
                console.error(result);
                alert(getLeadErrorMessage(result));
                return;
            }
            alert('Заявка отправлена! Мы скоро свяжемся с вами.');
            onClose();
        } catch (err) {
            console.error(err);
            alert('Ошибка сети. Попробуйте позже.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!open) return null;

    const formatMoney = (n: number) =>
        new Intl.NumberFormat('ru-RU').format(Math.max(0, Math.round(n)));

    return (
        <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center">
            <div className="absolute inset-0 bg-black/40" onClick={onClose} />
            <div className="relative w-full md:w-[520px] bg-white rounded-t-2xl md:rounded-2xl p-5 md:p-6 shadow-xl">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg md:text-2xl font-bold">Оставить заявку</h3>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-gray-100 transition"
                        aria-label="Закрыть"
                    >
                        ✕
                    </button>
                </div>

                <p className="text-sm text-[#666F8D] mb-4">
                    Мы свяжемся с вами и подскажем условия ипотеки.
                </p>

                {errors.bank && (
                    <div className="mb-3 text-sm text-red-600">
                        {errors.bank}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-3">
                    <div>
                        <label className="block text-sm mb-1.5">Имя</label>
                        <input
                            name="name"
                            value={form.name}
                            onChange={onChange}
                            placeholder="Введите ваше имя"
                            className={`w-full h-[48px] px-3 bg-gray-100 rounded-lg outline-none border ${
                                errors.name ? 'border-red-500' : 'border-transparent'
                            } focus:ring-2 focus:ring-blue-500 focus:bg-white`}
                        />
                        {errors.name && <p className="text-sm text-red-600 mt-1">{errors.name}</p>}
                    </div>

                    <div>
                        <label className="block text-sm mb-1.5">Телефон</label>
                        <input
                            name="phone"
                            type="tel"
                            value={form.phone}
                            onChange={onChange}
                            placeholder="+992 9XX XXX XXX"
                            className={`w-full h-[48px] px-3 bg-gray-100 rounded-lg outline-none border ${
                                errors.phone ? 'border-red-500' : 'border-transparent'
                            } focus:ring-2 focus:ring-blue-500 focus:bg-white`}
                        />
                        {errors.phone && <p className="text-sm text-red-600 mt-1">{errors.phone}</p>}
                    </div>

                    <div>
                        <label className="block text-sm mb-1.5">Комментарий (необязательно)</label>
                        <textarea
                            name="message"
                            rows={3}
                            value={form.message}
                            onChange={onChange}
                            placeholder="Когда вам удобно поговорить?"
                            className={`w-full px-3 py-2 bg-gray-100 rounded-lg outline-none border ${
                                errors.message ? 'border-red-500' : 'border-transparent'
                            } focus:ring-2 focus:ring-blue-500 focus:bg-white resize-none`}
                        />
                        {errors.message && <p className="text-sm text-red-600 mt-1">{errors.message}</p>}
                    </div>

                    <div className="bg-[#F6F8FB] rounded-xl p-3 text-sm text-[#1F2937]">
                        <div className="flex justify-between">
                            <span>Стоимость</span>
                            <b>{formatMoney(payload.propertyPrice)} с.</b>
                        </div>
                        <div className="flex justify-between">
                            <span>Ставка</span>
                            <b>{payload.interestRate}%</b>
                        </div>
                        <div className="flex justify-between">
                            <span>Срок</span>
                            <b>{payload.loanTermYears} г.</b>
                        </div>
                        <div className="flex justify-between">
                            <span>Банк</span>
                            <b>{payload.selectedBank ?? 'не выбран'}</b>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full h-[48px] rounded-lg bg-[#0036A5] text-white font-semibold hover:bg-blue-700 disabled:opacity-50 transition"
                    >
                        {isSubmitting ? 'Отправка...' : 'Отправить'}
                    </button>
                </form>
            </div>
        </div>
    );
}
