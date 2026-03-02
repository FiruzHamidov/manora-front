import type { Metadata } from 'next';
import NewBuildingWrapper from './NewBuildingWrapper';
import { axios } from '@/utils/axios';
import MainShell from '@/app/_components/manora/MainShell';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://manora.tj';
const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'https://backend.aura.tj/api';
const STORAGE_URL =
  process.env.NEXT_PUBLIC_STORAGE_URL ?? 'https://storage.aura.tj';

async function fetchBuilding(id: number, source: 'local' | 'aura' = 'local') {
  try {
    const { data } = await axios.get(`/feed/new-buildings/${id}`, {
      params: source ? { source } : undefined,
    });
    return data;
  } catch (err) {
    // Try a direct fetch fallback with full URL (helps diagnose baseURL/env issues)
    try {
      const res = await fetch(`${API_URL}/feed/new-buildings/${id}?source=${source}`, {
        next: { revalidate: 300 },
      });
      if (!res.ok) {
        // eslint-disable-next-line no-console
        console.error(
          'fetchBuilding: fetch fallback failed',
          res.status,
          res.statusText
        );
        return null;
      }
      const json = await res.json();
      return json;
    } catch (err2) {
      // eslint-disable-next-line no-console
      console.error('fetchBuilding: axios and fetch both failed', err, err2);
      return null;
    }
  }
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams?: { source?: string };
}): Promise<Metadata> {
  const param = await params;
  const source = searchParams?.source === 'aura' ? 'aura' : 'local';
  const resp = await fetchBuilding(Number(param.slug), source);

  if (!resp) {
    return {
      title: 'Новостройка не найдена — Manora',
      robots: { index: false, follow: false },
    };
  }

  const raw = resp.data ?? resp;
  const title =
    (raw?.title && String(raw.title).trim()) || 'Новостройка — Manora';
  const description = raw?.description
    ? String(raw.description).slice(0, 160)
    : `Информация о новостройке ${title}`;
  const url = `${SITE_URL}/new-buildings/${param.slug}`;
  const photoPath =
    raw?.photos && raw.photos.length
      ? raw.photos[0].path ?? raw.photos[0].file_path
      : undefined;
  const image = photoPath ? `${STORAGE_URL}/${photoPath}` : undefined;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: 'article',
      url,
      title,
      description,
      siteName: 'Manora',
      images: image ? [{ url: image }] : undefined,
      locale: 'ru_RU',
    },
    twitter: {
      card: image ? 'summary_large_image' : 'summary',
      title,
      description,
      images: image ? [image] : undefined,
    },
    robots: { index: true, follow: true },
  };
}

export default function Page({
  searchParams,
}: {
  searchParams?: { source?: string };
}) {
  const source = searchParams?.source === 'aura' ? 'aura' : 'local';

  return (
    <MainShell>
      <NewBuildingWrapper source={source} />
    </MainShell>
  );
}
