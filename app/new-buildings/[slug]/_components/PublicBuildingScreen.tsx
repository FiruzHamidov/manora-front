'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import Link from 'next/link';
import ResidentialShareButton from '@/ui-components/ResidentialShareButton';
import FavoriteButton from '@/ui-components/favorite-button/favorite-button';
import { useSearchParams } from 'next/navigation';
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import { useQuery } from '@tanstack/react-query';
import { residentialFreshness } from '@/services/new-buildings/analytics';
import { residentialDateLabel } from '@/services/new-buildings/dates';
import { observeContactSections } from '@/services/new-buildings/contact-bar';
import { trackResidential, measureResidential } from '@/services/new-buildings/track';
import { API_BASE_URL } from '@/config/api';
import { fetchPublicBuilding, PublicBuildingError } from '@/services/new-buildings/public-building-api';
import { buildingSections, buildingUpdatedLabel, residentialInventoryLabel, type PublicBuilding } from '@/services/new-buildings/public-building';
import { formatCompletion, formatCompletionRange } from '@/services/new-buildings/completion';
import { formatResidentialDecimal, unitPrice } from '@/services/new-buildings/public-unit';
import { changeSelection, readUnitSelection, selectionNavigation } from '@/services/new-buildings/unit-selection';
import BuildingGallery from './BuildingGallery';
import BuildingMasterplan from './BuildingMasterplan';
import BuildingLocation from './BuildingLocation';
import BuildingVideos from './BuildingVideos';
import BuildingReviews from './BuildingReviews';
import PaymentPrograms from '../../_components/PaymentPrograms';
import { UnitSelection } from './UnitSelection';
import { ResidentialContactForm } from './ResidentialContactForm';
import { ResidentialLeadRecoveryBoundary } from './ResidentialLeadRecoveryBoundary';

