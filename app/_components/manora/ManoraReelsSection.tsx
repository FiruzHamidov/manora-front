'use client';

import Link from 'next/link';
import { Clapperboard, Eye, Heart } from 'lucide-react';
import FallbackImage from '@/app/_components/FallbackImage';
import { useReels } from '@/services/reels/hooks';
import { formatReelCount, getReelDescription, getReelPreviewUrl, getReelTitle } from '@/services/reels/helpers';
import type { Reel } from '@/services/reels/types';

function ReelPosterCard({ reel }: { reel: Reel }) {
  const title = getReelTitle(reel);
  const description = getReelDescription(reel);

  return (
    <Link
      href={`/reels/${reel.id}`}
      className="group relative block aspect-[260/408] min-h-[300px] w-[210px] shrink-0 overflow-hidden rounded-[12px] bg-[#111827] outline-none transition-transform duration-200 hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-[#006341] md:w-full md:min-h-0"
      aria-label={title}
    >
      <FallbackImage
        src={getReelPreviewUrl(reel)}
        alt={title}
        fill
        className="object-cover transition-transform duration-500 group-hover:scale-105"
        sizes="(max-width: 768px) 210px, 260px"
      />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.16)_0%,rgba(0,0,0,0.22)_46%,rgba(0,0,0,0.72)_100%)]" />
      <div className="absolute right-4 top-4 flex h-6 w-6 items-center justify-center rounded-md bg-white text-[#111827]">
        <Clapperboard className="h-4 w-4" strokeWidth={3} />
      </div>
      <div className="absolute inset-x-0 bottom-0 p-4 text-white">
        <h3 className="line-clamp-2 text-[15px] font-extrabold leading-5">{title}</h3>
        {description ? (
          <p className="mt-1 line-clamp-2 text-[12px] font-medium leading-4 text-white/80">{description}</p>
        ) : null}
        <div className="mt-3 flex items-center gap-3 text-[12px] font-semibold text-white/85">
          <span className="inline-flex items-center gap-1">
            <Heart className="h-3.5 w-3.5" />
            {formatReelCount(reel.likes_count)}
          </span>
          <span className="inline-flex items-center gap-1">
            <Eye className="h-3.5 w-3.5" />
            {formatReelCount(reel.views_count)}
          </span>
        </div>
      </div>
    </Link>
  );
}

function ReelsSkeleton() {
  return (
    <div className="hide-scrollbar flex gap-4 overflow-x-auto md:grid md:grid-cols-5 md:overflow-visible md:gap-[19px]">
      {Array.from({ length: 5 }).map((_, index) => (
        <div
          key={index}
          className="aspect-[260/408] min-h-[300px] w-[210px] shrink-0 animate-pulse rounded-[12px] bg-[#E7ECF2] md:w-full md:min-h-0"
        />
      ))}
    </div>
  );
}

export default function ManoraReelsSection() {
  const { data, isLoading, error } = useReels({ per_page: 5, status: 'published' });
  const reels = (data ?? []).slice(0, 5);

  if (!isLoading && (error || reels.length === 0)) {
    return null;
  }

  return (
    <section className="mt-2 rounded-[26px] bg-white px-4 py-6 md:mt-[60px] md:rounded-[30px] md:px-8 md:py-10">
      <h2 className="mb-5 text-[28px] font-extrabold leading-none text-black md:mb-6 md:text-[32px]">
        Manora Reels
      </h2>
      {isLoading ? (
        <ReelsSkeleton />
      ) : (
        <div className="hide-scrollbar flex gap-4 overflow-x-auto pb-1 md:grid md:grid-cols-5 md:overflow-visible md:gap-[19px] md:pb-0">
          {reels.map((reel) => (
            <ReelPosterCard key={reel.id} reel={reel} />
          ))}
        </div>
      )}
    </section>
  );
}
