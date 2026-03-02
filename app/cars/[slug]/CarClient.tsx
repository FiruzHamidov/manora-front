'use client';

import { useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { resolveMediaUrl } from '@/constants/base-url';
import { useGetCarByIdQuery } from '@/services/cars/hooks';
import type { Car, CarPhoto } from '@/services/cars/types';
import { Loading } from '@/ui-components/Loading';
import CarDetailsWrapper from './_components/CarDetailsWrapper';

export default function CarClient({ slug }: { slug: string }) {
  const searchParams = useSearchParams();
  const source = searchParams.get('source') === 'aura' ? 'aura' : 'local';
  const { data: car, isLoading, error } = useGetCarByIdQuery(slug, source);

  const photos = useMemo(
    () =>
      car?.photos?.map((photo: CarPhoto) =>
        resolveMediaUrl(
          photo.file_path || photo.path || photo.url,
          '/images/no-image.png',
          source
        )
      ) ?? [],
    [car, source]
  );

  if (isLoading) return <Loading />;

  if (error || !car) {
    return <div className="mx-auto w-full max-w-[1520px] px-4 py-10 text-center text-[#475467]">Ошибка при загрузке автомобиля</div>;
  }

  return <CarDetailsWrapper car={car as Car} photos={photos} />;
}
