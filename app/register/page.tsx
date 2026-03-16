'use client';

import { FormEvent, useMemo, useState } from 'react';
import { useMask } from '@react-input/mask';
import Link from 'next/link';
import MainShell from '@/app/_components/manora/MainShell';
import ClientProfileOnboarding from '@/app/_components/auth/ClientProfileOnboarding';
import {
  extractApiErrorMessage,
  extractFieldErrors,
} from '@/services/login/api';
import {
  resolveAuthRouteByCode,
  useCompleteProfileMutation,
  useRegisterMutation,
} from '@/services/login/hooks';
import { RegisterRequest } from '@/services/login/types';

function normalizePhone(rawPhone: string): string | null {
  const digits = rawPhone.replace(/\D/g, '');

  if (digits.length !== 12 || !digits.startsWith('992')) {
    return null;
  }

  return `+${digits}`;
}

export default function RegisterPage() {
  const maskRef = useMask({
    mask: '(+992) ___ __ __ __',
    replacement: { _: /\d/ },
  });
  const [step, setStep] = useState<'register' | 'profile'>('register');
  const [formError, setFormError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [form, setForm] = useState<RegisterRequest>({
    name: '',
    phone: '',
    email: '',
    password: '',
    description: '',
    birthday: '',
  });

  const normalizedPhone = useMemo(() => normalizePhone(form.phone), [form.phone]);
  const isRegisterValid = useMemo(() => {
    return Boolean(
      form.name.trim() &&
        normalizedPhone &&
        form.email.trim() &&
        form.password.trim().length >= 6 &&
        form.birthday
    );
  }, [form.birthday, form.email, form.name, form.password, normalizedPhone]);

  const registerMutation = useRegisterMutation({
    redirect: false,
    onSuccess: (response) => {
      const nextCode = response.auth_state?.code;
      if (nextCode === 'PROFILE_REQUIRED') {
        setStep('profile');
        return;
      }

      window.location.href = resolveAuthRouteByCode(nextCode);
    },
  });
  const completeProfileMutation = useCompleteProfileMutation({
    redirect: true,
  });

  const handleRegister = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError('');
    setFieldErrors({});

    if (!normalizedPhone) {
      setFormError('Введите корректный номер телефона');
      return;
    }

    try {
      await registerMutation.mutateAsync({
        ...form,
        phone: normalizedPhone,
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password.trim(),
        description: form.description.trim(),
      });
    } catch (error) {
      const errors = extractFieldErrors(error);
      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors);
      }
      setFormError(
        extractApiErrorMessage(error, 'Не удалось создать аккаунт. Попробуйте снова.')
      );
    }
  };

  return (
    <MainShell>
      <div className="relative overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(11,67,184,0.12),_transparent_32%),linear-gradient(180deg,#F7FAFF_0%,#F3F7FD_100%)]">
        <div className="mx-auto grid min-h-[calc(100vh-120px)] w-full max-w-[1320px] gap-8 px-4 py-8 md:grid-cols-[0.95fr_1.05fr] md:px-6 md:py-12">
          <section className="rounded-[32px] bg-[#0B43B8] p-6 text-white shadow-[0_24px_80px_rgba(11,67,184,0.28)] md:p-8">
            <div className="inline-flex rounded-full border border-white/25 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white/80">
              Manora Account
            </div>
            <h1 className="mt-5 max-w-[440px] text-3xl font-black leading-tight md:text-5xl">
              Регистрация клиента в два шага
            </h1>
            <p className="mt-4 max-w-[460px] text-sm leading-6 text-white/82 md:text-base">
              Сначала создаём аккаунт, затем сразу завершаем анкету клиента. После
              подтверждения профиля вы попадаете в личный кабинет.
            </p>

            <div className="mt-8 space-y-3">
              {[
                'Шаг 1. Создание аккаунта через JSON POST /api/register',
                'Шаг 2. Завершение анкеты через Bearer POST /api/auth/complete-profile',
                'После auth_state.code = OK автоматически открывается личный кабинет',
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm text-white/90"
                >
                  {item}
                </div>
              ))}
            </div>

            <p className="mt-8 text-sm text-white/75">
              Уже есть аккаунт?{' '}
              <Link href="/login" className="font-semibold text-white underline underline-offset-4">
                Войти
              </Link>
            </p>
          </section>

          <section className="self-center">
            {step === 'register' ? (
              <div className="rounded-[28px] border border-[#DCE6F5] bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] md:p-8">
                <div className="inline-flex rounded-full bg-[#EAF2FF] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#0B43B8]">
                  Шаг 1
                </div>
                <h2 className="mt-4 text-2xl font-black text-[#0F172A] md:text-3xl">
                  Создайте аккаунт клиента
                </h2>
                <p className="mt-3 text-sm leading-6 text-[#52607A] md:text-base">
                  Заполните базовые данные. Если бэкенд вернет
                  <span className="mx-1 font-semibold text-[#0B43B8]">PROFILE_REQUIRED</span>
                  , мы сразу откроем второй шаг onboarding.
                </p>

                <form className="mt-8 grid gap-4 md:grid-cols-2" onSubmit={handleRegister}>
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-[#334155]">Имя</label>
                    <input
                      value={form.name}
                      onChange={(event) =>
                        setForm((prev) => ({ ...prev, name: event.target.value }))
                      }
                      className="h-12 w-full rounded-2xl border border-[#CBD5E1] px-4 text-sm outline-none transition focus:border-[#0B43B8]"
                      placeholder="Иван"
                    />
                    {fieldErrors.name?.[0] ? (
                      <p className="mt-1 text-xs text-red-600">{fieldErrors.name[0]}</p>
                    ) : null}
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-[#334155]">Телефон</label>
                    <input
                      ref={maskRef}
                      type="tel"
                      value={form.phone}
                      onChange={(event) =>
                        setForm((prev) => ({ ...prev, phone: event.target.value }))
                      }
                      className="h-12 w-full rounded-2xl border border-[#CBD5E1] px-4 text-sm outline-none transition focus:border-[#0B43B8]"
                      placeholder="(+992) 900 00 00 00"
                    />
                    {fieldErrors.phone?.[0] ? (
                      <p className="mt-1 text-xs text-red-600">{fieldErrors.phone[0]}</p>
                    ) : null}
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-[#334155]">Email</label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(event) =>
                        setForm((prev) => ({ ...prev, email: event.target.value }))
                      }
                      className="h-12 w-full rounded-2xl border border-[#CBD5E1] px-4 text-sm outline-none transition focus:border-[#0B43B8]"
                      placeholder="ivan@example.com"
                    />
                    {fieldErrors.email?.[0] ? (
                      <p className="mt-1 text-xs text-red-600">{fieldErrors.email[0]}</p>
                    ) : null}
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-[#334155]">Пароль</label>
                    <input
                      type="password"
                      value={form.password}
                      onChange={(event) =>
                        setForm((prev) => ({ ...prev, password: event.target.value }))
                      }
                      className="h-12 w-full rounded-2xl border border-[#CBD5E1] px-4 text-sm outline-none transition focus:border-[#0B43B8]"
                      placeholder="Минимум 6 символов"
                    />
                    {fieldErrors.password?.[0] ? (
                      <p className="mt-1 text-xs text-red-600">{fieldErrors.password[0]}</p>
                    ) : null}
                  </div>

                  <div className="md:col-span-2">
                    <label className="mb-2 block text-sm font-semibold text-[#334155]">О себе</label>
                    <textarea
                      value={form.description}
                      onChange={(event) =>
                        setForm((prev) => ({ ...prev, description: event.target.value }))
                      }
                      className="min-h-[120px] w-full rounded-2xl border border-[#CBD5E1] px-4 py-3 text-sm outline-none transition focus:border-[#0B43B8]"
                      placeholder="Необязательно"
                    />
                    {fieldErrors.description?.[0] ? (
                      <p className="mt-1 text-xs text-red-600">{fieldErrors.description[0]}</p>
                    ) : null}
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-[#334155]">Дата рождения</label>
                    <input
                      type="date"
                      value={form.birthday}
                      onChange={(event) =>
                        setForm((prev) => ({ ...prev, birthday: event.target.value }))
                      }
                      className="h-12 w-full rounded-2xl border border-[#CBD5E1] px-4 text-sm outline-none transition focus:border-[#0B43B8]"
                    />
                    {fieldErrors.birthday?.[0] ? (
                      <p className="mt-1 text-xs text-red-600">{fieldErrors.birthday[0]}</p>
                    ) : null}
                  </div>

                  <div className="flex items-end">
                    <div className="w-full rounded-2xl border border-dashed border-[#BFDBFE] bg-[#F8FBFF] px-4 py-3 text-sm text-[#33507A]">
                      Для клиента автоматически будет использован
                      <span className="ml-1 font-semibold">account_type: user</span>.
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
                      disabled={!isRegisterValid || registerMutation.isPending}
                      className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-[#0B43B8] px-6 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:bg-[#9DB7E9]"
                    >
                      {registerMutation.isPending ? 'Создаем аккаунт...' : 'Продолжить'}
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <ClientProfileOnboarding
                title="Завершите профиль клиента"
                description="Аккаунт создан. Остался финальный шаг: отправим анкету клиента с account_type = user и после успешного ответа откроем личный кабинет."
                submitLabel="Завершить регистрацию"
                isPending={completeProfileMutation.isPending}
                initialValues={form}
                onSubmit={completeProfileMutation.mutateAsync}
              />
            )}
          </section>
        </div>
      </div>
    </MainShell>
  );
}
