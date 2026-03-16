'use client';

import Link from 'next/link';
import MainShell from '@/app/_components/manora/MainShell';
import ClientProfileOnboarding from '@/app/_components/auth/ClientProfileOnboarding';
import {
  useAuthGate,
  useCompleteProfileMutation,
} from '@/services/login/hooks';

export default function CompleteProfilePage() {
  const { data, isLoading } = useAuthGate(true);
  const completeProfileMutation = useCompleteProfileMutation({
    redirect: true,
  });

  return (
    <MainShell>
      <div className="mx-auto w-full max-w-[920px] px-4 py-8 md:py-12">
        {isLoading ? (
          <div className="rounded-[28px] border border-[#DCE6F5] bg-white p-8 text-center text-sm text-[#52607A] shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
            Проверяем состояние авторизации...
          </div>
        ) : data?.user ? (
          <ClientProfileOnboarding
            title="Завершите профиль клиента"
            description={
              data.auth_state?.message ||
              'Профиль требует дополнительную анкету. После отправки формы откроется личный кабинет.'
            }
            submitLabel="Сохранить и перейти в кабинет"
            isPending={completeProfileMutation.isPending}
            initialValues={{
              name: data.user.name,
              email: data.user.email,
              description: data.user.description,
              birthday: data.user.birthday,
            }}
            onSubmit={completeProfileMutation.mutateAsync}
          />
        ) : (
          <div className="rounded-[28px] border border-[#DCE6F5] bg-white p-8 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
            <h1 className="text-2xl font-black text-[#0F172A]">Нет активной регистрации</h1>
            <p className="mt-3 text-sm leading-6 text-[#52607A]">
              Чтобы завершить профиль, сначала создайте аккаунт клиента или войдите
              в существующий профиль.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/register"
                className="inline-flex h-11 items-center justify-center rounded-2xl bg-[#0B43B8] px-5 text-sm font-semibold text-white"
              >
                Перейти к регистрации
              </Link>
              <Link
                href="/login"
                className="inline-flex h-11 items-center justify-center rounded-2xl border border-[#CBD5E1] px-5 text-sm font-semibold text-[#0F172A]"
              >
                Войти
              </Link>
            </div>
          </div>
        )}
      </div>
    </MainShell>
  );
}
