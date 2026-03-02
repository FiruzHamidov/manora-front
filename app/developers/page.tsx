'use client';

import { useState } from 'react';
import { useDevelopers } from '@/services/new-buildings/hooks';
import DeveloperCard from '@/ui-components/developers/developer-card';
import MainShell from '@/app/_components/manora/MainShell';

export default function DevelopersPage() {
  const [page, setPage] = useState(1);
  const { data: developersData, isLoading } = useDevelopers({
    page,
    per_page: 12,
  });

  if (isLoading) {
    return (
      <MainShell>
        <div className="mx-auto w-full max-w-[1520px] px-4 sm:px-6 lg:px-8 pt-8 pb-12">
          <h1 className="text-3xl font-bold mb-8">Застройщики</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-[22px] p-6 animate-pulse">
                <div className="w-20 h-20 bg-gray-200 rounded-full mb-4" />
                <div className="h-6 bg-gray-200 rounded mb-2" />
                <div className="h-4 bg-gray-200 rounded w-2/3" />
              </div>
            ))}
          </div>
        </div>
      </MainShell>
    );
  }

  const developers = Array.isArray(developersData)
    ? developersData
    : developersData?.data || [];
  const totalPages = Array.isArray(developersData)
    ? 1
    : developersData?.last_page || 1;

  return (
    <MainShell>
      <div className="mx-auto w-full max-w-[1520px] px-4 sm:px-6 lg:px-8 pt-8 pb-12">
        <h1 className="text-3xl font-bold mb-8">Застройщики</h1>

        {developers.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-[#666F8D] text-lg">Застройщики не найдены</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {developers.map((developer) => (
                <DeveloperCard key={developer.id} developer={developer} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-8 gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 rounded-lg bg-white border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Назад
                </button>
                <span className="px-4 py-2">
                  Страница {page} из {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 rounded-lg bg-white border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Вперед
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </MainShell>
  );
}
