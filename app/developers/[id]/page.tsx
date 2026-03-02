'use client';

import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useDeveloper, useNewBuildings } from '@/services/new-buildings/hooks';
import { resolveMediaUrl } from '@/constants/base-url';
import InstagramIcon from '@/icons/InstagramIcon';
import PhoneIcon from '@/icons/PhoneIcon';
import WhatsappGreenIcon from '@/icons/WhatsappGreenIcon';
import FacebookBlueIcon from '@/icons/FacebookBlueIcon';
import { NewBuildingCardWithPhotos } from '@/app/new-buildings/[slug]/_components/NewBuildingCardWithPhotos';
import MainShell from '@/app/_components/manora/MainShell';
import FallbackImage from '@/app/_components/FallbackImage';

export default function DeveloperDetailPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const id = Number(params.id);
  const source = searchParams.get('source') === 'aura' ? 'aura' : 'local';

  const { data: developer, isLoading: developerLoading } = useDeveloper(id, source);
  const { data: buildingsData, isLoading: buildingsLoading } = useNewBuildings({
    developer_id: id,
    per_page: 100,
  });

  const formatUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    return `https://${url}`;
  };

  if (developerLoading) {
    return (
      <MainShell>
        <div className="mx-auto w-full max-w-[1520px] px-4 sm:px-6 lg:px-8 pt-8 pb-12">
          <div className="animate-pulse">
            <div className="h-32 bg-gray-200 rounded-[22px] mb-5" />
            <div className="h-96 bg-gray-200 rounded-[22px]" />
          </div>
        </div>
      </MainShell>
    );
  }

  if (!developer) {
    return (
      <MainShell>
        <div className="mx-auto w-full max-w-[1520px] px-4 sm:px-6 lg:px-8 pt-8 pb-12">
          <div className="text-center">Застройщик не найден</div>
        </div>
      </MainShell>
    );
  }

  const buildings = buildingsData?.data || [];
  const logoUrl = developer.logo_path
    ? resolveMediaUrl(developer.logo_path, '/images/no-image.png', source)
    : '/images/no-image.png';
  const phoneNumber = developer.phone || '';
  const cleanPhone = phoneNumber.replace(/[^\d+]/g, '');

  return (
    <MainShell>
      <div className="mx-auto w-full max-w-[1520px] px-4 sm:px-6 lg:px-8 pt-8 pb-12">
        <div className="flex gap-5 mb-10">
        <div className="bg-white min-w-[70%] rounded-[22px] p-[50px] mb-5">
          <div className="flex items-center gap-4 mb-6">
            <div className="relative w-[80px] h-[80px] rounded-full overflow-hidden flex-shrink-0">
              <FallbackImage
                src={logoUrl}
                alt={developer.name}
                fill
                className="object-cover"
              />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold mb-0.5">
                {developer.name}
              </h1>
              <p className="text-[#666F8D]">
                {developer.address || `ул.Айни 64 г.Душанбе`}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-y-3 gap-x-20 mb-8 text-sm">
            <div className="flex justify-between pb-1.5 border-b border-b-[#E3E6EA]">
              <div className="text-[#666F8D]">Год основания</div>
              <div>{developer.founded_year || '2021'}</div>
            </div>
            <div className="flex justify-between pb-1.5 border-b border-b-[#E3E6EA]">
              <div className="text-[#666F8D]">Всего проектов</div>
              <div>{developer.total_projects || '3'}</div>
            </div>
            <div className="flex justify-between">
              <div className="text-[#666F8D]">На стадии строительства</div>
              <div>{developer.under_construction_count || '2'}</div>
            </div>
            <div className="flex justify-between">
              <div className="text-[#666F8D]">Завершённые объекты</div>
              <div>{developer.built_count || '1'}</div>
            </div>
          </div>

          {developer.description ? (
            <p className="text-base mb-6">{developer.description}</p>
          ) : (
            <p className="text-base mb-6">Нет описания застройщика</p>
          )}

          <div className="flex gap-3">
            {developer.facebook && (
              <Link
                href={formatUrl(developer.facebook)}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full flex items-center justify-center hover:opacity-80 transition-opacity"
                aria-label="Facebook"
              >
                <FacebookBlueIcon className="w-10 h-10 text-white" />
              </Link>
            )}
            {developer.instagram && (
              <Link
                href={formatUrl(developer.instagram)}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full flex items-center justify-center hover:opacity-80 transition-opacity"
                aria-label="Instagram"
              >
                <InstagramIcon />
              </Link>
            )}
            {(developer.phone || developer.whatsapp) && (
              <Link
                href={`https://wa.me/${cleanPhone}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full flex items-center justify-center hover:opacity-80 transition-opacity"
                aria-label="WhatsApp"
              >
                <WhatsappGreenIcon className="w-10 h-10" />
              </Link>
            )}
          </div>
        </div>

        {phoneNumber && (
          <div className="flex flex-col gap-2.5 w-full">
            <div className="bg-white rounded-[22px] px-6 py-4">
              <Link
                href={`tel:${cleanPhone}`}
                className="w-full flex items-center"
              >
                <div className="bg-[#0036A5] p-2.5 rounded-full w-11 h-11 mr-3">
                  <PhoneIcon className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-sm text-[#666F8D] mb-0.5">
                    Телефон застройщика
                  </div>
                  <div className="text-xl font-bold">{phoneNumber}</div>
                </div>
              </Link>
            </div>

            <div className="bg-[#22C55E] text-white rounded-[22px] px-8 py-4">
              <Link
                target="_blank"
                href={`https://wa.me/${cleanPhone}`}
                className="w-full rounded-full flex items-center"
              >
                <div className="flex items-center justify-center bg-white rounded-full w-11 h-11 mr-2">
                  <WhatsappGreenIcon className="w-8 h-8" />
                </div>
                <div>
                  <div className="text-sm mb-0.5">Написать в</div>
                  <div className="text-2xl font-bold">Whatsapp</div>
                </div>
              </Link>
            </div>
          </div>
        )}
        </div>

        {buildingsLoading ? (
          <div className="animate-pulse">
            <div className="h-8 w-48 bg-gray-200 rounded mb-5" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-96 bg-gray-200 rounded-[22px]" />
              ))}
            </div>
          </div>
        ) : buildings.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {buildings.map((building) => (
              <NewBuildingCardWithPhotos key={building.id} building={building} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-[22px] px-4 py-10 text-center">
            <p className="text-[#666F8D] text-lg">
              У этого застройщика пока нет объектов
            </p>
          </div>
        )}
      </div>
    </MainShell>
  );
}
