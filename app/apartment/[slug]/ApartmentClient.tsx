'use client';

import {useGetPropertyByIdQuery} from '@/services/properties/hooks';
import {PropertyPhoto} from '@/services/properties/types';
import GalleryWrapper from './_components/GalleryWrapper';
import {resolveMediaUrl} from '@/constants/base-url';
import {Loading} from '@/ui-components/Loading';
import {useSearchParams} from 'next/navigation';

export default function ApartmentClient({slug}: { slug: string }) {
    const searchParams = useSearchParams();
    const source = searchParams.get('source') === 'aura' ? 'aura' : 'local';
    const {
        data: apartment,
        isLoading,
        error,
    } = useGetPropertyByIdQuery(slug, false, source);

    if (isLoading) return <Loading/>;

    if (error || !apartment) {
        return <div>Ошибка при загрузке объекта</div>;
    }

    const photos: string[] =
        apartment.photos?.map(
            (p: PropertyPhoto) =>
                resolveMediaUrl(
                    (p as PropertyPhoto & { path?: string; url?: string }).file_path ||
                    (p as PropertyPhoto & { path?: string; url?: string }).path ||
                    (p as PropertyPhoto & { path?: string; url?: string }).url,
                    '/images/no-image.png',
                    source
                )
        ) ?? [];

    return <GalleryWrapper apartment={apartment} photos={photos}/>
}
