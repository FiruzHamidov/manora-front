type Observation = Record<string, string | number>;

/** Server log contract: no request URL/query, filter values, response body or error text. */
export function serverLoadObservation(context: Record<string, unknown>, duration: number, status: number): Observation | null {
  if (typeof context.surface !== 'string' || !['catalog', 'building', 'unit'].includes(context.surface)
    || typeof context.phase !== 'string' || !['ssr', 'preflight', 'sitemap'].includes(context.phase)) return null;
  const httpStatus = Number.isInteger(status) && status >= 100 && status <= 599 ? status : 0;
  const entry: Observation = {
    event: 'residential.server.load_result', surface: context.surface, phase: context.phase,
    duration_ms: Number.isFinite(duration) ? Math.min(60000, Math.max(0, Math.round(duration))) : 0,
    http_status: httpStatus,
    outcome: httpStatus >= 200 && httpStatus < 400 ? 'success' : 'error',
  };
  for (const key of ['building_id', 'unit_id']) {
    const value = context[key];
    if (Number.isSafeInteger(value) && Number(value) > 0 && Number(value) < 1e15) entry[key] = Number(value);
  }
  return entry;
}

/** Observational only: preserve the exact result/error even when logging fails. */
export async function observeResidentialServerLoad<T>(
  context: Record<string, unknown>, operation: () => Promise<T>,
  emit: (entry: Observation) => void = entry => console.info(JSON.stringify(entry)),
): Promise<T> {
  if (typeof window !== 'undefined') return operation();
  const start = performance.now();
  const record = (status: () => number) => {
    try {
      const entry = serverLoadObservation(context, performance.now() - start, status());
      if (entry) emit(entry);
    } catch { /* Log failure must not change rendering or error handling. */ }
  };
  try {
    const result = await operation();
    record(() => result instanceof Response ? result.status : typeof result === 'number' ? result : 200);
    return result;
  } catch (error) {
    record(() => error && typeof error === 'object' && 'status' in error && typeof error.status === 'number' ? error.status : 0);
    throw error;
  }
}
