'use client';

import { type LucideIcon, Building2, CarFront, Check, Home, KeyRound, RotateCcw, Search, SlidersHorizontal, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { axios } from '@/utils/axios';
import { SearchableSelect } from '@/ui-components/SearchableSelect';
import type { PropertyFilters } from '@/services/properties/types';
import type { CarsFilters } from '@/services/cars/types';
import type { NewBuildingsFilters } from '@/services/new-buildings/types';
import { PROPERTY_DOCUMENT_TYPES } from '@/constants/property-document-types';

type FilterMode = 'secondary' | 'new-buildings' | 'rent' | 'cars';

type OptionItem = {
  id: number | string;
  name: string;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: FilterMode;
};

const MODE_OPTIONS: Array<{ key: FilterMode; label: string; hint: string; icon: LucideIcon }> = [
  { key: 'secondary', label: 'Вторичка', hint: 'Готовое жильё', icon: Home },
  { key: 'new-buildings', label: 'Новостройки', hint: 'Квартиры в ЖК', icon: Building2 },
  { key: 'rent', label: 'Аренда', hint: 'Снять недвижимость', icon: KeyRound },
  { key: 'cars', label: 'Автомобили', hint: 'Новые и с пробегом', icon: CarFront },
];

const FUEL_OPTIONS: Array<{ value: NonNullable<CarsFilters['fuel_type']>; label: string }> = [
  { value: 'petrol', label: 'Бензин' },
  { value: 'diesel', label: 'Дизель' },
  { value: 'hybrid', label: 'Гибрид' },
  { value: 'electric', label: 'Электро' },
  { value: 'gas', label: 'Газ' },
  { value: 'other', label: 'Другое' },
];

const TRANSMISSION_OPTIONS: Array<{ value: NonNullable<CarsFilters['transmission']>; label: string }> = [
  { value: 'manual', label: 'Механика' },
  { value: 'automatic', label: 'Автомат' },
  { value: 'robot', label: 'Робот' },
  { value: 'variator', label: 'Вариатор' },
];

const DRIVE_OPTIONS: Array<{ value: NonNullable<CarsFilters['drive_type']>; label: string }> = [
  { value: 'front', label: 'Передний' },
  { value: 'rear', label: 'Задний' },
  { value: 'all_wheel', label: 'Полный' },
];

const CONDITION_OPTIONS: Array<{ value: NonNullable<CarsFilters['condition']>; label: string }> = [
  { value: 'new', label: 'Новый' },
  { value: 'used', label: 'С пробегом' },
];

const toOptions = (payload: unknown): OptionItem[] => {
  const list = Array.isArray(payload)
    ? payload
    : Array.isArray((payload as { data?: unknown[] })?.data)
      ? (payload as { data?: unknown[] }).data ?? []
      : [];

  return list
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const obj = item as Record<string, unknown>;
      const id = obj.id as number | string | undefined;
      const name = (obj.name ?? obj.title ?? obj.city) as string | undefined;
      if (id === undefined || !name) return null;
      return { id, name };
    })
    .filter((item): item is OptionItem => item !== null);
};

const dedupeOptionsByName = (options: OptionItem[]): OptionItem[] => {
  const unique = new globalThis.Map<string, OptionItem>();
  options.forEach((option) => {
    const key = option.name.trim().toLocaleLowerCase('ru-RU');
    if (key && !unique.has(key)) unique.set(key, option);
  });
  return Array.from(unique.values());
};

type RangeFieldProps = {
  label: string;
  from: string | number | undefined;
  to: string | number | undefined;
  onFromChange: (value: string | undefined) => void;
  onToChange: (value: string | undefined) => void;
  fromPlaceholder?: string;
  toPlaceholder?: string;
};

