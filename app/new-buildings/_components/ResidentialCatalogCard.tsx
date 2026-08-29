'use client';

import ResidentialImage from '@/ui-components/ResidentialImage';
import FavoriteButton from '@/ui-components/favorite-button/favorite-button';
import Link from 'next/link';
import { useState } from 'react';
import { formatCompletionRange } from '@/services/new-buildings/completion';
import { residentialInventoryLabel } from '@/services/new-buildings/public-building';
import { formatResidentialDecimal, unitPrice } from '@/services/new-buildings/public-unit';
import { catalogBuildingHref, type CatalogCard, type CatalogFilters } from '@/services/new-buildings/residential-catalog';

export function ResidentialCatalogCard({ building, filters, priority = false }: { building: CatalogCard; filters: CatalogFilters; priority?: boolean }) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const href = '/new-buildings/' + building.id;
  return <article className="flex min-w-0 flex-col overflow-hidden rounded-3xl border border-gray-200 bg-white">
    <Link href={href} aria-label={building.title} className="relative block aspect-[16/10] bg-gray-100">
      {building.cover && failedUrl !== building.cover.url
        ? <ResidentialImage image={building.cover} alt={building.cover.alt} sizes="(max-width: 767px) 100vw, (max-width: 1279px) 50vw, 33vw" priority={priority}
          className="absolute inset-0 h-full w-full object-cover" onError={() => setFailedUrl(building.cover!.url)} />
        : <span className="flex h-full items-center justify-center text-gray-600">Фото пока нет</span>}
    </Link>
    <div className="flex flex-1 flex-col gap-3 p-5 [overflow-wrap:anywhere]">
      <FavoriteButton propertyId={building.id} targetType="new_building" label="В избранное" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-green-800 p-2 text-green-800" />
      <h2 className="text-xl font-bold"><Link href={href} className="hover:text-[#006341]">{building.title}</Link></h2>
      <p className="text-sm text-gray-600">{[building.city, building.address, building.district].filter(Boolean).join(', ') || 'Адрес не указан'}</p>
      <p className="text-sm">Застройщик: {building.developer?.name || 'Не указан'}</p>
      <p className="text-sm">Сдача: {formatCompletionRange(building.completion)}</p>
      <div>
        <p className="text-xl font-bold">{building.min_price === null ? 'Цена по запросу' : 'От ' + unitPrice(building.min_price)}</p>
        {building.min_price_per_sqm !== null && <p className="mt-1 text-sm text-gray-600">От {unitPrice(building.min_price_per_sqm)} / м²</p>}
      </div>
      <p className="font-medium">{residentialInventoryLabel(building.available_count)}</p>
      {building.rooms_summary.length > 0 && <ul className="flex flex-wrap gap-2" aria-label="Группы квартир">{building.rooms_summary.map(group =>
        <li key={group.rooms ?? 'unknown'}>
          {group.rooms === null ? <span className="block rounded-xl bg-gray-100 p-2 text-sm">Комнаты не указаны: {group.available_count}</span>
            : <Link className="block min-h-11 rounded-xl bg-green-50 p-2 text-sm text-[#005235] hover:underline" href={catalogBuildingHref(building.id, filters, group.rooms)}>
              {group.rooms === '0' ? 'Студии' : group.rooms + '-комн.'}: {group.available_count}
              {group.area_from !== null && <span className="block text-xs">от {formatResidentialDecimal(group.area_from)} м²</span>}
              {group.min_price !== null && <span className="block text-xs">от {unitPrice(group.min_price)}</span>}
            </Link>}
        </li>)}</ul>}
      {building.has_installment_programs ? <Link href={href + '#payment-programs'} className="inline-flex min-h-11 self-start items-center rounded-xl bg-green-50 px-3 py-2 text-sm font-semibold text-[#005235] underline">Условия рассрочки</Link>
        : building.installment_available && <span className="self-start rounded-full bg-amber-50 px-3 py-1 text-sm text-amber-900">Есть рассрочка · условия уточняются</span>}
      <Link href={catalogBuildingHref(building.id, filters)} className="mt-auto flex min-h-11 items-center justify-center rounded-xl border border-[#006341] px-4 py-3 text-center font-semibold text-[#006341]">
        {building.available_count ? 'Выбрать квартиру' : 'Подробнее о ЖК'}
      </Link>
    </div>
  </article>;
}
