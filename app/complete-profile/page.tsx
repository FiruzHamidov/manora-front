'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import MainShell from '@/app/_components/manora/MainShell';
import {
  useAuthGate,
  useCompleteProfileMutation,
  resolveAuthRouteByCode,
} from '@/services/login/hooks';
import { CompleteProfilePayload } from '@/services/login/types';
import { extractFieldErrors } from '@/services/login/api';

const ACCOUNT_TYPE_OPTIONS = [
  { label: 'Обычный пользователь', value: 'user' as const },
  { label: 'Риэлтор', value: 'realtor' as const },
  { label: 'Застройщик', value: 'developer' as const },
];

type AccountType = CompleteProfilePayload['account_type'];

export default function CompleteProfilePage() {
  const { data } = useAuthGate(true);
  const completeProfile = useCompleteProfileMutation();
  const [accountType, setAccountType] = useState<AccountType>('user');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [description, setDescription] = useState('');
  const [birthday, setBirthday] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [formError, setFormError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  useEffect(() => {
    const user = data?.user;
    if (!user) return;
    setName((prev) => prev || user.name || '');
    setEmail((prev) => prev || user.email || '');
    setDescription((prev) => prev || user.description || '');
    setBirthday((prev) => prev || user.birthday || '');
  }, [data?.user]);

  useEffect(() => {
    const user = data?.user;
    if (!user) return;
    const savedType = sessionStorage.getItem('complete_profile_account_type') as AccountType | null;
    const savedCompanyName = sessionStorage.getItem('complete_profile_company_name');
    const savedLicense = sessionStorage.getItem('complete_profile_license_number');
    if (savedType) setAccountType(savedType);
    if (savedCompanyName) setCompanyName(savedCompanyName);
    if (savedLicense) setLicenseNumber(savedLicense);
  }, [data?.user]);

  useEffect(() => {
    sessionStorage.setItem('complete_profile_account_type', accountType);
    sessionStorage.setItem('complete_profile_company_name', companyName);
    sessionStorage.setItem('complete_profile_license_number', licenseNumber);
  }, [accountType, companyName, licenseNumber]);

  const requiresExtendedFields = accountType === 'realtor' || accountType === 'developer';

  const isFormValid = useMemo(() => {
    if (!name.trim()) return false;
    if (!requiresExtendedFields) return true;
    return Boolean(email.trim() && companyName.trim() && licenseNumber.trim());
  }, [name, requiresExtendedFields, email, companyName, licenseNumber]);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setFormError('');
    setFieldErrors({});

    const payload: CompleteProfilePayload = {
      account_type: accountType,
      name: name.trim(),
      email: email.trim() || null,
      description: description.trim() || null,
      birthday: birthday || null,
      company_name: requiresExtendedFields ? companyName.trim() : null,
      license_number: requiresExtendedFields ? licenseNumber.trim() : null,
    };

    try {
      const response = await completeProfile.mutateAsync(payload);
      const target = resolveAuthRouteByCode(response.auth_state.code);
      window.location.href = target;
    } catch (error) {
      const errors = extractFieldErrors(error);
      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors);
        return;
      }
      setFormError('Не удалось завершить профиль. Попробуйте снова.');
    }
  };

  return (
    <MainShell>
      <div className="mx-auto w-full max-w-[820px] px-4 py-8 md:py-12">
        <div className="rounded-2xl bg-white p-5 md:p-8">
          <h1 className="text-2xl font-bold text-[#0F172A]">Завершение профиля</h1>
          <p className="mt-2 text-sm text-[#64748B]">
            {data?.auth_state?.message || 'Выберите тип аккаунта и заполните обязательные поля.'}
          </p>

          <form className="mt-6 space-y-4" onSubmit={onSubmit}>
            <div>
              <label className="mb-2 block text-sm font-semibold text-[#334155]">Тип аккаунта</label>
              <div className="grid gap-2 md:grid-cols-3">
                {ACCOUNT_TYPE_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setAccountType(option.value)}
                    className={`rounded-xl border px-3 py-2 text-sm font-semibold transition ${
                      accountType === option.value
                        ? 'border-[#0036A5] bg-[#EAF1FF] text-[#0036A5]'
                        : 'border-[#D7DFEA] bg-white text-[#334155]'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold text-[#334155]">Имя</label>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="h-11 w-full rounded-xl border border-[#D7DFEA] px-3 text-sm outline-none focus:border-[#0036A5]"
                placeholder="Введите имя"
              />
              {fieldErrors.name?.[0] && <p className="mt-1 text-xs text-red-600">{fieldErrors.name[0]}</p>}
            </div>

            {requiresExtendedFields && (
              <>
                <div>
                  <label className="mb-1 block text-sm font-semibold text-[#334155]">Email</label>
                  <input
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="h-11 w-full rounded-xl border border-[#D7DFEA] px-3 text-sm outline-none focus:border-[#0036A5]"
                    placeholder="you@example.com"
                  />
                  {fieldErrors.email?.[0] && <p className="mt-1 text-xs text-red-600">{fieldErrors.email[0]}</p>}
                </div>

                <div>
                  <label className="mb-1 block text-sm font-semibold text-[#334155]">Компания</label>
                  <input
                    value={companyName}
                    onChange={(event) => setCompanyName(event.target.value)}
                    className="h-11 w-full rounded-xl border border-[#D7DFEA] px-3 text-sm outline-none focus:border-[#0036A5]"
                    placeholder="Название компании"
                  />
                  {fieldErrors.company_name?.[0] && (
                    <p className="mt-1 text-xs text-red-600">{fieldErrors.company_name[0]}</p>
                  )}
                </div>

                <div>
                  <label className="mb-1 block text-sm font-semibold text-[#334155]">Номер лицензии</label>
                  <input
                    value={licenseNumber}
                    onChange={(event) => setLicenseNumber(event.target.value)}
                    className="h-11 w-full rounded-xl border border-[#D7DFEA] px-3 text-sm outline-none focus:border-[#0036A5]"
                    placeholder="Введите номер лицензии"
                  />
                  {fieldErrors.license_number?.[0] && (
                    <p className="mt-1 text-xs text-red-600">{fieldErrors.license_number[0]}</p>
                  )}
                </div>
              </>
            )}

            <div>
              <label className="mb-1 block text-sm font-semibold text-[#334155]">Описание</label>
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                className="min-h-[88px] w-full rounded-xl border border-[#D7DFEA] px-3 py-2 text-sm outline-none focus:border-[#0036A5]"
                placeholder="Краткая информация о вас"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold text-[#334155]">Дата рождения</label>
              <input
                type="date"
                value={birthday}
                onChange={(event) => setBirthday(event.target.value)}
                className="h-11 w-full rounded-xl border border-[#D7DFEA] px-3 text-sm outline-none focus:border-[#0036A5]"
              />
            </div>

            {formError && <p className="text-sm text-red-600">{formError}</p>}

            <button
              type="submit"
              disabled={!isFormValid || completeProfile.isPending}
              className="h-11 w-full rounded-xl bg-[#0036A5] text-sm font-semibold text-white disabled:opacity-50"
            >
              {completeProfile.isPending ? 'Сохраняем...' : 'Сохранить'}
            </button>
          </form>
        </div>
      </div>
    </MainShell>
  );
}
