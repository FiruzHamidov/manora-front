'use client';

import Link from 'next/link';
import { Phone } from 'lucide-react';
import type { NewBuilding, NewBuildingStats } from '@/services/new-buildings/types';
import { ResidentialContactForm } from './ResidentialContactForm';
import { unitPriceRange } from '@/services/new-buildings/public-unit';
import { residentialDateLabel } from '@/services/new-buildings/dates';

export function PriceAndBuilder({ building, stats }: { building: NewBuilding; stats?: NewBuildingStats }) {
  const source = building.__source === 'aura' ? 'aura' : 'local';
  const consultant = source === 'local' ? building.consultant : null;
  const location = [building.address, building.district].filter(Boolean).join(', ');
  const hasPrice = stats?.inventory ? stats.inventory.available_price_min !== null : stats?.total_price?.min != null && stats.total_price.min > 0;
  const price = stats?.inventory ? unitPriceRange(stats.inventory.available_price_min, stats.inventory.price_max) : stats?.total_price?.formatted;
  return <aside id="consultant" className="min-w-0 max-w-full lg:sticky lg:top-4 lg:self-start">
    <div className="min-w-0 max-w-full space-y-5 rounded-[26px] bg-white p-5 shadow-[0_4px_24px_rgba(15,23,42,0.08)]">
      <div className="min-w-0">
        <h2 className="min-w-0 break-words text-2xl font-bold">{building.title}</h2>
        {location && <p className="mt-2 min-w-0 break-words text-sm text-gray-600">{location}</p>}
      </div>
      <div className="border-y py-4">
        {hasPrice && <p className="text-sm text-gray-500">Стоимость свободных квартир</p>}
        <p className="min-w-0 break-all text-2xl font-bold text-[#006341]">{hasPrice ? price : 'Цена по запросу'}</p>
        {!stats?.inventory && stats?.price_per_sqm?.formatted && <p className="mt-1 text-sm">{stats.price_per_sqm.formatted}</p>}
      </div>
      <section aria-label="Консультант Manora" className="min-w-0 space-y-3">
        <h3 className="font-semibold">Консультант Manora</h3>
        {consultant ? <>
          <p>{consultant.name}</p>
          <a href={`tel:${consultant.phone}`} className="flex min-w-0 items-start gap-2 text-[#006341] underline"><Phone aria-hidden="true" className="h-4 w-4 shrink-0" /><span className="min-w-0 break-all">{consultant.phone}</span></a>
        </> : <p className="text-sm text-gray-600">Контакт консультанта уточняется. Можно оставить заявку в Manora.</p>}
      </section>
      <ResidentialContactForm building={building} />
      {building.developer && <div className="border-t pt-4 text-sm"><span className="text-gray-500">Застройщик: </span><Link href={`/developers/${building.developer.id}?source=${source}`} className="underline">{building.developer.name}</Link></div>}
      {building.data_verified_at && <p className="text-xs text-gray-500">Данные проверены {residentialDateLabel(building.data_verified_at) ?? 'дата не указана'}</p>}
    </div>
  </aside>;
}