function RangeField({
  label,
  from,
  to,
  onFromChange,
  onToChange,
  fromPlaceholder = 'От',
  toPlaceholder = 'До',
}: RangeFieldProps) {
  return (
    <div>
      <p className="mb-2 text-[13px] font-semibold text-[#33453D]">{label}</p>
      <div className="grid grid-cols-[1fr_auto_1fr] items-center overflow-hidden rounded-xl border border-[#DCE6E1] bg-white shadow-[0_2px_10px_rgba(15,60,44,0.035)] focus-within:border-[#16845F] focus-within:ring-2 focus-within:ring-[#DDF1E9]">
        <input
          value={from ?? ''}
          onChange={(event) => onFromChange(event.target.value || undefined)}
          className="h-12 min-w-0 bg-transparent px-3 text-sm font-medium text-[#17251F] outline-none placeholder:font-normal placeholder:text-[#96A19C]"
          inputMode="numeric"
          placeholder={fromPlaceholder}
          aria-label={`${label}, от`}
        />
        <span className="text-[#A4AEA9]">—</span>
        <input
          value={to ?? ''}
          onChange={(event) => onToChange(event.target.value || undefined)}
          className="h-12 min-w-0 bg-transparent px-3 text-sm font-medium text-[#17251F] outline-none placeholder:font-normal placeholder:text-[#96A19C]"
          inputMode="numeric"
          placeholder={toPlaceholder}
          aria-label={`${label}, до`}
        />
      </div>
    </div>
  );
}

type ChoiceGroupProps<T extends string> = {
  label: string;
  value: T | undefined;
  options: Array<{ value: T; label: string }>;
  onChange: (value: T | undefined) => void;
};

function ChoiceGroup<T extends string>({ label, value, options, onChange }: ChoiceGroupProps<T>) {
  return (
    <div>
      <p className="mb-2 text-[13px] font-semibold text-[#33453D]">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const selected = value === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(selected ? undefined : option.value)}
              className={`inline-flex min-h-10 items-center gap-1.5 rounded-xl border px-3.5 text-sm font-medium transition active:scale-[0.98] ${
                selected
                  ? 'border-[#006341] bg-[#E9F6F0] text-[#006341]'
                  : 'border-[#DCE6E1] bg-white text-[#4A5A53]'
              }`}
            >
              {selected ? <Check size={14} strokeWidth={2.7} /> : null}
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

const buildQueryString = (input: Record<string, unknown>): string => {
  const params = new URLSearchParams();

  Object.entries(input).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    if (Array.isArray(value)) {
      if (value.length === 0) return;
      params.set(key, value.join(','));
      return;
    }
    params.set(key, String(value));
  });

  return params.toString();
};

type SearchParamsLike = {
  get: (key: string) => string | null;
};

const resolveModeFromLocation = (
  pathname: string,
  searchParams: SearchParamsLike,
  defaultMode: FilterMode
): FilterMode => {
  if (pathname.startsWith('/cars')) return 'cars';
  if (pathname.startsWith('/new-buildings')) return 'new-buildings';
  if (searchParams.get('offer_type') === 'rent') return 'rent';
  if (pathname.startsWith('/listings')) return 'secondary';
  return defaultMode;
};

