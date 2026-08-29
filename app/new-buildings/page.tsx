import { cache, Suspense } from 'react';
import type { Metadata } from 'next';
import { API_BASE_URL } from '@/config/api';
import { catalogApiQuery, readCatalogFilters, type CatalogList } from '@/services/new-buildings/residential-catalog';
import { fetchCatalog } from '@/services/new-buildings/residential-catalog-api';
import ResidentialCatalogScreen from './_components/ResidentialCatalogScreen';
import { RESIDENTIAL_SITE } from '@/services/new-buildings/sharing';
import { residentialRobots } from '@/services/new-buildings/seo';
import { RESIDENTIAL_V2_ENABLED } from '@/services/new-buildings/rollout';
import LegacyResidentialCatalog from './_components/LegacyResidentialCatalog';
import { observeResidentialServerLoad } from '@/services/new-buildings/server-observation';

export const dynamic = 'force-dynamic';
const canonical = RESIDENTIAL_SITE + '/new-buildings';
const readCatalog = cache((query: string) => observeResidentialServerLoad({ surface: 'catalog', phase: 'ssr' },
  () => fetchCatalog<CatalogList>(API_BASE_URL, '', query)).catch(() => null));
type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };
function queryParams(search: Record<string, string | string[] | undefined>) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(search)) {
    if (Array.isArray(value)) value.forEach(item => params.append(key, item));
    else if (value !== undefined) params.set(key, value);
  }
  return params;
}
export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const search = await searchParams;
  if (!RESIDENTIAL_V2_ENABLED) return { title: 'Новостройки — Manora', alternates: { canonical }, robots: { index: false, follow: true } };
  const initial = await readCatalog(catalogApiQuery(readCatalogFilters(queryParams(search))));
  const title = 'Жилые комплексы — Manora';
  const description = 'Жилые комплексы и свободные квартиры: цены, сроки сдачи, подбор по комнатам и площади, карта.';
  return { title: { absolute: title }, description,
    alternates: { canonical }, robots: residentialRobots(initial ? search : { unavailable: true }),
    openGraph: { title, description, url: canonical, type: 'website', images: [] },
    twitter: { title, description, card: 'summary', images: [] } };
}
export default async function NewBuildingsPage({ searchParams }: Props) {
  if (!RESIDENTIAL_V2_ENABLED) return <Suspense fallback={<p className="p-6">Загрузка каталога…</p>}><LegacyResidentialCatalog /></Suspense>;
  const query = catalogApiQuery(readCatalogFilters(queryParams(await searchParams)));
  const initial = await readCatalog(query);
  return <Suspense fallback={<p className="p-6">Загрузка каталога…</p>}><ResidentialCatalogScreen initial={initial} initialQuery={query} /></Suspense>;
}
