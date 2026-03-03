'use client';

import { ChangeEvent, FormEvent, useRef, useState } from 'react';
import { getLeadErrorMessage, getSourceUrl, getUtmFromUrl, submitLead } from '@/services/leads/api';

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

export default function PartnerLeadForm() {
  const [form, setForm] = useState<FormState>(INITIAL_FORM_STATE);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

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

    if (!company) nextErrors.company = 'Укажите компанию';
    if (!city) nextErrors.city = 'Укажите город';
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
        telegram: {
          title: 'Партнёрская заявка Manora',
          name: form.name.trim(),
          phone: form.phone.trim(),
          company: form.company.trim(),
          city: form.city.trim(),
          partnershipType: form.partnershipType,
          comment: form.comment.trim() || undefined,
          pageUrl: sourceUrl,
          sourceId: 'web-partners-form',
        },
      });

      if (!result.ok) {
        alert(getLeadErrorMessage(result));
        return;
      }

      setForm(INITIAL_FORM_STATE);
      setErrors({});
      alert('Заявка отправлена. Команда Manora свяжется с вами.');
    } catch (error) {
      console.error(error);
      alert('Ошибка сети. Попробуйте позже.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClassName =
    'h-12 w-full rounded-2xl border bg-[#F8FAFC] px-4 text-sm text-[#0F172A] outline-none transition focus:border-[#0B43B8]';
  const errorClassName = 'mt-1 text-sm text-red-600';

  return (
    <div id="partner-form" className="rounded-[30px] bg-[#0B1220] p-5 text-white shadow-[0_24px_70px_rgba(11,18,32,0.24)] md:p-8 lg:p-10">
      <div className="mb-8 max-w-[720px]">
        <div className="mb-3 inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs uppercase tracking-[0.22em] text-white/75">
          Партнерская заявка
        </div>
        <h2 className="text-2xl font-extrabold leading-tight md:text-[38px]">
          Станьте партнёром Manora и выходите в поток клиентов быстрее
        </h2>
        <p className="mt-3 max-w-[620px] text-sm leading-6 text-white/72 md:text-base">
          Оставьте контакты, чтобы обсудить партнёрство именно с Manora. Форма рассчитана на агентства недвижимости,
          риелторов, агентов и застройщиков, которые хотят использовать преимущества бренда и потока заявок.
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="grid gap-4 md:grid-cols-2">
        <div>
          <input
            ref={refs.name}
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Ваше имя"
            className={`${inputClassName} ${errors.name ? 'border-red-500' : 'border-white/10'}`}
          />
          {errors.name ? <p className={errorClassName}>{errors.name}</p> : null}
        </div>

        <div>
          <input
            ref={refs.phone}
            name="phone"
            value={form.phone}
            onChange={handleChange}
            placeholder="Телефон"
            className={`${inputClassName} ${errors.phone ? 'border-red-500' : 'border-white/10'}`}
          />
          {errors.phone ? <p className={errorClassName}>{errors.phone}</p> : null}
        </div>

        <div>
          <input
            ref={refs.company}
            name="company"
            value={form.company}
            onChange={handleChange}
            placeholder="Компания или бренд"
            className={`${inputClassName} ${errors.company ? 'border-red-500' : 'border-white/10'}`}
          />
          {errors.company ? <p className={errorClassName}>{errors.company}</p> : null}
        </div>

        <div>
          <input
            ref={refs.city}
            name="city"
            value={form.city}
            onChange={handleChange}
            placeholder="Город"
            className={`${inputClassName} ${errors.city ? 'border-red-500' : 'border-white/10'}`}
          />
          {errors.city ? <p className={errorClassName}>{errors.city}</p> : null}
        </div>

        <div className="md:col-span-2">
          <select
            ref={refs.partnershipType}
            name="partnershipType"
            value={form.partnershipType}
            onChange={handleChange}
            className={`${inputClassName} ${errors.partnershipType ? 'border-red-500' : 'border-white/10'}`}
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

        <div className="md:col-span-2">
          <textarea
            ref={refs.comment}
            name="comment"
            value={form.comment}
            onChange={handleChange}
            rows={5}
            placeholder="Коротко опишите, чем вы занимаетесь и какой формат сотрудничества вам интересен"
            className={`${inputClassName} min-h-[140px] py-3 ${errors.comment ? 'border-red-500' : 'border-white/10'}`}
          />
          {errors.comment ? <p className={errorClassName}>{errors.comment}</p> : null}
        </div>

        <div className="md:col-span-2 flex flex-col items-start justify-between gap-4 border-t border-white/10 pt-4 md:flex-row md:items-center">
          <p className="max-w-[580px] text-sm leading-6 text-white/60">
            После отправки заявка попадёт в CRM Manora. Команда свяжется с вами и предложит формат партнёрства,
            подходящий для агентства недвижимости, застройщика, риелтора или агента.
          </p>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex min-w-[220px] items-center justify-center rounded-2xl bg-[#F59E0B] px-6 py-3 text-sm font-semibold text-[#111827] transition hover:bg-[#FBBF24] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? 'Отправляем...' : 'Отправить заявку'}
          </button>
        </div>
      </form>
    </div>
  );
}
