import type { Metadata } from 'next';
import { FAQ } from '@/ui-components/FAQ';
import { ExtraPagesBanner } from '../_components/extra-pages-banner';
import { WhyUs } from '../_components/why-us';
import { ProcessSteps } from './_components/process-steps';
import { ApplicationForm } from './_components/application-form';
import GoogleAdSlot from '@/app/_components/ads/GoogleAdSlot';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://manora.tj';
const ROUTE_PATH = '/document-registration';
const ABS_URL = `${SITE_URL}${ROUTE_PATH}`;

const bannerData = {
    title: 'Оформление документов',
    description:
        'Полный комплекс юридического сопровождения сделок с недвижимостью. Надежно. Законно. Под ключ.',
    buttonLabel: 'Получить консультацию',
    buttonLink: '#document-registration-form',
    imageUrl: '/images/extra-pages/doc-banner.png',
    imageAlt: 'Регистрация документов',
};

const faqItems = [
    {
        question: 'Какой срок оформления документов?',
        answer:
            'Срок оформления документов зависит от конкретной услуги и составляет от 3 до 10 рабочих дней.',
    },
    {
        question: 'Какие документы нужны для оформления?',
        answer:
            'Для оформления документов необходимы: паспорт, ИНН, СНИЛС и документы, подтверждающие право собственности.',
    },
];

// ====== SEO: метаданные ======
export async function generateMetadata(): Promise<Metadata> {
    const title = `${bannerData.title} — Manora`;
    const description = bannerData.description;
    const ogImage = `${SITE_URL}${bannerData.imageUrl}`;

    return {
        title,
        description,
        alternates: {
            canonical: ABS_URL,
        },
        openGraph: {
            type: 'website',
            url: ABS_URL,
            title,
            description,
            siteName: 'Manora',
            images: [{ url: ogImage, alt: bannerData.imageAlt }],
            locale: 'ru_RU',
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            images: [ogImage],
        },
        robots: {
            index: true,
            follow: true,
        },
    };
}

// ====== Страница ======
export default function DocumentRegistration() {
    // JSON-LD: Хлебные крошки (BreadcrumbList)
    const breadcrumbLd = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
            {
                '@type': 'ListItem',
                position: 1,
                name: 'Главная',
                item: SITE_URL,
            },
            {
                '@type': 'ListItem',
                position: 2,
                name: 'Оформление документов',
                item: ABS_URL,
            },
        ],
    };

    // JSON-LD: Услуга (Service)
    const serviceLd = {
        '@context': 'https://schema.org',
        '@type': 'Service',
        name: bannerData.title,
        description: bannerData.description,
        areaServed: {
            '@type': 'AdministrativeArea',
            name: 'Таджикистан',
        },
        provider: {
            '@type': 'Organization',
            name: 'Manora',
            url: SITE_URL,
        },
        serviceType: 'Юридическое сопровождение сделок с недвижимостью',
        image: `${SITE_URL}${bannerData.imageUrl}`,
        url: ABS_URL,
    };

    // JSON-LD: FAQ (FAQPage)
    const faqLd = {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faqItems.map((f) => ({
            '@type': 'Question',
            name: f.question,
            acceptedAnswer: { '@type': 'Answer', text: f.answer },
        })),
    };

    return (
        <div className="mx-auto w-full max-w-[1520px] px-4 sm:px-6 lg:px-8 py-10 md:py-[100px]">
            {/* Доступный H1 (если ExtraPagesBanner не рендерит h1 сам) */}
            <h1 className="sr-only">{bannerData.title}</h1>

            {/* JSON-LD */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceLd) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
            />

            <ExtraPagesBanner {...bannerData} />

            <div className="py-10">
                <WhyUs
                    title="Почему мы?"
                    items={[
                        {
                            image: '/images/extra-pages/doc-why-1.png',
                            description: 'лет опыта в сфере недвижимости',
                        },
                        {
                            image: '/images/extra-pages/doc-why-2.png',
                            description: 'Лицензированные юристы и риэлторы',
                        },
                        {
                            image: '/images/extra-pages/doc-why-3.png',
                            description: 'Прозрачные тарифы, без скрытых комиссий',
                        },
                        {
                            image: '/images/extra-pages/doc-why-4.png',
                            description: 'Онлайн и офлайн сопровождение',
                        },
                    ]}
                />
            </div>

            <ProcessSteps />

            <div className="py-6">
                <div className="bg-white rounded-[22px] p-4 md:p-6">
                    <GoogleAdSlot
                        slot="2404125144"
                        format="auto"
                        fullWidthResponsive="true"
                    />
                </div>
            </div>

            <div className="py-10" id="document-registration-form">
                <ApplicationForm
                    title={bannerData.title}
                    description={bannerData.description}
                />
            </div>

            <FAQ items={faqItems} />
        </div>
    );
}

// (необязательно) Если используешь ISR на уровне роута:
export const revalidate = 1800; // переиндексация раз в 30 минут
