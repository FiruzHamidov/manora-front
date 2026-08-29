import { observeResidentialServerLoad } from './server-observation.ts';

/** Check visibility before Next starts its streaming shell, which otherwise commits HTTP 200. */
export async function publicUnitPreflight(baseUrl: string, pathname: string, source: string | null, transport: typeof fetch = fetch): Promise<200 | 404 | 503 | null> {
  const route = /^\/new-buildings\/([^/]+)\/units\/([^/]+)\/?$/.exec(pathname);
  if (!route) return null;
  if ((source !== null && source !== 'local') || !route.slice(1).every(id => /^[1-9]\d{0,14}$/.test(id) && Number.isSafeInteger(Number(id)))) return 404;
  return observeResidentialServerLoad({ surface: 'unit', phase: 'preflight', building_id: Number(route[1]), unit_id: Number(route[2]) },
    () => visibility(baseUrl.replace(/\/$/, '') + '/v2/new-buildings/' + route[1] + '/units/' + route[2], transport));
}

export async function publicBuildingPreflight(baseUrl: string, pathname: string, source: string | null, transport: typeof fetch = fetch): Promise<200 | 404 | 503 | null> {
  const route = /^\/new-buildings\/([^/]+)\/?$/.exec(pathname);
  if (!route || source === 'aura') return null; // External feed IDs remain a separate legacy route.
  if (source !== null && source !== 'local' || !/^[1-9]\d{0,14}$/.test(route[1]) || !Number.isSafeInteger(Number(route[1]))) return 404;
  return observeResidentialServerLoad({ surface: 'building', phase: 'preflight', building_id: Number(route[1]) },
    () => visibility(baseUrl.replace(/\/$/, '') + '/v2/new-buildings/' + route[1], transport));
}

async function visibility(url: string, transport: typeof fetch): Promise<200 | 404 | 503> {
  try {
    const response = await transport(url, {
      method: 'HEAD', cache: 'no-store', headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(12000),
    });
    return response.ok ? 200 : response.status === 404 ? 404 : 503;
  } catch { return 503; }
}

export function unitFailureCopy(status: 404 | 503) {
  return status === 404
    ? { title: 'Квартира не найдена', description: 'Проверьте ссылку. Эта квартира может быть снята с публикации или относиться к другому ЖК.' }
    : { title: 'Не удалось загрузить квартиру', description: 'Сервис временно недоступен. Это не означает, что квартира продана или снята с публикации.' };
}

/** Static trusted copy only. A direct response preserves status even with the root streaming boundary. */
export function unitFailureHtml(status: 404 | 503): string {
  return failureHtml(status, unitFailureCopy(status));
}

export function buildingFailureHtml(status: 404 | 503): string {
  return failureHtml(status, status === 404
    ? { title: 'Жилой комплекс не найден', description: 'Проверьте ссылку. ЖК может быть снят с публикации.' }
    : { title: 'Не удалось загрузить ЖК', description: 'Сервис временно недоступен. Это не означает, что комплекс снят с публикации.' });
}

function failureHtml(status: 404 | 503, copy: { title: string; description: string }): string {
  return '<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,follow"><title>' + copy.title + ' — Manora</title><style>body{margin:0;background:#f5f7f6;color:#17251e;font:18px/1.6 system-ui,sans-serif}main{max-width:700px;margin:8vh auto;padding:24px}h1{font-size:clamp(26px,5vw,38px);line-height:1.2}a{color:#006341;display:inline-block;padding:12px 0;margin-right:24px}.retry{background:#006341;color:white;padding:12px 20px;border-radius:12px}a:focus-visible{outline:3px solid #006341;outline-offset:4px}</style></head><body><main><a href="/">Manora</a><h1>' + copy.title + '</h1><p>' + copy.description + '</p>' + (status === 503 ? '<a class="retry" href="">Повторить загрузку</a>' : '') + '<a href="/new-buildings">Вернуться в каталог ЖК</a></main></body></html>';
}
