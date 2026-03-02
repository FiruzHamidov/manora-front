'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { axios } from '@/utils/axios';
import type { PropertyFilters } from '@/services/properties/types';
import type { CarsFilters } from '@/services/cars/types';
import type { NewBuildingsFilters } from '@/services/new-buildings/types';

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
  const locations = useMemo(() => toOptions(locationsData), [locationsData]);
  const carCategories = useMemo(() => toOptions(carCategoriesData), [carCategoriesData]);
  const carBrands = useMemo(() => toOptions(carBrandsData), [carBrandsData]);
  const carModels = useMemo(() => toOptions(carModelsData), [carModelsData]);

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
      className={`fixed inset-0 z-[80] md:hidden transition ${
        isOpen ? 'pointer-events-auto' : 'pointer-events-none'
      }`}
    >
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-black/45 transition-opacity ${
          isOpen ? 'opacity-100' : 'opacity-0'
        }`}
      />
      <aside
        className={`absolute inset-y-0 left-0 h-full w-full bg-white shadow-xl transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between border-b border-[#E5E7EB] px-4 py-4">
          <p className="text-lg font-bold text-[#111827]">Фильтры</p>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-[#64748B]"
            aria-label="Закрыть фильтры"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex h-full flex-col">
          <div className="border-b border-[#E5E7EB] p-4">
            <p className="mb-3 text-sm font-medium text-[#64748B]">Быстрый выбор</p>
            <div className="grid grid-cols-1 gap-2">
              {[
                { key: 'secondary', label: 'Вторичка' },
                { key: 'new-buildings', label: 'Новостройки' },
                { key: 'rent', label: 'Аренда' },
                { key: 'cars', label: 'Автомобили' },
              ].map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setMode(item.key as FilterMode)}
                  className={`rounded-xl border px-4 py-3 text-left text-sm font-semibold ${
                    mode === item.key
                      ? 'border-[#0036A5] bg-[#EEF4FF] text-[#0036A5]'
                      : 'border-[#E2E8F0] text-[#334155]'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4 pb-28">
            {(mode === 'secondary' || mode === 'rent') && (
              <>
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-[#334155]">Тип недвижимости</span>
                  <select
                    value={String(propertyFilters.type_id ?? '')}
                    onChange={(event) => setPropertyFilters((prev) => ({ ...prev, type_id: event.target.value || undefined }))}
                    className="h-11 w-full rounded-xl border border-[#E2E8F0] bg-white px-3 text-sm text-[#111827] outline-none"
                  >
                    <option value="">Выбрать</option>
                    {propertyTypes.map((option) => (
                      <option key={option.id} value={option.id}>{option.name}</option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-[#334155]">Локация</span>
                  <select
                    value={String(propertyFilters.location_id ?? '')}
                    onChange={(event) => setPropertyFilters((prev) => ({ ...prev, location_id: event.target.value || undefined }))}
                    className="h-11 w-full rounded-xl border border-[#E2E8F0] bg-white px-3 text-sm text-[#111827] outline-none"
                  >
                    <option value="">По всему Таджикистану</option>
                    {locations.map((option) => (
                      <option key={option.id} value={option.id}>{option.name}</option>
                    ))}
                  </select>
                </label>

                <div className="rounded-xl border border-[#E2E8F0] p-3">
                  <p className="text-sm font-medium text-[#334155]">Комнаты</p>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <input value={propertyFilters.roomsFrom ?? ''} onChange={(event) => setPropertyFilters((prev) => ({ ...prev, roomsFrom: event.target.value || undefined }))} className="h-10 rounded-lg border border-[#E2E8F0] px-3 text-sm outline-none" inputMode="numeric" placeholder="От" />
                    <input value={propertyFilters.roomsTo ?? ''} onChange={(event) => setPropertyFilters((prev) => ({ ...prev, roomsTo: event.target.value || undefined }))} className="h-10 rounded-lg border border-[#E2E8F0] px-3 text-sm outline-none" inputMode="numeric" placeholder="До" />
                  </div>
                </div>

                <div className="rounded-xl border border-[#E2E8F0] p-3">
                  <p className="text-sm font-medium text-[#334155]">Цена, сомони</p>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <input value={propertyFilters.priceFrom ?? ''} onChange={(event) => setPropertyFilters((prev) => ({ ...prev, priceFrom: event.target.value || undefined }))} className="h-10 rounded-lg border border-[#E2E8F0] px-3 text-sm outline-none" inputMode="numeric" placeholder="От" />
                    <input value={propertyFilters.priceTo ?? ''} onChange={(event) => setPropertyFilters((prev) => ({ ...prev, priceTo: event.target.value || undefined }))} className="h-10 rounded-lg border border-[#E2E8F0] px-3 text-sm outline-none" inputMode="numeric" placeholder="До" />
                  </div>
                </div>

                <div className="rounded-xl border border-[#E2E8F0] p-3">
                  <p className="text-sm font-medium text-[#334155]">Площадь, м²</p>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <input value={propertyFilters.areaFrom ?? ''} onChange={(event) => setPropertyFilters((prev) => ({ ...prev, areaFrom: event.target.value || undefined }))} className="h-10 rounded-lg border border-[#E2E8F0] px-3 text-sm outline-none" inputMode="numeric" placeholder="От" />
                    <input value={propertyFilters.areaTo ?? ''} onChange={(event) => setPropertyFilters((prev) => ({ ...prev, areaTo: event.target.value || undefined }))} className="h-10 rounded-lg border border-[#E2E8F0] px-3 text-sm outline-none" inputMode="numeric" placeholder="До" />
                  </div>
                </div>

                <div className="rounded-xl border border-[#E2E8F0] p-3">
                  <p className="text-sm font-medium text-[#334155]">Этаж</p>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <input value={propertyFilters.floorFrom ?? ''} onChange={(event) => setPropertyFilters((prev) => ({ ...prev, floorFrom: event.target.value || undefined }))} className="h-10 rounded-lg border border-[#E2E8F0] px-3 text-sm outline-none" inputMode="numeric" placeholder="От" />
                    <input value={propertyFilters.floorTo ?? ''} onChange={(event) => setPropertyFilters((prev) => ({ ...prev, floorTo: event.target.value || undefined }))} className="h-10 rounded-lg border border-[#E2E8F0] px-3 text-sm outline-none" inputMode="numeric" placeholder="До" />
                  </div>
                </div>

                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-[#334155]">Ориентир</span>
                  <input
                    value={propertyFilters.landmark ?? ''}
                    onChange={(event) => setPropertyFilters((prev) => ({ ...prev, landmark: event.target.value || undefined }))}
                    className="h-11 w-full rounded-xl border border-[#E2E8F0] px-3 text-sm text-[#111827] outline-none"
                    placeholder="Район, улица, ориентир"
                  />
                </label>
              </>
            )}

            {mode === 'cars' && (
              <>
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-[#334155]">Поиск</span>
                  <input
                    value={carFilters.search ?? ''}
                    onChange={(event) => setCarFilters((prev) => ({ ...prev, search: event.target.value || undefined }))}
                    className="h-11 w-full rounded-xl border border-[#E2E8F0] px-3 text-sm text-[#111827] outline-none"
                    placeholder="Марка, модель"
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-[#334155]">Категория</span>
                  <select value={String(carFilters.category_id ?? '')} onChange={(event) => setCarFilters((prev) => ({ ...prev, category_id: event.target.value || undefined }))} className="h-11 w-full rounded-xl border border-[#E2E8F0] bg-white px-3 text-sm text-[#111827] outline-none">
                    <option value="">Выбрать</option>
                    {carCategories.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}
                  </select>
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-[#334155]">Марка</span>
                  <select value={String(carFilters.brand_id ?? '')} onChange={(event) => setCarFilters((prev) => ({ ...prev, brand_id: event.target.value || undefined, model_id: undefined }))} className="h-11 w-full rounded-xl border border-[#E2E8F0] bg-white px-3 text-sm text-[#111827] outline-none">
                    <option value="">Выбрать</option>
                    {carBrands.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}
                  </select>
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-[#334155]">Модель</span>
                  <select value={String(carFilters.model_id ?? '')} onChange={(event) => setCarFilters((prev) => ({ ...prev, model_id: event.target.value || undefined }))} className="h-11 w-full rounded-xl border border-[#E2E8F0] bg-white px-3 text-sm text-[#111827] outline-none">
                    <option value="">Выбрать</option>
                    {carModels.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}
                  </select>
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-[#334155]">Состояние</span>
                  <select value={String(carFilters.condition ?? '')} onChange={(event) => setCarFilters((prev) => ({ ...prev, condition: (event.target.value || undefined) as CarsFilters['condition'] }))} className="h-11 w-full rounded-xl border border-[#E2E8F0] bg-white px-3 text-sm text-[#111827] outline-none">
                    <option value="">Выбрать</option>
                    {CONDITION_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-[#334155]">Топливо</span>
                  <select value={String(carFilters.fuel_type ?? '')} onChange={(event) => setCarFilters((prev) => ({ ...prev, fuel_type: (event.target.value || undefined) as CarsFilters['fuel_type'] }))} className="h-11 w-full rounded-xl border border-[#E2E8F0] bg-white px-3 text-sm text-[#111827] outline-none">
                    <option value="">Выбрать</option>
                    {FUEL_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-[#334155]">Коробка</span>
                  <select value={String(carFilters.transmission ?? '')} onChange={(event) => setCarFilters((prev) => ({ ...prev, transmission: (event.target.value || undefined) as CarsFilters['transmission'] }))} className="h-11 w-full rounded-xl border border-[#E2E8F0] bg-white px-3 text-sm text-[#111827] outline-none">
                    <option value="">Выбрать</option>
                    {TRANSMISSION_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-[#334155]">Привод</span>
                  <select value={String(carFilters.drive_type ?? '')} onChange={(event) => setCarFilters((prev) => ({ ...prev, drive_type: (event.target.value || undefined) as CarsFilters['drive_type'] }))} className="h-11 w-full rounded-xl border border-[#E2E8F0] bg-white px-3 text-sm text-[#111827] outline-none">
                    <option value="">Выбрать</option>
                    {DRIVE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                </label>

                <div className="rounded-xl border border-[#E2E8F0] p-3">
                  <p className="text-sm font-medium text-[#334155]">Цена</p>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <input value={String(carFilters.price_from ?? '')} onChange={(event) => setCarFilters((prev) => ({ ...prev, price_from: event.target.value || undefined }))} className="h-10 rounded-lg border border-[#E2E8F0] px-3 text-sm outline-none" inputMode="numeric" placeholder="От" />
                    <input value={String(carFilters.price_to ?? '')} onChange={(event) => setCarFilters((prev) => ({ ...prev, price_to: event.target.value || undefined }))} className="h-10 rounded-lg border border-[#E2E8F0] px-3 text-sm outline-none" inputMode="numeric" placeholder="До" />
                  </div>
                </div>

                <div className="rounded-xl border border-[#E2E8F0] p-3">
                  <p className="text-sm font-medium text-[#334155]">Год выпуска</p>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <input value={String(carFilters.year_from ?? '')} onChange={(event) => setCarFilters((prev) => ({ ...prev, year_from: event.target.value || undefined }))} className="h-10 rounded-lg border border-[#E2E8F0] px-3 text-sm outline-none" inputMode="numeric" placeholder="От" />
                    <input value={String(carFilters.year_to ?? '')} onChange={(event) => setCarFilters((prev) => ({ ...prev, year_to: event.target.value || undefined }))} className="h-10 rounded-lg border border-[#E2E8F0] px-3 text-sm outline-none" inputMode="numeric" placeholder="До" />
                  </div>
                </div>

                <div className="rounded-xl border border-[#E2E8F0] p-3">
                  <p className="text-sm font-medium text-[#334155]">Пробег</p>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <input value={String(carFilters.mileage_from ?? '')} onChange={(event) => setCarFilters((prev) => ({ ...prev, mileage_from: event.target.value || undefined }))} className="h-10 rounded-lg border border-[#E2E8F0] px-3 text-sm outline-none" inputMode="numeric" placeholder="От" />
                    <input value={String(carFilters.mileage_to ?? '')} onChange={(event) => setCarFilters((prev) => ({ ...prev, mileage_to: event.target.value || undefined }))} className="h-10 rounded-lg border border-[#E2E8F0] px-3 text-sm outline-none" inputMode="numeric" placeholder="До" />
                  </div>
                </div>
              </>
            )}

            {mode === 'new-buildings' && (
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-[#334155]">Поиск</span>
                <input
                  value={newBuildingFilters.search ?? ''}
                  onChange={(event) => setNewBuildingFilters((prev) => ({ ...prev, search: event.target.value || undefined }))}
                  className="h-11 w-full rounded-xl border border-[#E2E8F0] px-3 text-sm text-[#111827] outline-none"
                  placeholder="Название, район, застройщик"
                />
              </label>
            )}
          </div>

          <div className="sticky bottom-0 border-t border-[#E5E7EB] bg-white px-4 py-3">
            <div className="flex gap-2">
              <button type="button" onClick={handleReset} className="flex-1 rounded-xl border border-[#D6DEE8] px-4 py-3 text-sm font-semibold text-[#334155]">Сбросить</button>
              <button type="button" onClick={handleApply} className="flex-1 rounded-xl bg-[#0036A5] px-4 py-3 text-sm font-semibold text-white">Показать</button>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
