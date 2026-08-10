'use client';

import Axios from 'axios';
import Link from 'next/link';
import { ArrowLeft, RefreshCw, TriangleAlert } from 'lucide-react';

type ManagedNewBuildingErrorProps = {
  error?: unknown;
  isRetrying?: boolean;
  onRetry: () => void;
};

export default function ManagedNewBuildingError({
  error,
  isRetrying = false,
  onRetry,
}: ManagedNewBuildingErrorProps) {
  const status = Axios.isAxiosError(error) ? error.response?.status : undefined;
  const isNotFound = status === 404;

  return (
    <div
      role="alert"
      className="rounded-2xl border border-red-200 bg-red-50 px-5 py-6 text-red-950"
    >
      <div className="flex items-start gap-3">
        <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
        <div>
          <h2 className="text-lg font-semibold">
            {isNotFound ? 'Новостройка не найдена' : 'Не удалось загрузить новостройку'}
          </h2>
          <p className="mt-1 text-sm leading-6 text-red-800">
            {isNotFound
              ? 'Запись могла быть удалена или недоступна для управления.'
              : 'Проверьте соединение и права доступа, затем попробуйте ещё раз.'}
          </p>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={onRetry}
          disabled={isRetrying}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-red-700 px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw className={`h-4 w-4 ${isRetrying ? 'animate-spin' : ''}`} />
          {isRetrying ? 'Повторяем…' : 'Повторить'}
        </button>
        <Link
          href="/admin/new-buildings"
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-red-300 bg-white px-4 text-sm font-semibold text-red-800"
        >
          <ArrowLeft className="h-4 w-4" />
          К списку новостроек
        </Link>
      </div>
    </div>
  );
}
