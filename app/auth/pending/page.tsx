'use client';

import MainShell from '@/app/_components/manora/MainShell';
import { useAuthGate, resolveAuthRouteByCode } from '@/services/login/hooks';
import { authApi } from '@/services/login/api';
import { useState } from 'react';

export default function AuthPendingPage() {
  const { data, refetch, isFetching } = useAuthGate(true);
  const [error, setError] = useState('');

  const handleCheckStatus = async () => {
    setError('');
    try {
      const response = await authApi.getAuthState();
      const target = resolveAuthRouteByCode(response.auth_state.code);
      if (target !== '/auth/pending') {
        window.location.href = target;
        return;
      }
      await refetch();
    } catch {
      setError('Не удалось проверить статус. Попробуйте снова.');
    }
  };

  return (
    <MainShell>
      <div className="mx-auto w-full max-w-[620px] px-4 py-10">
        <div className="rounded-2xl bg-white p-6 md:p-8">
          <h1 className="text-2xl font-bold text-[#0F172A]">Заявка на модерации</h1>
          <p className="mt-3 text-sm text-[#475569]">
            {data?.auth_state?.message || 'Ваш профиль проверяется модератором.'}
          </p>
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
          <button
            type="button"
            onClick={handleCheckStatus}
            disabled={isFetching}
            className="mt-6 h-11 w-full rounded-xl bg-[#0036A5] text-sm font-semibold text-white disabled:opacity-50"
          >
            {isFetching ? 'Проверяем...' : 'Проверить статус'}
          </button>
        </div>
      </div>
    </MainShell>
  );
}
