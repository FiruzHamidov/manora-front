import { API_BASE_URL } from '@/config/api';
import { residentialSitemapChunk, sitemapResponse } from '@/services/new-buildings/sitemap';
import { RESIDENTIAL_V2_ENABLED } from '@/services/new-buildings/rollout';
import { observeResidentialServerLoad } from '@/services/new-buildings/server-observation';

export const dynamic = 'force-dynamic';
export async function GET(_request: Request, { params }: { params: Promise<{ kind: string; chunk: string }> }) {
  const { kind, chunk } = await params;
  const generate = () => sitemapResponse(() => residentialSitemapChunk(API_BASE_URL, kind, chunk), RESIDENTIAL_V2_ENABLED);
  return RESIDENTIAL_V2_ENABLED ? observeResidentialServerLoad({ surface: 'catalog', phase: 'sitemap' }, generate) : generate();
}
