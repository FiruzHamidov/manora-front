import { cache, Suspense } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { residentialCanonical, RESIDENTIAL_SITE } from '@/services/new-buildings/sharing';
import { residentialRobots } from '@/services/new-buildings/seo';
import { API_BASE_URL } from '@/config/api';
import { fetchPublicBuilding, PublicBuildingError } from '@/services/new-buildings/public-building-api';
import { unitPrice } from '@/services/new-buildings/public-unit';
import PublicBuildingScreen from './_components/PublicBuildingScreen';
import NewBuildingWrapper from './NewBuildingWrapper';
import { RESIDENTIAL_V2_ENABLED } from '@/services/new-buildings/rollout';
import { observeResidentialServerLoad } from '@/services/new-buildings/server-observation';

export const dynamic = 'force-dynamic';
const SITE = RESIDENTIAL_SITE;
type Props = { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };
const read = cache(async (id: string) => {
  try { return await observeResidentialServerLoad({ surface: 'building', phase: 'ssr', building_id: Number(id) }, () => fetchPublicBuilding(API_BASE_URL, id)); }
  catch (error) { if (error instanceof PublicBuildingError && error.status === 404) notFound(); throw error; }
});
async function route(props: Props) {
  const [{ slug }, query] = await Promise.all([props.params, props.searchParams]);
  if (query.source !== undefined && query.source !== 'local' && query.source !== 'aura') notFound();
  return { id: slug, external: query.source === 'aura', robots: residentialRobots(query) };
}
export async function generateMetadata(props: Props): Promise<Metadata> {
  const { id, external, robots } = await route(props);
  if (external) return { title: 'Жилой комплекс партнёра — Manora', alternates: { canonical: SITE + '/new-buildings/' + encodeURIComponent(id) + '?source=aura' }, robots: { index: false, follow: true } };
  if (!RESIDENTIAL_V2_ENABLED) return { title: 'Жилой комплекс — Manora', alternates: { canonical: SITE + '/new-buildings/' + encodeURIComponent(id) }, robots: { index: false, follow: true } };
  const building = await read(id);
  const canonical = residentialCanonical({ buildingId: building.id });
  const title = building.title + ' — Manora';
  const description = [building.title, building.address, building.inventory.min_price ? 'От ' + unitPrice(building.inventory.min_price) : 'Цена по запросу', 'Квартиры и консультация Manora.'].filter(Boolean).join('. ');
  const image = building.photos[0];
  return { title: { absolute: title }, description, alternates: { canonical }, robots,
    openGraph: { title, description, url: canonical, type: 'website', images: image ? [{ url: image.url, alt: image.alt }] : [] },
    twitter: { title, description, card: image ? 'summary_large_image' : 'summary', images: image ? [image.url] : [] } };
}
export default async function NewBuildingPage(props: Props) {
  const { id, external } = await route(props);
  if (external) return <Suspense fallback={<p className="p-6">Загрузка ЖК партнёра…</p>}><NewBuildingWrapper source="aura" /></Suspense>;
  if (!RESIDENTIAL_V2_ENABLED) return <Suspense fallback={<p className="p-6">Загрузка ЖК…</p>}><NewBuildingWrapper source="local" /></Suspense>;
  const building = await read(id);
  const breadcrumbs = { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Жилые комплексы', item: SITE + '/new-buildings' },
    { '@type': 'ListItem', position: 2, name: building.title, item: SITE + '/new-buildings/' + building.id },
  ] };
  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs).replace(/</g, '\\u003c') }} />
    <Suspense fallback={<p className="p-6">Загрузка жилого комплекса…</p>}><PublicBuildingScreen initialBuilding={building} /></Suspense>
  </>;
}
