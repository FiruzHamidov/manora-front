export type MediaSource = { url: string; width: number; height: number };
export type ResponsiveMedia = {
  url: string; sources?: MediaSource[]; width?: number | null; height?: number | null;
};

/** Keep authorization-aware URLs intact; never send them through an image proxy. */
export function residentialImageAttributes(image: ResponsiveMedia, sizes: string, full = false) {
  if (full) return { src: image.url, srcSet: undefined, sizes: undefined };
  const seen = new Set<number>();
  const sources = (image.sources ?? []).filter(source => {
    if (!Number.isInteger(source.width) || source.width < 1 || source.width > 4000 ||
      !Number.isInteger(source.height) || source.height < 1 || source.height > 4000 ||
      !/^(https?:\/\/|\/(?!\/))/.test(source.url) || /[\s,]/.test(source.url) || seen.has(source.width)) return false;
    seen.add(source.width);
    return true;
  }).sort((a, b) => a.width - b.width);
  if (!sources.length) return { src: image.url, srcSet: undefined, sizes: undefined };
  return {
    src: (sources.find(source => source.width >= 640) ?? sources[sources.length - 1]).url,
    srcSet: sources.map(source => source.url + ' ' + source.width + 'w').join(', '), sizes,
  };
}
