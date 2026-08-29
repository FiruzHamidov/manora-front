import { cache, Suspense } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { residentialCanonical, RESIDENTIAL_SITE } from '@/services/new-buildings/sharing';
import { residentialRobots } from '@/services/new-buildings/seo';
import { API_BASE_URL } from '@/config/api';
import { fetchPublicUnit, PublicUnitError } from '@/services/new-buildings/public-unit-api';
import { unitTitle, unitPrice, UNIT_STATUS_LABELS } from '@/services/new-buildings/public-unit';
import PublicUnitScreen from './_components/PublicUnitScreen';
import { RESIDENTIAL_V2_ENABLED } from '@/services/new-buildings/rollout';
import { observeResidentialServerLoad } from '@/services/new-buildings/server-observation';

export const dynamic = 'force-dynamic';
const SITE_URL = RESIDENTIAL_SITE;
type Props = { params: Promise<{ slug: string; unitId: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };
const getUnit = cache(async (buildingId: string, unitId: string) => {
  try { return await observeResidentialServerLoad({ surface: 'unit', phase: 'ssr', building_id: Number(buildingId), unit_id: Number(unitId) },
    () => fetchPublicUnit(API_BASE_URL, buildingId, unitId)); }
  catch (error) {
    if (error instanceof PublicUnitError && error.status === 404) notFound();
    throw error;
  }
});
async function readUnit(props: Props) {
  if (!RESIDENTIAL_V2_ENABLED) notFound();
  const [{ slug, unitId }, search] = await Promise.all([props.params, props.searchParams]);
  // External feed IDs are not local inventory IDs.
  if (search.source !== undefined && search.source !== 'local') notFound();
  return getUnit(slug, unitId);
}
export async function generateMetadata(props: Props): Promise<Metadata> {
  const unit = await readUnit(props);
  const title = unitTitle(unit) + ' — ' + unit.building.title;
  const canonical = residentialCanonical({ buildingId: unit.new_building_id, unitId: unit.id });
  const description = UNIT_STATUS_LABELS[unit.availability_status] + '. ' + unitPrice(unit.effective_total_price, unit.currency) + '. ' + (unit.building.address || unit.building.title) + '. Консультация Manora.';
  const image = unit.plan?.image ?? unit.photo;
  return {
    title, description, alternates: { canonical },
    robots: residentialRobots(await props.searchParams),
    openGraph: { title, description, url: canonical, type: 'website', images: image ? [{ url: image.url }] : [] },
    twitter: { card: image ? 'summary_large_image' : 'summary', title, description, images: image ? [image.url] : [] },
  };
}
export default async function UnitPage(props: Props) {
  const unit = await readUnit(props);
  const buildingUrl = SITE_URL + '/new-buildings/' + unit.new_building_id;
  const breadcrumbs = { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Жилые комплексы', item: SITE_URL + '/new-buildings' },
    { '@type': 'ListItem', position: 2, name: unit.building.title, item: buildingUrl },
    { '@type': 'ListItem', position: 3, name: unitTitle(unit), item: buildingUrl + '/units/' + unit.id },
  ] };
  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs).replace(/</g, '\\u003c') }} />
    <Suspense fallback={<p className="p-8">Загрузка квартиры…</p>}><PublicUnitScreen initialUnit={unit} /></Suspense>
  </>;
}
