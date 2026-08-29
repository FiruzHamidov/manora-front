'use client';

import { useEffect, useRef, useState } from 'react';
import { residentialFreshness } from '@/services/new-buildings/analytics';
import { trackResidential, measureResidential } from '@/services/new-buildings/track';
import Link from 'next/link';
import UnitComparisonButton from '@/ui-components/UnitComparisonButton';
import ResidentialShareButton from '@/ui-components/ResidentialShareButton';
import FavoriteButton from '@/ui-components/favorite-button/favorite-button';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import { API_BASE_URL } from '@/config/api';
import { fetchPublicUnit, PublicUnitError } from '@/services/new-buildings/public-unit-api';
import { formatCompletion } from '@/services/new-buildings/completion';
import { residentialDateLabel } from '@/services/new-buildings/dates';
import { observeContactSections } from '@/services/new-buildings/contact-bar';
import { formatResidentialDecimal as decimal, unitFilterContext, unitFloorLabel, unitPrice, unitPrimaryActionLabel, unitSelectionHref, unitTitle, UNIT_STATUS_LABELS, type PublicUnit } from '@/services/new-buildings/public-unit';
import { ResidentialContactForm } from '../../../_components/ResidentialContactForm';
import { ResidentialLeadRecoveryBoundary } from '../../../_components/ResidentialLeadRecoveryBoundary';
import SimilarUnits from './SimilarUnits';
import UnitMedia from './UnitMedia';
import PaymentPrograms from '../../../../_components/PaymentPrograms';

