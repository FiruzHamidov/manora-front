'use client';

import { FormEvent, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Archive, Clapperboard, Eye, Film, ImagePlus, Play, ShieldAlert, Upload } from 'lucide-react';
import { toast } from 'react-toastify';
import { Button } from '@/ui-components/Button';
import { getReelPreviewUrl, getReelTitle } from '@/services/reels/helpers';
import { useMyReels, usePublishReel, useUploadReel } from '@/services/reels/hooks';
import type { Reel } from '@/services/reels/types';
import { useChangeStoryStatus, useMyStories, useUploadStory } from '@/services/stories/hooks';
import type { Story } from '@/services/stories/types';
import { resolveMediaUrl } from '@/constants/base-url';
import showAxiosErrorToast from '@/utils/showAxiosErrorToast';

type ContentTab = 'reels' | 'stories';

const statusMeta: Record<string, { label: string; className: string }> = {
  published: { label: 'Опубликован', className: 'bg-emerald-50 text-emerald-700' },
  active: { label: 'Активна', className: 'bg-emerald-50 text-emerald-700' },
  processing: { label: 'Обрабатывается', className: 'bg-amber-50 text-amber-700' },
  uploading: { label: 'Загружается', className: 'bg-sky-50 text-sky-700' },
  draft: { label: 'Черновик', className: 'bg-slate-100 text-slate-700' },
  archived: { label: 'В архиве', className: 'bg-slate-100 text-slate-600' },
  hidden: { label: 'Скрыта модератором', className: 'bg-rose-50 text-rose-700' },
  blocked: { label: 'Заблокирован', className: 'bg-rose-50 text-rose-700' },
  deleted: { label: 'Удалена', className: 'bg-rose-50 text-rose-700' },
};

