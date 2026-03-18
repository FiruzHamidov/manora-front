'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { extractApiErrorMessage, extractFieldErrors } from '@/services/login/api';
import { AccountType, CompleteProfilePayload } from '@/services/login/types';

const ACCOUNT_TYPE_OPTIONS: Array<{
  value: Exclude<AccountType, null>;
  title: string;
  description: string;
}> = [
  {
    value: 'user',
    title: 'Владелец или покупатель',
    description: 'Подходит для частных клиентов, которые покупают, продают или сдают недвижимость.',
  },
  {
    value: 'realtor',
    title: 'Агент',
    description: 'Для риелторов и брокеров. Можно указать агентство и номер лицензии.',
  },
  {
    value: 'developer',
    title: 'Застройщик',
    description: 'Для компаний-застройщиков и их представителей.',
  },
];

type ClientProfileOnboardingProps = {
  title: string;
  description: string;
  submitLabel?: string;
  isPending?: boolean;
  initialValues?: {
    accountType?: AccountType;
    name?: string | null;
    email?: string | null;
    description?: string | null;
    birthday?: string | null;
    companyName?: string | null;
    licenseNumber?: string | null;
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
  const [accountType, setAccountType] = useState<Exclude<AccountType, null>>('user');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [profileDescription, setProfileDescription] = useState('');
  const [birthday, setBirthday] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [formError, setFormError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  useEffect(() => {
    setAccountType(initialValues?.accountType || 'user');
    setName(initialValues?.name || '');
    setEmail(initialValues?.email || '');
    setProfileDescription(initialValues?.description || '');
    setBirthday(initialValues?.birthday || '');
    setCompanyName(initialValues?.companyName || '');
    setLicenseNumber(initialValues?.licenseNumber || '');
  }, [
    initialValues?.accountType,
    initialValues?.birthday,
    initialValues?.companyName,
    initialValues?.description,
    initialValues?.email,
    initialValues?.licenseNumber,
    initialValues?.name,
  ]);

  const isValid = useMemo(() => {
    if (!name.trim() || !email.trim() || !birthday) {
      return false;
    }

    if (accountType === 'developer') {
      return Boolean(companyName.trim());
    }

    return true;
  }, [accountType, birthday, companyName, email, name]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError('');
    setFieldErrors({});

    try {
      await onSubmit({
        account_type: accountType,
        name: name.trim(),
        email: email.trim(),
        description: profileDescription.trim(),
        birthday,
        company_name: companyName.trim() || null,
        license_number: licenseNumber.trim() || null,
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
        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-semibold text-[#334155]">Тип аккаунта</label>
          <div className="grid gap-3 md:grid-cols-3">
            {ACCOUNT_TYPE_OPTIONS.map((option) => {
              const isActive = accountType === option.value;

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setAccountType(option.value)}
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
          {fieldErrors.account_type?.[0] ? (
            <p className="mt-1 text-xs text-red-600">{fieldErrors.account_type[0]}</p>
          ) : null}
        </div>

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

        {(accountType === 'realtor' || accountType === 'developer') ? (
          <div>
            <label className="mb-2 block text-sm font-semibold text-[#334155]">
              {accountType === 'developer' ? 'Название компании' : 'Агентство или компания'}
            </label>
            <input
              value={companyName}
              onChange={(event) => setCompanyName(event.target.value)}
              className="h-12 w-full rounded-2xl border border-[#CBD5E1] px-4 text-sm outline-none transition focus:border-[#0B43B8]"
              placeholder={accountType === 'developer' ? 'Manora Development' : 'Название агентства'}
            />
            {fieldErrors.company_name?.[0] ? (
              <p className="mt-1 text-xs text-red-600">{fieldErrors.company_name[0]}</p>
            ) : null}
          </div>
        ) : null}

        {accountType === 'realtor' ? (
          <div>
            <label className="mb-2 block text-sm font-semibold text-[#334155]">
              Номер лицензии
            </label>
            <input
              value={licenseNumber}
              onChange={(event) => setLicenseNumber(event.target.value)}
              className="h-12 w-full rounded-2xl border border-[#CBD5E1] px-4 text-sm outline-none transition focus:border-[#0B43B8]"
              placeholder="Необязательно"
            />
            {fieldErrors.license_number?.[0] ? (
              <p className="mt-1 text-xs text-red-600">{fieldErrors.license_number[0]}</p>
            ) : null}
          </div>
        ) : null}

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
            После отправки анкеты заявка будет сохранена как{' '}
            <span className="font-semibold">
              {ACCOUNT_TYPE_OPTIONS.find((option) => option.value === accountType)?.title.toLowerCase()}
            </span>.
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
