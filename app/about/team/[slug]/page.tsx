import type { Metadata } from "next";
import { notFound } from "next/navigation";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://manora.tj";
const API_URL  = process.env.NEXT_PUBLIC_API_URL  ?? "https://back.manora.tj/api";
const STORAGE_URL = process.env.NEXT_PUBLIC_STORAGE_URL ?? "https://back.manora.tj/storage";
const ROUTE_PREFIX = "/about/team";

type Review = { id: number; author: string; rating: number; date: string; text: string; };
type Realtor = {
    id: number; name: string; position?: string | null; avatar?: string | null;
    phone?: string; photo?: string | null; rating?: number; reviewCount?: number;
    reviews?: Review[]; description?: string;
};

async function fetchRealtor(slug: string): Promise<Realtor | null> {
    const res = await fetch(`${API_URL}/user/${slug}`, { next: { revalidate: 300 } });
    if (!res.ok) return null;
    const d = await res.json();

    const raw = (d.phone ?? "").toString();
    const digits = raw.replace(/\D/g, "");
    const phoneTj = digits.startsWith("992") ? `+${digits}` : `+992${digits.startsWith("992") ? "" : digits}`;

    return {
        id: d.id,
        name: d.name,
        position: d.position ?? "Специалист по недвижимости",
        avatar: d.photo,
        phone: phoneTj,
        photo: d.photo,
        description: d.description ?? "",
        rating: Number(d.rating ?? 0) || undefined,
        reviewCount: Number(d.reviewCount ?? 0) || undefined,
        reviews: Array.isArray(d.reviews) ? d.reviews : [],
    };
}

function getPhotoUrl(realtor: Realtor): string | undefined {
    const p = realtor.photo || realtor.avatar;
    return p ? `${STORAGE_URL}/${p}` : undefined;
}

export async function generateMetadata(
    { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
    const { slug } = await params;
    const realtor = await fetchRealtor(slug);
    if (!realtor) {
        return { title: "Риелтор не найден — Manora.tj", robots: { index: false, follow: false } };
    }

    const title = `${realtor.name} — Риелтор Manora.tj`;
    const descBase = realtor.description?.trim() || "Профиль риелтора, контакты и объявления.";
    const ratingBit = realtor.rating ? ` Рейтинг: ${realtor.rating}★.` : "";
    const description = (descBase + ratingBit).slice(0, 160);
    const url = `${SITE_URL}${ROUTE_PREFIX}/${slug}`;
    const image = getPhotoUrl(realtor);

    return {
        title,
        description,
        alternates: { canonical: url },
        openGraph: {
            type: "profile",
            url,
            title,
            description,
            siteName: "Manora.tj",
            images: image ? [{ url: image, alt: realtor.name }] : undefined,
            locale: "ru_RU",
        },
        twitter: {
            card: image ? "summary_large_image" : "summary",
            title,
            description,
            images: image ? [image] : undefined,
        },
        robots: { index: true, follow: true },
    };
}

// ✅ Page тоже принимает Promise<{slug:string}> и распаковывает
export default async function Page(
    { params }: { params: Promise<{ slug: string }> }
) {
    const { slug } = await params;
    const realtor = await fetchRealtor(slug);
    if (!realtor) notFound();

    const url = `${SITE_URL}${ROUTE_PREFIX}/${slug}`;
    const image = getPhotoUrl(realtor);

    const personLd: Record<string, unknown> = {
        "@context": "https://schema.org",
        "@type": "RealEstateAgent",
        name: realtor.name,
        jobTitle: realtor.position ?? "Риелтор",
        url,
        ...(image ? { image } : {}),
        ...(realtor.phone ? { telephone: realtor.phone } : {}),
        ...(realtor.description ? { description: realtor.description } : {}),
        areaServed: { "@type": "AdministrativeArea", name: "Таджикистан" },
        brand: { "@type": "Organization", name: "Manora.tj", url: SITE_URL },
        ...(realtor.rating && realtor.reviewCount
            ? { aggregateRating: { "@type": "AggregateRating", ratingValue: realtor.rating, reviewCount: realtor.reviewCount } }
            : {}),
    };

    const breadcrumbLd = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
            { "@type": "ListItem", position: 1, name: "Главная", item: SITE_URL },
            { "@type": "ListItem", position: 2, name: "Команда", item: `${SITE_URL}${ROUTE_PREFIX}` },
            { "@type": "ListItem", position: 3, name: realtor.name, item: url },
        ],
    };

    return (
        <>
            <h1 className="sr-only">{realtor.name} — Риелтор Manora.tj</h1>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(personLd) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
            <RealtorClient slug={slug} />
        </>
    );
}

export const revalidate = 300;

// импорт после определения — ок
import RealtorClient from "./RealtorClient";
