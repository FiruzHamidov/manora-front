'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { extractApiErrorMessage, extractFieldErrors } from '@/services/login/api';
import { CompleteProfilePayload } from '@/services/login/types';

type ClientProfileOnboardingProps = {
  title: string;
  description: string;
  submitLabel?: string;
  isPending?: boolean;
  initialValues?: {
    name?: string | null;
    email?: string | null;
    description?: string | null;
    birthday?: string | null;
  };
  onSubmit: (payload: CompleteProfilePayload) => Promise<unknown>;
};

export default function ClientProfileOnboarding({
  title,
  description,
  submitLabel = 'Сохранить',
  isPending = false,
  initialValues,
  onSubmit,
}: ClientProfileOnboardingProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [profileDescription, setProfileDescription] = useState('');
  const [birthday, setBirthday] = useState('');
  const [formError, setFormError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  useEffect(() => {
    setName(initialValues?.name || '');
    setEmail(initialValues?.email || '');
    setProfileDescription(initialValues?.description || '');
    setBirthday(initialValues?.birthday || '');
  }, [
    initialValues?.birthday,
    initialValues?.description,
    initialValues?.email,
    initialValues?.name,
  ]);

  const isValid = useMemo(() => {
    return Boolean(name.trim() && email.trim() && birthday);
  }, [birthday, email, name]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError('');
    setFieldErrors({});

    try {
      await onSubmit({
        account_type: 'user',
        name: name.trim(),
        email: email.trim(),
        description: profileDescription.trim(),
        birthday,
      });
    } catch (error) {
      const errors = extractFieldErrors(error);
      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors);
      }
      setFormError(
        extractApiErrorMessage(error, 'Не удалось завершить регистрацию. Попробуйте снова.')
      );
    }
  };

  return (
    <div className="rounded-[28px] border border-[#DCE6F5] bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] md:p-8">
      <div className="max-w-[560px]">
        <div className="inline-flex rounded-full bg-[#EAF2FF] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#0B43B8]">
          Шаг 2
        </div>
        <h2 className="mt-4 text-2xl font-black text-[#0F172A] md:text-3xl">{title}</h2>
        <p className="mt-3 text-sm leading-6 text-[#52607A] md:text-base">{description}</p>
      </div>

      <form className="mt-8 grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
        <div>
          <label className="mb-2 block text-sm font-semibold text-[#334155]">Имя</label>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="h-12 w-full rounded-2xl border border-[#CBD5E1] px-4 text-sm outline-none transition focus:border-[#0B43B8]"
            placeholder="Иван"
          />
          {fieldErrors.name?.[0] ? (
            <p className="mt-1 text-xs text-red-600">{fieldErrors.name[0]}</p>
          ) : null}
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-[#334155]">Email</label>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="h-12 w-full rounded-2xl border border-[#CBD5E1] px-4 text-sm outline-none transition focus:border-[#0B43B8]"
            placeholder="ivan@example.com"
          />
          {fieldErrors.email?.[0] ? (
            <p className="mt-1 text-xs text-red-600">{fieldErrors.email[0]}</p>
          ) : null}
        </div>

        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-semibold text-[#334155]">О себе</label>
          <textarea
            value={profileDescription}
            onChange={(event) => setProfileDescription(event.target.value)}
            className="min-h-[120px] w-full rounded-2xl border border-[#CBD5E1] px-4 py-3 text-sm outline-none transition focus:border-[#0B43B8]"
            placeholder="Коротко расскажите о себе"
          />
          {fieldErrors.description?.[0] ? (
            <p className="mt-1 text-xs text-red-600">{fieldErrors.description[0]}</p>
          ) : null}
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-[#334155]">Дата рождения</label>
          <input
            type="date"
            value={birthday}
            onChange={(event) => setBirthday(event.target.value)}
            className="h-12 w-full rounded-2xl border border-[#CBD5E1] px-4 text-sm outline-none transition focus:border-[#0B43B8]"
          />
          {fieldErrors.birthday?.[0] ? (
            <p className="mt-1 text-xs text-red-600">{fieldErrors.birthday[0]}</p>
          ) : null}
        </div>

        <div className="flex items-end">
          <div className="w-full rounded-2xl border border-dashed border-[#BFDBFE] bg-[#F8FBFF] px-4 py-3 text-sm text-[#33507A]">
            Тип аккаунта будет сохранен как <span className="font-semibold">client user</span>.
          </div>
        </div>

        {formError ? (
          <div className="md:col-span-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {formError}
          </div>
        ) : null}

        <div className="md:col-span-2">
          <button
            type="submit"
            disabled={!isValid || isPending}
            className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-[#0B43B8] px-6 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:bg-[#9DB7E9] md:w-auto"
          >
            {isPending ? 'Сохраняем...' : submitLabel}
          </button>
        </div>
      </form>
    </div>
  );
}