function StatusBadge({ status }: { status?: string | null }) {
  const meta = statusMeta[status ?? ''] ?? {
    label: status || 'Без статуса',
    className: 'bg-slate-100 text-slate-600',
  };
  return <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${meta.className}`}>{meta.label}</span>;
}

function EmptyState({ tab }: { tab: ContentTab }) {
  return (
    <div className="rounded-[28px] border border-dashed border-[#CFE0D8] bg-white px-6 py-14 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EAF8F2] text-[#006341]">
        {tab === 'reels' ? <Film className="h-7 w-7" /> : <ImagePlus className="h-7 w-7" />}
      </div>
      <h2 className="mt-4 text-xl font-bold text-[#14231D]">
        {tab === 'reels' ? 'Снимите первый рилс' : 'Поделитесь первой историей'}
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#64726C]">
        Контент публикуется без предварительного ожидания модерации. Соблюдайте правила сообщества.
      </p>
    </div>
  );
}

export default function ProfileContentPage() {
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<ContentTab>(() =>
    searchParams.get('tab') === 'stories' ? 'stories' : 'reels'
  );
  const [reelTitle, setReelTitle] = useState('');
  const [storyCaption, setStoryCaption] = useState('');
  const [reelFile, setReelFile] = useState<File | null>(null);
  const [storyFiles, setStoryFiles] = useState<File[]>([]);
  const reelInputRef = useRef<HTMLInputElement>(null);
  const storyInputRef = useRef<HTMLInputElement>(null);

  const reelsQuery = useMyReels({ per_page: 50 });
  const storiesQuery = useMyStories();
  const uploadReel = useUploadReel();
  const publishReel = usePublishReel();
  const uploadStory = useUploadStory();
  const changeStoryStatus = useChangeStoryStatus();

  const reels = useMemo(() => reelsQuery.data ?? [], [reelsQuery.data]);
  const stories = useMemo(() => storiesQuery.data ?? [], [storiesQuery.data]);
  const isLoading = tab === 'reels' ? reelsQuery.isLoading : storiesQuery.isLoading;

  const submitReel = async (event: FormEvent) => {
    event.preventDefault();
    if (!reelFile) {
      toast.info('Выберите видео для рилса');
      return;
    }

    const payload = new FormData();
    payload.append('video', reelFile);
    if (reelTitle.trim()) payload.append('title', reelTitle.trim());

    try {
      await uploadReel.mutateAsync(payload);
      setReelFile(null);
      setReelTitle('');
      if (reelInputRef.current) reelInputRef.current.value = '';
      toast.success('Рилс загружен. Он появится в ленте после обработки видео.');
    } catch (error) {
      showAxiosErrorToast(error, 'Не удалось загрузить рилс');
    }
  };

  const submitStory = async (event: FormEvent) => {
    event.preventDefault();
    if (storyFiles.length === 0) {
      toast.info('Добавьте фото или видео');
      return;
    }

    const payload = new FormData();
    payload.append('type', 'media');
    payload.append('status', 'active');
    if (storyCaption.trim()) payload.append('caption', storyCaption.trim());
    storyFiles.forEach((file) => payload.append('media[]', file));

    try {
      await uploadStory.mutateAsync(payload);
      setStoryFiles([]);
      setStoryCaption('');
      if (storyInputRef.current) storyInputRef.current.value = '';
      toast.success('История опубликована на 24 часа');
    } catch (error) {
      showAxiosErrorToast(error, 'Не удалось опубликовать историю');
    }
  };

  const archiveReel = async (reel: Reel) => {
    try {
      await publishReel.mutateAsync({ id: reel.id, status: 'archived' });
      toast.success('Рилс перенесён в архив');
    } catch (error) {
      showAxiosErrorToast(error, 'Не удалось архивировать рилс');
    }
  };

  const archiveStory = async (story: Story) => {
    try {
      await changeStoryStatus.mutateAsync({ id: story.id, action: 'archive' });
      toast.success('История перенесена в архив');
    } catch (error) {
      showAxiosErrorToast(error, 'Не удалось архивировать историю');
    }
  };

  return (
    <div className="mx-auto max-w-6xl pb-8">
      <section className="overflow-hidden rounded-[30px] bg-[linear-gradient(135deg,#004E35_0%,#007A50_58%,#00A56E_100%)] px-5 py-7 text-white shadow-[0_20px_60px_rgba(0,99,65,0.18)] sm:px-8 sm:py-9">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/14 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.12em]">
              <Clapperboard className="h-4 w-4" />
              Мой контент
            </div>
            <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">Расскажите о себе и объектах</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/80 sm:text-base">
              Рилсы и истории выходят сразу. Если контент нарушает правила, модератор может скрыть его с объяснением причины.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-white/12 px-4 py-3 backdrop-blur">
              <div className="text-2xl font-black">{reels.length}</div>
              <div className="text-xs text-white/70">рилсов</div>
            </div>
            <div className="rounded-2xl bg-white/12 px-4 py-3 backdrop-blur">
              <div className="text-2xl font-black">{stories.length}</div>
              <div className="text-xs text-white/70">историй</div>
            </div>
          </div>
        </div>
      </section>

      <div className="mt-5 flex rounded-2xl border border-[#DCE7E2] bg-white p-1.5 shadow-sm">
        {([
          ['reels', 'Рилсы', Film],
          ['stories', 'Истории', ImagePlus],
        ] as const).map(([value, label, Icon]) => (
          <button
            key={value}
            type="button"
            onClick={() => setTab(value)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition ${
              tab === value ? 'bg-[#006341] text-white shadow-sm' : 'text-[#5D6C65] hover:bg-[#F2F8F5]'
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      <section className="mt-5 rounded-[28px] border border-[#DCE7E2] bg-white p-5 shadow-[0_14px_45px_rgba(15,53,39,0.06)] sm:p-6">
        {tab === 'reels' ? (
          <form onSubmit={submitReel} className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-bold text-[#263B32]">Название</span>
                <input
                  value={reelTitle}
                  onChange={(event) => setReelTitle(event.target.value)}
                  maxLength={255}
                  placeholder="Например: обзор квартиры"
                  className="mt-2 h-12 w-full rounded-2xl border border-[#CEDCD5] px-4 text-sm outline-none transition focus:border-[#00A56E] focus:ring-4 focus:ring-[#00A56E]/10"
                />
              </label>
              <label className="block">
                <span className="text-sm font-bold text-[#263B32]">Видео до 100 МБ</span>
                <input
                  ref={reelInputRef}
                  type="file"
                  accept="video/mp4,video/quicktime"
                  onChange={(event) => setReelFile(event.target.files?.[0] ?? null)}
                  className="mt-2 block h-12 w-full cursor-pointer rounded-2xl border border-[#CEDCD5] text-sm file:mr-3 file:h-full file:border-0 file:bg-[#EFF8F4] file:px-4 file:font-bold file:text-[#006341]"
                />
              </label>
            </div>
            <Button type="submit" loading={uploadReel.isPending} className="h-12 rounded-2xl px-6">
              <Upload className="mr-2 h-4 w-4" />
              Загрузить рилс
            </Button>
          </form>
        ) : (
          <form onSubmit={submitStory} className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-bold text-[#263B32]">Подпись</span>
                <input
                  value={storyCaption}
                  onChange={(event) => setStoryCaption(event.target.value)}
                  maxLength={500}
                  placeholder="Что происходит?"
                  className="mt-2 h-12 w-full rounded-2xl border border-[#CEDCD5] px-4 text-sm outline-none transition focus:border-[#00A56E] focus:ring-4 focus:ring-[#00A56E]/10"
                />
              </label>
              <label className="block">
                <span className="text-sm font-bold text-[#263B32]">До 10 фото или видео</span>
                <input
                  ref={storyInputRef}
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime"
                  onChange={(event) => setStoryFiles(Array.from(event.target.files ?? []).slice(0, 10))}
                  className="mt-2 block h-12 w-full cursor-pointer rounded-2xl border border-[#CEDCD5] text-sm file:mr-3 file:h-full file:border-0 file:bg-[#EFF8F4] file:px-4 file:font-bold file:text-[#006341]"
                />
              </label>
            </div>
            <Button type="submit" loading={uploadStory.isPending} className="h-12 rounded-2xl px-6">
              <Play className="mr-2 h-4 w-4" />
              Опубликовать
            </Button>
          </form>
        )}
      </section>

      <div className="mt-6">
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="h-72 animate-pulse rounded-[26px] bg-white" />
            ))}
          </div>
        ) : null}

        {!isLoading && tab === 'reels' && reels.length === 0 ? <EmptyState tab="reels" /> : null}
        {!isLoading && tab === 'stories' && stories.length === 0 ? <EmptyState tab="stories" /> : null}

        {!isLoading && tab === 'reels' && reels.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {reels.map((reel) => (
              <article key={reel.id} className="overflow-hidden rounded-[26px] border border-[#DCE7E2] bg-white shadow-sm">
                <div
                  className="relative aspect-[16/10] bg-[#E8F1ED] bg-cover bg-center"
                  style={{ backgroundImage: `url("${getReelPreviewUrl(reel)}")` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
                  <div className="absolute left-3 top-3"><StatusBadge status={reel.status} /></div>
                  <div className="absolute bottom-3 right-3 flex items-center gap-1 rounded-full bg-black/45 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur">
                    <Eye className="h-3.5 w-3.5" /> {reel.views_count ?? 0}
                  </div>
                </div>
                <div className="p-4">
                  <h2 className="line-clamp-1 font-extrabold text-[#172A21]">{getReelTitle(reel)}</h2>
                  {reel.status === 'blocked' ? (
                    <div className="mt-3 rounded-2xl bg-rose-50 p-3 text-sm text-rose-800">
                      <div className="flex items-center gap-2 font-bold"><ShieldAlert className="h-4 w-4" /> Причина блокировки</div>
                      <p className="mt-1 leading-5">{reel.moderation_reason || 'Обратитесь в поддержку за подробностями.'}</p>
                    </div>
                  ) : null}
                  {!['archived', 'blocked'].includes(String(reel.status)) ? (
                    <button
                      type="button"
                      onClick={() => void archiveReel(reel)}
                      disabled={publishReel.isPending}
                      className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-[#52665D] hover:text-[#006341]"
                    >
                      <Archive className="h-4 w-4" /> В архив
                    </button>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        ) : null}

        {!isLoading && tab === 'stories' && stories.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {stories.map((story) => {
              const firstItem = story.items?.[0];
              const preview = firstItem?.media_url ? resolveMediaUrl(firstItem.media_url) : '/images/no-image.png';
              return (
                <article key={story.id} className="overflow-hidden rounded-[26px] border border-[#DCE7E2] bg-white shadow-sm">
                  <div
                    className="relative aspect-[16/10] bg-[#E8F1ED] bg-cover bg-center"
                    style={{ backgroundImage: `url("${preview}")` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
                    <div className="absolute left-3 top-3"><StatusBadge status={story.status} /></div>
                    <div className="absolute bottom-3 right-3 flex items-center gap-1 rounded-full bg-black/45 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur">
                      <Eye className="h-3.5 w-3.5" /> {story.views_count ?? 0}
                    </div>
                  </div>
                  <div className="p-4">
                    <h2 className="line-clamp-2 font-extrabold text-[#172A21]">{story.caption || `История #${story.id}`}</h2>
                    {story.status === 'hidden' ? (
                      <div className="mt-3 rounded-2xl bg-rose-50 p-3 text-sm text-rose-800">
                        <div className="flex items-center gap-2 font-bold"><ShieldAlert className="h-4 w-4" /> Скрыто модератором</div>
                        <p className="mt-1 leading-5">{story.moderation_reason || 'Обратитесь в поддержку за подробностями.'}</p>
                      </div>
                    ) : null}
                    {story.status === 'active' ? (
                      <button
                        type="button"
                        onClick={() => void archiveStory(story)}
                        disabled={changeStoryStatus.isPending}
                        className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-[#52665D] hover:text-[#006341]"
                      >
                        <Archive className="h-4 w-4" /> Завершить историю
                      </button>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        ) : null}
      </div>
    </div>
  );
}
