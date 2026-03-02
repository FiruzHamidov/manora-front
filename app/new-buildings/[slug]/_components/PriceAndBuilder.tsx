import { FC } from 'react';
import Link from 'next/link';
import { Phone, MessageCircle } from 'lucide-react';
import type {
  NewBuilding,
  NewBuildingStats,
} from '@/services/new-buildings/types';
import { resolveMediaUrl } from '@/constants/base-url';
import FallbackImage from '@/app/_components/FallbackImage';

interface PriceAndBuilderProps {
  building: NewBuilding;
  stats?: NewBuildingStats;
}

export const PriceAndBuilder: FC<PriceAndBuilderProps> = ({
  building,
  stats,
}) => {
  const developer = building.developer;
  const source = building.__source === 'aura' ? 'aura' : 'local';

  if (!developer) {
    return null;
  }

  const phoneNumber = developer.phone || '+992 000 00 00 00';
  const cleanPhone = phoneNumber.replace(/[^\d+]/g, '');
  const developerLogo = resolveMediaUrl(developer.logo_path, '/images/no-image.png', source);

  // Format price display
  const priceDisplay = stats?.total_price?.formatted || 'По запросу';
  const pricePerSqm = stats?.price_per_sqm?.formatted;

  return (
    <aside className="lg:sticky lg:top-4 lg:self-start">
      <div className="overflow-hidden rounded-[26px] bg-white shadow-[0_4px_24px_rgba(15,23,42,0.08)]">
        <div className="border-b border-[#E5E7EB] px-5 py-5">
          <h3 className="text-[28px] font-extrabold leading-tight text-[#111827]">
            {building.title}
          </h3>
          <div className="mt-1 text-sm text-[#64748B]">
            {building.address || 'г. Душанбе'}, район {building.district || 'уточняется'}
          </div>
        </div>

        <div className="border-b border-[#E5E7EB] px-5 py-5">
          <div className="text-sm text-[#64748B]">от</div>
          <div className="mt-1 text-[32px] font-extrabold text-[#0036A5]">
            {priceDisplay}
          </div>
          <div className="mt-1 text-[17px] font-semibold text-[#111827]">
            {pricePerSqm || 'Цена за м² уточняется'}
          </div>
          {building.installment_available && (
            <div className="mt-2 inline-flex rounded-full bg-[#EFF6FF] px-3 py-1 text-xs font-semibold text-[#0036A5]">
              Доступна рассрочка
            </div>
          )}
        </div>

        <div className="px-5 py-5">
          <div className="mb-5 text-sm font-semibold uppercase tracking-[0.08em] text-[#94A3B8]">
            Застройщик
          </div>

          <div className="rounded-2xl bg-[#F8FAFC] p-4">
            <Link href={`/developers/${developer.id}?source=${source}`}>
              <div className="flex items-center gap-4">
                <div className="relative h-[64px] w-[64px] overflow-hidden rounded-full bg-white">
                  <FallbackImage
                    src={developerLogo}
                    alt={developer.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-[#111827]">{developer.name}</h4>
                  <div className="text-sm text-[#64748B]">Бренд застройщика</div>
                </div>
              </div>
            </Link>

            {developer.description ? (
              <div className="mt-4 text-sm leading-6 text-[#64748B]">
                {developer.description}
              </div>
            ) : null}
          </div>

          <div className="mt-5 space-y-3">
            <a
              href={`tel:${cleanPhone}`}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#0036A5] text-sm font-semibold text-white"
            >
              <Phone className="h-4 w-4" />
              Позвонить
            </a>
            <a
              target="_blank"
              rel="noreferrer"
              href={`https://wa.me/${cleanPhone}`}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-[#D7DFEA] bg-white text-sm font-semibold text-[#111827]"
            >
              <MessageCircle className="h-4 w-4 text-green-500" />
              Консультация
            </a>
          </div>
        </div>

        <div className="border-t border-[#E5E7EB] px-5 py-5">
          <div className="space-y-2.5 text-sm text-[#475569]">
            {developer.under_construction_count !== undefined && (
              <div className="flex items-center justify-between">
                <span>Строится</span>
                <span className="font-semibold text-[#111827]">{developer.under_construction_count}</span>
              </div>
            )}
            {developer.built_count !== undefined && (
              <div className="flex items-center justify-between">
                <span>Построено</span>
                <span className="font-semibold text-[#111827]">{developer.built_count}</span>
              </div>
            )}
            {developer.total_projects !== undefined && (
              <div className="flex items-center justify-between">
                <span>Всего проектов</span>
                <span className="font-semibold text-[#111827]">{developer.total_projects}</span>
              </div>
            )}
            {developer.founded_year && (
              <div className="flex items-center justify-between">
                <span>Год основания</span>
                <span className="font-semibold text-[#111827]">{developer.founded_year}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
};
