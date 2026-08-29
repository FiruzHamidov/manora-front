export type SelectionEndpoint = 'units' | 'unit-facets' | 'availability-grid';
export class UnitSelectionError extends Error {
  readonly status: number;
  readonly fields: Record<string, string[]>;
  constructor(status: number, fields: Record<string, string[]> = {}) {
    super(status === 404 ? 'Этот ЖК больше не доступен.' : status === 422 ? 'Проверьте условия подбора.' : 'Не удалось загрузить квартиры. Повторите запрос.');
    this.status = status; this.fields = fields;
  }
}
export async function fetchUnitSelection<T>(baseUrl: string, buildingId: number, endpoint: SelectionEndpoint, query: string, signal: AbortSignal, transport: typeof fetch = fetch): Promise<T> {
  try {
    const response = await transport(baseUrl.replace(/\/$/, '') + '/v2/new-buildings/' + buildingId + '/' + endpoint + '?' + query, {
      signal: AbortSignal.any([signal, AbortSignal.timeout(12_000)]), cache: 'no-store', headers: { Accept: 'application/json' },
    });
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new UnitSelectionError(response.status, body.errors ?? {});
    }
    return await response.json() as T;
  } catch (error) {
    if (signal.aborted || error instanceof UnitSelectionError) throw error;
    throw new UnitSelectionError(503);
  }
}
