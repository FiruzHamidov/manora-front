import type {Metadata} from "next";
import {notFound} from "next/navigation";
// импорт внизу — норм
import ApartmentClient from "./ApartmentClient";
import MainShell from "@/app/_components/manora/MainShell";
import {resolveMediaUrl} from "@/constants/base-url";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://manora.tj";
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "https://back.manora.tj/api";
type PropertyPhoto = { file_path?: string; path?: string; url?: string };
type Apartment = {
    id: number;
    title: string;
    slug: string;
    description?: string;
    price?: number;
    currency?: "TJS" | "USD" | "RUB";
    total_area?: number;
    rooms?: number;
    location?: { name?: string };
    photos?: PropertyPhoto[];
    created_at?: string;
    updated_at?: string;
    moderation_status?: string;
    offer_type?: "sale" | "rent";
    listing_type?: "regular" | "vip";
};

async function fetchApartment(slug: string, source: 'local' | 'aura' = 'local'): Promise<Apartment | null> {
    if (source === 'aura') {
        const liveRes = await fetch(`${API_URL}/properties/${slug}`, {next: {revalidate: 300}});
        if (liveRes.ok) return liveRes.json();
    }

    const res = await fetch(`${API_URL}/feed/properties/${slug}?source=${source}`, {next: {revalidate: 300}});
    if (!res.ok) return null;
    return res.json();
}

function shortDesc(a: Apartment): string {
    const bits: string[] = [];
    if (a.location?.name) bits.push(a.location.name);
    if (a.rooms) bits.push(`${a.rooms}-комнатная`);
    if (a.total_area) bits.push(`${a.total_area} м²`);
    if (a.price && a.currency) bits.push(`${a.price} ${a.currency}`);
    const tail = a.description?.slice(0, 140) ?? "";
    return `${bits.join(" · ")}.${tail ? " " + tail : ""}`.trim();
}

function firstPhotoUrl(a: Apartment, source: 'local' | 'aura' = 'local'): string | undefined {
    const first = a.photos?.[0];
    const fp = first?.file_path || first?.path || first?.url;
    return fp ? resolveMediaUrl(fp, "/images/no-image.png", source) : undefined;
}

export async function generateMetadata(
    {params, searchParams}: { params: Promise<{ slug: string }>; searchParams?: Promise<{ source?: string }> }
): Promise<Metadata> {
    const {slug} = await params;
    const sp = searchParams ? await searchParams : undefined;
    const source = sp?.source === 'aura' ? 'aura' : 'local';
    const apt = await fetchApartment(slug, source);
    if (!apt) {
        return {title: "Объект не найден — Manora.tj", robots: {index: false, follow: false}};
    }

    const title =
        apt.title?.trim() ||
        `Купить ${apt.rooms ? apt.rooms + "-комнатную" : ""} ${apt.total_area ? apt.total_area + " м²" : ""} — Manora.tj`;

    const description = shortDesc(apt).slice(0, 160);
    const url = `${SITE_URL}/apartment/${slug}`;
    const image = firstPhotoUrl(apt, source);

    return {
        title,
        description,
        alternates: {canonical: url},
        openGraph: {
            type: "article",
            url,
            title,
            description,
            siteName: "Manora.tj",
            images: image ? [{url: image}] : undefined,
            locale: "ru_RU",
        },
        twitter: {
            card: image ? "summary_large_image" : "summary",
            title,
            description,
            images: image ? [image] : undefined,
        },
        robots: {
            index: apt.moderation_status === "approved",
            follow: true,
        },
    };
}

export default async function Page(
    {params, searchParams}: { params: Promise<{ slug: string }>; searchParams?: Promise<{ source?: string }> }
) {
    const {slug} = await params;
    const sp = searchParams ? await searchParams : undefined;
    const source = sp?.source === 'aura' ? 'aura' : 'local';
    const apt = await fetchApartment(slug, source);
    if (!apt) notFound();

    const image = firstPhotoUrl(apt, source);
    const price = apt.price;
    const currency = apt.currency ?? "TJS";

    // «чистый» JSON-LD без undefined
    const jsonLd: Record<string, unknown> = {
        "@context": "https://schema.org",
        "@type": "RealEstateListing",
        name: apt.title,
        ...(apt.description ? {description: apt.description} : {}),
        url: `${SITE_URL}/apartment/${slug}`,
        ...(image ? {image: [image]} : {}),
        address: {
            "@type": "PostalAddress",
            ...(apt.location?.name ? {addressLocality: apt.location.name} : {}),
            addressCountry: "TJ",
        },
        category: apt.offer_type === "rent" ? "rent" : "sell",
        ...(price ? {
            offers: {
                "@type": "Offer",
                price,
                priceCurrency: currency,
                availability: "https://schema.org/InStock",
                url: `${SITE_URL}/apartment/${slug}`,
            },
        } : {}),
        ...(apt.total_area ? {
            floorSize: {"@type": "QuantitativeValue", value: apt.total_area, unitCode: "MTK"},
        } : {}),
        ...(apt.rooms ? {numberOfRoomsTotal: apt.rooms} : {}),
        ...(apt.created_at ? {datePosted: apt.created_at} : {}),
        ...(apt.updated_at ? {dateModified: apt.updated_at} : {}),
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{__html: JSON.stringify(jsonLd)}}
            />
            <MainShell>
                <ApartmentClient slug={slug}/>
            </MainShell>
        </>
    );
}

export const revalidate = 300;
