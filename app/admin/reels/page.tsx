'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, Film, Pencil, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/ui-components/Button';
import { Input } from '@/ui-components/Input';
import { Select } from '@/ui-components/Select';
import { DeleteReelDialog } from '@/app/admin/reels/_components/DeleteReelDialog';
import { useDeleteReel, useReels } from '@/services/reels/hooks';
import type { Reel, ReelContentType, ReelFilters, ReelSourceType } from '@/services/reels/types';
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
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function getReelTitle(reel: Reel) {
  return reel.title || String(reel.source_data?.title || '') || `Рилс #${reel.id}`;
}

function getReelSubtitle(reel: Reel) {
  return reel.description || String(reel.source_data?.description || '') || reel.hook || 'Без описания';
}

const contentTypeOptions = [
  { id: '', name: 'Все типы контента' },
  { id: 'property', name: 'Недвижимость' },
  { id: 'car', name: 'Авто' },
  { id: 'developer', name: 'Застройщик' },
  { id: 'generic', name: 'Generic' },
];

const sourceTypeOptions = [
  { id: '', name: 'Все типы источника' },
  { id: 'property', name: 'Недвижимость' },
  { id: 'car', name: 'Авто' },
  { id: 'developer', name: 'Застройщик' },
  { id: 'generic', name: 'Без привязки' },
];

const typeMeta: Record<ReelContentType, { label: string; className: string }> = {
  property: { label: 'Недвижимость', className: 'bg-[#EEF4FF] text-[#0B43B8]' },
  car: { label: 'Авто', className: 'bg-[#ECFDF3] text-[#027A48]' },
  developer: { label: 'Застройщик', className: 'bg-[#FFF7ED] text-[#C4320A]' },
  generic: { label: 'Generic', className: 'bg-[#F4F3FF] text-[#5925DC]' },
};

