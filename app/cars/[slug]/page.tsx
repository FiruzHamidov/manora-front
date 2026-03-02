import type { Metadata } from 'next';
import MainShell from "@/app/_components/manora/MainShell";
import CarClient from "./CarClient";
import { resolveMediaUrl } from '@/constants/base-url';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://manora.tj';
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'https://backend.aura.tj/api';

type CarPhoto = { path?: string; file_path?: string; url?: string };
type CarMeta = {
  id: number;
  title?: string;
  description?: string;
  price?: number | string;
  currency?: string;
  year?: number | string;
  brand?: { name?: string };
  model?: { name?: string };
  photos?: CarPhoto[];
};

async function fetchCar(slug: string, source: 'local' | 'aura' = 'local'): Promise<CarMeta | null> {
  try {
    const direct = await fetch(`${API_URL}/cars/${slug}?source=${source}`, {
      next: { revalidate: 300 },
    });
    if (direct.ok) return direct.json();
  } catch {}

  try {
    const fallback = await fetch(`${API_URL}/cars?search=${slug}&per_page=50&source=${source}`, {
      next: { revalidate: 300 },
    });
    if (!fallback.ok) return null;
    const json = await fallback.json();
    const raw = Array.isArray(json?.data) ? json.data : [];
    return raw.find((car: CarMeta) => String(car.id) === slug) ?? null;
  } catch {
    return null;
  }
}

function buildCarTitle(car: CarMeta) {
  return car.title || `${car.brand?.name || ''} ${car.model?.name || ''}`.trim() || 'Автомобиль';
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ source?: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const sp = searchParams ? await searchParams : undefined;
  const source = sp?.source === 'aura' ? 'aura' : 'local';
  const car = await fetchCar(slug, source);

  if (!car) {
    return {
      title: 'Автомобиль не найден — Manora',
      robots: { index: false, follow: false },
    };
  }

  const title = buildCarTitle(car);
  const pricePart = car.price ? `${Number(car.price).toLocaleString('ru-RU')} с.` : '';
  const yearPart = car.year ? String(car.year) : '';
  const description =
    car.description?.slice(0, 160) ||
    [title, yearPart, pricePart].filter(Boolean).join(' • ');
  const url = `${SITE_URL}/cars/${slug}`;
  const firstPhoto = car.photos?.[0];
  const image = resolveMediaUrl(
    firstPhoto?.file_path || firstPhoto?.path || firstPhoto?.url,
    '/images/no-image.png',
    source
  );

  return {
    title: `${title} — Manora`,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: 'article',
      url,
      title: `${title} — Manora`,
      description,
      siteName: 'Manora',
      images: image ? [{ url: image }] : undefined,
      locale: 'ru_RU',
    },
    twitter: {
      card: image ? 'summary_large_image' : 'summary',
      title: `${title} — Manora`,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export default async function CarPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return (
    <MainShell>
      <CarClient slug={slug} />
    </MainShell>
  );
}
