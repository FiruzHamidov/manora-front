'use client';

import { useParams, useSearchParams } from 'next/navigation';
import { PriceAndBuilder } from './_components/PriceAndBuilder';
import { Offers } from './_components/Offers';
import { ComfortNearby } from './_components/ComfortNearby';
import { BuildingInfo } from './_components/BuildingInfo';
import { NewBuildingCardWithPhotos } from './_components/NewBuildingCardWithPhotos';
import {
  useNewBuilding,
  useNewBuildings,
  useNewBuildingPhotos,
} from '@/services/new-buildings/hooks';

export default function NewBuildingWrapper({ source }: { source?: 'local' | 'aura' }) {
  const params = useParams<{ slug: string }>();
  const searchParams = useSearchParams();
  const id = Number(params.slug);
  const sourceParam = (source || searchParams.get('source') || 'local') as 'local' | 'aura';

  const { data: buildingResponse, isLoading } = useNewBuilding(id, sourceParam);
  const { data: photos } = useNewBuildingPhotos(id, sourceParam);
  const { data: similarBuildingsResponse } = useNewBuildings({ page: 1, per_page: 6 });

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-[1520px] px-4 sm:px-6 lg:px-8 pt-8 pb-12">
        <div className="animate-pulse">
          <div className="h-96 bg-gray-200 rounded-[22px] mb-5" />
          <div className="h-64 bg-gray-200 rounded-[22px]" />
        </div>
      </div>
    );
  }

  if (!buildingResponse) {
    return (
      <div className="mx-auto w-full max-w-[1520px] px-4 sm:px-6 lg:px-8 pt-8 pb-12">
        <div className="text-center">Новостройка не найдена</div>
      </div>
    );
  }

  const building = buildingResponse.data;
  const stats = buildingResponse.stats;
  const similarBuildings = (similarBuildingsResponse?.data || []).filter((item) => item.id !== building.id).slice(0, 3);

  return (
    <div className="pb-12">
      <BuildingInfo
        building={building}
        photos={photos || []}
        stats={stats}
        showDetails={false}
      />

      <div className="mx-auto mt-5 w-full max-w-[1520px] px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
          <div className="min-w-0 flex-1">
            <BuildingInfo
              building={building}
              photos={photos || []}
              stats={stats}
              showHero={false}
            />
            <Offers building={building} />
            <ComfortNearby building={building} />

            {similarBuildings.length > 0 ? (
              <section className="mt-5 rounded-[26px] bg-white p-4 shadow-[0_2px_20px_rgba(15,23,42,0.05)] md:p-6">
                <div className="flex items-baseline gap-3">
                  <h2 className="text-[28px] font-extrabold text-[#111827]">Похожие новостройки</h2>
                  <span className="text-sm text-[#94A3B8]">{similarBuildings.length} новостройки</span>
                </div>

                <div className="mt-5 grid gap-4 xl:grid-cols-3 md:grid-cols-2">
                  {similarBuildings.map((item) => (
                    <NewBuildingCardWithPhotos key={item.id} building={item} />
                  ))}
                </div>
              </section>
            ) : null}
          </div>

          <div className="w-full lg:w-[360px] xl:w-[390px]">
            <PriceAndBuilder building={building} stats={stats} />
          </div>
        </div>
      </div>
    </div>
  );
}
