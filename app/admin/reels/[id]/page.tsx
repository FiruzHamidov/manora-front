'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'react-toastify';
import { Button } from '@/ui-components/Button';
import { DeleteReelDialog } from '@/app/admin/reels/_components/DeleteReelDialog';
import { useDeleteReel, useReel } from '@/services/reels/hooks';
import type { Reel, ReelSourceType } from '@/services/reels/types';
import showAxiosErrorToast from '@/utils/showAxiosErrorToast';

function detectSourceType(reel: Reel): ReelSourceType {
  const raw = reel.reelable_type?.toLowerCase() ?? '';
  if (raw.includes('property')) return 'property';
  if (raw.includes('car')) return 'car';
  if (raw.includes('developer')) return 'developer';
  return reel.content_type === 'generic' ? 'generic' : reel.content_type;
}

function formatDate(value?: string) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function formatSourceValue(value: unknown) {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'boolean') return value ? 'Да' : 'Нет';
  return String(value);
}

function getReelTitle(reel: Reel) {
  return reel.title || String(reel.source_data?.title || '') || `Рилс #${reel.id}`;
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[20px] bg-[#F8FAFC] px-4 py-3">
      <div className="text-xs font-semibold uppercase tracking-[0.08em] text-[#98A2B3]">{label}</div>
      <div className="mt-2 whitespace-pre-line text-sm leading-6 text-[#101828]">{value || '—'}</div>
    </div>
  );
}

export default function ReelDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const reelId = Number(params.id);
  const { data: reel, isLoading, error } = useReel(reelId);
  const deleteReel = useDeleteReel();
  const [deleteOpen, setDeleteOpen] = useState(false);

  const handleDelete = async () => {
    if (!reel) return;

    try {
      await deleteReel.mutateAsync(reel.id);
      toast.success('Рилс удалён');
      router.push('/admin/reels');
      router.refresh();
    } catch (error) {
      showAxiosErrorToast(error, 'Не удалось удалить рилс');
    }
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-5">
        <div className="rounded-[26px] bg-white p-6 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
          <div className="h-7 w-64 rounded bg-slate-200" />
          <div className="mt-4 h-4 w-80 rounded bg-slate-200" />
        </div>
        <div className="rounded-[26px] bg-white p-6 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
          <div className="h-72 rounded bg-slate-200" />
        </div>
      </div>
    );
  }

  if (error || !reel) {
    return (
      <div className="rounded-[26px] bg-white p-10 text-center shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
        <div className="text-lg font-semibold text-[#B42318]">Рилс не найден</div>
        <p className="mt-2 text-sm text-[#667085]">
          Проверьте ссылку или вернитесь к списку сценариев.
        </p>
      </div>
    );
  }

  const sourceType = detectSourceType(reel);

  return (
    <div className="space-y-5">
      <div className="rounded-[26px] bg-white p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04)] md:p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-[#EEF4FF] px-3 py-1 text-xs font-semibold text-[#0B43B8]">
              {reel.content_type} · source {sourceType}
            </div>
            <h1 className="mt-3 text-[30px] font-extrabold leading-tight text-[#101828]">
              {getReelTitle(reel)}
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[#667085]">
              {reel.description || reel.hook || 'Описание для этого рилса пока не задано.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link href="/admin/reels" className="inline-flex">
              <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                К списку
              </Button>
            </Link>
            <Link href={`/admin/reels/${reel.id}/edit`} className="inline-flex">
              <Button variant="outline">
                <Pencil className="mr-2 h-4 w-4" />
                Редактировать
              </Button>
            </Link>
            <Button
              variant="secondary"
              className="border border-[#F3D0CD] text-[#D92D20] hover:bg-[#FEF3F2]"
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Удалить
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(340px,0.85fr)]">
        <div className="space-y-5">
          <section className="rounded-[26px] bg-white p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04)] md:p-6">
            <h2 className="text-xl font-bold text-[#101828]">Структура рилса</h2>
            <p className="mt-1 text-sm text-[#667085]">
              Сценарий показан как структурированный документ: метаданные, hook, сцены и call to action.
            </p>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <DetailRow label="Title" value={reel.title || ''} />
              <DetailRow label="Hook" value={reel.hook || ''} />
              <DetailRow label="Description" value={reel.description || ''} />
              <DetailRow
                label="Параметры"
                value={`Длительность: ${reel.duration} сек\nPoster second: ${reel.poster_second ?? '—'}\nAspect ratio: ${reel.aspect_ratio ?? '9:16'}`}
              />
            </div>

            <div className="mt-5">
              <div className="text-xs font-semibold uppercase tracking-[0.08em] text-[#98A2B3]">
                Сцены
              </div>
              <div className="mt-3 space-y-3">
                {reel.scenes?.length ? (
                  reel.scenes.map((scene, index) => (
                    <article key={`${scene.start_second}-${scene.end_second}-${index}`} className="rounded-[22px] border border-[#EAECF0] p-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-[#EEF4FF] px-2.5 py-1 text-xs font-semibold text-[#0B43B8]">
                          Сцена {index + 1}
                        </span>
                        <span className="text-xs text-[#667085]">
                          {scene.start_second}s - {scene.end_second}s
                        </span>
                      </div>
                      <div className="mt-3 grid gap-3 md:grid-cols-3">
                        <DetailRow label="Визуал" value={scene.visual} />
                        <DetailRow label="Озвучка" value={scene.voiceover} />
                        <DetailRow label="Текст на экране" value={scene.onscreen_text} />
                      </div>
                    </article>
                  ))
                ) : (
                  <div className="rounded-[20px] border border-dashed border-[#D0D5DD] px-4 py-8 text-center text-sm text-[#667085]">
                    Сцены для этого рилса ещё не добавлены.
                  </div>
                )}
              </div>
            </div>

            <div className="mt-5">
              <DetailRow label="CTA" value={reel.cta || ''} />
            </div>
          </section>
        </div>

        <div className="space-y-5">
          <section className="rounded-[26px] bg-white p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04)] md:p-6">
            <h2 className="text-xl font-bold text-[#101828]">Метаданные</h2>
            <div className="mt-5 grid gap-3">
              <DetailRow label="ID" value={String(reel.id)} />
              <DetailRow label="Content type" value={reel.content_type} />
              <DetailRow label="Source type" value={sourceType} />
              <DetailRow label="Source ID" value={reel.reelable_id ? String(reel.reelable_id) : '—'} />
              <DetailRow label="Language" value={reel.language || 'ru'} />
              <DetailRow label="Tone" value={reel.tone || 'selling'} />
              <DetailRow label="Создан" value={formatDate(reel.created_at)} />
              <DetailRow label="Обновлён" value={formatDate(reel.updated_at)} />
            </div>
          </section>

          <section className="rounded-[26px] bg-white p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04)] md:p-6">
            <h2 className="text-xl font-bold text-[#101828]">Source data</h2>
            <div className="mt-4 space-y-3">
              {reel.source_data && Object.keys(reel.source_data).length > 0 ? (
                Object.entries(reel.source_data).map(([key, value]) => (
                  <DetailRow key={key} label={key} value={formatSourceValue(value)} />
                ))
              ) : (
                <div className="rounded-[20px] border border-dashed border-[#D0D5DD] px-4 py-8 text-center text-sm text-[#667085]">
                  Backend не вернул `source_data` для этого рилса.
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      <DeleteReelDialog
        open={deleteOpen}
        title={getReelTitle(reel)}
        submitting={deleteReel.isPending}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
