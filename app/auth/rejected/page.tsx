'use client';

import Link from 'next/link';
import MainShell from '@/app/_components/manora/MainShell';
import { useAuthGate } from '@/services/login/hooks';

export default function AuthRejectedPage() {
  const { data } = useAuthGate(true);

  return (
    <MainShell>
      <div className="mx-auto w-full max-w-[620px] px-4 py-10">
        <div className="rounded-2xl bg-white p-6 md:p-8">
          <h1 className="text-2xl font-bold text-[#0F172A]">Заявка отклонена</h1>
          <p className="mt-3 text-sm text-[#475569]">
            {data?.auth_state?.message || 'Модерация отклонила заявку. Обновите данные и отправьте заново.'}
          </p>
          <Link
            href="/complete-profile"
            className="mt-6 inline-flex h-11 w-full items-center justify-center rounded-xl bg-[#0036A5] text-sm font-semibold text-white"
          >
            Отправить заново
          </Link>
        </div>
      </div>
    </MainShell>
  );
}
