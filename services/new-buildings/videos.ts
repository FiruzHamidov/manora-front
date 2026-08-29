export type BuildingVideoInput = { title: string; source_url: string; caption: string | null; sort_order: number };
export type BuildingVideo = BuildingVideoInput & { id: number };
export type PublicBuildingVideo = BuildingVideo & { provider: 'youtube' | 'vimeo'; embed_url: string };
export type BuildingVideosResponse<T = BuildingVideo> = { version: number; videos: T[] };

/** A frame load event alone cannot distinguish a player from a browser error page. */
export function videoFrameBlocked(event: Pick<SecurityPolicyViolationEvent, 'disposition' | 'effectiveDirective' | 'blockedURI'>, embed: string): boolean {
  if (event.disposition !== 'enforce' || event.effectiveDirective !== 'frame-src') return false;
  try {
    // Cross-origin violations can expose only the blocked origin, not the full URL.
    return new URL(event.blockedURI).origin === new URL(embed).origin;
  } catch { return false; }
}

// Defense at the iframe/link sink: accept only the server's canonical representation.
export function videoLinks(video: Pick<PublicBuildingVideo, 'provider' | 'source_url' | 'embed_url'>): { source: string; embed: string } | null {
  if (typeof video.source_url !== 'string' || typeof video.embed_url !== 'string') return null;
  let source = '', embed = '';
  if (video.provider === 'youtube') {
    const match = /^https:\/\/www\.youtube\.com\/watch\?v=([A-Za-z0-9_-]{11})$/.exec(video.source_url);
    if (!match) return null;
    source = 'https://www.youtube.com/watch?v=' + match[1];
    embed = 'https://www.youtube-nocookie.com/embed/' + match[1] + '?autoplay=0&playsinline=1';
  } else if (video.provider === 'vimeo') {
    const match = /^https:\/\/vimeo\.com\/([1-9][0-9]{0,11})(?:\/([a-fA-F0-9]{10}))?$/.exec(video.source_url);
    if (!match) return null;
    source = 'https://vimeo.com/' + match[1] + (match[2] ? '/' + match[2] : '');
    embed = 'https://player.vimeo.com/video/' + match[1] + '?' + (match[2] ? 'h=' + match[2] + '&' : '') + 'autoplay=0&dnt=1';
  } else return null;
  return source === video.source_url && embed === video.embed_url ? { source, embed } : null;
}
