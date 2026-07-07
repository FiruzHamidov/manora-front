'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Eye, Heart } from 'lucide-react';
import FallbackImage from '@/app/_components/FallbackImage';
import ManoraLoading from '@/app/_components/manora/ManoraLoading';
import { useReel } from '@/services/reels/hooks';
import {
  formatReelCount,
  getReelDescription,
  getReelPlaybackUrl,
  getReelPreviewUrl,
  getReelTitle,
} from '@/services/reels/helpers';

export default function ReelDetailsPage() {
  const params = useParams<{ id: string }>();
  const { data: reel, isLoading, error } = useReel(params.id);

  if (isLoading) {
    return <ManoraLoading fullscreen text="Загружаем рилс..." />;
  }

  if (error || !reel) {
    return (
      <main className="mx-auto flex min-h-[70vh] w-full max-w-[960px] flex-col items-center justify-center px-4 text-center">
        <h1 className="text-2xl font-extrabold text-[#111827]">Рилс не найден</h1>
        <p className="mt-2 max-w-md text-sm leading-6 text-[#667085]">
          Возможно, видео ещё проходит модерацию или было удалено.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#006341] px-5 py-3 text-sm font-bold text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          На главную
        </Link>
      </main>
    );
  }

  const title = getReelTitle(reel);
  const description = getReelDescription(reel);
  const playbackUrl = getReelPlaybackUrl(reel);
  const previewUrl = getReelPreviewUrl(reel);

  return (
    <main className="mx-auto w-full max-w-[1180px] px-4 py-6 md:px-6 md:py-10">
      <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-[#006341]">
        <ArrowLeft className="h-4 w-4" />
        Назад
      </Link>

      <section className="mt-5 grid gap-6 md:grid-cols-[minmax(320px,420px)_1fr] md:items-center">
        <div className="relative mx-auto aspect-[9/16] w-full max-w-[420px] overflow-hidden rounded-[24px] bg-[#111827]">
          {playbackUrl ? (
            <video
              src={playbackUrl}
              poster={previewUrl}
              controls
              playsInline
              className="h-full w-full object-cover"
            />
          ) : (
            <FallbackImage src={previewUrl} alt={title} fill className="object-cover" sizes="420px" />
          )}
        </div>

        <div>
          <p className="text-sm font-bold uppercase text-[#006341]">Manora Reels</p>
          <h1 className="mt-3 text-3xl font-extrabold leading-tight text-[#111827] md:text-5xl">
            {title}
          </h1>
          {description ? (
            <p className="mt-4 max-w-2xl text-base leading-7 text-[#667085]">{description}</p>
          ) : null}
          <div className="mt-6 flex flex-wrap gap-3 text-sm font-bold text-[#344054]">
            <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2">
              <Heart className="h-4 w-4 text-[#D92D20]" />
              {formatReelCount(reel.likes_count)}
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2">
              <Eye className="h-4 w-4 text-[#006341]" />
              {formatReelCount(reel.views_count)}
            </span>
          </div>
        </div>
      </section>
    </main>
  );
}
