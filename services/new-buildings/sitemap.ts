import { residentialCanonical, RESIDENTIAL_SITE } from './sharing';

const chunkSize = 1000;
const maxChunk = 999999999999;
const validId = (value: unknown): value is number => Number.isSafeInteger(value) && Number(value) > 0 && Number(value) < 1e15;
const validChunk = (value: unknown): value is number => Number.isSafeInteger(value) && Number(value) >= 0 && Number(value) <= maxChunk;
const xml = (value: string) => value.replace(/[<>&"']/g, character => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' })[character]!);
const document = (kind: 'sitemapindex' | 'urlset', entries: string[]) => '<?xml version="1.0" encoding="UTF-8"?>\n<' + kind + ' xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' + entries.join('') + '</' + kind + '>';

async function request(base: string, path: string, transport: typeof fetch): Promise<unknown> {
  const response = await transport(base.replace(/\/$/, '') + '/v2/new-buildings/sitemap' + path, {
    cache: 'no-store', headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(12000),
  });
  if (!response.ok) throw new Error('Sitemap source unavailable');
  return response.json();
}

function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid sitemap source');
  return value as Record<string, unknown>;
}

export async function residentialSitemapIndex(base: string, site = RESIDENTIAL_SITE, transport: typeof fetch = fetch): Promise<string> {
  const manifest = object(await request(base, '', transport));
  if (manifest.chunk_size !== chunkSize) throw new Error('Unknown sitemap partition');
  const entries: string[] = [];
  for (const kind of ['buildings', 'units'] as const) {
    const chunks = manifest[kind];
    if (!Array.isArray(chunks) || chunks.some(value => !validChunk(value)) || new Set(chunks).size !== chunks.length) throw new Error('Invalid sitemap chunks');
    if (kind === 'buildings' && !chunks.includes(0)) throw new Error('Missing catalog sitemap');
    for (const chunk of chunks) entries.push('<sitemap><loc>' + xml(new URL(site).origin + '/sitemaps/residential/' + kind + '/' + chunk + '.xml') + '</loc></sitemap>');
  }
  if (entries.length > 50000) throw new Error('Sitemap index limit exceeded');
  return document('sitemapindex', entries);
}

export async function residentialSitemapChunk(base: string, kind: string, file: string, site = RESIDENTIAL_SITE, transport: typeof fetch = fetch): Promise<string | null> {
  if (!['buildings', 'units'].includes(kind) || !/^(0|[1-9]\d{0,11})\.xml$/.test(file)) return null;
  const chunk = Number(file.slice(0, -4));
  if (!validChunk(chunk)) return null;
  const result = object(await request(base, '/' + kind + '/' + chunk, transport));
  if (!Array.isArray(result.data) || result.data.length > chunkSize) throw new Error('Invalid sitemap rows');
  const entries = kind === 'buildings' && chunk === 0 ? ['<url><loc>' + xml(new URL(site).origin + '/new-buildings') + '</loc></url>'] : [];
  let previousId = chunk * chunkSize;
  for (const raw of result.data) {
    const row = object(raw);
    if (!validId(row.id) || row.id <= previousId || row.id > (chunk + 1) * chunkSize || (kind === 'units' && !validId(row.building_id))) throw new Error('Invalid sitemap identity');
    previousId = row.id;
    const url = residentialCanonical(kind === 'units' ? { buildingId: row.building_id as number, unitId: row.id } : { buildingId: row.id }, site);
    let modified = '';
    if (row.last_modified !== null) {
      if (typeof row.last_modified !== 'string' || !/^\d{4}-\d{2}-\d{2}T/.test(row.last_modified) || !Number.isFinite(Date.parse(row.last_modified))) throw new Error('Invalid sitemap date');
      modified = '<lastmod>' + xml(new Date(row.last_modified).toISOString()) + '</lastmod>';
    }
    entries.push('<url><loc>' + xml(url) + '</loc>' + modified + '</url>');
  }
  return document('urlset', entries);
}

/** Never return an empty successful sitemap after an upstream failure. */
export async function sitemapResponse(generate: () => Promise<string | null>, enabled = true): Promise<Response> {
  try {
    const body = enabled ? await generate() : null;
    return new Response(body ?? 'Sitemap not found', { status: body === null ? 404 : 200,
      headers: { 'Content-Type': body === null ? 'text/plain; charset=utf-8' : 'application/xml; charset=utf-8', 'Cache-Control': 'private, no-store' } });
  } catch {
    return new Response('Sitemap temporarily unavailable', { status: 503,
      headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'private, no-store', 'Retry-After': '60', 'X-Robots-Tag': 'noindex' } });
  }
}
