'use client';

import { ChangeEvent, FormEvent, useRef, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { getLeadErrorMessage, getSourceUrl, getUtmFromUrl } from '@/services/leads/api';
import { useLeadSubmission } from '@/services/leads/hooks';

type FormState = {
  name: string;
  phone: string;
  company: string;
  city: string;
  partnershipType: string;
  comment: string;
};

type FormErrors = Partial<Record<keyof FormState, string>>;

const INITIAL_FORM_STATE: FormState = {
  name: '',
  phone: '',
  company: '',
  city: '',
  partnershipType: '',
  comment: '',
};

type PartnerLeadFormProps = {
  variant?: 'default' | 'compact';
};

export default function PartnerLeadForm({ variant = 'default' }: PartnerLeadFormProps) {
  const { submitLead } = useLeadSubmission();
  const isCompact = variant === 'compact';
  const [form, setForm] = useState<FormState>(INITIAL_FORM_STATE);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const refs = {
    name: useRef<HTMLInputElement>(null),
    phone: useRef<HTMLInputElement>(null),
    company: useRef<HTMLInputElement>(null),
    city: useRef<HTMLInputElement>(null),
    partnershipType: useRef<HTMLSelectElement>(null),
    comment: useRef<HTMLTextAreaElement>(null),
  };

  const handleChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = event.target;
    const field = name as keyof FormState;

    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const validate = (): FormErrors => {
    const nextErrors: FormErrors = {};
    const name = form.name.trim();
    const phone = form.phone.trim();
    const company = form.company.trim();
    const city = form.city.trim();
    const comment = form.comment.trim();
    const phoneDigits = phone.replace(/[^\d+]/g, '');

    if (!name) nextErrors.name = 'Укажите имя';
    else if (name.length < 2) nextErrors.name = 'Имя слишком короткое';

    if (!phone) nextErrors.phone = 'Укажите телефон';
    else if (!/^\+?\d{7,15}$/.test(phoneDigits)) nextErrors.phone = 'Неверный формат телефона';

    if (!isCompact && !company) nextErrors.company = 'Укажите компанию';
    if (!isCompact && !city) nextErrors.city = 'Укажите город';
    if (!form.partnershipType) nextErrors.partnershipType = 'Выберите формат партнёрства';
    if (comment.length > 1000) nextErrors.comment = 'Сообщение слишком длинное';

    return nextErrors;
  };

  const focusFirstError = (nextErrors: FormErrors) => {
    const order: (keyof FormState)[] = ['name', 'phone', 'company', 'city', 'partnershipType', 'comment'];

    for (const field of order) {
      if (!nextErrors[field]) continue;
      refs[field].current?.focus();
      break;
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (isSubmitting) return;

    const nextErrors = validate();
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      focusFirstError(nextErrors);
      return;
    }

    setIsSubmitting(true);
    const sourceUrl = getSourceUrl();

    try {
      const result = await submitLead({
        lead: {
          service_type: 'Партнерство с Manora',
          name: form.name.trim(),
          phone: form.phone.trim(),
          comment: form.comment.trim() || undefined,
          source: 'web-partners-form',
          source_url: sourceUrl,
          utm: getUtmFromUrl(sourceUrl),
          context: {
            company: form.company.trim(),
            city: form.city.trim(),
            partnership_type: form.partnershipType,
            form_title: 'Стать партнёром Manora',
          },
        },
      });

      if (!result.ok) {
        alert(getLeadErrorMessage(result));
        return;
      }

      setForm(INITIAL_FORM_STATE);
      setErrors({});
      setIsSubmitted(true);
    } catch (error) {
      console.error(error);
      alert('Ошибка сети. Попробуйте позже.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClassName =
    'h-12 w-full rounded-2xl border bg-white px-4 text-sm text-[#0F172A] outline-none transition focus:border-[#006341] focus:ring-4 focus:ring-[#DDEFE7]';
  const errorClassName = 'mt-1 text-sm text-red-600';

  if (isSubmitted) {
    return (
      <div
        id="partner-form"
        className={`flex min-h-[360px] flex-col items-center justify-center rounded-[30px] p-7 text-center ${
          isCompact
            ? 'border border-[#D9E8E0] bg-white text-[#0F172A] shadow-[0_18px_60px_rgba(15,23,42,0.08)]'
            : 'bg-[#003E2A] text-white shadow-[0_24px_70px_rgba(0,99,65,0.24)]'
        }`}
        role="status"
      >
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#E9F6EF] text-[#006341]">
          <CheckCircle2 className="h-7 w-7" />
        </span>
        <h2 className="mt-5 text-2xl font-extrabold">Заявка отправлена</h2>
        <p className={`mt-2 max-w-md text-sm leading-6 ${isCompact ? 'text-[#64748B]' : 'text-white/70'}`}>
          Команда Manora свяжется с вами в течение рабочего дня и предложит подходящий формат партнёрства.
        </p>
        <button
          type="button"
          onClick={() => setIsSubmitted(false)}
          className={`mt-6 rounded-2xl px-5 py-3 text-sm font-semibold ${
            isCompact ? 'bg-[#006341] text-white' : 'bg-white text-[#006341]'
          }`}
        >
          Отправить ещё одну заявку
        </button>
      </div>
    );
  }

  return (
    <div
      id="partner-form"
      className={`rounded-[30px] p-5 md:p-8 lg:p-10 ${
        isCompact
          ? 'border border-[#D9E8E0] bg-white text-[#0F172A] shadow-[0_18px_60px_rgba(15,23,42,0.08)]'
          : 'bg-[#003E2A] text-white shadow-[0_24px_70px_rgba(0,99,65,0.24)]'
      }`}
    >
      <div className={`max-w-[720px] ${isCompact ? 'mb-6' : 'mb-8'}`}>
        <div
          className={`mb-3 inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${
            isCompact ? 'bg-[#E9F6EF] text-[#006341]' : 'border border-white/15 bg-white/10 text-white/75'
          }`}
        >
          Партнёрская заявка
        </div>
        <h2 className={`font-extrabold leading-tight ${isCompact ? 'text-2xl md:text-[34px]' : 'text-2xl md:text-[38px]'}`}>
          {isCompact ? 'Давайте обсудим сотрудничество' : 'Станьте партнёром Manora и выходите в поток клиентов быстрее'}
        </h2>
        <p className={`mt-3 max-w-[620px] text-sm leading-6 md:text-base ${isCompact ? 'text-[#64748B]' : 'text-white/72'}`}>
          {isCompact
            ? 'Оставьте контакты — ответим в течение рабочего дня и расскажем об условиях без лишних презентаций.'
            : 'Оставьте контакты, чтобы обсудить партнёрство именно с Manora. Форма рассчитана на агентства недвижимости, риелторов, агентов и застройщиков, которые хотят использовать преимущества бренда и потока заявок.'}
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate className={`grid gap-4 ${isCompact ? '' : 'md:grid-cols-2'}`}>
        <div>
          <label htmlFor="partner-name" className="sr-only">Ваше имя</label>
          <input
            id="partner-name"
            ref={refs.name}
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Ваше имя"
            autoComplete="name"
            className={`${inputClassName} ${errors.name ? 'border-red-500' : 'border-[#D7E1DC]'}`}
          />
          {errors.name ? <p className={errorClassName}>{errors.name}</p> : null}
        </div>

        <div>
          <label htmlFor="partner-phone" className="sr-only">Телефон</label>
          <input
            id="partner-phone"
            ref={refs.phone}
            name="phone"
            type="tel"
            value={form.phone}
            onChange={handleChange}
            placeholder="Телефон"
            autoComplete="tel"
            className={`${inputClassName} ${errors.phone ? 'border-red-500' : 'border-[#D7E1DC]'}`}
          />
          {errors.phone ? <p className={errorClassName}>{errors.phone}</p> : null}
        </div>

        {!isCompact ? <div>
          <input
            ref={refs.company}
            name="company"
            value={form.company}
            onChange={handleChange}
            placeholder="Компания или бренд"
            className={`${inputClassName} ${errors.company ? 'border-red-500' : 'border-[#D7E1DC]'}`}
          />
          {errors.company ? <p className={errorClassName}>{errors.company}</p> : null}
        </div> : null}

        {!isCompact ? <div>
          <input
            ref={refs.city}
            name="city"
            value={form.city}
            onChange={handleChange}
            placeholder="Город"
            className={`${inputClassName} ${errors.city ? 'border-red-500' : 'border-[#D7E1DC]'}`}
          />
          {errors.city ? <p className={errorClassName}>{errors.city}</p> : null}
        </div> : null}

        <div className={isCompact ? '' : 'md:col-span-2'}>
          <label htmlFor="partner-type" className="sr-only">Тип партнёра</label>
          <select
            id="partner-type"
            ref={refs.partnershipType}
            name="partnershipType"
            value={form.partnershipType}
            onChange={handleChange}
            className={`${inputClassName} ${errors.partnershipType ? 'border-red-500' : 'border-[#D7E1DC]'}`}
          >
            <option value="">Выберите формат партнёрства</option>
            <option value="agency">Агентство недвижимости</option>
            <option value="developer">Застройщик</option>
            <option value="realtor">Риелтор</option>
            <option value="agent">Агент</option>
            <option value="team">Партнёрская команда продаж</option>
          </select>
          {errors.partnershipType ? <p className={errorClassName}>{errors.partnershipType}</p> : null}
        </div>

        {!isCompact ? <div className="md:col-span-2">
          <textarea
            ref={refs.comment}
            name="comment"
            value={form.comment}
            onChange={handleChange}
            rows={5}
            placeholder="Коротко опишите, чем вы занимаетесь и какой формат сотрудничества вам интересен"
            className={`${inputClassName} min-h-[140px] py-3 ${errors.comment ? 'border-red-500' : 'border-[#D7E1DC]'}`}
          />
          {errors.comment ? <p className={errorClassName}>{errors.comment}</p> : null}
        </div> : null}

        <div className={`${isCompact ? '' : 'md:col-span-2'} flex flex-col items-start justify-between gap-4 border-t pt-4 md:flex-row md:items-center ${
          isCompact ? 'border-[#E3EAE6]' : 'border-white/10'
        }`}>
          <p className={`max-w-[580px] text-xs leading-5 ${isCompact ? 'text-[#7A8781]' : 'text-white/60'}`}>
            Нажимая кнопку, вы соглашаетесь с обработкой персональных данных.
          </p>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex min-w-[220px] items-center justify-center rounded-2xl bg-[#F5A313] px-6 py-3 text-sm font-bold text-[#111827] transition hover:bg-[#F7B436] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? 'Отправляем...' : isCompact ? 'Получить условия' : 'Отправить заявку'}
          </button>
        </div>
      </form>
    </div>
  );
}