const card = 'min-w-0 rounded-3xl border border-gray-200 bg-white p-4 md:p-6';
const button = 'inline-flex min-h-11 items-center justify-center rounded-xl border border-[#006341] px-4 py-3 text-center font-semibold text-[#006341] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006341]';
export default function PublicBuildingScreen({ initialBuilding }: { initialBuilding: PublicBuilding }) {
  const query = useQuery<PublicBuilding, PublicBuildingError>({
    queryKey: ['public-building', initialBuilding.id],
    queryFn: ({ signal }) => measureResidential({ surface: 'building', building_id: initialBuilding.id, endpoint: 'detail' }, () => fetchPublicBuilding(API_BASE_URL, String(initialBuilding.id), signal), signal),
    initialData: initialBuilding, staleTime: 0, refetchInterval: 30_000, refetchOnWindowFocus: true,
    retry: (count, error) => error.status !== 404 && count < 1,
  });
  const building = query.data ?? initialBuilding;
  const verifiedDate = residentialDateLabel(building.data_verified_at);
  const viewed = useRef<number | null>(null);
  useEffect(() => {
    if (viewed.current === initialBuilding.id) return;
    viewed.current = initialBuilding.id;
    trackResidential('building_view', { surface: 'building', building_id: initialBuilding.id, ...residentialFreshness(initialBuilding) });
  }, [initialBuilding]);
  const [hasPrograms, setHasPrograms] = useState(initialBuilding.has_payment_programs);
  useEffect(() => { if (building.has_payment_programs) setHasPrograms(true); }, [building.has_payment_programs]);
  const [contactOpen, setContactOpen] = useState(false), [descriptionOpen, setDescriptionOpen] = useState(false);
  const [contactPending, setContactPending] = useState(false);
  const [headerHeight, setHeaderHeight] = useState(76), [navHeight, setNavHeight] = useState(60), [activeSection, setActiveSection] = useState('characteristics');
  const nav = useRef<HTMLElement | null>(null);
  const contact = useRef<HTMLElement | null>(null);
  const purchase = useRef<HTMLElement | null>(null);
  const reviews = useRef<HTMLDivElement | null>(null);
  const [showMobileContact, setShowMobileContact] = useState(false);
  useEffect(() => observeContactSections([contact.current, purchase.current, reviews.current], setShowMobileContact),
    [building.id, hasPrograms, building.has_payment_programs, query.isError]);
  const initialAnchorHandled = useRef(false);
  const [layoutReady, setLayoutReady] = useState(false);
  const [selectionReady, setSelectionReady] = useState(false);
  const params = useSearchParams(), search = params.toString();
  const filters = useMemo(() => readUnitSelection(new URLSearchParams(search)), [search]);
  const sections = useMemo(() => buildingSections({ ...building, has_payment_programs: hasPrograms || building.has_payment_programs }), [building, hasPrograms]);
  const scrollOffset = headerHeight + navHeight + 16;
  useEffect(() => {
    // Do not move the reader later if they already interacted during initial loading.
    const cancel = () => { initialAnchorHandled.current = true; };
    const events = ['pointerdown', 'wheel', 'touchstart', 'keydown'] as const;
    events.forEach(event => window.addEventListener(event, cancel, { passive: true, once: true }));
    return () => events.forEach(event => window.removeEventListener(event, cancel));
  }, []);
  useEffect(() => {
    const header = document.querySelector('header');
    const observer = new ResizeObserver(() => {
      if (header) setHeaderHeight(Math.ceil(header.getBoundingClientRect().height));
      if (nav.current) setNavHeight(Math.ceil(nav.current.getBoundingClientRect().height));
      setLayoutReady(true);
    });
    if (header) observer.observe(header);
    if (nav.current) observer.observe(nav.current);
    return () => observer.disconnect();
  }, [query.isError]);
  useEffect(() => {
    if (!layoutReady || initialAnchorHandled.current || query.isError) return;
    const id = window.location.hash.slice(1);
    if (!sections.some(section => section.id === id)) { initialAnchorHandled.current = true; return; }
    if (sections.findIndex(section => section.id === id) > sections.findIndex(section => section.id === 'apartments') && !selectionReady) return;
    const target = document.getElementById(id);
    if (!target) return;
    const frame = requestAnimationFrame(() => { target.scrollIntoView({ block: 'start' }); initialAnchorHandled.current = true; });
    return () => cancelAnimationFrame(frame);
  }, [layoutReady, sections, scrollOffset, query.isError, selectionReady]);
  useEffect(() => {
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const visible = sections.filter(section => (document.getElementById(section.id)?.getBoundingClientRect().top ?? Infinity) <= scrollOffset + 24);
        setActiveSection(visible.at(-1)?.id ?? sections[0].id);
      });
    };
    update(); window.addEventListener('scroll', update, { passive: true });
    return () => { cancelAnimationFrame(frame); window.removeEventListener('scroll', update); };
  }, [sections, scrollOffset]);
  const openContact = () => setContactOpen(true);
  const price = building.inventory.min_price === null ? 'Цена по запросу' : 'От ' + unitPrice(building.inventory.min_price);
  const inventoryLabel = residentialInventoryLabel(building.inventory.available_count);
  const apartmentsAction = building.inventory.available_count > 0 ? 'Выбрать квартиру' : 'Посмотреть подбор';
  const updated = buildingUpdatedLabel(building);
  const style = { '--building-header-offset': headerHeight + 'px', '--building-scroll-offset': scrollOffset + 'px' } as CSSProperties;
  return <div className="mx-auto max-w-[1280px] px-3 pb-48 pt-6 sm:px-6 md:pb-24 lg:pb-12" style={style}>
    {query.isError && <section role="alert" className="mx-auto max-w-3xl py-12">
      <h1 className="text-2xl font-bold">{query.error.message}</h1>
      <p className="my-4">{query.error.status === 404 ? 'ЖК может быть снят с публикации.' : 'Актуальные данные не получены. Ранее показанная цена не подтверждена.'}</p>
      <button className={button} onClick={() => void query.refetch()}>Повторить загрузку</button>
      <Link href="/new-buildings" className="ml-4 inline-flex min-h-11 items-center underline">Каталог ЖК</Link>
    </section>}
    <ResidentialLeadRecoveryBoundary hidden={query.isError}>
    <nav aria-label="Хлебные крошки" className="mb-4 text-sm text-gray-600"><Link href="/" className="underline">Главная</Link> / <Link href="/new-buildings" className="underline">Жилые комплексы</Link> / {building.title}</nav>
    <div className="mb-5 space-y-3">
      <h1 className="break-words text-3xl font-bold md:text-4xl">{building.title}</h1>
      <p className="text-gray-600">{[building.city, building.address, building.district].filter(Boolean).join(', ') || 'Адрес не указан'}</p>
      <p>Сдача: {formatCompletionRange(building.completion)}</p>
      {updated && <p className="text-sm text-gray-600">Обновлено: {updated}</p>}
      <p className="text-sm text-gray-600">{verifiedDate ? 'Данные проверены ответственным: ' + verifiedDate : 'Дата проверки данных не указана'}</p>
      <p className="text-2xl font-bold">{price}</p>
      <p className="font-medium">{inventoryLabel}</p>
      <div className="flex flex-wrap gap-3"><a href="#apartments" className={button}>{apartmentsAction}</a><button className={button + ' bg-[#006341] text-white'} onClick={openContact}>Получить консультацию</button></div>
    </div>
    <FavoriteButton propertyId={building.id} targetType="new_building" label="В избранное" className={button + " mb-5 gap-2"} />
    <ResidentialShareButton buildingId={building.id} title={building.title} />
    <BuildingGallery key={building.id + ':' + building.version} building={building} onRefresh={() => { void query.refetch(); }} />
    <nav ref={nav} aria-label="Разделы жилого комплекса" className="sticky top-[var(--building-header-offset)] z-30 my-5 flex flex-nowrap gap-1 overflow-x-auto overscroll-x-contain rounded-2xl border border-gray-200 bg-white/95 p-2 shadow-sm backdrop-blur-sm xl:flex-wrap">
      {sections.map(section => <a key={section.id} href={'#' + section.id} aria-current={activeSection === section.id ? 'location' : undefined}
        className="inline-flex min-h-11 shrink-0 items-center whitespace-nowrap rounded-xl px-3 py-2 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#006341] aria-current:bg-green-50 aria-current:text-[#006341]">{section.label}</a>)}
    </nav>
    <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_310px]">
      <div className="min-w-0 space-y-5">
        <section id="characteristics" className={card} style={{ scrollMarginTop: scrollOffset }}>
          <h2 className="mb-5 text-2xl font-bold">Характеристики</h2>
          <dl className="grid min-w-0 gap-4 sm:grid-cols-2">
            {[
              ['Стадия', building.stage?.name], ['Класс жилья', building.housing_class], ['Материал стен', building.material?.name],
              ['Высота потолков', building.ceiling_height === null ? null : formatResidentialDecimal(building.ceiling_height) + ' м'],
              ['Отопление', building.heating_description], ['Парковка', building.parking_description], ['Благоустройство', building.landscaping_description],
            ].map(([label, value]) => <div key={label} className="min-w-0"><dt className="text-sm text-gray-600">{label}</dt><dd className="mt-1 break-words">{value || 'Не указано'}</dd></div>)}
          </dl>
          <h3 className="mb-3 mt-6 font-semibold">Корпуса и этажность</h3>
          {building.blocks.length ? <ul className="space-y-3">{building.blocks.map(block => <li key={block.id} className="rounded-xl bg-gray-50 p-3">
            <Link href={'?' + selectionNavigation(search, changeSelection(filters, 'block_id', String(block.id))) + '#apartments'} className="font-semibold text-[#006341] underline">{block.name}</Link>
            <p className="mt-1 text-sm">Этажи: {block.floors_from !== null && block.floors_to !== null ? block.floors_from + '–' + block.floors_to : 'Не указаны'} · Сдача: {formatCompletion(block)} · Свободно: {block.available_count}</p>
          </li>)}</ul> : <p className="text-gray-600">Данные о корпусах не указаны.</p>}
          <h3 className="mb-3 mt-6 font-semibold">Удобства</h3>
          {building.features.length ? <ul className="flex flex-wrap gap-2">{building.features.map(feature => <li className="rounded-full bg-green-50 px-3 py-2 text-sm" key={feature.id}>{feature.name}</li>)}</ul> : <p className="text-gray-600">Удобства не указаны.</p>}
        </section>
        <UnitSelection buildingId={building.id} scrollOffset={scrollOffset} onReady={setSelectionReady} />
        {building.has_masterplan && <BuildingMasterplan buildingId={building.id} version={building.version} scrollOffset={scrollOffset} />}
        {sections.some(section => section.id === 'description') && <section id="description" className={card} style={{ scrollMarginTop: scrollOffset }}>
          <h2 className="mb-4 text-2xl font-bold">О комплексе</h2>
          {building.description && <><p className={'whitespace-pre-wrap break-words ' + (!descriptionOpen && building.description.length > 600 ? 'line-clamp-6' : '')}>{building.description}</p>
            {building.description.length > 600 && <button className="mt-3 min-h-11 font-semibold text-[#006341] underline" aria-expanded={descriptionOpen} onClick={() => setDescriptionOpen(value => !value)}>{descriptionOpen ? 'Свернуть описание' : 'Читать описание полностью'}</button>}</>}
          {!!building.advantages?.length && <ul className="mt-4 list-disc space-y-2 pl-5">{building.advantages.map((value, index) => <li key={index}>{value}</li>)}</ul>}
        </section>}
        {sections.some(section => section.id === 'location') && <section id="location" className={card} style={{ scrollMarginTop: scrollOffset }}>
          <h2 className="mb-4 text-2xl font-bold">Расположение</h2>
          <BuildingLocation building={building} />
        </section>}
        {building.has_videos && <BuildingVideos buildingId={building.id} version={building.version} scrollOffset={scrollOffset} unavailable={query.isError} />}
        {(hasPrograms || building.has_payment_programs) && <section ref={purchase} id="payment-programs" className={card} style={{ scrollMarginTop: scrollOffset }}><h2 className="mb-4 text-2xl font-bold">Условия покупки</h2><PaymentPrograms buildingId={building.id} unavailable={query.isError} /></section>}
        <div ref={reviews}><BuildingReviews buildingId={building.id} scrollOffset={scrollOffset} unavailable={query.isError} /></div>
        <section ref={contact} id="contacts" className={card} style={{ scrollMarginTop: scrollOffset }}>
          <h2 className="mb-4 text-2xl font-bold">Застройщик и консультант</h2>
          {building.developer ? <div className="mb-6"><Link href={'/developers/' + building.developer.id} className="text-xl font-semibold text-[#006341] underline">{building.developer.name}</Link>
            {building.developer.founded_year && <p className="mt-2">Год основания: {building.developer.founded_year}</p>}
            {building.developer.description && <p className="mt-3 whitespace-pre-wrap break-words">{building.developer.description}</p>}</div> : <p className="mb-4 text-gray-600">Застройщик не указан.</p>}
          <h3 className="font-semibold">Консультант Manora</h3>
          {building.consultant ? <p className="mt-2">{building.consultant.name} · <a className="inline-flex min-h-11 items-center text-[#006341] underline" href={'tel:' + building.consultant.phone}>{building.consultant.phone}</a></p> : <p className="mt-2 text-gray-600">Контакт консультанта пока не указан. Оставьте заявку в Manora.</p>}
          <button className={button + ' mt-4'} onClick={openContact}>Получить консультацию</button>
        </section>
      </div>
      <aside aria-label="Цена и обращение" className={card + ' sticky top-[var(--building-scroll-offset)] hidden h-fit space-y-4 xl:block'}>
        <p className="text-2xl font-bold">{price}</p>
        {building.inventory.min_price_per_sqm !== null && <p className="text-sm text-gray-600">От {unitPrice(building.inventory.min_price_per_sqm)} / м²</p>}
        <p>{inventoryLabel}</p>
        {building.inventory.reserved_count > 0 && <p className="text-sm">Забронировано: {building.inventory.reserved_count}</p>}
        {building.has_payment_programs ? <a href="#payment-programs" className="inline-flex min-h-11 items-center text-sm text-green-800 underline">Подтверждённые программы покупки</a> : building.installment_available && <p className="text-sm text-amber-800">Рассрочка заявлена. Подтверждённые условия уточните у консультанта.</p>}
        <a href="#apartments" className={button + ' w-full'}>{apartmentsAction}</a>
        <button className={button + ' w-full bg-[#006341] text-white'} onClick={openContact}>Получить консультацию</button>
      </aside>
    </div>
    {showMobileContact && <div role="region" aria-label="Быстрые действия по ЖК" className="fixed inset-x-0 bottom-[calc(104px+env(safe-area-inset-bottom))] z-[80] flex flex-wrap items-center justify-between gap-2 border-t bg-white p-3 shadow-lg md:bottom-[env(safe-area-inset-bottom)] xl:hidden">
      <p className="min-w-0 text-sm font-bold">{price}</p>
      <div className="flex flex-wrap gap-2"><a href="#apartments" className={button + ' text-sm'}>Квартиры</a><button className={button + ' bg-[#006341] text-sm text-white'} onClick={openContact}>Консультация</button></div>
    </div>}
    </ResidentialLeadRecoveryBoundary>
    {contactPending && !contactOpen && <section aria-label="Неподтверждённая заявка" className="mx-auto max-w-xl space-y-3 rounded-xl border border-amber-400 bg-amber-50 p-4">
      <p role="status">Осталась заявка без подтверждения от CRM. Вернитесь к исходной отправке, чтобы проверить результат без дубля.</p>
      <button className={button} onClick={openContact}>Продолжить отправку заявки</button>
    </section>}
    <Dialog open={contactOpen} onClose={setContactOpen} unmount={false} className="relative z-[210]">
      <div className="fixed inset-0 bg-black/60" aria-hidden="true" />
      <div className="fixed inset-0 overflow-y-auto p-3 sm:p-6">
        <DialogPanel className="mx-auto max-w-lg rounded-2xl bg-white p-5">
          <div className="mb-4 flex items-start justify-between gap-3"><DialogTitle className="text-xl font-bold">{query.isError ? 'Консультация по ЖК' : 'Консультация по ЖК ' + building.title}</DialogTitle><button data-autofocus className="min-h-11 underline" onClick={() => setContactOpen(false)}>Закрыть</button></div>
          {query.isError && <p role="alert" className="mb-3 text-red-700">Данные ЖК не подтверждены. Новая заявка доступна после обновления; ранее отправленную можно подтвердить повтором исходных данных. <button className="min-h-11 underline" onClick={() => void query.refetch()}>Обновить данные ЖК</button></p>}
          <ResidentialContactForm building={building} filters={filters} unavailable={query.isError} onSubmissionPendingChange={setContactPending} />
        </DialogPanel>
      </div>
    </Dialog>
  </div>;
}
