'use client';

import { FormEvent, useMemo, useState } from 'react';
import Image from 'next/image';
import {
  Building2,
  BedDouble,
  CalendarDays,
  CarFront,
  Factory,
  Gauge,
  HandCoins,
  HardHat,
  KeyRound,
  Layers3,
  MapPin,
  Maximize2,
  SlidersHorizontal,
  WalletCards,
  X,
  type LucideIcon,
} from 'lucide-react';
import { SearchableSelect } from '@/ui-components/SearchableSelect';
import { orderHomeLocationOptions } from '@/services/home/location-options';

export type DesktopHomeCatalog = 'all' | 'properties' | 'new-buildings' | 'cars';

export type DesktopHomeSearch = {
  catalog: DesktopHomeCatalog;
  offerType: '' | 'sale' | 'rent';
  categoryId: string;
  locationId: string;
  query: string;
  priceFrom: string;
  priceTo: string;
  roomsFrom: string;
  roomsTo: string;
  areaFrom: string;
  areaTo: string;
  floorFrom: string;
  floorTo: string;
  yearBuiltFrom: string;
  yearBuiltTo: string;
  yearFrom: string;
  yearTo: string;
  mileageFrom: string;
  mileageTo: string;
  developerId: string;
  stageId: string;
  materialId: string;
  ceilingFrom: string;
  ceilingTo: string;
};

type FilterOption = { id: number | string; name: string };

type HeroTabOption = {
  id: string;
  label: string;
  icon: LucideIcon;
  disabled?: boolean;
  title?: string;
};

type HeroSegmentedTabsProps = {
  label: string;
  value: string;
  options: HeroTabOption[];
  onValueChange: (value: string) => void;
};