export default function ReelsPage() {
  const router = useRouter();
  const [filters, setFilters] = useState<ReelFilters>({
    content_type: '',
    source_type: '',
    source_id: '',
  });
  const [deleteTarget, setDeleteTarget] = useState<Reel | null>(null);

  const { data: reels, isLoading, error, refetch } = useReels(filters);
  const deleteReel = useDeleteReel();

  const orderedReels = useMemo(
    () => (reels ?? []).slice().sort((a, b) => (b.id ?? 0) - (a.id ?? 0)),
    [reels]
  );

  const handleDelete = async () => {
    if (!deleteTarget) return;

    try {
      await deleteReel.mutateAsync(deleteTarget.id);
      setDeleteTarget(null);
    } catch (error) {
      showAxiosErrorToast(error, 'Не удалось удалить рилс');
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-[26px] bg-white p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04)] md:p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-[#EEF4FF] px-3 py-1 text-xs font-semibold text-[#0B43B8]">
              <Film className="h-3.5 w-3.5" />
              Модуль рилсов
            </div>
            <h1 className="mt-3 text-[30px] font-extrabold leading-tight text-[#101828]">
              Сценарии рилсов
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[#667085]">
              Создавайте, редактируйте и просматривайте сценарные заготовки рилсов для недвижимости, автомобилей, застройщиков и generic-сценариев.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => void refetch()}
              className="rounded-xl border border-[#D0D5DD] px-4 py-2.5 text-sm font-medium text-[#344054]"
            >
              Обновить
            </button>
            <Link href="/admin/reels/create">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Создать рилс
              </Button>
            </Link>
          </div>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-3">
          <Select
            label="Фильтр по content_type"
            name="content_type"
            value={String(filters.content_type ?? '')}
            options={contentTypeOptions}
            onChange={(event) =>
              setFilters((current) => ({ ...current, content_type: event.target.value as ReelContentType | '' }))
            }
          />
          <Select
            label="Фильтр по source_type"
            name="source_type"
            value={String(filters.source_type ?? '')}
            options={sourceTypeOptions}
            onChange={(event) =>
              setFilters((current) => ({ ...current, source_type: event.target.value as ReelSourceType | '' }))
            }
          />
          <Input
            label="Фильтр по source_id"
            name="source_id"
            type="number"
            value={String(filters.source_id ?? '')}
            onChange={(event) =>
              setFilters((current) => ({ ...current, source_id: event.target.value }))
            }
            placeholder="Например: 15"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="animate-pulse rounded-[24px] bg-white p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
              <div className="h-5 w-28 rounded bg-slate-200" />
              <div className="mt-4 h-7 w-3/4 rounded bg-slate-200" />
              <div className="mt-3 h-4 w-full rounded bg-slate-200" />
              <div className="mt-2 h-4 w-5/6 rounded bg-slate-200" />
              <div className="mt-6 h-10 rounded bg-slate-200" />
            </div>
          ))}
        </div>
      ) : null}

      {!isLoading && error ? (
        <div className="rounded-[26px] bg-white p-10 text-center shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
          <div className="text-lg font-semibold text-[#B42318]">Не удалось загрузить рилсы</div>
          <p className="mt-2 text-sm text-[#667085]">
            Попробуйте обновить список или проверить доступность backend API.
          </p>
        </div>
      ) : null}

      {!isLoading && !error && orderedReels.length === 0 ? (
        <div className="rounded-[26px] bg-white p-10 text-center shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#EEF4FF] text-[#0B43B8]">
            <Film className="h-6 w-6" />
          </div>
          <h2 className="mt-4 text-xl font-semibold text-[#101828]">Рилсы не найдены</h2>
          <p className="mt-2 text-sm leading-6 text-[#667085]">
            Измените фильтры или создайте первый сценарий рилса вручную.
          </p>
          <Link href="/admin/reels/create" className="mt-5 inline-flex">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Создать первый рилс
            </Button>
          </Link>
        </div>
      ) : null}

      {!isLoading && !error && orderedReels.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {orderedReels.map((reel) => {
            const sourceType = detectSourceType(reel);
            const meta = typeMeta[reel.content_type];
            return (
              <article
                key={reel.id}
                className="rounded-[24px] bg-white p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04)] transition hover:shadow-[0_8px_24px_rgba(15,23,42,0.08)]"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${meta.className}`}>
                    {meta.label}
                  </span>
                  <span className="rounded-full bg-[#F8FAFC] px-2.5 py-1 text-xs font-semibold text-[#667085]">
                    source: {sourceType}
                  </span>
                  {reel.reelable_id ? (
                    <span className="rounded-full bg-[#F8FAFC] px-2.5 py-1 text-xs font-semibold text-[#667085]">
                      source_id: {reel.reelable_id}
                    </span>
                  ) : null}
                </div>

                <h2 className="mt-4 line-clamp-2 text-xl font-bold leading-tight text-[#101828]">
                  {getReelTitle(reel)}
                </h2>
                <p className="mt-2 line-clamp-3 text-sm leading-6 text-[#667085]">
                  {getReelSubtitle(reel)}
                </p>

                <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-2xl bg-[#F8FAFC] px-3 py-3">
                    <div className="text-xs uppercase tracking-[0.08em] text-[#98A2B3]">Длительность</div>
                    <div className="mt-1 font-semibold text-[#101828]">{reel.duration} сек</div>
                  </div>
                  <div className="rounded-2xl bg-[#F8FAFC] px-3 py-3">
                    <div className="text-xs uppercase tracking-[0.08em] text-[#98A2B3]">Сцен</div>
                    <div className="mt-1 font-semibold text-[#101828]">{reel.scenes?.length ?? 0}</div>
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-between gap-3 text-xs text-[#667085]">
                  <span>Обновлён {formatDate(reel.updated_at)}</span>
                  <span>#{reel.id}</span>
                </div>

                <div className="mt-5 grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => router.push(`/admin/reels/${reel.id}`)}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#D0D5DD] px-3 py-2.5 text-sm font-medium text-[#344054]"
                  >
                    <Eye className="h-4 w-4" />
                    Смотреть
                  </button>
                  <button
                    type="button"
                    onClick={() => router.push(`/admin/reels/${reel.id}/edit`)}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#D0D5DD] px-3 py-2.5 text-sm font-medium text-[#344054]"
                  >
                    <Pencil className="h-4 w-4" />
                    Ред.
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(reel)}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#F3D0CD] px-3 py-2.5 text-sm font-medium text-[#D92D20]"
                  >
                    <Trash2 className="h-4 w-4" />
                    Удалить
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      ) : null}

      <DeleteReelDialog
        open={Boolean(deleteTarget)}
        title={deleteTarget ? getReelTitle(deleteTarget) : null}
        submitting={deleteReel.isPending}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
