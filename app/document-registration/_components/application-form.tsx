'use client';

import Image from 'next/image';
import { ChangeEvent, FormEvent, useRef, useState } from 'react';
import { getLeadErrorMessage, getSourceUrl, getUtmFromUrl, submitLead } from '@/services/leads/api';

interface ApplicationFormProps {
  title: string; // Заголовок формы
  description: string; // Описание формы
}

export const ApplicationForm = ({ title, description }: ApplicationFormProps) => {
  const [formData, setFormData] = useState({ name: '', phone: '' });
  const [errors, setErrors] = useState<{ name?: string; phone?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const nameRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);

  type FormState = {
    name: string;
    phone: string;
  };

  type FormErrors = Partial<Record<keyof FormState, string>>;
  type FieldName = keyof FormState;

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const field = name as FieldName;

    setFormData((prev) => ({ ...prev, [field]: value }));

    setErrors((prev) => {
      const next: FormErrors = { ...prev };
      if (field in next) delete next[field];
      return next;
    });
  };

  const validate = () => {
    const t = (s: string) => s.trim();
    const next: { name?: string; phone?: string } = {};

    if (!t(formData.name)) next.name = 'Укажите имя';
    else if (!/^[\p{L}\s'-]{2,}$/u.test(t(formData.name)))
      next.name = 'Имя должно содержать минимум 2 буквы';

    const digits = formData.phone.replace(/[^\d+]/g, '');
    if (!t(formData.phone)) next.phone = 'Укажите телефон';
    else if (!/^\+?\d{7,15}$/.test(digits))
      next.phone = 'Неверный формат телефона';

    return next;
  };

  const focusFirstError = (errs: typeof errors) => {
    if (errs.name) nameRef.current?.focus();
    else if (errs.phone) phoneRef.current?.focus();
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const next = validate();
    if (Object.keys(next).length) {
      setErrors(next);
      focusFirstError(next);
      return;
    }

    setIsSubmitting(true);

    const sourceUrl = getSourceUrl();
    const payload = {
      ...formData,
      title,
      pageUrl: sourceUrl,
    };

    try {
      const result = await submitLead({
        lead: {
          service_type: title,
          name: formData.name.trim(),
          phone: formData.phone.trim(),
          source: 'web-service-form',
          source_url: sourceUrl,
          utm: getUtmFromUrl(sourceUrl),
          context: {
            form_title: title,
          },
        },
        telegram: payload,
      });
      if (!result.ok) {
        console.error(result.message);
        alert(getLeadErrorMessage(result));
        return;
      }

      setFormData({ name: '', phone: '' });
      setErrors({});
      alert('Заявка отправлена! Мы скоро свяжемся с вами.');
    } catch (err) {
      console.error(err);
      alert('Ошибка сети. Попробуйте позже.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const base =
      'w-full pl-10 pr-3 py-3 bg-gray-100 rounded-lg outline-none border transition-all focus:ring-2 focus:ring-blue-500 focus:bg-white';
  const withErr = (k: keyof typeof formData) =>
      `${base} ${errors[k] ? 'border-red-500' : 'border-transparent'}`;
  const errText = 'mt-1 text-sm text-red-600';

  return (
      <div className="bg-gradient-to-br overflow-hidden relative z-10 from-[#0036A5] to-[#115DFB] rounded-3xl">
        <div className="flex flex-col lg:flex-row lg:justify-center lg:gap-52">
          {/* Mobile */}
          <div className="text-white lg:hidden px-6 py-8">
            <h2 className="text-2xl font-bold mb-4">{title}</h2>
            <p className="text-lg text-[#BBD2FF] leading-relaxed">{description}</p>
          </div>

          {/* Desktop */}
          <div className="hidden lg:block text-white w-full lg:w-[70%] py-8 px-6 lg:py-[60px] lg:px-20">
            <h2 className="text-2xl lg:text-[40px] font-bold mb-4 lg:mb-7">{title}</h2>
            <p className="text-lg lg:text-[20px] text-[#BBD2FF] leading-relaxed">{description}</p>

            <div className="mt-4 lg:mt-5 relative z-0 h-32 lg:h-full opacity-45">
              <Image
                  src="/images/extra-pages/keys.png"
                  alt="Keys illustration"
                  width={378}
                  height={378}
                  className="absolute object-cover"
              />
            </div>
          </div>

          {/* Form */}
          <div className="bg-white rounded-t-2xl lg:rounded-2xl pt-6 pb-8 px-6 lg:pt-[30px] lg:pb-[46px] lg:px-10 lg:my-[35px] lg:mr-[60px] shadow-xs">
            <div className="mb-4 lg:mb-4">
              <h3 className="text-xl lg:text-2xl font-bold mb-1">Форма связи онлайн</h3>
              <p className="text-[#666F8D] text-sm">
                Обратитесь к нам напрямую и с вами свяжутся наши менеджеры
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 lg:space-y-2" noValidate>
              {/* Name */}
              <div>
                <label className="block text-sm mb-1.5">Представьтесь</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-[#0036A5]" fill="currentColor" viewBox="0 0 20 20">
                      <path
                          fillRule="evenodd"
                          d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                          clipRule="evenodd"
                      />
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
                  />
                </div>
                {errors.name && <p className={errText}>{errors.name}</p>}
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm mb-1.5">Телефон</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-[#0036A5]" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                    </svg>
                  </div>
                  <input
                      ref={phoneRef}
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="+992 9XX XXX XXX"
                      className={withErr('phone')}
                  />
                </div>
                {errors.phone && <p className={errText}>{errors.phone}</p>}
              </div>

              {/* Submit */}
              <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full mt-4 bg-[#0036A5] text-white py-[13px] rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50"
              >
                {isSubmitting ? 'Отправка...' : 'Отправить запрос'}
              </button>
            </form>
          </div>
        </div>
      </div>
  );
};
