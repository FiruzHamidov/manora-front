export const BASE_URL: string | undefined = process.env.NEXT_PUBLIC_BASE_URL;
export const STORAGE_URL: string | undefined =
  process.env.NEXT_PUBLIC_STORAGE_URL;
export const API_URL: string | undefined = process.env.NEXT_PUBLIC_API_URL;
export const AURA_BACKEND_URL: string =
  process.env.NEXT_PUBLIC_AURA_BACKEND_URL ?? "https://backend.aura.tj/storage";

const stripTrailingSlash = (value: string): string => value.replace(/\/+$/, "");
const stripApiSuffix = (value: string): string =>
  value.replace(/\/api\/?$/, "");

const API_ORIGIN = API_URL ? stripApiSuffix(stripTrailingSlash(API_URL)) : "";
const STORAGE_BASE = STORAGE_URL ? stripTrailingSlash(STORAGE_URL) : "";
const AURA_BACKEND_BASE = stripTrailingSlash(AURA_BACKEND_URL);

type MediaSource = "aura" | "local";

export const resolveMediaUrl = (
  rawPath?: string | null,
  fallback: string = "/images/no-image.png",
  source: MediaSource = "local"
): string => {
  if (!rawPath) return fallback;

  let src = String(rawPath).trim();
  if (!src) return fallback;
  src = src.replace("/storage/storage/", "/storage/");

  const activeStorageBase = source === "aura" ? AURA_BACKEND_BASE : STORAGE_BASE;

  if (/^https?:\/\//i.test(src)) {
    if (/back\.manora\.tj\/storage\//i.test(src)) {
      const [, tail = ""] = src.split(/\/storage\//i);
      if (source === "aura") {
        return `${AURA_BACKEND_BASE}/storage/${tail}`;
      }
      if (STORAGE_BASE) {
        const normalizedTail = tail.replace(/^\/+/, "");
        const withoutDupStorage =
          STORAGE_BASE.endsWith("/storage") &&
          normalizedTail.startsWith("storage/")
            ? normalizedTail.slice("storage/".length)
            : normalizedTail;
        return `${STORAGE_BASE}/${withoutDupStorage}`;
      }
    }
    return src;
  }
  if (src.startsWith("//")) return `https:${src}`;

  // Absolute storage path from backend
  if (src.startsWith("/storage/")) {
    if (source === "aura") return `${AURA_BACKEND_BASE}${src}`;
    if (activeStorageBase) {
      const storageOrigin = activeStorageBase.replace(/\/storage\/?$/, "");
      return `${storageOrigin}${src}`;
    }
    if (API_ORIGIN) return `${API_ORIGIN}${src}`;
    return src;
  }

  // Relative storage path
  if (activeStorageBase) {
    const normalized = src.replace(/^\/+/, "");
    const withoutDupStorage =
      activeStorageBase.endsWith("/storage") && normalized.startsWith("storage/")
        ? normalized.slice("storage/".length)
        : normalized;
    return `${activeStorageBase}/${withoutDupStorage}`;
  }

  if (API_ORIGIN) {
    return `${API_ORIGIN}/${src.replace(/^\/+/, "")}`;
  }

  return src.startsWith("/") ? src : `/${src}`;
};
