export const residentialEvents = ['building_view', 'unit_view', 'block_select', 'filter_apply', 'form_start', 'lead_result', 'load_result'] as const;
export type ResidentialEvent = typeof residentialEvents[number];
const surfaces = ['catalog', 'building', 'unit', 'selection', 'payment'];
const endpoints = ['list', 'map', 'facets', 'units', 'unit-facets', 'availability-grid', 'detail',
  'gallery', 'masterplan', 'nearby', 'videos', 'payment-programs', 'payment-units', 'payment-calculation', 'similar', 'reviews', 'map-sdk', 'video-player'];
const filterKeys = new Set(['rooms', 'price_min', 'price_max', 'area_min', 'area_max', 'floor_min', 'floor_max', 'block_id', 'entrance_id',
  'finishing', 'include_reserved', 'sort', 'page', 'view', 'search', 'city', 'district', 'developer_id', 'stage_id', 'material_id',
  'completion_year_min', 'completion_year_max', 'installment_available', 'bbox', 'zoom', 'not_first', 'not_last', 'only_last', 'window_view', 'kitchen_area_min', 'kitchen_area_max', 'grid_floor_page', 'grid_position_page', 'source']);

/** Construct a new payload; never spread form values, URL parameters or exceptions. */
export function residentialEventPayload(event: ResidentialEvent, data: Record<string, unknown>): Record<string, unknown> | null {
  if (!residentialEvents.includes(event) || typeof data.surface !== 'string' || !surfaces.includes(data.surface)) return null;
  const result: Record<string, unknown> = { event, surface: data.surface };
  for (const key of ['building_id', 'unit_id', 'block_id']) {
    const value = data[key];
    if (Number.isSafeInteger(value) && Number(value) > 0 && Number(value) < 1e15) result[key] = value;
  }
  for (const [key, max] of [['duration_ms', 60000], ['http_status', 599], ['data_age_seconds', 31536000], ['verification_age_seconds', 315360000]] as const) {
    const value = data[key];
    if (typeof value === 'number' && Number.isFinite(value) && value >= 0) result[key] = Math.min(max, Math.round(value));
  }
  if (data.outcome === 'success' || data.outcome === 'error') result.outcome = data.outcome;
  if (typeof data.endpoint === 'string' && endpoints.includes(data.endpoint)) result.endpoint = data.endpoint;
  if (Array.isArray(data.filter_keys)) result.filter_keys = [...new Set(data.filter_keys.filter(key => typeof key === 'string' && filterKeys.has(key)))].sort().slice(0, 48);
  return result;
}

export async function sendResidentialEvent(base: string, event: ResidentialEvent, data: Record<string, unknown>, transport: typeof fetch = fetch): Promise<boolean> {
  const payload = residentialEventPayload(event, data);
  if (!payload) return false;
  try {
    const response = await transport(base.replace(/\/$/, '') + '/v2/residential/events', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload), credentials: 'omit', referrerPolicy: 'no-referrer', cache: 'no-store',
      keepalive: true, signal: AbortSignal.timeout(5000),
    });
    return response.ok;
  } catch { return false; }
}

/** External analytics never receives arbitrary route segments, titles or query strings. */
export function analyticsPage(pathname: string): string | null {
  const path = pathname.split(/[?#]/, 1)[0];
  if (/^\/(admin|profile|dashboard|login|register|reset-password|favorites)(\/|$)/.test(path)) return null;
  if (/^\/new-buildings\/[1-9]\d{0,14}(\/units\/[1-9]\d{0,14})?\/?$/.test(path)) return path.replace(/\/$/, '');
  if (['/', '/new-buildings', '/listings', '/cars', '/about/news', '/mortgage-calculator', '/partners', '/developers', '/branches', '/policy', '/legal'].includes(path)) return path;
  return '/other';
}

/** Dates become bounded numeric ages, never raw server content. */
export function residentialFreshness(result: unknown, now = Date.now()): Record<string, number> {
  if (!result || typeof result !== 'object') return {};
  const value = result as { meta?: { as_of?: unknown }; as_of?: unknown; data_verified_at?: unknown; building?: { data_verified_at?: unknown } };
  const ages: Record<string, number> = {};
  for (const [key, date, max] of [
    ['data_age_seconds', value.meta?.as_of ?? value.as_of, 31536000],
    ['verification_age_seconds', value.data_verified_at ?? value.building?.data_verified_at, 315360000],
  ] as const) {
    if (typeof date !== 'string') continue;
    const age = (now - Date.parse(date)) / 1000;
    if (Number.isFinite(age)) ages[key] = Math.min(max, Math.max(0, Math.round(age)));
  }
  return ages;
}

export async function measureResidentialLoad<T>(
  data: Record<string, unknown>, operation: () => Promise<T>,
  emit: (event: ResidentialEvent, data: Record<string, unknown>) => void, signal?: AbortSignal,
): Promise<T> {
  const start = performance.now();
  const record = (details: () => Record<string, unknown>) => {
    if (signal?.aborted) return;
    try { emitLoadResult({ ...data, ...details(), duration_ms: performance.now() - start }, emit); }
    catch { /* Diagnostics must not alter the operation, even for a throwing getter. */ }
  };
  try {
    const result = await operation();
    record(() => ({ ...residentialFreshness(result), http_status: 200, outcome: 'success' }));
    return result;
  } catch (error) {
    record(() => ({ outcome: 'error', http_status: error && typeof error === 'object' && 'status' in error ? error.status : 0 }));
    throw error;
  }
}

function emitLoadResult(data: Record<string, unknown>, emit: (event: ResidentialEvent, data: Record<string, unknown>) => void) {
  try {
    const payload = residentialEventPayload('load_result', data);
    if (payload) { delete payload.event; emit('load_result', payload); }
  } catch { /* Diagnostic transport failure must not change the page state. */ }
}

/** One failure per explicit SDK/player attempt; no provider URL, event object or inferred HTTP status. */
export function residentialResourceFailure(data: Record<string, unknown>, emit: (event: ResidentialEvent, data: Record<string, unknown>) => void): () => void {
  let reported = false;
  return () => {
    if (reported) return;
    reported = true;
    emitLoadResult({ ...data, outcome: 'error', http_status: 0 }, emit);
  };
}
