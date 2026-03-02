'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowUpWideNarrow,
  ChevronRight,
  ListFilterPlus,
  ListIcon,
  MapIcon,
  X,
} from 'lucide-react';
import MainShell from '@/app/_components/manora/MainShell';
import Buy from '@/app/_components/buy/buy';
import { BuyMap } from '@/app/buy/_components/BuyMap';
import BuyCardSkeleton from '@/ui-components/BuyCardSkeleton';
import { axios } from '@/utils/axios';
import { useGetCarsInfiniteQuery } from '@/services/cars/hooks';
import type { Car, CarsFilters, CarsSortDir, CarsSortField } from '@/services/cars/types';
import type { Property, PropertiesResponse } from '@/services/properties/types';
import { resolveMediaUrl } from '@/constants/base-url';

type CarsViewMode = 'list' | 'map';
type CarsSortMode = 'default' | 'price_asc' | 'price_desc' | 'year_desc' | 'year_asc';

type DictOption = {
  id: string | number;
  name: string;
};

const PAGE_SIZE = 24;

const SORT_OPTIONS: Array<{ value: CarsSortMode; label: string }> = [
  { value: 'default', label: 'По умолчанию' },
  { value: 'price_asc', label: 'Цена — по возрастанию' },
  { value: 'price_desc', label: 'Цена — по убыванию' },
  { value: 'year_desc', label: 'Год — новые сверху' },
  { value: 'year_asc', label: 'Год — старые сверху' },
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

const toOptions = (payload: any): DictOption[] => {
  const raw = Array.isArray(payload) ? payload : payload?.data ?? [];
  return raw.map((item: any) => ({
    id: item.id,
    name: item.name ?? item.title ?? `#${item.id}`,
  }));
};

const parseNum = (value: unknown): number | null => {
  if (value === null || value === undefined || value === '') return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

const getCarTitle = (car: Car): string =>
  car.title || `${car.brand?.name || ''} ${car.model?.name || ''}`.trim() || 'Автомобиль';

const sortModeToApi = (
  sort: CarsSortMode
): { sort?: CarsSortField; dir?: CarsSortDir } => {
  switch (sort) {
    case 'price_asc':
      return { sort: 'price', dir: 'asc' };
    case 'price_desc':
      return { sort: 'price', dir: 'desc' };
    case 'year_desc':
      return { sort: 'year', dir: 'desc' };
    case 'year_asc':
      return { sort: 'year', dir: 'asc' };
    default:
      return {};
  }
};

const apiSortToMode = (
  sort?: string | null,
  dir?: string | null
): CarsSortMode => {
  if (sort === 'price' && dir === 'asc') return 'price_asc';
  if (sort === 'price' && dir === 'desc') return 'price_desc';
  if (sort === 'year' && dir === 'desc') return 'year_desc';
  if (sort === 'year' && dir === 'asc') return 'year_asc';
  return 'default';
};

function CarFiltersOverlay({
  isOpen,
  filters,
  brandOptions,
  modelOptions,
  categoryOptions,
  onChange,
  onClose,
  onApply,
  onReset,
}: {
  isOpen: boolean;
  filters: CarsFilters;
  brandOptions: DictOption[];
  modelOptions: DictOption[];
  categoryOptions: DictOption[];
  onChange: (patch: Partial<CarsFilters>) => void;
  onClose: () => void;
  onApply: () => void;
  onReset: () => void;
}) {
  useEffect(() => {
    if (!isOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[999999] flex items-start justify-center overflow-y-auto bg-[#020617]/45 px-3 py-4 sm:px-6 sm:py-6">
      <button
        type="button"
        aria-label="Закрыть фильтры"
        onClick={onClose}
        className="absolute inset-0"
      />

      <div
        className="relative min-h-[calc(100vh-2rem)] w-full max-w-[1520px] rounded-3xl bg-white px-4 py-6 shadow-lg sm:min-h-[calc(100vh-3rem)] sm:px-8 md:px-12 lg:px-[70px]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-[#0F172A]">Фильтр автомобилей</h2>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#0036A5] text-white"
          >
            <X size={18} />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-[#334155]">Категория</span>
            <select
              value={String(filters.category_id ?? '')}
              onChange={(event) => onChange({ category_id: event.target.value || undefined })}
              className="h-11 w-full rounded-xl border border-[#E2E8F0] bg-white px-3 text-sm text-[#111827] outline-none"
            >
              <option value="">Выбрать</option>
              {categoryOptions.map((option) => (
                <option key={option.id} value={option.id}>{option.name}</option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-[#334155]">Марка</span>
            <select
              value={String(filters.brand_id ?? '')}
              onChange={(event) => onChange({ brand_id: event.target.value || undefined, model_id: undefined })}
              className="h-11 w-full rounded-xl border border-[#E2E8F0] bg-white px-3 text-sm text-[#111827] outline-none"
            >
              <option value="">Выбрать</option>
              {brandOptions.map((option) => (
                <option key={option.id} value={option.id}>{option.name}</option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-[#334155]">Модель</span>
            <select
              value={String(filters.model_id ?? '')}
              onChange={(event) => onChange({ model_id: event.target.value || undefined })}
              className="h-11 w-full rounded-xl border border-[#E2E8F0] bg-white px-3 text-sm text-[#111827] outline-none"
            >
              <option value="">Выбрать</option>
              {modelOptions.map((option) => (
                <option key={option.id} value={option.id}>{option.name}</option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-[#334155]">Состояние</span>
            <select
              value={String(filters.condition ?? '')}
              onChange={(event) => onChange({ condition: (event.target.value || undefined) as CarsFilters['condition'] })}
              className="h-11 w-full rounded-xl border border-[#E2E8F0] bg-white px-3 text-sm text-[#111827] outline-none"
            >
              <option value="">Выбрать</option>
              {CONDITION_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>

          <div className="rounded-xl border border-[#E2E8F0] p-3">
            <p className="text-sm font-medium text-[#334155]">Цена</p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <input
                value={String(filters.price_from ?? '')}
                onChange={(event) => onChange({ price_from: event.target.value || undefined })}
                className="h-10 rounded-lg border border-[#E2E8F0] px-3 text-sm outline-none"
                inputMode="numeric"
                placeholder="От"
              />
              <input
                value={String(filters.price_to ?? '')}
                onChange={(event) => onChange({ price_to: event.target.value || undefined })}
                className="h-10 rounded-lg border border-[#E2E8F0] px-3 text-sm outline-none"
                inputMode="numeric"
                placeholder="До"
              />
            </div>
          </div>

          <div className="rounded-xl border border-[#E2E8F0] p-3">
            <p className="text-sm font-medium text-[#334155]">Год выпуска</p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <input
                value={String(filters.year_from ?? '')}
                onChange={(event) => onChange({ year_from: event.target.value || undefined })}
                className="h-10 rounded-lg border border-[#E2E8F0] px-3 text-sm outline-none"
                inputMode="numeric"
                placeholder="От"
              />
              <input
                value={String(filters.year_to ?? '')}
                onChange={(event) => onChange({ year_to: event.target.value || undefined })}
                className="h-10 rounded-lg border border-[#E2E8F0] px-3 text-sm outline-none"
                inputMode="numeric"
                placeholder="До"
              />
            </div>
          </div>

          <div className="rounded-xl border border-[#E2E8F0] p-3">
            <p className="text-sm font-medium text-[#334155]">Пробег</p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <input
                value={String(filters.mileage_from ?? '')}
                onChange={(event) => onChange({ mileage_from: event.target.value || undefined })}
                className="h-10 rounded-lg border border-[#E2E8F0] px-3 text-sm outline-none"
                inputMode="numeric"
                placeholder="От"
              />
              <input
                value={String(filters.mileage_to ?? '')}
                onChange={(event) => onChange({ mileage_to: event.target.value || undefined })}
                className="h-10 rounded-lg border border-[#E2E8F0] px-3 text-sm outline-none"
                inputMode="numeric"
                placeholder="До"
              />
            </div>
          </div>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-[#334155]">Топливо</span>
            <select
              value={String(filters.fuel_type ?? '')}
              onChange={(event) => onChange({ fuel_type: (event.target.value || undefined) as CarsFilters['fuel_type'] })}
              className="h-11 w-full rounded-xl border border-[#E2E8F0] bg-white px-3 text-sm text-[#111827] outline-none"
            >
              <option value="">Выбрать</option>
              {FUEL_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-[#334155]">Коробка</span>
            <select
              value={String(filters.transmission ?? '')}
              onChange={(event) => onChange({ transmission: (event.target.value || undefined) as CarsFilters['transmission'] })}
              className="h-11 w-full rounded-xl border border-[#E2E8F0] bg-white px-3 text-sm text-[#111827] outline-none"
            >
              <option value="">Выбрать</option>
              {TRANSMISSION_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-[#334155]">Привод</span>
            <select
              value={String(filters.drive_type ?? '')}
              onChange={(event) => onChange({ drive_type: (event.target.value || undefined) as CarsFilters['drive_type'] })}
              className="h-11 w-full rounded-xl border border-[#E2E8F0] bg-white px-3 text-sm text-[#111827] outline-none"
            >
              <option value="">Выбрать</option>
              {DRIVE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onReset}
            className="inline-flex h-11 items-center justify-center rounded-xl border border-[#D6DEE8] px-5 text-sm font-semibold text-[#111827]"
          >
            Сбросить
          </button>
          <button
            type="button"
            onClick={onApply}
            className="inline-flex h-11 items-center justify-center rounded-xl bg-[#0036A5] px-5 text-sm font-semibold text-white"
          >
            Показать автомобили
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CarsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [view, setView] = useState<CarsViewMode>((searchParams.get('view') as CarsViewMode) || 'list');
  const [sort, setSort] = useState<CarsSortMode>(() => apiSortToMode(searchParams.get('sort'), searchParams.get('dir')));
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const initialFilters = useMemo<CarsFilters>(() => ({
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
    per_page: PAGE_SIZE,
  }), [searchParams]);

  const [draftFilters, setDraftFilters] = useState<CarsFilters>(initialFilters);
  const apiSort = useMemo(() => sortModeToApi(sort), [sort]);

  useEffect(() => {
    setDraftFilters(initialFilters);
  }, [initialFilters]);

  useEffect(() => {
    setSort(apiSortToMode(searchParams.get('sort'), searchParams.get('dir')));
  }, [searchParams]);

  const filters = useMemo<CarsFilters>(() => ({
    ...initialFilters,
    per_page: PAGE_SIZE,
    sort: apiSort.sort,
    dir: apiSort.dir,
  }), [apiSort.dir, apiSort.sort, initialFilters]);

  const { data: categoriesData } = useQuery({
    queryKey: ['dict', 'car-categories'],
    queryFn: async () => (await axios.get('/car-categories')).data,
    staleTime: 5 * 60 * 1000,
  });

  const { data: brandsData } = useQuery({
    queryKey: ['dict', 'car-brands'],
    queryFn: async () => (await axios.get('/car-brands')).data,
    staleTime: 5 * 60 * 1000,
  });

  const selectedBrandId = draftFilters.brand_id ?? filters.brand_id;

  const { data: modelsData } = useQuery({
    queryKey: ['dict', 'car-models', selectedBrandId],
    queryFn: async () => (await axios.get('/car-models', { params: { brand_id: selectedBrandId } })).data,
    enabled: Boolean(selectedBrandId),
    staleTime: 5 * 60 * 1000,
  });

  const categoryOptions = useMemo(() => toOptions(categoriesData), [categoriesData]);
  const brandOptions = useMemo(() => toOptions(brandsData), [brandsData]);
  const modelOptions = useMemo(() => toOptions(modelsData), [modelsData]);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useGetCarsInfiniteQuery(filters);

  const allCars = useMemo(() => data?.pages.flatMap((page) => page.data) ?? [], [data]);

  const carsAsListings = useMemo<Property[]>(() => {
    return allCars.map((car, index) => {
      const rawPath =
        car.photos?.find((photo) => photo.is_main)?.path ||
        car.photos?.[0]?.path ||
        car.photos?.[0]?.file_path ||
        car.photos?.[0]?.url;
      const source =
        (car as Car & { __source?: 'aura' | 'local' }).__source === 'aura'
          ? 'aura'
          : 'local';
      const resolvedPhoto = resolveMediaUrl(rawPath, '/images/no-image.png', source);
      const title = getCarTitle(car);
      const latitude = (car as any).latitude ?? (car as any).location?.latitude ?? '';
      const longitude = (car as any).longitude ?? (car as any).location?.longitude ?? '';

      return {
        id: Number(car.id),
        title,
        description: car.description || title,
        __source: source,
        __entity: 'car',
        moderation_status: 'approved',
        created_by: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        price: String(car.price ?? 0),
        currency: car.currency || 'TJS',
        contract_type: {
          id: 0,
          name: 'Продажа',
          slug: 'sale',
          created_at: '',
          updated_at: '',
        },
        rooms: 0,
        floor: '',
        is_business_owner: false,
        is_full_apartment: false,
        is_for_aura: false,
        listing_type: 'regular',
        offer_type: 'sale',
        type: {
          id: 0,
          name: 'Транспорт',
          slug: 'transport',
        },
        status: {
          id: 0,
          name: 'Активно',
          slug: 'active',
          created_at: '',
          updated_at: '',
        },
        location: null,
        latitude: String(latitude || ''),
        longitude: String(longitude || ''),
        address: [car.brand?.name, car.model?.name, car.year].filter(Boolean).join(' • '),
        category: car.category,
        brand: car.brand,
        model: car.model,
        year: car.year,
        mileage: car.mileage,
        fuel_type: car.fuel_type,
        transmission: car.transmission,
        drive_type: car.drive_type,
        condition: car.condition,
        photos: [
          {
            id: index + 1,
            property_id: Number(car.id),
            file_path: resolvedPhoto,
            type: 'photo',
            created_at: '',
            updated_at: '',
          },
        ],
      } as Property;
    });
  }, [allCars]);

  const properties = useMemo<PropertiesResponse>(() => ({
    current_page: data?.pages[data.pages.length - 1]?.current_page ?? 1,
    data: carsAsListings,
    first_page_url: '',
    from: carsAsListings.length ? 1 : 0,
    last_page: data?.pages[data.pages.length - 1]?.last_page ?? 1,
    last_page_url: '',
    links: [],
    next_page_url: hasNextPage ? 'next' : null,
    path: '',
    per_page: PAGE_SIZE,
    prev_page_url: null,
    to: carsAsListings.length,
    total: data?.pages[0]?.total ?? carsAsListings.length,
  }), [carsAsListings, data, hasNextPage]);

  const mapItems = useMemo(
    () => carsAsListings.filter((item) => parseNum(item.latitude) !== null && parseNum(item.longitude) !== null),
    [carsAsListings]
  );

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || view !== 'list' || !hasNextPage || isFetchingNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          fetchNextPage();
        }
      },
      { rootMargin: '240px' }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage, view]);

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (view === 'list') params.delete('view');
    else params.set('view', view);

    if (!apiSort.sort || !apiSort.dir) {
      params.delete('sort');
      params.delete('dir');
    } else {
      params.set('sort', apiSort.sort);
      params.set('dir', apiSort.dir);
    }

    const nextUrl = `${pathname}${params.toString() ? `?${params.toString()}` : ''}`;
    const currentUrl = `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;

    if (nextUrl !== currentUrl) {
      router.replace(nextUrl, { scroll: false });
    }
  }, [apiSort.dir, apiSort.sort, pathname, router, searchParams, view]);

  const applyFilters = () => {
    const params = new URLSearchParams(searchParams.toString());

    Object.entries(draftFilters).forEach(([key, value]) => {
      if (key === 'page' || key === 'per_page') return;
      if (value === undefined || value === null || value === '') {
        params.delete(key);
        return;
      }
      params.set(key, String(value));
    });

    router.push(`${pathname}?${params.toString()}`);
    setIsFiltersOpen(false);
  };

  const resetFilters = () => {
    setDraftFilters({ per_page: PAGE_SIZE });
    const params = new URLSearchParams(searchParams.toString());
    [
      'category_id',
      'brand_id',
      'model_id',
      'condition',
      'fuel_type',
      'transmission',
      'drive_type',
      'year_from',
      'year_to',
      'price_from',
      'price_to',
      'mileage_from',
      'mileage_to',
    ].forEach((key) => params.delete(key));
    router.push(`${pathname}${params.toString() ? `?${params.toString()}` : ''}`);
    setIsFiltersOpen(false);
  };

  return (
    <MainShell>
      <CarFiltersOverlay
        isOpen={isFiltersOpen}
        filters={draftFilters}
        brandOptions={brandOptions}
        modelOptions={modelOptions}
        categoryOptions={categoryOptions}
        onChange={(patch) => setDraftFilters((prev) => ({ ...prev, ...patch }))}
        onClose={() => setIsFiltersOpen(false)}
        onApply={applyFilters}
        onReset={resetFilters}
      />

      <section className="bg-[#F3F4F6]">
        <div className="mx-auto w-full max-w-[1520px] px-3 py-6 md:px-6 md:py-10">
          <nav className="mb-6 flex flex-wrap items-center gap-2 text-[15px] text-[#64748B] md:mb-10">
            <Link href="/" className="transition-colors hover:text-[#0036A5]">
              Главная
            </Link>
            <ChevronRight size={16} />
            <span>Каталог</span>
            <ChevronRight size={16} />
            <span>Автомобили</span>
          </nav>

          <div className="flex flex-col gap-6 md:gap-10">
            <div className="flex flex-col gap-2 md:flex-row md:items-end md:gap-4">
              <h1 className="text-3xl font-extrabold tracking-[-0.02em] text-[#111827] md:text-[40px] md:leading-none">
                Автомобили
              </h1>
              <p className="text-lg font-semibold text-[#475569] md:pb-1">
                {properties.total} автомобилей
              </p>
            </div>

            <div className="flex items-center gap-3 md:justify-start">
              <div className="flex min-w-0 flex-1 items-center gap-3 overflow-x-auto pb-1 md:flex-none md:overflow-visible">
                <button
                  type="button"
                  onClick={() => setView('list')}
                  className={`inline-flex h-[56px] shrink-0 items-center gap-2 rounded-2xl px-4 text-[12px] font-medium md:px-6 md:text-[18px] ${
                    view === 'list' ? 'bg-[#0036A5] text-white' : 'bg-white text-[#475569]'
                  }`}
                >
                  <ListIcon size={20} />
                  <span>Список</span>
                </button>

                <button
                  type="button"
                  onClick={() => setView('map')}
                  aria-label="На карте"
                  className={`inline-flex h-[56px] w-[56px] shrink-0 items-center justify-center rounded-2xl text-[18px] font-medium md:w-auto md:gap-2 md:px-7 ${
                    view === 'map' ? 'bg-[#0036A5] text-white' : 'bg-white text-[#0036A5]'
                  }`}
                >
                  <MapIcon size={22} />
                  <span className="hidden md:inline">На карте</span>
                </button>
              </div>

              <div className="relative shrink-0">
                <button
                  type="button"
                  onClick={() => setIsSortOpen((prev) => !prev)}
                  aria-label="Сортировка"
                  className="inline-flex h-[56px] w-[56px] shrink-0 items-center justify-center rounded-2xl bg-white"
                >
                  <ArrowUpWideNarrow size={22} className="text-[#0036A5]" />
                </button>

                {isSortOpen && (
                  <div className="absolute right-0 top-[64px] z-20 w-[240px] rounded-2xl border border-[#E2E8F0] bg-white p-2 shadow-xl">
                    {SORT_OPTIONS.map(({ value, label }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => {
                          setSort(value);
                          setIsSortOpen(false);
                        }}
                        className={`flex w-full items-center rounded-xl px-3 py-3 text-left text-sm ${
                          sort === value ? 'bg-[#EEF4FF] font-semibold text-[#0036A5]' : 'text-[#334155]'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => setIsFiltersOpen(true)}
                aria-label="Фильтр"
                className="inline-flex h-[56px] w-[56px] shrink-0 items-center justify-center rounded-2xl bg-white"
              >
                <ListFilterPlus size={22} className="text-[#0036A5]" />
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1520px] px-3 py-6 md:px-6 md:py-10 !pt-0">
        {view === 'list' ? (
          <>
            <Buy properties={properties} isLoading={isLoading} title="" injectAdsEveryTen />
            <div ref={sentinelRef} className="h-6" />
            {isFetchingNextPage && (
              <div className="grid grid-cols-1 gap-[30px] py-2 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                {Array.from({ length: 4 }).map((_, index) => (
                  <BuyCardSkeleton key={`car-loading-${index}`} />
                ))}
              </div>
            )}
            {!hasNextPage && !isLoading && carsAsListings.length > 0 && (
              <div className="py-4 text-center text-sm text-[#64748B]">
                Больше автомобилей нет
              </div>
            )}
          </>
        ) : (
          <>
            {mapItems.length > 0 ? (
              <div className="relative h-[70vh] min-h-[560px]">
                <div className="h-full w-full">
                  <BuyMap items={mapItems} />
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-[#E2E8F0] bg-white p-6 text-sm text-[#64748B]">
                Для отображения автомобилей на карте нужны координаты в ответе `/cars`.
              </div>
            )}
          </>
        )}
      </section>
    </MainShell>
  );
}
