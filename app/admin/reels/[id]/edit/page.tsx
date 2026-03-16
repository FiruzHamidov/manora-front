'use client';

import { useParams } from 'next/navigation';
import { ReelForm } from '@/app/admin/reels/_components/ReelForm';
import { useReel } from '@/services/reels/hooks';

export default function EditReelPage() {
  const params = useParams<{ id: string }>();
  const reelId = Number(params.id);
  const { data: reel, isLoading, error } = useReel(reelId);

  if (isLoading) {
    return (
      <div className="animate-pulse rounded-[26px] bg-white p-6 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
        <div className="h-7 w-56 rounded bg-slate-200" />
        <div className="mt-4 h-4 w-72 rounded bg-slate-200" />
        <div className="mt-6 h-64 rounded bg-slate-200" />
      </div>
    );
  }

  if (error || !reel) {
    return (
      <div className="rounded-[26px] bg-white p-10 text-center shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
        <div className="text-lg font-semibold text-[#B42318]">Не удалось загрузить рилс</div>
        <p className="mt-2 text-sm text-[#667085]">
          Проверьте идентификатор рилса и попробуйте открыть экран снова.
        </p>
      </div>
    );
  }

  return <ReelForm mode="edit" reel={reel} />;
}
