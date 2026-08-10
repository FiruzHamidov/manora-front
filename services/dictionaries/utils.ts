import type { DictionaryErrorPayload } from './types';

export function normalizeDictionaryList<T>(
  payload: T[] | { data?: T[] } | { items?: T[] } | undefined
): T[] {
  if (Array.isArray(payload)) return payload;
  if (
    payload &&
    'data' in payload &&
    Array.isArray(payload.data)
  ) {
    return payload.data;
  }
  if (
    payload &&
    'items' in payload &&
    Array.isArray(payload.items)
  ) {
    return payload.items;
  }
  return [];
}

const CYRILLIC_MAP: Record<string, string> = {
  а: 'a',
  б: 'b',
  в: 'v',
  г: 'g',
  д: 'd',
  е: 'e',
  ё: 'e',
  ж: 'zh',
  з: 'z',
  и: 'i',
  й: 'y',
  к: 'k',
  л: 'l',
  м: 'm',
  н: 'n',
  о: 'o',
  п: 'p',
  р: 'р',
  с: 's',
  т: 't',
  у: 'u',
  ф: 'f',
  х: 'kh',
  ц: 'ts',
  ч: 'ch',
  ш: 'sh',
  щ: 'shch',
  ы: 'y',
  ь: '',
  ъ: '',
  э: 'e',
  ю: 'yu',
  я: 'ya',
  А: 'a',
  Б: 'b',
  В: 'v',
  Г: 'g',
  Д: 'd',
  Е: 'e',
  Ё: 'e',
  Ж: 'zh',
  З: 'z',
  И: 'i',
  Й: 'y',
  К: 'k',
  Л: 'l',
  М: 'm',
  Н: 'n',
  О: 'o',
  П: 'p',
  Р: 'r',
  С: 's',
  Т: 't',
  У: 'u',
  Ф: 'f',
  Х: 'h',
  Ц: 'ts',
  Ч: 'ch',
  Ш: 'sh',
  Щ: 'shch',
  Ы: 'y',
  Ь: '',
  Ъ: '',
  Э: 'e',
  Ю: 'yu',
  Я: 'ya',
};

export function generateSlug(value: string): string {
  if (!value.trim()) return '';

  return value
    .normalize('NFKD')
    .replace(/[^\w\s\-\u0430-\u044f\u0410-\u042f]/gu, '')
    .split('')
    .map((symbol) => CYRILLIC_MAP[symbol] ?? symbol)
    .join('')
    .toLowerCase()
    .replace(/[_\s]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/[^a-z0-9-]/g, '');
}

export function filterOptionsExcludingId<T extends { id: number }>(
  items: T[],
  currentId?: number
): T[] {
  if (!currentId) return items;
  return items.filter((item) => item.id !== currentId);
}

export function parseDictionaryError(
  error: unknown
): { status: number | undefined; message: string; fieldErrors: Record<string, string[]> } {
  const raw = error as {
    response?: { status?: number; data?: DictionaryErrorPayload };
    message?: string;
  };

  const data = raw?.response?.data ?? {};
  const status = raw?.response?.status;
  const message =
    data.message ||
    data.error ||
    data.detail ||
    raw?.message ||
    'Ошибка запроса';

  const fieldErrors: Record<string, string[]> = {};
  const errors = data.errors;
  if (errors && typeof errors === 'object') {
    Object.entries(errors).forEach(([field, value]) => {
      fieldErrors[field] = Array.isArray(value) ? value : [String(value)];
    });
  }

  return { status, message: String(message), fieldErrors };
}
