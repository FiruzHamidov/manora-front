import { resolveMediaUrl } from '@/constants/base-url';
import type { Reel } from '@/services/reels/types';

const pickFirstString = (...values: unknown[]): string | undefined => {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }
  return undefined;
};

export const getReelTitle = (reel: Reel): string =>
  reel.title || String(reel.source_data?.title || '') || reel.hook || `Рилс #${reel.id}`;

export const getReelDescription = (reel: Reel): string =>
  reel.description || String(reel.source_data?.description || '') || reel.cta || '';

export const getReelPreviewUrl = (reel: Reel, fallback: string = '/images/no-image.png'): string => {
  const rawPreview = pickFirstString(
    reel.playback?.preview_image_url,
    reel.playback?.preview_image,
    reel.playback?.thumbnail_public_url,
    reel.playback?.thumbnail_url,
    reel.source_data?.preview_image,
    reel.source_data?.thumbnail_url,
    reel.source_data?.thumbnail,
    reel.source_data?.image_url,
    reel.source_data?.image
  );

  return resolveMediaUrl(rawPreview, fallback);
};

export const getReelPlaybackUrl = (reel: Reel): string => {
  const rawVideo = pickFirstString(
    reel.playback?.hls_url,
    reel.playback?.mp4_url,
    reel.playback?.video_public_url,
    reel.playback?.video_url
  );

  return rawVideo ? resolveMediaUrl(rawVideo, '') : '';
};

export const formatReelCount = (value?: number | null): string => {
  const count = Number(value ?? 0);
  if (!Number.isFinite(count) || count <= 0) return '0';
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(count >= 10_000_000 ? 0 : 1)}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(count >= 10_000 ? 0 : 1)}K`;
  return String(count);
};
