'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

type Props = { ymId: number };

export default function YandexMetrikaClient({ ymId }: Props) {
    const pathname = usePathname();
    const searchParams = useSearchParams();

    useEffect(() => {
        const ym = (window as any)?.ym;
        if (!ym) return;

        const url = pathname + (searchParams?.toString() ? `?${searchParams}` : '');
        ym(ymId, 'hit', url);
    }, [pathname, searchParams, ymId]);

    return null;
}