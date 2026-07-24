'use client';

import { useState } from 'react';
import { Archive, Eye, ImagePlus, RotateCcw, ShieldBan, X } from 'lucide-react';
import { toast } from 'react-toastify';
import { resolveMediaUrl } from '@/constants/base-url';
import { useModerateStory, useModerationStories } from '@/services/stories/hooks';
import type { Story, StoryStatus } from '@/services/stories/types';
import { Button } from '@/ui-components/Button';
import showAxiosErrorToast from '@/utils/showAxiosErrorToast';

const filters: Array<{ value?: StoryStatus; label: string }> = [
  { label: 'Все' },
  { value: 'active', label: 'Активные' },
  { value: 'hidden', label: 'Скрытые' },
  { value: 'archived', label: 'Архив' },
];

export default function AdminStoriesPage() {
  const [status, setStatus] = useState<StoryStatus | undefined>();
  const [hideTarget, setHideTarget] = useState<Story | null>(null);
  const [reason, setReason] = useState('');
  const storiesQuery = useModerationStories(status);
  const moderateStory = useModerateStory();
  const stories = storiesQuery.data ?? [];

  const runAction = async (
    story: Story,
    action: 'hide' | 'archive' | 'republish',
    moderationReason?: string
  ) => {
    try {
      await moderateStory.mutateAsync({
        id: story.id,
        action,
        reason: moderationReason,
      });
      setHideTarget(null);
      setReason('');
      toast.success(
        action === 'hide'
          ? 'История скрыта'
          : action === 'republish'
            ? 'История возвращена в ленту'
            : 'История архивирована'
      );
    } catch (error) {
      showAxiosErrorToast(error, 'Не удалось изменить статус истории');
    }
  };

  return (
    <div className="space-y-5">
      <section className="rounded-[28px] bg-white p-5 shadow-sm sm:p-7">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-[#EFFAF5] px-3 py-1.5 text-xs font-bold uppercase tracking-[0.12em] text-[#006341]">
              <ImagePlus className="h-4 w-4" />
              Модерация контента
            </div>
            <h1 className="mt-3 text-3xl font-black text-[#14231D]">Истории пользователей</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#64726C]">
              Истории публикуются сразу. Скрывайте только нарушения и обязательно объясняйте автору причину.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {filters.map((filter) => (
              <button
                key={filter.label}
                type="button"
                onClick={() => setStatus(filter.value)}
                className={`rounded-xl px-4 py-2.5 text-sm font-bold transition ${
                  status === filter.value
                    ? 'bg-[#006341] text-white'
                    : 'border border-[#D5E1DB] bg-white text-[#56665F] hover:bg-[#F1F8F5]'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {storiesQuery.isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-80 animate-pulse rounded-[26px] bg-white" />
          ))}
        </div>
      ) : null}

      {!storiesQuery.isLoading && stories.length === 0 ? (
        <div className="rounded-[28px] bg-white px-6 py-16 text-center text-[#64726C]">
          Историй с таким статусом нет.
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {stories.map((story) => {
          const firstItem = story.items?.[0];
          const preview = resolveMediaUrl(firstItem?.thumbnail_url || firstItem?.media_url);
          return (
            <article key={story.id} className="overflow-hidden rounded-[26px] border border-[#DCE7E2] bg-white shadow-sm">
              <div
                className="relative aspect-[16/10] bg-[#E9F1ED] bg-cover bg-center"
                style={{ backgroundImage: `url("${preview}")` }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
                <span className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-xs font-bold ${
                  story.status === 'hidden'
                    ? 'bg-rose-50 text-rose-700'
                    : story.status === 'active'
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-white text-slate-700'
                }`}>
                  {story.status === 'hidden' ? 'Скрыта' : story.status === 'active' ? 'Активна' : 'Архив'}
                </span>
                <span className="absolute bottom-3 right-3 inline-flex items-center gap-1 rounded-full bg-black/45 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur">
                  <Eye className="h-3.5 w-3.5" /> {story.views_count ?? 0}
                </span>
              </div>
              <div className="p-4">
                <div className="text-xs font-bold uppercase tracking-[0.1em] text-[#829188]">
                  {story.user?.name || `Пользователь #${story.user_id}`}
                </div>
                <h2 className="mt-2 line-clamp-2 text-lg font-extrabold text-[#172A21]">
                  {story.caption || `История #${story.id}`}
                </h2>
                {story.moderation_reason ? (
                  <p className="mt-3 rounded-2xl bg-rose-50 p-3 text-sm leading-5 text-rose-800">
                    {story.moderation_reason}
                  </p>
                ) : null}
                <div className="mt-4 flex flex-wrap gap-2">
                  {story.status === 'active' ? (
                    <>
                      <button
                        type="button"
                        onClick={() => setHideTarget(story)}
                        className="inline-flex items-center gap-2 rounded-xl bg-rose-50 px-3 py-2 text-sm font-bold text-rose-700"
                      >
                        <ShieldBan className="h-4 w-4" /> Скрыть
                      </button>
                      <button
                        type="button"
                        onClick={() => void runAction(story, 'archive')}
                        className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 text-sm font-bold text-slate-700"
                      >
                        <Archive className="h-4 w-4" /> В архив
                      </button>
                    </>
                  ) : null}
                  {story.status === 'hidden' ? (
                    <button
                      type="button"
                      onClick={() => void runAction(story, 'republish')}
                      className="inline-flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-700"
                    >
                      <RotateCcw className="h-4 w-4" /> Вернуть
                    </button>
                  ) : null}
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {hideTarget ? (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-[#07130E]/55 p-3 backdrop-blur-sm sm:items-center">
          <div className="w-full max-w-lg rounded-[28px] bg-white p-5 shadow-2xl sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-[#172A21]">Почему скрываем историю?</h2>
                <p className="mt-1 text-sm leading-5 text-[#64726C]">Автор увидит этот текст в своём кабинете.</p>
              </div>
              <button type="button" onClick={() => setHideTarget(null)} className="rounded-full p-2 text-slate-500 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <textarea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              maxLength={1000}
              rows={4}
              autoFocus
              placeholder="Укажите конкретное нарушение и как его исправить"
              className="mt-5 w-full resize-none rounded-2xl border border-[#CEDCD5] p-4 text-sm outline-none focus:border-[#00A56E] focus:ring-4 focus:ring-[#00A56E]/10"
            />
            <div className="mt-4 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setHideTarget(null)}>Отмена</Button>
              <Button
                onClick={() => void runAction(hideTarget, 'hide', reason.trim())}
                disabled={!reason.trim()}
                loading={moderateStory.isPending}
                className="bg-rose-700 hover:bg-rose-800"
              >
                Скрыть историю
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
