export class CatalogError extends Error {
  readonly status: number;
  readonly fields: Record<string, string[]>;
  constructor(status: number, fields: Record<string, string[]> = {}) {
    super(status === 422 ? 'Проверьте фильтры каталога.' : 'Не удалось обновить каталог. Повторите запрос.');
    this.status = status;
    this.fields = fields;
  }
}
export async function fetchCatalog<T>(baseUrl: string, endpoint: '' | 'map' | 'facets', query: string, signal?: AbortSignal, transport: typeof fetch = fetch): Promise<T> {
  try {
    const response = await transport(baseUrl.replace(/\/$/, '') + '/v2/new-buildings' + (endpoint ? '/' + endpoint : '') + (query ? '?' + query : ''), {
      cache: 'no-store', headers: { Accept: 'application/json' },
      signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(12_000)]) : AbortSignal.timeout(12_000),
    });
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new CatalogError(response.status, body.errors ?? {});
    }
    return await response.json() as T;
  } catch (error) {
    if (signal?.aborted || error instanceof CatalogError) throw error;
    throw new CatalogError(503);
  }
}