export default function PublicUnitScreen({ initialUnit }: { initialUnit: PublicUnit }) {
  const search = useSearchParams();
  const filters = unitFilterContext(new URLSearchParams(search.toString()));
  const query = useQuery({
    queryKey: ['public-unit', initialUnit.new_building_id, initialUnit.id],
    queryFn: ({ signal }) => measureResidential({ surface: 'unit', building_id: initialUnit.new_building_id, unit_id: initialUnit.id, endpoint: 'detail' }, () => fetchPublicUnit(API_BASE_URL, String(initialUnit.new_building_id), String(initialUnit.id), signal), signal),
    initialData: initialUnit, staleTime: 15000, refetchInterval: 30000, refetchOnWindowFocus: 'always',
    retry: (count, error) => !(error instanceof PublicUnitError && error.status === 404) && count < 1,
  });
  const unit = query.data;
  const contact = useRef<HTMLDivElement>(null);
  const purchase = useRef<HTMLElement>(null);
  const [purchaseMounted, setPurchaseMounted] = useState(initialUnit.availability_status !== 'sold');
  // Once opened, keep the form's receipt and payload even if the unit is sold later.
  useEffect(() => { if (unit.availability_status !== 'sold') setPurchaseMounted(true); }, [unit.availability_status]);
  const [showMobileContact, setShowMobileContact] = useState(false);
  useEffect(() => observeContactSections([contact.current, purchase.current], setShowMobileContact),
    [unit.id, unit.availability_status, purchaseMounted]);
  const viewed = useRef<number | null>(null);
  useEffect(() => {
    if (viewed.current === initialUnit.id) return;
    viewed.current = initialUnit.id;
    trackResidential('unit_view', { surface: 'unit', building_id: initialUnit.new_building_id, unit_id: initialUnit.id, ...residentialFreshness(initialUnit) });
  }, [initialUnit]);
  const selection = unitSelectionHref(unit.new_building_id, filters);
  const missing = query.error instanceof PublicUnitError && query.error.status === 404;
  const size = (value: string | null) => value === null ? 'Не указана' : decimal(value) + ' м²';
  const completion = unit.block ?? unit.building;
  const details: [string, string][] = [
    ['Корпус', unit.block?.name || 'Не указан'], ['Подъезд', unit.entrance?.name || 'Не указан'],
    ['Номер квартиры', unit.number || 'Не указан'], ['Этаж', unitFloorLabel(unit)],
    ['Общая площадь', size(unit.area)], ['Жилая площадь', size(unit.living_area)], ['Площадь кухни', size(unit.kitchen_area)],
    ['Санузлы', unit.bathrooms === null ? 'Не указано' : String(unit.bathrooms)],
    ['Отделка', unit.finishing || 'Не указана'], ['Вид из окон', unit.window_view || 'Не указан'],
    ['Высота потолков', unit.building.ceiling_height === null ? 'Не указана' : decimal(unit.building.ceiling_height) + ' м'],
    ['Срок сдачи', formatCompletion(completion)],
  ];
  const verified = residentialDateLabel(unit.building.data_verified_at);
  return <>
    {missing && <section className="mx-auto max-w-4xl px-4 py-16"><h1 className="text-2xl font-bold">Квартира больше недоступна</h1><p className="my-4">Карточка снята с публикации. Ранее показанные условия больше не актуальны. Введённые данные сохранены.</p><button className="mr-4 min-h-11 underline" onClick={() => void query.refetch()}>Повторить загрузку квартиры</button><Link href={selection} className="underline">Вернуться к подбору квартир</Link></section>}
    <ResidentialLeadRecoveryBoundary hidden={missing}>
    <article className="mx-auto max-w-7xl px-4 pb-40 pt-6 md:px-6 xl:pb-12">
    <nav aria-label="Хлебные крошки" className="mb-5 text-sm text-gray-600">
      <ol className="flex flex-wrap gap-2">
        <li><Link href="/new-buildings" className="underline">Жилые комплексы</Link><span aria-hidden="true"> /</span></li>
        <li><Link href={selection} className="underline">{unit.building.title}</Link><span aria-hidden="true"> /</span></li>
        <li aria-current="page">{unit.number ? 'Квартира №' + unit.number : 'Квартира ' + unit.id}</li>
      </ol>
    </nav>
    <Link href={selection} className="inline-block min-h-11 text-sm font-medium text-[#006341] underline">← Вернуться к текущему подбору</Link>
    <FavoriteButton propertyId={unit.id} targetType="developer_unit" label="В избранное" className="mb-4 flex min-h-11 items-center gap-2 rounded-xl border border-green-800 px-4 py-2 text-green-800" />
    <UnitComparisonButton buildingId={unit.new_building_id} unitId={unit.id} />
    <ResidentialShareButton buildingId={unit.new_building_id} unitId={unit.id} title={unitTitle(unit) + " — " + unit.building.title} />
    <h1 className="mb-3 text-2xl font-bold md:text-4xl">{unitTitle(unit)}</h1>
    <p className="mb-6 text-gray-600">{unit.building.title} · {unit.building.address || 'Адрес не указан'}</p>
    {query.isError && <div role="alert" className="mb-5 rounded-xl border border-amber-400 bg-amber-50 p-4">
      Не удалось обновить данные. Ниже показана последняя загруженная версия; актуальность цены и статуса не подтверждена.
      <button type="button" className="ml-2 min-h-11 underline" onClick={() => void query.refetch()}>Повторить обновление</button>
    </div>}
    <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
      <div className="min-w-0 space-y-6">
        <UnitMedia unit={unit} />
        <section aria-labelledby="unit-details" className="rounded-2xl border bg-white p-4 md:p-6">
          <h2 id="unit-details" className="mb-4 text-xl font-semibold">Характеристики квартиры</h2>
          <dl className="grid gap-4 sm:grid-cols-2">{details.map(([label, value]) => <div key={label}><dt className="text-sm text-gray-600">{label}</dt><dd className="break-words font-medium">{value}</dd></div>)}</dl>
        </section>
        {unit.description && <section className="rounded-2xl border bg-white p-4 md:p-6">
          <h2 className="mb-3 text-xl font-semibold">Описание</h2>
          <p className="whitespace-pre-wrap break-words">{unit.description}</p>
        </section>}
        {purchaseMounted && <ResidentialLeadRecoveryBoundary hidden={unit.availability_status === 'sold'}><section ref={purchase} className="min-w-0 space-y-4 rounded-2xl border bg-white p-4 md:p-6"><h2 className="text-xl font-semibold">Условия покупки</h2><PaymentPrograms key={unit.id} buildingId={unit.new_building_id} unit={unit} unavailable={query.isError || unit.availability_status === 'sold'} /></section></ResidentialLeadRecoveryBoundary>}
        <SimilarUnits unit={unit} unavailable={query.isError} />
      </div>
      <aside className="min-w-0">
        <div className="space-y-5 rounded-2xl border bg-white p-4 xl:sticky xl:top-24 xl:max-h-[calc(100dvh-7rem)] xl:overflow-y-auto xl:overscroll-contain">
          <div>
            <p className="mb-2 inline-block rounded-full bg-gray-100 px-3 py-1 font-semibold">{UNIT_STATUS_LABELS[unit.availability_status]}</p>
            <p className="text-2xl font-bold">{unitPrice(unit.effective_total_price, unit.currency)}</p>
            {unit.discount_price !== null && unit.total_price !== null && unit.discount_price !== unit.total_price && <p className="text-sm text-gray-600">Цена без скидки: <s>{unitPrice(unit.total_price, unit.currency)}</s></p>}
            <p className="mt-1 text-sm text-gray-600">{unit.effective_price_per_sqm === null ? 'Цена за м² по запросу' : unitPrice(unit.effective_price_per_sqm, unit.currency) + ' / м²'}</p>
            <p className="mt-3 text-sm">Сдача: {formatCompletion(completion)}</p>
            <p className="mt-2 text-xs text-gray-600">Данные ЖК проверены: {verified ?? 'дата не указана'}</p>
            {unit.availability_status === 'reserved' && <p className="mt-3 text-sm">Квартира забронирована. Можно запросить уведомление об освобождении или подбор похожих вариантов.</p>}
            {unit.availability_status === 'sold' && <p className="mt-3 text-sm">Квартира продана. Manora может подобрать похожие предложения; их наличие нужно уточнить.</p>}
          </div>
          {unit.building.developer && <p className="text-sm">Застройщик: {unit.building.developer.name}</p>}
          {unit.building.consultant ? <div className="border-t pt-4">
            <p className="text-sm text-gray-600">Ваш консультант Manora</p>
            <p className="font-semibold">{unit.building.consultant.name}</p>
            <a className="inline-block min-h-11 pt-2 text-[#006341] underline" href={'tel:' + unit.building.consultant.phone}>{unit.building.consultant.phone}</a>
          </div> : <p className="text-sm text-gray-600">Контакт консультанта пока не указан. Вы можете оставить обращение в Manora.</p>}
          <div ref={contact} id="unit-contact" className="scroll-mt-28 border-t pt-4">
            <ResidentialContactForm key={unit.id} building={{ id: unit.new_building_id }} unit={unit} filters={filters} unavailable={query.isError} />
          </div>
        </div>
      </aside>
    </div>
    {showMobileContact && <div className="fixed inset-x-0 bottom-[calc(104px+env(safe-area-inset-bottom))] z-[80] flex items-center justify-between gap-3 border-t bg-white px-4 py-3 shadow-lg md:bottom-[env(safe-area-inset-bottom)] xl:hidden">
      <span className="min-w-0 text-sm font-semibold">{query.isError ? 'Данные требуют обновления' : unitPrice(unit.effective_total_price, unit.currency)}</span>
      <a href="#unit-contact" className="shrink-0 rounded-xl bg-[#006341] px-4 py-3 text-sm font-semibold text-white">{unitPrimaryActionLabel(unit.availability_status)}</a>
    </div>}
  </article></ResidentialLeadRecoveryBoundary></>;
}
