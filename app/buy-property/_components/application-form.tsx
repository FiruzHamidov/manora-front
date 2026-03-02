'use client';

import Image from 'next/image';
import { FormEvent, useRef, useState } from 'react';
import { getLeadErrorMessage, getSourceUrl, getUtmFromUrl, submitLead } from '@/services/leads/api';

interface ApplicationFormProps {
    id?: string;
    title?: string;
}

type FormState = {
    name: string;
    phone: string;
    requestType: string;
    message: string;
};

type FormErrors = Partial<Record<keyof FormState, string>>;
type FieldName = keyof FormState;
type Focusable = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

export const ApplicationForm = ({ id, title }: ApplicationFormProps) => {
    const [formData, setFormData] = useState<FormState>({
        name: '',
        phone: '',
        requestType: '',
        message: '',
    });
    const [errors, setErrors] = useState<FormErrors>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    // refs для фокуса на первом ошибочном поле
    const nameRef = useRef<HTMLInputElement>(null);
    const phoneRef = useRef<HTMLInputElement>(null);
    const requestTypeRef = useRef<HTMLSelectElement>(null);
    const messageRef = useRef<HTMLTextAreaElement>(null);

    const focusRefs: Record<keyof FormState, React.RefObject<Focusable>> = {
        name: nameRef as React.RefObject<Focusable>,
        phone: phoneRef as React.RefObject<Focusable>,
        requestType: requestTypeRef as React.RefObject<Focusable>,
        message: messageRef as React.RefObject<Focusable>,
    };

    const handleInputChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;
        const field = name as FieldName;

        setFormData((prev) => ({ ...prev, [field]: value }));

        setErrors((prev) => {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { [field]: _, ...rest } = prev;
            return rest;
        });
    };

    // --- ВАЛИДАЦИЯ ---
    const validate = (data: FormState): FormErrors => {
        const errs: FormErrors = {};
        const t = (s: string) => s.trim();

        if (!t(data.name)) errs.name = 'Укажите имя';
        else if (t(data.name).length < 2) errs.name = 'Слишком короткое имя';

        const digits = data.phone.replace(/[^\d+]/g, '');
        const phoneOk = /^\+?\d{7,15}$/.test(digits);
        if (!t(data.phone)) errs.phone = 'Укажите телефон';
        else if (!phoneOk) errs.phone = 'Неверный формат телефона';

        if (!t(data.requestType)) errs.requestType = 'Выберите тип обращения';

        if (t(data.message).length > 1000) errs.message = 'Слишком длинное сообщение (до 1000 символов)';

        return errs;
    };

    const focusFirstError = (errs: FormErrors) => {
        const order: FieldName[] = ['name', 'phone', 'requestType', 'message'];
        for (const key of order) {
            if (errs[key]) {
                focusRefs[key]?.current?.focus();
                break;
            }
        }
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (isSubmitting) return;

        const nextErrors = validate(formData);
        if (Object.keys(nextErrors).length) {
            setErrors(nextErrors);
            focusFirstError(nextErrors);
            return;
        }

        setIsSubmitting(true);

        const sourceUrl = getSourceUrl();
        const payload = {
            ...formData,
            title: title ?? 'Заявка с сайта',
            sourceId: id,
            pageUrl: sourceUrl,
        };

        try {
            const result = await submitLead({
                lead: {
                    service_type: 'Срочный выкуп',
                    name: formData.name.trim(),
                    phone: formData.phone.trim(),
                    comment: formData.message?.trim() || undefined,
                    source: id || 'web-buy-property-form',
                    source_url: sourceUrl,
                    utm: getUtmFromUrl(sourceUrl),
                    context: {
                        request_type: formData.requestType,
                    },
                },
                telegram: payload,
            });

            if (!result.ok) {
                console.error(result.message);
                alert(getLeadErrorMessage(result));
                return;
            }

            setFormData({ name: '', phone: '', requestType: '', message: '' });
            setErrors({});
            alert('Заявка отправлена! Мы скоро свяжемся с вами.');
        } catch (err) {
            console.error(err);
            alert('Ошибка сети. Попробуйте позже.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // стили
    const base =
        'w-full pl-10 pr-3 py-3 bg-gray-100 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all';
    const withErr = (k: keyof FormState) => `${base} ${errors[k] ? 'border-red-500' : 'border-transparent'}`;
    const errText = 'mt-1 text-sm text-red-600';

    return (
        <div className="bg-gradient-to-br overflow-hidden relative z-10 from-[#0036A5] to-[#115DFB] rounded-3xl" id={id}>
            <div className="flex flex-col md:flex-row md:justify-center md:gap-52">
                {/* Mobile text */}
                <div className="text-white md:hidden px-6 py-8 text-center">
                    <h2 className="text-2xl font-bold mb-4">Срочный выкуп недвижимости</h2>
                    <p className="text-lg text-[#BBD2FF] leading-relaxed">
                        Нужна срочная продажа? Услуга быстрого выкупа от Manora — это надёжный и выгодный способ продать вашу
                        недвижимость в кратчайшие сроки.
                    </p>
                </div>

                {/* Desktop text + image */}
                <div className="hidden md:block text-white w-full md:w-[70%] py-8 px-6 md:py-[60px] md:px-20">
                    <h2 className="text-2xl md:text-[40px] font-bold mb-4 md:mb-7">Срочный выкуп недвижимости</h2>
                    <p className="text-lg md:text-[20px] text-[#BBD2FF] leading-relaxed">
                        Нужна срочная продажа? Услуга быстрого выкупа от Manora — это надёжный и выгодный способ продать вашу
                        недвижимость в кратчайшие сроки.
                        <br />
                        <br />
                        Мы полностью берём на себя все заботы, гарантируя вам комфортную сделку и самые выгодные условия. Свяжитесь
                        с нами прямо сейчас!
                    </p>
                    <div className="mt-4 md:mt-5 relative z-0 h-32 md:h-full opacity-45">
                        <Image src="/images/extra-pages/keys.png" alt="Keys illustration" width={378} height={378} className="absolute object-cover" />
                    </div>
                </div>

                {/* Form */}
                <div className="bg-white rounded-t-2xl md:rounded-2xl pt-6 pb-8 px-6 md:pt-[30px] md:pb-[46px] md:px-10 md:my-[35px] md:mr-[60px] shadow-xs">
                    <div className="mb-4 md:mb-4">
                        <h3 className="text-xl md:text-2xl font-bold mb-1">Форма связи онлайн</h3>
                        <p className="text-[#666F8D] text-sm">Обратитесь к нам напрямую и с вами свяжутся наши менеджеры</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-3 md:space-y-2" noValidate>
                        {/* name */}
                        <div>
                            <label className="block text-sm mb-1.5">Представьтесь</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <svg className="h-5 w-5 text-[#0036A5]" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <input
                                    ref={nameRef}
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    placeholder="Введите ваше имя"
                                    className={withErr('name')}
                                    aria-invalid={!!errors.name}
                                    aria-describedby={errors.name ? 'err-name' : undefined}
                                />
                            </div>
                            {errors.name && <p id="err-name" className={errText}>{errors.name}</p>}
                        </div>

                        {/* phone */}
                        <div>
                            <label className="block text-sm mb-1.5">Телефон</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <svg className="h-5 w-5 text-[#0036A5]" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06л-1.548.773a11.037 11.037 0 006.105 6.105л.774-1.548a1 1 0 011.059-.54л4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                                    </svg>
                                </div>
                                <input
                                    ref={phoneRef}
                                    type="tel"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleInputChange}
                                    placeholder="Введите номер телефона"
                                    className={withErr('phone')}
                                    aria-invalid={!!errors.phone}
                                    aria-describedby={errors.phone ? 'err-phone' : undefined}
                                />
                            </div>
                            {errors.phone && <p id="err-phone" className={errText}>{errors.phone}</p>}
                        </div>

                        {/* request type */}
                        <div>
                            <label className="block text-sm mb-1.5">Тип обращения</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <svg className="h-5 w-5 text-[#0036A5]" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M10.707 2.293a1 1 0 00-1.414 0л-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2а1 1 0 011-1h2а1 1 0 011 1v2а1 1 0 001 1h2а1 1 0 001-1v-6.586л.293.293a1 1 0 001.414-1.414л-7-7z" />
                                    </svg>
                                </div>
                                <select
                                    ref={requestTypeRef}
                                    name="requestType"
                                    value={formData.requestType}
                                    onChange={handleInputChange}
                                    className={`${withErr('requestType')} appearance-none`}
                                    aria-invalid={!!errors.requestType}
                                    aria-describedby={errors.requestType ? 'err-requestType' : undefined}
                                >
                                    <option value="">Выберите</option>
                                    <option value="buy">Покупка</option>
                                    <option value="sell">Продажа</option>
                                    <option value="rent">Аренда</option>
                                    <option value="consultation">Консультация</option>
                                </select>
                                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                    <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586л3.293-3.293a1 1 0 111.414 1.414л-4 4a1 1 0 01-1.414 0л-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                    </svg>
                                </div>
                            </div>
                            {errors.requestType && <p id="err-requestType" className={errText}>{errors.requestType}</p>}
                        </div>

                        {/* message */}
                        <div>
                            <label className="block text-sm mb-1.5">Текст письма</label>
                            <textarea
                                ref={messageRef}
                                name="message"
                                value={formData.message}
                                onChange={handleInputChange}
                                placeholder="Текст письма"
                                rows={4}
                                className={`w-full px-3 py-3 bg-gray-100 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all resize-none ${
                                    errors.message ? 'border-red-500' : 'border-transparent'
                                }`}
                                aria-invalid={!!errors.message}
                                aria-describedby={errors.message ? 'err-message' : undefined}
                            />
                            {errors.message && <p id="err-message" className={errText}>{errors.message}</p>}
                        </div>

                        {/* submit */}
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full mt-4 bg-[#0036A5] text-white py-[13px] rounded-lg hover:bg-blue-700 transition-colors duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? 'Отправка...' : 'Отправить запрос'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};
