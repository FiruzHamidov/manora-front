'use client';

import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, Plus, X } from 'lucide-react';
import { resolveMediaUrl } from '@/constants/base-url';
import { useProfile } from '@/services/login/hooks';
import { storiesApi } from '@/services/stories/api';
import { usePublicStories } from '@/services/stories/hooks';
import type { Story, StoryItem } from '@/services/stories/types';

type StoryGroup = {
  authorId: number;
  name: string;
  photo: string;
  isSeen: boolean;
  stories: Story[];
};

type StoryFrame = {
  story: Story;
  item: StoryItem;
};

const VIEWER_FINGERPRINT_KEY = 'manora_story_viewer_fingerprint';

const getViewerFingerprint = (): string => {
  if (typeof window === 'undefined') return '';

  const existing = window.localStorage.getItem(VIEWER_FINGERPRINT_KEY);
  if (existing) return existing;

  const next =
    typeof window.crypto?.randomUUID === 'function'
      ? window.crypto.randomUUID()
      : `guest-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  window.localStorage.setItem(VIEWER_FINGERPRINT_KEY, next);
  return next;
};

const getAuthorPhoto = (story: Story): string =>
  resolveMediaUrl(story.author?.photo, '/manora.svg', 'local');

const getFrames = (group?: StoryGroup): StoryFrame[] =>
  (group?.stories ?? []).flatMap((story) =>
    (story.items ?? []).map((item) => ({ story, item }))
  );

function StoryViewer({
  groups,
  initialGroupIndex,
  onClose,
}: {
  groups: StoryGroup[];
  initialGroupIndex: number;
  onClose: () => void;
}) {
  const [groupIndex, setGroupIndex] = useState(initialGroupIndex);
  const [frameIndex, setFrameIndex] = useState(0);
  const group = groups[groupIndex];
  const frames = useMemo(() => getFrames(group), [group]);
  const frame = frames[frameIndex];
  const duration = Math.max(
    3,
    Math.min(frame?.item.duration_seconds ?? frame?.item.duration_sec ?? 5, 15)
  );

  const goNext = () => {
    if (frameIndex < frames.length - 1) {
      setFrameIndex((value) => value + 1);
      return;
    }
    if (groupIndex < groups.length - 1) {
      setGroupIndex((value) => value + 1);
      setFrameIndex(0);
      return;
    }
    onClose();
  };

  const goPrevious = () => {
    if (frameIndex > 0) {
      setFrameIndex((value) => value - 1);
      return;
    }
    if (groupIndex > 0) {
      const previousGroupIndex = groupIndex - 1;
      const previousFrames = getFrames(groups[previousGroupIndex]);
      setGroupIndex(previousGroupIndex);
      setFrameIndex(Math.max(0, previousFrames.length - 1));
    }
  };

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'ArrowRight') goNext();
      if (event.key === 'ArrowLeft') goPrevious();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  useEffect(() => {
    if (!frame) return;
    storiesApi
      .markViewed(frame.story.id, {
        story_item_id: frame.item.id,
        viewer_fingerprint: getViewerFingerprint(),
      })
      .catch(() => undefined);
  }, [frame]);

  useEffect(() => {
    if (!frame || frame.item.media_type === 'video') return;
    const timeout = window.setTimeout(goNext, duration * 1000);
    return () => window.clearTimeout(timeout);
  });

  if (!group || !frame) return null;

  const background = frame.item.background_color || '#062F24';
  const mediaUrl = resolveMediaUrl(frame.item.media_url, '/manora.svg', 'local');

  return (
    <div
      className="fixed inset-0 z-[160] flex items-center justify-center bg-[#06110D]/95 px-0 py-0 sm:px-6 sm:py-5"
      role="dialog"
      aria-modal="true"
      aria-label={`История: ${group.name}`}
    >
      <div className="relative h-[100dvh] w-full overflow-hidden bg-[#062F24] sm:h-[min(900px,calc(100vh-40px))] sm:max-w-[520px] sm:rounded-[28px]">
        {frame.item.media_type === 'video' ? (
          <video
            key={mediaUrl}
            src={mediaUrl}
            autoPlay
            playsInline
            className="h-full w-full object-cover"
            onEnded={goNext}
          />
        ) : frame.item.media_type === 'text' ? (
          <div
            className="flex h-full w-full items-center justify-center px-10 text-center text-3xl font-black leading-tight text-white"
            style={{ backgroundColor: background }}
          >
            {frame.item.text || frame.story.caption}
          </div>
        ) : (
          <Image
            src={mediaUrl}
            alt={frame.story.caption || `История ${group.name}`}
            fill
            priority
            sizes="(max-width: 640px) 100vw, 520px"
            className="object-cover"
          />
        )}

        <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-black/75 to-transparent" />

        <div className="absolute inset-x-0 top-0 z-20 px-3 pt-[calc(10px+env(safe-area-inset-top))] sm:pt-4">
          <div className="flex gap-1">
            {frames.map((item, index) => (
              <span key={`${item.story.id}-${item.item.id}`} className="h-0.5 flex-1 overflow-hidden rounded-full bg-white/35">
                <span
                  className={`block h-full rounded-full bg-white ${
                    index < frameIndex ? 'w-full' : index === frameIndex ? 'animate-[story-progress_linear_forwards]' : 'w-0'
                  }`}
                  style={
                    index === frameIndex
                      ? {
                          width: '100%',
                          animationDuration: `${duration}s`,
                          transformOrigin: 'left',
                        }
                      : undefined
                  }
                />
              </span>
            ))}
          </div>

          <div className="mt-3 flex items-center justify-between">
            <div className="flex min-w-0 items-center gap-2.5">
              <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full border-2 border-white/90 bg-white">
                <Image src={group.photo} alt="" fill sizes="36px" className="object-cover" />
              </div>
              <div className="min-w-0">
                <div className="truncate text-sm font-bold text-white">{group.name}</div>
                <div className="text-[11px] text-white/70">Сейчас</div>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-black/25 text-white backdrop-blur"
              aria-label="Закрыть историю"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {frame.story.caption ? (
          <div className="absolute inset-x-5 bottom-[calc(28px+env(safe-area-inset-bottom))] z-20 rounded-2xl bg-black/35 px-4 py-3 text-sm font-medium leading-5 text-white backdrop-blur-md">
            {frame.story.caption}
          </div>
        ) : null}

        <button
          type="button"
          onClick={goPrevious}
          disabled={groupIndex === 0 && frameIndex === 0}
          className="absolute inset-y-24 left-0 z-10 w-1/3 disabled:pointer-events-none"
          aria-label="Предыдущая история"
        >
          <ChevronLeft className="ml-2 hidden h-8 w-8 text-white/80 sm:block" />
        </button>
        <button
          type="button"
          onClick={goNext}
          className="absolute inset-y-24 right-0 z-10 flex w-1/3 items-center justify-end"
          aria-label="Следующая история"
        >
          <ChevronRight className="mr-2 hidden h-8 w-8 text-white/80 sm:block" />
        </button>
      </div>
    </div>
  );
}

type ManoraStoriesProps = {
  compact?: boolean;
};

export default function ManoraStories({ compact = false }: ManoraStoriesProps) {
  const router = useRouter();
  const { data: user } = useProfile();
  const { data: stories = [], isLoading } = usePublicStories(30);
  const [selectedGroupIndex, setSelectedGroupIndex] = useState<number | null>(null);
  const profilePhoto = user?.photo
    ? resolveMediaUrl(user.photo, '/images/no-image.png', 'local')
    : null;
  const profileInitial = (user?.name || user?.email || 'Я')
    .trim()
    .charAt(0)
    .toUpperCase();

  const groups = useMemo<StoryGroup[]>(() => {
    const grouped = new Map<number, StoryGroup>();

    stories.forEach((story) => {
      const authorId = story.author?.id ?? story.user?.id ?? story.user_id;
      const current = grouped.get(authorId);
      if (current) {
        current.stories.push(story);
        current.isSeen = current.isSeen && Boolean(story.is_seen);
        return;
      }

      grouped.set(authorId, {
        authorId,
        name: story.author?.name || story.user?.name || 'Manora',
        photo: getAuthorPhoto(story),
        isSeen: Boolean(story.is_seen),
        stories: [story],
      });
    });

    return Array.from(grouped.values());
  }, [stories]);

  const handleAddStory = () => {
    if (!user?.id) {
      window.dispatchEvent(new Event('open-login-modal'));
      return;
    }
    router.push('/profile/content?tab=stories');
  };

  return (
    <>
      <section
        data-testid="manora-stories"
        data-compact={compact ? 'true' : 'false'}
        className={`min-w-0 [backface-visibility:hidden] transition-[max-height,padding] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          compact ? 'max-h-0 overflow-visible py-0' : 'max-h-[92px] overflow-hidden py-2.5'
        } md:max-h-[52px] md:flex-1 md:overflow-hidden md:py-1`}
        aria-label="Истории Manora"
      >
        <div
          className={`flex transform-gpu items-start [backface-visibility:hidden] [scrollbar-width:none] will-change-transform [&::-webkit-scrollbar]:hidden transition-[width,margin,transform,gap] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
            compact
              ? 'ml-auto mr-[92px] w-[104px] -translate-y-[50px] justify-end gap-0 overflow-x-hidden [&>*+*]:-ml-2.5'
              : 'w-full translate-y-0 gap-3 overflow-x-auto'
          } md:ml-0 md:mr-0 md:w-full md:translate-y-0 md:justify-start md:gap-0 md:overflow-x-auto md:[&>*+*]:-ml-2.5`}
        >
          <button
            type="button"
            onClick={handleAddStory}
            className={`group relative z-20 shrink-0 text-center transition-[width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
              compact ? 'w-9' : 'w-[64px]'
            } md:w-9`}
            aria-label="Добавить историю"
            title="Ваша история"
          >
            <span
              className={`relative mx-auto block rounded-full border-2 border-[#B9DCCF] bg-white p-0.5 shadow-[0_2px_8px_rgba(0,99,65,0.08)] transition-[width,height,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-active:scale-95 ${
                compact ? 'h-9 w-9' : 'h-[60px] w-[60px]'
              } md:h-9 md:w-9`}
            >
              <span className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-[#EAF7F2]">
                {profilePhoto ? (
                  <Image
                    src={profilePhoto}
                    alt=""
                    fill
                    sizes="60px"
                    className="object-cover"
                  />
                ) : (
                  <span
                    className={`font-extrabold leading-none text-[#006341] transition-[font-size] duration-300 ${
                      compact ? 'text-sm' : 'text-xl'
                    } md:text-sm`}
                    aria-hidden="true"
                  >
                    {profileInitial}
                  </span>
                )}
              </span>
              <span
                className={`absolute bottom-[-2px] right-[-2px] flex items-center justify-center rounded-full border-2 border-white bg-[#007A50] text-white shadow-sm transition-[width,height] duration-300 ${
                  compact ? 'h-4 w-4' : 'h-5 w-5'
                } md:h-4 md:w-4`}
              >
                <Plus className="h-2.5 w-2.5" strokeWidth={3} />
              </span>
            </span>
            <span
              className={`block truncate text-[10px] font-semibold text-[#263B32] transition-[max-height,margin,opacity,transform] duration-200 ${
                compact
                  ? 'mt-0 max-h-0 -translate-y-1 opacity-0'
                  : 'mt-1 max-h-4 translate-y-0 opacity-100'
              } md:mt-0 md:max-h-0 md:opacity-0`}
            >
              Ваша история
            </span>
          </button>

          {isLoading
            ? Array.from({ length: 5 }).map((_, index) => (
                <div
                  key={index}
                  className={`shrink-0 transition-[width] duration-300 ${
                    compact ? 'w-9' : 'w-[64px]'
                  } md:w-9`}
                >
                  <div
                    className={`mx-auto animate-pulse rounded-full bg-[#E5ECE9] transition-[width,height] duration-300 ${
                      compact ? 'h-9 w-9' : 'h-[60px] w-[60px]'
                    } md:h-9 md:w-9`}
                  />
                  {!compact ? (
                    <div className="mx-auto mt-1 h-2 w-11 animate-pulse rounded-full bg-[#E5ECE9] md:hidden" />
                  ) : null}
                </div>
              ))
            : groups.map((group, index) => (
                <button
                  key={group.authorId}
                  type="button"
                  onClick={() => setSelectedGroupIndex(index)}
                  className={`group relative shrink-0 text-center transition-[width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                    compact ? 'w-9' : 'w-[64px]'
                  } md:w-9`}
                  aria-label={`Открыть истории: ${group.name}`}
                  title={group.name}
                  style={{ zIndex: Math.max(1, 18 - index) }}
                >
                  <span
                    className={`mx-auto block rounded-full border-2 bg-white p-0.5 shadow-[0_2px_8px_rgba(0,99,65,0.08)] transition-[width,height,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-active:scale-95 ${
                      group.isSeen ? 'border-[#CBD6D1]' : 'border-[#00A86B]'
                    } ${compact ? 'h-9 w-9' : 'h-[60px] w-[60px]'} md:h-9 md:w-9`}
                  >
                    <span className="relative block h-full w-full overflow-hidden rounded-full bg-[#EAF2EE]">
                      <Image
                        src={group.photo}
                        alt=""
                        fill
                        sizes="60px"
                        className="object-cover"
                      />
                    </span>
                  </span>
                  <span
                    className={`block truncate text-[10px] font-medium text-[#263B32] transition-[max-height,margin,opacity,transform] duration-200 ${
                      compact
                        ? 'mt-0 max-h-0 -translate-y-1 opacity-0'
                        : 'mt-1 max-h-4 translate-y-0 opacity-100'
                    } md:mt-0 md:max-h-0 md:opacity-0`}
                  >
                    {group.name}
                  </span>
                </button>
              ))}
        </div>
      </section>

      {selectedGroupIndex !== null ? (
        <StoryViewer
          groups={groups}
          initialGroupIndex={selectedGroupIndex}
          onClose={() => setSelectedGroupIndex(null)}
        />
      ) : null}
    </>
  );
}
