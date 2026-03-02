'use client';

import MainShell from '@/app/_components/manora/MainShell';
import { useAuthGate } from '@/services/login/hooks';

export default function AuthInactivePage() {
  const { data } = useAuthGate(true);

  return (
    <MainShell>
      <div className="mx-auto w-full max-w-[620px] px-4 py-10">
        <div className="rounded-2xl bg-white p-6 md:p-8">
          <h1 className="text-2xl font-bold text-[#0F172A]">Аккаунт не активен</h1>
          <p className="mt-3 text-sm text-[#475569]">
            {data?.auth_state?.message || 'Ваш аккаунт временно не активен. Обратитесь в поддержку.'}
          </p>
        </div>
      </div>
    </MainShell>
  );
}
