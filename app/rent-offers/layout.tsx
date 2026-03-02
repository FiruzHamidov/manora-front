import {ReactNode} from 'react';
import {Metadata} from "next";

// SEO метаданные для head
export const metadata: Metadata = {
    title: 'Аренда недвижимости по всему Таджикистану — квартиры, дома, участки | Manora',
    description:
        'Ищете аренду квартиры, дома или участка по всему Таджикистану? Manora поможет найти недвижимость для аренды — топовые объявления, VIP-предложения, удобный поиск.',
    keywords: [
        'аренда недвижимости Таджикистан',
        'снять квартиру Душанбе',
        'снять дом Таджикистан',
        'аренда жилья',
        'Manora',
    ],
    openGraph: {
        title: 'Аренда недвижимости по всему Таджикистану | Manora',
        description:
            'Квартиры, дома и участки в аренду по всему Таджикистану. Manora — удобный поиск, VIP-объявления, проверенные предложения.',
        url: 'https://manora.tj/rent',
        siteName: 'Manora',
        locale: 'ru_RU',
        type: 'website',
    },
};
export default function RentLayout({children}: { children: ReactNode }) {
    return (
        <main className="mt-1 min-w-0">
            {children}
        </main>
    );
}