function HeroSegmentedTabs({ label, value, options, onValueChange }: HeroSegmentedTabsProps) {
  return (
    <div
      role="tablist"
      aria-label={label}
      className="flex h-10 items-center gap-1"
    >
      {options.map((option) => {
        const isSelected = value === option.id;
        const Icon = option.icon;

        return (
          <button
            key={option.id}
            type="button"
            role="tab"
            aria-selected={isSelected}
            disabled={option.disabled}
            title={option.title}
            onClick={() => onValueChange(option.id)}
            className={`flex h-full items-center justify-center gap-2 rounded-[12px] px-4 text-[14px] font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16845F] focus-visible:ring-offset-1 ${
              isSelected
                ? 'bg-[#E2F2EA] text-[#006341] shadow-[inset_0_0_0_1px_rgba(0,99,65,0.08)]'
                : 'text-[#4B5953] hover:bg-[#F1F6F3] hover:text-[#006341]'
            } disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-transparent disabled:hover:text-[#4B5953]`}
          >
            <Icon size={17} strokeWidth={1.9} aria-hidden="true" />
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

type RangeFilterGroupProps = {
  label: string;
  icon: LucideIcon;
  from: string;
  to: string;
  onFromChange: (value: string) => void;
  onToChange: (value: string) => void;
  fromPlaceholder?: string;
  toPlaceholder?: string;
};

function RangeFilterGroup({
  label,
  icon: Icon,
  from,
  to,
  onFromChange,
  onToChange,
  fromPlaceholder = 'От',
  toPlaceholder = 'До',
}: RangeFilterGroupProps) {
  return (
    <fieldset className="rounded-[14px] border border-[#E1E8E4] bg-[#FAFCFB] p-3">
      <legend className="sr-only">{label}</legend>
      <div className="mb-2 flex items-center gap-2 text-[13px] font-semibold text-[#33453D]">
        <Icon size={16} className="text-[#087A57]" aria-hidden="true" />
        {label}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <input
          value={from}
          onChange={(event) => onFromChange(event.target.value.replace(/\D+/g, ''))}
          inputMode="numeric"
          aria-label={`${label}, от`}
          placeholder={fromPlaceholder}
          className="h-10 min-w-0 rounded-[10px] border border-[#DDE5E1] bg-white px-3 text-sm outline-none transition placeholder:text-[#98A39E] focus:border-[#16845F] focus:ring-2 focus:ring-[#DDF1E9]"
        />
        <input
          value={to}
          onChange={(event) => onToChange(event.target.value.replace(/\D+/g, ''))}
          inputMode="numeric"
          aria-label={`${label}, до`}
          placeholder={toPlaceholder}
          className="h-10 min-w-0 rounded-[10px] border border-[#DDE5E1] bg-white px-3 text-sm outline-none transition placeholder:text-[#98A39E] focus:border-[#16845F] focus:ring-2 focus:ring-[#DDF1E9]"
        />
      </div>
    </fieldset>
  );
}

const ROOM_PRESET_OPTIONS: FilterOption[] = [
  { id: '', name: 'Комнаты' },
  { id: '1', name: '1 комната' },
  { id: '2', name: '2 комнаты' },
  { id: '3', name: '3 комнаты' },
  { id: '4+', name: '4+ комнат' },
];

const CAR_YEAR_PRESET_OPTIONS: FilterOption[] = [
  { id: '', name: 'Любой год' },
  { id: '2024', name: 'От 2024 года' },
  { id: '2020', name: 'От 2020 года' },
  { id: '2015', name: 'От 2015 года' },
  { id: '2010', name: 'От 2010 года' },
];

type DesktopHomeHeroProps = {
  propertyTypes: FilterOption[];
  carCategories: FilterOption[];
  locations: FilterOption[];
  developers: FilterOption[];
  constructionStages: FilterOption[];
  materials: FilterOption[];
  onSearch: (filters: DesktopHomeSearch) => void;
};

const initialSearch: DesktopHomeSearch = {
  catalog: 'properties',
  offerType: 'sale',
  categoryId: '',
  locationId: '',
  query: '',
  priceFrom: '',
  priceTo: '',
  roomsFrom: '',
  roomsTo: '',
  areaFrom: '',
  areaTo: '',
  floorFrom: '',
  floorTo: '',
  yearBuiltFrom: '',
  yearBuiltTo: '',
  yearFrom: '',
  yearTo: '',
  mileageFrom: '',
  mileageTo: '',
  developerId: '',
  stageId: '',
  materialId: '',
  ceilingFrom: '',
  ceilingTo: '',
};

export default function DesktopHomeHero({
  propertyTypes,
  carCategories,
  locations,
  developers,
  constructionStages,
  materials,
  onSearch,
}: DesktopHomeHeroProps) {
  const [filters, setFilters] = useState<DesktopHomeSearch>(initialSearch);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const categoryOptions = useMemo(() => {
    if (filters.catalog === 'cars') return carCategories;
    if (filters.catalog === 'properties' || filters.catalog === 'all') return propertyTypes;
    return [];
  }, [carCategories, filters.catalog, propertyTypes]);
  const orderedLocations = useMemo(
    () => orderHomeLocationOptions(locations),
    [locations]
  );

  const update = <Key extends keyof DesktopHomeSearch>(
    key: Key,
    value: DesktopHomeSearch[Key]
  ) => setFilters((current) => ({ ...current, [key]: value }));

  const changeCatalog = (catalog: DesktopHomeCatalog) => {
    setFilters((current) => ({
      ...current,
      catalog,
      categoryId: '',
      offerType: catalog === 'cars' || catalog === 'new-buildings' ? 'sale' : current.offerType,
      roomsFrom: catalog === 'cars' ? '' : current.roomsFrom,
      roomsTo: catalog === 'cars' ? '' : current.roomsTo,
      yearFrom: catalog === 'cars' ? current.yearFrom : '',
      yearTo: catalog === 'cars' ? current.yearTo : '',
      mileageFrom: catalog === 'cars' ? current.mileageFrom : '',
      mileageTo: catalog === 'cars' ? current.mileageTo : '',
    }));
  };

  const primaryRangeValue = filters.catalog === 'cars'
    ? filters.yearFrom
    : filters.roomsFrom === '4' && !filters.roomsTo
      ? '4+'
      : filters.roomsFrom && filters.roomsFrom === filters.roomsTo
        ? filters.roomsFrom
        : '';

  const changePrimaryRange = (value: string) => {
    if (filters.catalog === 'cars') {
      setFilters((current) => ({ ...current, yearFrom: value, yearTo: '' }));
      return;
    }

    if (value === '4+') {
      setFilters((current) => ({ ...current, roomsFrom: '4', roomsTo: '' }));
      return;
    }

    setFilters((current) => ({ ...current, roomsFrom: value, roomsTo: value }));
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSearch(filters);
  };

  const categoryPlaceholder = filters.catalog === 'cars'
    ? 'Категория авто'
    : filters.catalog === 'new-buildings'
      ? 'Все новостройки'
      : 'Тип недвижимости';

  return (
    <section className="relative z-20 left-1/2 right-1/2 hidden min-h-[590px] w-screen -mx-[50vw] overflow-visible bg-[#EED1B7] md:block lg:min-h-[640px] xl:min-h-[680px]">
      <Image
        src="/images/banner/home-hero-desktop.png"
        alt="Современный Душанбе на закате"
        fill
        priority
        quality={85}
        sizes="100vw"
        className="object-cover object-center"
      />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,248,240,0.12)_0%,rgba(255,244,229,0.02)_48%,rgba(20,22,21,0.12)_100%)]" />

      <div className="relative z-10 mx-auto flex min-h-[590px] max-w-[1520px] flex-col items-center justify-center px-6 pb-8 pt-[72px] lg:min-h-[640px] xl:min-h-[680px]">
        <h1 className="max-w-[720px] text-center text-[38px] font-extrabold leading-[1.06] tracking-[-0.035em] text-[#494044] lg:text-[44px] xl:text-[48px]">
          Покупайте, арендуйте и продавайте{' '}
          <span className="text-[#006341]">легко</span>
        </h1>
        <p className="mt-3 max-w-[620px] text-center text-[17px] leading-[1.28] text-[#67514E] lg:text-[19px]">
          Машины, квартиры, дома и другая недвижимость<br className="hidden lg:block" /> в Таджикистане на одной платформе.
        </p>

        <form onSubmit={submit} className="mt-6 w-full max-w-[1180px]">
          <div className="relative w-full">
            {showAdvanced ? (
              <div className="absolute right-0 top-full z-30 mt-3 w-full max-w-[980px] rounded-[20px] border border-white/65 bg-white/88 p-5 shadow-[0_22px_52px_rgba(23,35,30,0.2)] backdrop-blur-xl">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-[#17221E]">Дополнительные параметры</p>
                    <p className="mt-0.5 text-xs text-[#77817D]">Уточните параметры, чтобы быстрее найти подходящее объявление</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAdvanced(false)}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F1F5F3] text-[#51615A] hover:bg-[#E4ECE8]"
                    aria-label="Закрыть дополнительные фильтры"
                  >
                    <X size={17} />
                  </button>
                </div>
                {filters.catalog === 'new-buildings' ? (
                  <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
                    <SearchableSelect
                      label="Застройщик"
                      name="home-hero-developer"
                      value={filters.developerId}
                      options={[{ id: '', name: 'Все застройщики' }, ...developers]}
                      onValueChange={(value) => update('developerId', value)}
                      placeholder="Все застройщики"
                      searchPlaceholder="Поиск застройщика"
                      icon={Building2}
                      variant="compact"
                    />
                    <SearchableSelect
                      label="Стадия строительства"
                      name="home-hero-stage"
                      value={filters.stageId}
                      options={[{ id: '', name: 'Любая стадия' }, ...constructionStages]}
                      onValueChange={(value) => update('stageId', value)}
                      placeholder="Любая стадия"
                      searchPlaceholder="Поиск стадии"
                      icon={HardHat}
                      variant="compact"
                    />
                    <SearchableSelect
                      label="Материал дома"
                      name="home-hero-material"
                      value={filters.materialId}
                      options={[{ id: '', name: 'Любой материал' }, ...materials]}
                      onValueChange={(value) => update('materialId', value)}
                      placeholder="Любой материал"
                      searchPlaceholder="Поиск материала"
                      icon={Factory}
                      variant="compact"
                    />
                    <input
                      value={filters.ceilingFrom}
                      onChange={(event) => update('ceilingFrom', event.target.value)}
                      inputMode="decimal"
                      placeholder="Потолок от, м"
                      className="h-11 rounded-[10px] border border-[#DFE5E2] px-3 text-sm outline-none focus:border-[#006341]"
                    />
                    <input
                      value={filters.ceilingTo}
                      onChange={(event) => update('ceilingTo', event.target.value)}
                      inputMode="decimal"
                      placeholder="Потолок до, м"
                      className="h-11 rounded-[10px] border border-[#DFE5E2] px-3 text-sm outline-none focus:border-[#006341]"
                    />
                  </div>
                ) : filters.catalog === 'cars' ? (
                  <div className="grid gap-3 lg:grid-cols-3">
                    <RangeFilterGroup
                      label="Цена, сомони"
                      icon={WalletCards}
                      from={filters.priceFrom}
                      to={filters.priceTo}
                      onFromChange={(value) => update('priceFrom', value)}
                      onToChange={(value) => update('priceTo', value)}
                    />
                    <RangeFilterGroup
                      label="Год выпуска"
                      icon={CalendarDays}
                      from={filters.yearFrom}
                      to={filters.yearTo}
                      onFromChange={(value) => update('yearFrom', value)}
                      onToChange={(value) => update('yearTo', value)}
                    />
                    <RangeFilterGroup
                      label="Пробег, км"
                      icon={Gauge}
                      from={filters.mileageFrom}
                      to={filters.mileageTo}
                      onFromChange={(value) => update('mileageFrom', value)}
                      onToChange={(value) => update('mileageTo', value)}
                    />
                  </div>
                ) : (
                  <div className="grid gap-3 lg:grid-cols-3">
                    <RangeFilterGroup
                      label="Цена, сомони"
                      icon={WalletCards}
                      from={filters.priceFrom}
                      to={filters.priceTo}
                      onFromChange={(value) => update('priceFrom', value)}
                      onToChange={(value) => update('priceTo', value)}
                    />
                    <RangeFilterGroup
                      label="Площадь, м²"
                      icon={Maximize2}
                      from={filters.areaFrom}
                      to={filters.areaTo}
                      onFromChange={(value) => update('areaFrom', value)}
                      onToChange={(value) => update('areaTo', value)}
                    />
                    <RangeFilterGroup
                      label="Количество комнат"
                      icon={BedDouble}
                      from={filters.roomsFrom}
                      to={filters.roomsTo}
                      onFromChange={(value) => update('roomsFrom', value)}
                      onToChange={(value) => update('roomsTo', value)}
                    />
                    <RangeFilterGroup
                      label="Этаж"
                      icon={Layers3}
                      from={filters.floorFrom}
                      to={filters.floorTo}
                      onFromChange={(value) => update('floorFrom', value)}
                      onToChange={(value) => update('floorTo', value)}
                    />
                    <RangeFilterGroup
                      label="Год постройки"
                      icon={CalendarDays}
                      from={filters.yearBuiltFrom}
                      to={filters.yearBuiltTo}
                      onFromChange={(value) => update('yearBuiltFrom', value)}
                      onToChange={(value) => update('yearBuiltTo', value)}
                    />
                  </div>
                )}
              </div>
            ) : null}

            <div className="rounded-[26px] border border-white/55 bg-white/68 p-2.5 shadow-[0_16px_38px_rgba(26,31,29,0.18)] backdrop-blur-[4px]">
              <div className="mb-2 flex min-h-11 items-center px-1">
                <div className="flex items-center gap-2 rounded-[16px] bg-white/38 p-1">
                  <HeroSegmentedTabs
                    label="Раздел объявлений"
                    value={filters.catalog}
                    options={[
                      { id: 'properties', label: 'Недвижимость', icon: Building2 },
                      { id: 'cars', label: 'Авто', icon: CarFront },
                    ]}
                    onValueChange={(value) => changeCatalog(value as DesktopHomeCatalog)}
                  />

                  <span aria-hidden="true" className="h-6 w-px bg-[#D7E2DC]" />

                  <HeroSegmentedTabs
                    label="Тип сделки"
                    value={filters.offerType}
                    options={[
                      { id: 'sale', label: 'Купить', icon: HandCoins },
                      {
                        id: 'rent',
                        label: 'Арендовать',
                        icon: KeyRound,
                        disabled: filters.catalog === 'cars',
                        title: filters.catalog === 'cars' ? 'Аренда автомобилей пока недоступна' : undefined,
                      },
                    ]}
                    onValueChange={(value) => update('offerType', value as DesktopHomeSearch['offerType'])}
                  />
                </div>
              </div>

              <div className="grid h-[60px] grid-cols-[1fr_1.08fr_180px_146px_150px] gap-2 overflow-visible rounded-[17px]">
                <SearchableSelect
                  label="Категория"
                  name="home-hero-category"
                  value={filters.categoryId}
                  options={[{ id: '', name: categoryPlaceholder }, ...categoryOptions]}
                  onValueChange={(value) => update('categoryId', value)}
                  disabled={filters.catalog === 'new-buildings'}
                  placeholder={categoryPlaceholder}
                  searchPlaceholder="Поиск категории"
                  icon={filters.catalog === 'cars' ? CarFront : Building2}
                  variant="hero"
                  searchable={false}
                />

                <SearchableSelect
                  label="Город"
                  name="home-hero-location"
                  value={filters.locationId}
                  options={[{ id: '', name: 'По всему Таджикистану' }, ...orderedLocations]}
                  onValueChange={(value) => update('locationId', value)}
                  placeholder="По всему Таджикистану"
                  searchPlaceholder="Введите название города"
                  emptyMessage="Город не найден"
                  icon={MapPin}
                  variant="hero"
                />

                <SearchableSelect
                  label={filters.catalog === 'cars' ? 'Год выпуска' : 'Комнаты'}
                  name="home-hero-primary-range"
                  value={primaryRangeValue}
                  options={filters.catalog === 'cars' ? CAR_YEAR_PRESET_OPTIONS : ROOM_PRESET_OPTIONS}
                  onValueChange={changePrimaryRange}
                  placeholder={filters.catalog === 'cars' ? 'Любой год' : 'Комнаты'}
                  searchPlaceholder={filters.catalog === 'cars' ? 'Выберите год' : 'Выберите комнаты'}
                  icon={filters.catalog === 'cars' ? CalendarDays : BedDouble}
                  variant="hero"
                  searchable={false}
                />

                <button
                  type="button"
                  onClick={() => setShowAdvanced((current) => !current)}
                  aria-expanded={showAdvanced}
                  className={`inline-flex items-center justify-center gap-2 rounded-[15px] border text-[14px] font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16845F] focus-visible:ring-offset-1 ${showAdvanced ? 'border-[#BFD9CC]/80 bg-[#E2F2EA]/82 text-[#006341]' : 'border-white/65 bg-white/64 text-[#334840] hover:border-[#BFD9CC] hover:bg-white/80 hover:text-[#006341]'}`}
                >
                  <SlidersHorizontal size={18} aria-hidden="true" />
                  Все фильтры
                </button>

                <button
                  type="submit"
                  className="rounded-[15px] bg-[#006341] text-[19px] font-bold text-white transition hover:bg-[#004D33] active:scale-[0.99]"
                >
                  Найти
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </section>
  );
}