export default function MobileCatalogFiltersSheet({
  isOpen,
  onClose,
  defaultMode = 'secondary',
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const resolvedMode = useMemo(
    () => resolveModeFromLocation(pathname, searchParams, defaultMode),
    [defaultMode, pathname, searchParams]
  );

  const [mode, setMode] = useState<FilterMode>(resolvedMode);

  const propertyInitialFilters = useMemo<PropertyFilters>(() => ({
    listing_type: 'regular',
    offer_type: resolvedMode === 'rent' ? 'rent' : 'sale',
    type_id: searchParams.get('propertyTypes') || searchParams.get('type_id') || undefined,
    location_id: searchParams.get('cities') || searchParams.get('location_id') || undefined,
    roomsFrom: searchParams.get('roomsFrom') || undefined,
    roomsTo: searchParams.get('roomsTo') || undefined,
    priceFrom: searchParams.get('priceFrom') || undefined,
    priceTo: searchParams.get('priceTo') || undefined,
    areaFrom: searchParams.get('areaFrom') || undefined,
    areaTo: searchParams.get('areaTo') || undefined,
    floorFrom: searchParams.get('floorFrom') || undefined,
    floorTo: searchParams.get('floorTo') || undefined,
    landmark: searchParams.get('landmark') || undefined,
    document_type: searchParams.get('document_type') || undefined,
  }), [resolvedMode, searchParams]);

  const carInitialFilters = useMemo<CarsFilters>(() => ({
    category_id: searchParams.get('category_id') || undefined,
    brand_id: searchParams.get('brand_id') || undefined,
    model_id: searchParams.get('model_id') || undefined,
    condition: (searchParams.get('condition') as CarsFilters['condition']) || undefined,
    fuel_type: (searchParams.get('fuel_type') as CarsFilters['fuel_type']) || undefined,
    transmission: (searchParams.get('transmission') as CarsFilters['transmission']) || undefined,
    drive_type: (searchParams.get('drive_type') as CarsFilters['drive_type']) || undefined,
    year_from: searchParams.get('year_from') || undefined,
    year_to: searchParams.get('year_to') || undefined,
    price_from: searchParams.get('price_from') || undefined,
    price_to: searchParams.get('price_to') || undefined,
    mileage_from: searchParams.get('mileage_from') || undefined,
    mileage_to: searchParams.get('mileage_to') || undefined,
    search: searchParams.get('search') || undefined,
  }), [searchParams]);

  const newBuildingsInitialFilters = useMemo<NewBuildingsFilters>(() => ({
    search: searchParams.get('search') || undefined,
  }), [searchParams]);

  const [propertyFilters, setPropertyFilters] = useState<PropertyFilters>(propertyInitialFilters);
  const [carFilters, setCarFilters] = useState<CarsFilters>(carInitialFilters);
  const [newBuildingFilters, setNewBuildingFilters] = useState<NewBuildingsFilters>(newBuildingsInitialFilters);

  useEffect(() => {
    if (!isOpen) return;
    setMode(resolvedMode);
    setPropertyFilters({
      ...propertyInitialFilters,
      offer_type: resolvedMode === 'rent' ? 'rent' : 'sale',
    });
    setCarFilters(carInitialFilters);
    setNewBuildingFilters(newBuildingsInitialFilters);
  }, [carInitialFilters, isOpen, newBuildingsInitialFilters, propertyInitialFilters, resolvedMode]);

  const { data: propertyTypesData } = useQuery({
    queryKey: ['mobile-filter', 'property-types'],
    queryFn: async () => (await axios.get('/property-types')).data,
    staleTime: 5 * 60 * 1000,
  });

  const { data: locationsData } = useQuery({
    queryKey: ['mobile-filter', 'locations'],
    queryFn: async () => (await axios.get('/locations')).data,
    staleTime: 5 * 60 * 1000,
  });

  const { data: carCategoriesData } = useQuery({
    queryKey: ['mobile-filter', 'car-categories'],
    queryFn: async () => (await axios.get('/car-categories')).data,
    staleTime: 5 * 60 * 1000,
  });

  const { data: carBrandsData } = useQuery({
    queryKey: ['mobile-filter', 'car-brands'],
    queryFn: async () => (await axios.get('/car-brands')).data,
    staleTime: 5 * 60 * 1000,
  });

  const { data: carModelsData } = useQuery({
    queryKey: ['mobile-filter', 'car-models', carFilters.brand_id],
    queryFn: async () => (await axios.get('/car-models', { params: { brand_id: carFilters.brand_id } })).data,
    enabled: Boolean(carFilters.brand_id),
    staleTime: 5 * 60 * 1000,
  });

  const propertyTypes = useMemo(() => toOptions(propertyTypesData), [propertyTypesData]);
  const locations = useMemo(() => dedupeOptionsByName(toOptions(locationsData)), [locationsData]);
  const carCategories = useMemo(() => toOptions(carCategoriesData), [carCategoriesData]);
  const carBrands = useMemo(() => toOptions(carBrandsData), [carBrandsData]);
  const carModels = useMemo(() => toOptions(carModelsData), [carModelsData]);
  const activeFilterCount = useMemo(() => {
    const filters = mode === 'cars'
      ? carFilters
      : mode === 'new-buildings'
        ? newBuildingFilters
        : propertyFilters;
    const ignoredKeys = new Set(['listing_type', 'offer_type', 'page', 'per_page']);

    return Object.entries(filters).filter(([key, value]) => {
      if (ignoredKeys.has(key)) return false;
      if (Array.isArray(value)) return value.length > 0;
      return value !== undefined && value !== null && value !== '';
    }).length;
  }, [carFilters, mode, newBuildingFilters, propertyFilters]);

  const handleApply = () => {
    if (mode === 'cars') {
      const query = buildQueryString(carFilters as Record<string, unknown>);
      router.push(query ? `/cars?${query}` : '/cars');
      onClose();
      return;
    }

    if (mode === 'new-buildings') {
      const query = buildQueryString(newBuildingFilters as Record<string, unknown>);
      router.push(query ? `/new-buildings?${query}` : '/new-buildings');
      onClose();
      return;
    }

    const payload: Record<string, unknown> = {
      ...propertyFilters,
      propertyTypes: propertyFilters.type_id ? [String(propertyFilters.type_id)] : undefined,
      cities: propertyFilters.location_id ? [String(propertyFilters.location_id)] : undefined,
      type_id: undefined,
      location_id: undefined,
      listing_type: 'regular',
      offer_type: mode === 'rent' ? 'rent' : 'sale',
    };
    const query = buildQueryString(payload);
    router.push(query ? `/listings?${query}` : '/listings');
    onClose();
  };

  const handleReset = () => {
    if (mode === 'cars') {
      setCarFilters({});
      return;
    }
    if (mode === 'new-buildings') {
      setNewBuildingFilters({});
      return;
    }
    setPropertyFilters({
      listing_type: 'regular',
      offer_type: mode === 'rent' ? 'rent' : 'sale',
    });
  };

  return (
    <div
      className={`fixed inset-0 z-[80] overflow-x-hidden transition md:hidden ${
        isOpen ? 'pointer-events-auto' : 'pointer-events-none'
      }`}
    >
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-[#071D15]/55 backdrop-blur-[2px] transition-opacity ${
          isOpen ? 'opacity-100' : 'opacity-0'
        }`}
      />
      <aside
        className={`absolute inset-y-0 right-0 flex h-full w-full max-w-[480px] flex-col overflow-hidden bg-[#F5F8F6] shadow-[-20px_0_60px_rgba(0,35,24,0.2)] transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        aria-label="Фильтры каталога"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-[#E1E9E5] bg-white px-4 py-3.5">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E9F6F0] text-[#006341]">
              <SlidersHorizontal size={20} />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-lg font-extrabold text-[#15231D]">Фильтры</p>
                {activeFilterCount > 0 ? (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#006341] px-1.5 text-[11px] font-bold text-white">
                    {activeFilterCount}
                  </span>
                ) : null}
              </div>
              <p className="text-[11px] text-[#7A8982]">Уточните параметры поиска</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F2F5F3] text-[#64736C] transition active:scale-95"
            aria-label="Закрыть фильтры"
          >
            <X size={19} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4">
          <section>
            <p className="mb-2.5 text-[13px] font-semibold text-[#43554C]">Что ищете?</p>
            <div className="grid grid-cols-2 gap-2">
              {MODE_OPTIONS.map((item) => {
                const Icon = item.icon;
                const selected = mode === item.key;
                return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setMode(item.key)}
                  className={`flex min-h-[72px] items-center gap-3 rounded-2xl border p-3 text-left transition active:scale-[0.985] ${
                    selected
                      ? 'border-[#0B7B57] bg-[#E8F6EF] shadow-[0_4px_14px_rgba(0,99,65,0.08)]'
                      : 'border-[#DFE7E3] bg-white'
                  }`}
                >
                  <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                    selected ? 'bg-[#006341] text-white' : 'bg-[#F0F4F2] text-[#65766E]'
                  }`}>
                    <Icon size={19} />
                  </span>
                  <span className="min-w-0">
                    <span className={`block text-[13px] font-bold ${selected ? 'text-[#006341]' : 'text-[#273730]'}`}>
                      {item.label}
                    </span>
                    <span className="mt-0.5 block truncate text-[10px] text-[#829089]">{item.hint}</span>
                  </span>
                </button>
                );
              })}
            </div>
          </section>

          <div>
            {(mode === 'secondary' || mode === 'rent') && (
              <section className="mt-4 space-y-5 rounded-[22px] border border-[#E2EAE6] bg-white p-4 shadow-[0_8px_26px_rgba(20,50,39,0.045)]">
                <div>
                  <h3 className="text-[15px] font-extrabold text-[#1A2922]">Недвижимость</h3>
                  <p className="mt-0.5 text-[11px] text-[#87938D]">Основные параметры объекта</p>
                </div>

                <SearchableSelect
                  label="Тип недвижимости"
                  name="mobile-property-type"
                  value={String(propertyFilters.type_id ?? '')}
                  options={propertyTypes}
                  onValueChange={(value) => setPropertyFilters((prev) => ({ ...prev, type_id: value || undefined }))}
                  placeholder="Любой тип"
                  searchPlaceholder="Найдите тип недвижимости"
                  icon={Building2}
                />
                <SearchableSelect
                  label="Город"
                  name="mobile-property-location"
                  value={String(propertyFilters.location_id ?? '')}
                  options={locations}
                  onValueChange={(value) => setPropertyFilters((prev) => ({ ...prev, location_id: value || undefined }))}
                  placeholder="Весь Таджикистан"
                  searchPlaceholder="Найдите город"
                />

                <RangeField label="Комнаты" from={propertyFilters.roomsFrom} to={propertyFilters.roomsTo} onFromChange={(value) => setPropertyFilters((prev) => ({ ...prev, roomsFrom: value }))} onToChange={(value) => setPropertyFilters((prev) => ({ ...prev, roomsTo: value }))} />
                <RangeField label="Цена, сомони" from={propertyFilters.priceFrom} to={propertyFilters.priceTo} onFromChange={(value) => setPropertyFilters((prev) => ({ ...prev, priceFrom: value }))} onToChange={(value) => setPropertyFilters((prev) => ({ ...prev, priceTo: value }))} fromPlaceholder="Минимум" toPlaceholder="Максимум" />
                <RangeField label="Площадь, м²" from={propertyFilters.areaFrom} to={propertyFilters.areaTo} onFromChange={(value) => setPropertyFilters((prev) => ({ ...prev, areaFrom: value }))} onToChange={(value) => setPropertyFilters((prev) => ({ ...prev, areaTo: value }))} />
                <RangeField label="Этаж" from={propertyFilters.floorFrom} to={propertyFilters.floorTo} onFromChange={(value) => setPropertyFilters((prev) => ({ ...prev, floorFrom: value }))} onToChange={(value) => setPropertyFilters((prev) => ({ ...prev, floorTo: value }))} />

                <SearchableSelect
                  label="Тип документа"
                  name="mobile-property-document-type"
                  value={String(propertyFilters.document_type ?? '')}
                  options={[...PROPERTY_DOCUMENT_TYPES]}
                  onValueChange={(value) => setPropertyFilters((prev) => ({ ...prev, document_type: value || undefined }))}
                  placeholder="Любой документ"
                  searchPlaceholder="Найдите тип документа"
                />

                <label className="block">
                  <span className="mb-2 block text-[13px] font-semibold text-[#33453D]">Ориентир</span>
                  <div className="flex h-12 items-center gap-2 rounded-xl border border-[#DCE6E1] px-3 focus-within:border-[#16845F] focus-within:ring-2 focus-within:ring-[#DDF1E9]">
                    <Search size={18} className="shrink-0 text-[#779087]" />
                    <input
                      value={propertyFilters.landmark ?? ''}
                      onChange={(event) => setPropertyFilters((prev) => ({ ...prev, landmark: event.target.value || undefined }))}
                      className="min-w-0 flex-1 bg-transparent text-sm text-[#17251F] outline-none placeholder:text-[#96A19C]"
                      placeholder="Район, улица, ориентир"
                    />
                  </div>
                </label>
              </section>
            )}

            {mode === 'cars' && (
              <section className="mt-4 space-y-5 rounded-[22px] border border-[#E2EAE6] bg-white p-4 shadow-[0_8px_26px_rgba(20,50,39,0.045)]">
                <div>
                  <h3 className="text-[15px] font-extrabold text-[#1A2922]">Автомобиль</h3>
                  <p className="mt-0.5 text-[11px] text-[#87938D]">Марка, характеристики и бюджет</p>
                </div>

                <label className="block">
                  <span className="mb-2 block text-[13px] font-semibold text-[#33453D]">Поиск</span>
                  <div className="flex h-12 items-center gap-2 rounded-xl border border-[#DCE6E1] px-3 focus-within:border-[#16845F] focus-within:ring-2 focus-within:ring-[#DDF1E9]">
                    <Search size={18} className="text-[#779087]" />
                    <input value={carFilters.search ?? ''} onChange={(event) => setCarFilters((prev) => ({ ...prev, search: event.target.value || undefined }))} className="min-w-0 flex-1 bg-transparent text-sm text-[#17251F] outline-none placeholder:text-[#96A19C]" placeholder="Марка, модель" />
                  </div>
                </label>

                <SearchableSelect label="Категория" name="mobile-car-category" value={String(carFilters.category_id ?? '')} options={carCategories} onValueChange={(value) => setCarFilters((prev) => ({ ...prev, category_id: value || undefined }))} placeholder="Любая категория" icon={CarFront} />
                <SearchableSelect label="Марка" name="mobile-car-brand" value={String(carFilters.brand_id ?? '')} options={carBrands} onValueChange={(value) => setCarFilters((prev) => ({ ...prev, brand_id: value || undefined, model_id: undefined }))} placeholder="Любая марка" icon={CarFront} />
                <SearchableSelect label="Модель" name="mobile-car-model" value={String(carFilters.model_id ?? '')} options={carModels} onValueChange={(value) => setCarFilters((prev) => ({ ...prev, model_id: value || undefined }))} placeholder={carFilters.brand_id ? 'Любая модель' : 'Сначала выберите марку'} disabled={!carFilters.brand_id} icon={CarFront} />

                <ChoiceGroup label="Состояние" value={carFilters.condition} options={CONDITION_OPTIONS} onChange={(value) => setCarFilters((prev) => ({ ...prev, condition: value }))} />
                <ChoiceGroup label="Топливо" value={carFilters.fuel_type} options={FUEL_OPTIONS} onChange={(value) => setCarFilters((prev) => ({ ...prev, fuel_type: value }))} />
                <ChoiceGroup label="Коробка передач" value={carFilters.transmission} options={TRANSMISSION_OPTIONS} onChange={(value) => setCarFilters((prev) => ({ ...prev, transmission: value }))} />
                <ChoiceGroup label="Привод" value={carFilters.drive_type} options={DRIVE_OPTIONS} onChange={(value) => setCarFilters((prev) => ({ ...prev, drive_type: value }))} />

                <RangeField label="Цена" from={carFilters.price_from} to={carFilters.price_to} onFromChange={(value) => setCarFilters((prev) => ({ ...prev, price_from: value }))} onToChange={(value) => setCarFilters((prev) => ({ ...prev, price_to: value }))} fromPlaceholder="Минимум" toPlaceholder="Максимум" />
                <RangeField label="Год выпуска" from={carFilters.year_from} to={carFilters.year_to} onFromChange={(value) => setCarFilters((prev) => ({ ...prev, year_from: value }))} onToChange={(value) => setCarFilters((prev) => ({ ...prev, year_to: value }))} />
                <RangeField label="Пробег, км" from={carFilters.mileage_from} to={carFilters.mileage_to} onFromChange={(value) => setCarFilters((prev) => ({ ...prev, mileage_from: value }))} onToChange={(value) => setCarFilters((prev) => ({ ...prev, mileage_to: value }))} />
              </section>
            )}

            {mode === 'new-buildings' && (
              <section className="mt-4 rounded-[22px] border border-[#E2EAE6] bg-white p-4 shadow-[0_8px_26px_rgba(20,50,39,0.045)]">
                <h3 className="text-[15px] font-extrabold text-[#1A2922]">Поиск новостройки</h3>
                <p className="mt-0.5 text-[11px] text-[#87938D]">Название ЖК, район или застройщик</p>
                <label className="block">
                  <span className="sr-only">Поиск</span>
                  <div className="mt-4 flex h-12 items-center gap-2 rounded-xl border border-[#DCE6E1] px-3 focus-within:border-[#16845F] focus-within:ring-2 focus-within:ring-[#DDF1E9]">
                    <Search size={18} className="text-[#779087]" />
                    <input
                      value={newBuildingFilters.search ?? ''}
                      onChange={(event) => setNewBuildingFilters((prev) => ({ ...prev, search: event.target.value || undefined }))}
                      className="min-w-0 flex-1 bg-transparent text-sm text-[#17251F] outline-none placeholder:text-[#96A19C]"
                      placeholder="Введите название или район"
                    />
                  </div>
                </label>
              </section>
            )}
          </div>
        </div>

        <div className="shrink-0 border-t border-[#DEE8E3] bg-white px-4 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 shadow-[0_-12px_30px_rgba(20,50,39,0.08)]">
          <div className="flex gap-2.5">
            <button
              type="button"
              onClick={handleReset}
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[#D6E1DC] text-[#52635B] transition active:scale-95"
              aria-label="Сбросить фильтры"
            >
              <RotateCcw size={18} />
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="flex h-12 flex-1 items-center justify-center rounded-xl bg-[#006341] px-5 text-sm font-bold text-white shadow-[0_8px_20px_rgba(0,99,65,0.2)] transition active:scale-[0.985]"
            >
              Показать объявления{activeFilterCount > 0 ? ` · ${activeFilterCount}` : ''}
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}
