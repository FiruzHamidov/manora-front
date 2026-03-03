'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  Building2,
  ChevronDown,
  CircleUserRound,
  Heart,
  Home,
  MessageCircle,
  MoveRight,
  Quote,
  Search,
  SlidersHorizontal,
} from 'lucide-react';
import FallbackImage from '@/app/_components/FallbackImage';
import ManoraLoading from '@/app/_components/manora/ManoraLoading';
import MobileCatalogFiltersSheet from '@/app/_components/manora/MobileCatalogFiltersSheet';
import BuyCard from '@/app/_components/buy/buy-card';
import { NewBuildingCardWithPhotos } from '@/app/new-buildings/[slug]/_components/NewBuildingCardWithPhotos';
import { useNewBuildings, useDevelopers } from '@/services/new-buildings/hooks';
import { useGetPropertiesQuery } from '@/services/properties/hooks';
import { useGetCarsQuery } from '@/services/cars/hooks';
import { resolveMediaUrl } from '@/constants/base-url';
import { buildListingsCatalogHref, getPropertyTypeIdsBySlugs } from '@/constants/catalog-links';
import { axios } from '@/utils/axios';
import type { Developer, NewBuildingsFilters } from '@/services/new-buildings/types';
import type { Property, PropertyFilters } from '@/services/properties/types';
import type { Car, CarsFilters } from '@/services/cars/types';

const reviews = [
  {
    name: 'Шерали Абдраров',
    role: 'Покупатель',
    text: 'Оперативно нашли объект, помогли с документами и сопровождали сделку.',
  },
  {
    name: 'Фарзона Абдулло',
    role: 'Покупатель',
    text: 'Очень удобный сервис: объекты, карта и застройщики в одном месте.',
  },
  {
    name: 'Саидмурод Исмоилов',
    role: 'Арендатор',
    text: 'Подобрали квартиру за один день. Все прозрачно и быстро.',
  },
];
const MOBILE_SEARCH_HINTS = ['Новостройки', 'Вторичка', 'Квартиры в аренду', 'Автомобили'];

type HomeTab = 'properties' | 'cars' | 'new-buildings';
type OptionItem = { id: number | string; name: string };

const toOptions = (payload: unknown, nameKey: string = 'name'): OptionItem[] => {
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
      const name = (obj[nameKey] ?? obj.name ?? obj.city ?? obj.title) as string | undefined;
      if (id === undefined || !name) return null;
      return { id, name };
    })
    .filter((item): item is OptionItem => item !== null);
};

const asSelectValue = (value: unknown): string => {
  if (Array.isArray(value)) {
    return value.length > 0 ? String(value[0]) : '';
  }
  if (value === undefined || value === null) return '';
  return String(value);
};

const buildQueryString = <T extends object>(input: T): string => {
  const params = new URLSearchParams();
  Object.entries(input as Record<string, unknown>).forEach(([key, value]) => {
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

const toCompactNumber = (value?: string | number): string => {
  if (value === undefined || value === null || value === '') return '';
  const numeric = Number(String(value).replace(/[^\d]/g, ''));
  if (Number.isNaN(numeric) || numeric <= 0) return '';
  if (numeric >= 1_000_000) {
    const million = numeric / 1_000_000;
    return `${Number.isInteger(million) ? million : million.toFixed(1)}млн`;
  }
  if (numeric >= 1_000) {
    const thousand = numeric / 1_000;
    return `${Number.isInteger(thousand) ? thousand : thousand.toFixed(1)}к`;
  }
  return String(numeric);
};

const formatPriceRangeLabel = (from?: string | number, to?: string | number): string => {
  const left = toCompactNumber(from);
  const right = toCompactNumber(to);
  if (!left && !right) return 'Цена: от - до';
  if (left && right) return `${left}-${right} смн`;
  if (left) return `от ${left} смн`;
  return `до ${right} смн`;
};

const formatRoomsRangeLabel = (from?: string, to?: string): string => {
  if (!from && !to) return 'Комнаты: от - до';
  if (from && to) return `${from}-${to} комн.`;
  if (from) return `от ${from} комн.`;
  return `до ${to} комн.`;
};

const formatAreaRangeLabel = (from?: string, to?: string): string => {
  if (!from && !to) return 'Площадь: от - до';
  if (from && to) return `${from}-${to} м²`;
  if (from) return `от ${from} м²`;
  return `до ${to} м²`;
};

const formatCarYearRangeLabel = (from?: string | number, to?: string | number): string => {
  if (!from && !to) return 'Год: от - до';
  if (from && to) return `${from}-${to}`;
  if (from) return `от ${from}`;
  return `до ${to}`;
};

const formatCeilingRangeLabel = (from?: string | number, to?: string | number): string => {
  if (!from && !to) return 'Потолок: от - до';
  if (from && to) return `${from}-${to} м`;
  if (from) return `от ${from} м`;
  return `до ${to} м`;
};

function SectionTitle({ title, href }: { title: string; href: string }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="text-lg font-extrabold text-[#111827] md:text-2xl">{title}</h2>
      <Link href={href} className="cursor-pointer text-xs font-bold text-[#0036A5] md:text-sm">
        Все
      </Link>
    </div>
  );
}

function DeveloperChip({ developer }: { developer: Developer }) {
  const source = (developer as Developer & { __source?: 'aura' | 'local' }).__source === 'aura' ? 'aura' : 'local';
  const logo = resolveMediaUrl(developer.logo_path, '/images/no-image.png', source);
  return (
    <article className="group cursor-pointer">
      <div className="rounded-xl bg-[#FFFFFF] p-3 transition-all duration-200 group-hover:bg-[#DEE4ED]">
        <div className="mx-auto relative h-14 w-14 overflow-hidden rounded-full bg-white shadow-sm md:h-16 md:w-16">
          <FallbackImage src={logo} alt={developer.name} fill className="object-cover" />
        </div>
      </div>
      <p className="mt-2 line-clamp-1 text-center text-[12px] font-medium text-[#56637A]">
        {developer.name}
      </p>
    </article>
  );
}

export default function HomePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<HomeTab>('properties');
  const [propertyFilters, setPropertyFilters] = useState<PropertyFilters>({
    listing_type: 'regular',
    offer_type: 'sale',
    per_page: 30,
  });
  const [carFilters, setCarFilters] = useState<CarsFilters>({ per_page: 8 });
  const [newBuildingFilters, setNewBuildingFilters] = useState<NewBuildingsFilters>({ per_page: 8 });
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [openRangePanel, setOpenRangePanel] = useState<'rooms' | 'price' | 'area' | 'car-year' | 'car-price' | 'ceiling' | null>(null);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [mobileSearch, setMobileSearch] = useState('');
  const [showMobileSuggestions, setShowMobileSuggestions] = useState(false);
  const [typedHint, setTypedHint] = useState('');
  const [hintIndex, setHintIndex] = useState(0);
  const [isDeletingHint, setIsDeletingHint] = useState(false);

  useEffect(() => {
    if (activeTab !== 'properties') {
      setOpenRangePanel(null);
    }
  }, [activeTab]);

  useEffect(() => {
    const currentHint = MOBILE_SEARCH_HINTS[hintIndex % MOBILE_SEARCH_HINTS.length];
    const atEdge = !isDeletingHint
      ? typedHint.length >= currentHint.length
      : typedHint.length === 0;

    const timeout = window.setTimeout(() => {
      if (!isDeletingHint) {
        if (typedHint.length < currentHint.length) {
          setTypedHint(currentHint.slice(0, typedHint.length + 1));
          return;
        }
        setIsDeletingHint(true);
        return;
      }

      if (typedHint.length > 0) {
        setTypedHint(typedHint.slice(0, -1));
        return;
      }

      setIsDeletingHint(false);
      setHintIndex((prev) => (prev + 1) % MOBILE_SEARCH_HINTS.length);
    }, atEdge ? 900 : isDeletingHint ? 55 : 95);

    return () => window.clearTimeout(timeout);
  }, [hintIndex, isDeletingHint, typedHint]);

  const {
    data: propertyTypesData,
  } = useQuery({ queryKey: ['dict', 'property-types'], queryFn: async () => (await axios.get('/property-types')).data, staleTime: 5 * 60 * 1000 });
  const { data: locationsData } = useQuery({ queryKey: ['dict', 'locations'], queryFn: async () => (await axios.get('/locations')).data, staleTime: 5 * 60 * 1000 });
  useQuery({ queryKey: ['dict', 'building-types'], queryFn: async () => (await axios.get('/building-types')).data, staleTime: 5 * 60 * 1000 });
  const { data: parkingTypesData } = useQuery({ queryKey: ['dict', 'parking-types'], queryFn: async () => (await axios.get('/parking-types')).data, staleTime: 5 * 60 * 1000 });
  const { data: heatingTypesData } = useQuery({ queryKey: ['dict', 'heating-types'], queryFn: async () => (await axios.get('/heating-types')).data, staleTime: 5 * 60 * 1000 });
  const { data: repairTypesData } = useQuery({ queryKey: ['dict', 'repair-types'], queryFn: async () => (await axios.get('/repair-types')).data, staleTime: 5 * 60 * 1000 });
  const { data: contractTypesData } = useQuery({ queryKey: ['dict', 'contract-types'], queryFn: async () => (await axios.get('/contract-types')).data, staleTime: 5 * 60 * 1000 });
  const { data: carCategoriesData } = useQuery({ queryKey: ['dict', 'car-categories'], queryFn: async () => (await axios.get('/car-categories')).data, staleTime: 5 * 60 * 1000 });
  const { data: carBrandsData } = useQuery({ queryKey: ['dict', 'car-brands'], queryFn: async () => (await axios.get('/car-brands')).data, staleTime: 5 * 60 * 1000 });
  const { data: carModelsData } = useQuery({
    queryKey: ['dict', 'car-models', carFilters.brand_id],
    queryFn: async () => (await axios.get('/car-models', { params: { brand_id: carFilters.brand_id } })).data,
    enabled: Boolean(carFilters.brand_id),
    staleTime: 5 * 60 * 1000,
  });
  const { data: stagesData } = useQuery({ queryKey: ['dict', 'construction-stages'], queryFn: async () => (await axios.get('/construction-stages')).data, staleTime: 5 * 60 * 1000 });
  const { data: materialsData } = useQuery({ queryKey: ['dict', 'materials'], queryFn: async () => (await axios.get('/materials')).data, staleTime: 5 * 60 * 1000 });
  useQuery({ queryKey: ['dict', 'features'], queryFn: async () => (await axios.get('/features', { params: { search: '', per_page: 50 } })).data, staleTime: 5 * 60 * 1000 });

  const propertyTypes = useMemo(() => toOptions(propertyTypesData), [propertyTypesData]);
  const propertyTypeIdsBySlug = useMemo(() => ({
    commercial: getPropertyTypeIdsBySlugs(propertyTypesData, ['commercial']),
    housesAndLand: getPropertyTypeIdsBySlugs(propertyTypesData, ['house', 'houses', 'land', 'land_spots']),
  }), [propertyTypesData]);
  const locations = useMemo(() => toOptions(locationsData, 'city'), [locationsData]);
  const parkingTypes = useMemo(() => toOptions(parkingTypesData), [parkingTypesData]);
  const heatingTypes = useMemo(() => toOptions(heatingTypesData), [heatingTypesData]);
  const repairTypes = useMemo(() => toOptions(repairTypesData), [repairTypesData]);
  const contractTypes = useMemo(() => toOptions(contractTypesData), [contractTypesData]);
  const carCategories = useMemo(() => toOptions(carCategoriesData), [carCategoriesData]);
  const carBrands = useMemo(() => toOptions(carBrandsData), [carBrandsData]);
  const carModels = useMemo(() => toOptions(carModelsData), [carModelsData]);
  const constructionStages = useMemo(() => toOptions(stagesData), [stagesData]);
  const materials = useMemo(() => toOptions(materialsData), [materialsData]);

  const { data: newBuildingsData, isLoading: isNewBuildingsLoading } = useNewBuildings({ page: 1, per_page: 8 });
  const { data: developersData } = useDevelopers({ page: 1, per_page: 100 });
  const { data: propertiesData, isLoading: isPropertiesLoading } = useGetPropertiesQuery({ listing_type: 'regular', per_page: 30 });
  const { data: carsData, isLoading: isCarsLoading } = useGetCarsQuery({ page: 1, per_page: 8 });

  const newBuildings = newBuildingsData?.data ?? [];
  const developers = Array.isArray(developersData) ? developersData : developersData?.data || [];
  const allDevelopers = developers.map((developer) => ({ id: developer.id, name: developer.name }));
  const properties = propertiesData?.data ?? [];
  const cars = carsData?.data ?? [];
  const secondary = properties.slice(0, 8);
  const carsAsListings = useMemo<Property[]>(() => {
    return cars.slice(0, 8).map((car, index) => {
      const rawPath =
        car.photos?.find((photo) => photo.is_main)?.path ||
        car.photos?.[0]?.path ||
        car.photos?.[0]?.file_path ||
        car.photos?.[0]?.url;
      const source =
        (car as Car & { __source?: 'aura' | 'local' }).__source === 'aura'
          ? 'aura'
          : 'local';
      const resolvedPhoto = resolveMediaUrl(
        rawPath,
        '/images/no-image.png',
        source
      );
      const title =
        car.title ||
        `${car.brand?.name || ''} ${car.model?.name || ''}`.trim() ||
        'Автомобиль';

      return {
        id: Number(car.id),
        title,
        description: car.description || title,
        moderation_status: 'approved',
        created_by: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        price: String(car.price ?? 0),
        currency: car.currency || 'TJS',
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
        address: [car.brand?.name, car.model?.name, car.year]
          .filter(Boolean)
          .join(' • '),
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
  }, [cars]);
  const isHomeDataLoading = isNewBuildingsLoading || isPropertiesLoading || isCarsLoading;
  const categoryCards = useMemo(() => ([
    { title: 'Новостройки', image: '/categories/novostroyki.png', href: '/new-buildings', imagePositionClass: 'md:bottom-[7px]' },
    { title: 'Вторичка', image: '/categories/vtorichka.png', href: buildListingsCatalogHref() },
    { title: 'Транспорт', image: '/categories/cars.png', href: '/cars', imagePositionClass: 'md:right-[0px] md:bottom-[0px]' },
    { title: 'Ипотечный калькулятор', image: '/categories/calc.png', href: '/mortgage-calculator' },
    { title: 'Аренда', image: '/categories/arenda.png', href: buildListingsCatalogHref({ offerType: 'rent' }), imagePositionClass: 'md:right-[0px] md:bottom-[0px]' },
    { title: 'Коммерческая', image: '/categories/commerce.png', href: buildListingsCatalogHref({ propertyTypeIds: propertyTypeIdsBySlug.commercial }) },
    { title: 'Дома участки', image: '/categories/home.png', href: buildListingsCatalogHref({ propertyTypeIds: propertyTypeIdsBySlug.housesAndLand }) },
    { title: 'Другие категории', href: '/categories' },
  ]), [propertyTypeIdsBySlug]);

  useEffect(() => {
    if (activeTab === 'properties') {
      setMobileSearch(propertyFilters.title ?? '');
      return;
    }
    if (activeTab === 'new-buildings') {
      setMobileSearch(newBuildingFilters.search ?? '');
      return;
    }
    setMobileSearch('');
  }, [activeTab, propertyFilters.title, newBuildingFilters.search]);

  useEffect(() => {
    if (!showMobileFilters) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [showMobileFilters]);

  const mobileSuggestionPool = useMemo(() => {
    if (activeTab === 'properties') {
      return [
        '2-комнатная квартира',
        'Аренда квартиры',
        'Дом с участком',
        ...locations.slice(0, 6).map((item) => item.name),
      ];
    }
    if (activeTab === 'cars') {
      return [
        'Toyota Camry',
        'Hyundai Tucson',
        'Электромобиль',
        ...carBrands.slice(0, 6).map((item) => item.name),
      ];
    }
    return [
      'Новостройка в центре',
      'Сдача в 2026',
      ...allDevelopers.slice(0, 6).map((item) => item.name),
    ];
  }, [activeTab, locations, carBrands, allDevelopers]);

  const mobileSuggestions = useMemo(() => {
    const search = mobileSearch.trim().toLowerCase();
    if (!search) return mobileSuggestionPool.slice(0, 6);
    return mobileSuggestionPool
      .filter((item) => item.toLowerCase().includes(search))
      .slice(0, 8);
  }, [mobileSearch, mobileSuggestionPool]);

  const handleResetFilters = () => {
    if (activeTab === 'properties') {
      const resetFilters: PropertyFilters = { listing_type: 'regular', offer_type: 'sale', per_page: 30 };
      setPropertyFilters(resetFilters);
      setOpenRangePanel(null);
      return;
    }
    if (activeTab === 'cars') {
      const resetFilters: CarsFilters = { per_page: 8 };
      setCarFilters(resetFilters);
      return;
    }
    const resetFilters: NewBuildingsFilters = { per_page: 8 };
    setNewBuildingFilters(resetFilters);
  };

  const hasActivePropertyFilters = useMemo(() => {
    const defaults: Partial<PropertyFilters> = { listing_type: 'regular', offer_type: 'sale', per_page: 30 };
    return Object.entries(propertyFilters).some(([key, value]) => {
      if (value === undefined || value === null || value === '') return false;
      if (Array.isArray(value) && value.length === 0) return false;
      if (key in defaults && String(value) === String(defaults[key as keyof typeof defaults])) return false;
      return true;
    });
  }, [propertyFilters]);

  const hasActiveCarFilters = useMemo(() => (
    Object.entries(carFilters).some(([key, value]) => key !== 'per_page' && value !== undefined && value !== null && value !== '')
  ), [carFilters]);

  const hasActiveNewBuildingFilters = useMemo(() => (
    Object.entries(newBuildingFilters).some(([key, value]) => key !== 'per_page' && value !== undefined && value !== null && value !== '')
  ), [newBuildingFilters]);

  const handleFind = () => {
    const normalizedSearch = mobileSearch.trim();

    if (activeTab === 'properties') {
      const payload: PropertyFilters = {
        ...propertyFilters,
        title: normalizedSearch || propertyFilters.title,
      };
      const query = buildQueryString(payload);
      router.push(query ? `/listings?${query}` : '/listings');
      return;
    }
    if (activeTab === 'cars') {
      const query = buildQueryString(carFilters);
      router.push(query ? `/cars?${query}` : '/cars');
      return;
    }
    const payload: NewBuildingsFilters = {
      ...newBuildingFilters,
      search: normalizedSearch || newBuildingFilters.search,
    };
    const query = buildQueryString(payload);
    router.push(query ? `/new-buildings?${query}` : '/new-buildings');
  };

  return (
    <div className="min-h-screen">
      {isHomeDataLoading && <ManoraLoading fullscreen text="Загружаем главную..." />}

      <div className="mx-auto w-full max-w-[1520px] px-3 pb-6 md:px-6">
        <section className="hidden md:block relative left-1/2 right-1/2 -mx-[50vw] w-screen overflow-hidden bg-[#0036A5]">
          <div className="relative h-[480px]">
            <iframe
              className="pointer-events-none absolute left-0 top-1/2 h-[56.25vw] min-h-full w-full -translate-y-1/2"
              src="https://www.youtube-nocookie.com/embed/vfRFp_s-W1g?start=5&autoplay=1&mute=1&controls=0&loop=1&playlist=vfRFp_s-W1g&modestbranding=1&rel=0&playsinline=1&iv_load_policy=3&disablekb=1&fs=0&cc_load_policy=0"
              title="Manora banner background video"
              allow="autoplay; encrypted-media; picture-in-picture"
              referrerPolicy="strict-origin-when-cross-origin"
            />
            <div className="absolute inset-0 bg-black/55" />

            <div className="relative z-10 mx-auto flex h-full w-full max-w-[1520px] flex-col justify-center px-3 md:px-6">
              <h1 className="max-w-[900px] text-3xl font-extrabold text-white md:text-5xl">
                Найди дом и авто своей мечты прямо сейчас
              </h1>

              <div className="mt-5 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('properties')}
                  className={`rounded-[10px] px-4 py-2 text-sm font-medium text-white transition-colors ${
                    activeTab === 'properties' ? 'bg-[#0036A5]' : 'bg-black/45 hover:bg-black/60'
                  }`}
                >
                  Недвижимость
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('cars')}
                  className={`rounded-[10px] px-4 py-2 text-sm font-medium text-white transition-colors ${
                    activeTab === 'cars' ? 'bg-[#0036A5]' : 'bg-black/45 hover:bg-black/60'
                  }`}
                >
                  Авто
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('new-buildings')}
                  className={`rounded-[10px] px-4 py-2 text-sm font-medium text-white transition-colors ${
                    activeTab === 'new-buildings' ? 'bg-[#0036A5]' : 'bg-black/45 hover:bg-black/60'
                  }`}
                >
                  Новостройки
                </button>
              </div>

              <div className="mt-3 rounded-[12px] bg-white p-1.5 shadow-[0_10px_24px_rgba(0,0,0,0.18)]">
                {activeTab === 'properties' && (
                  <>
                    <div className="grid gap-1 md:grid-cols-[1fr_1fr_1fr_1fr_1fr_auto_auto_auto] md:gap-0 md:[&>*:not(:last-child)]:border-r md:[&>*:not(:last-child)]:border-[#E5E7EB]">
                      <label className="relative">
                        <select
                          value={asSelectValue(propertyFilters.type_id)}
                          onChange={(event) => setPropertyFilters((prev) => ({ ...prev, type_id: event.target.value || undefined }))}
                          className="h-11 w-full appearance-none rounded-[8px] px-3 pr-8 text-[15px] text-[#111827] outline-none"
                        >
                          <option value="">Тип недвижимости</option>
                          {propertyTypes.map((option) => (
                            <option key={option.id} value={option.id}>{option.name}</option>
                          ))}
                        </select>
                        <ChevronDown size={18} className="pointer-events-none absolute right-3 top-3.5 text-[#4B5563]" />
                      </label>
                      <label className="relative">
                        <select
                          value={asSelectValue(propertyFilters.location_id)}
                          onChange={(event) => setPropertyFilters((prev) => ({ ...prev, location_id: event.target.value || undefined }))}
                          className="h-11 w-full appearance-none rounded-[8px] px-3 pr-8 text-[15px] text-[#111827] outline-none"
                        >
                          <option value="">По всему Таджикистану</option>
                          {locations.map((option) => (
                            <option key={option.id} value={option.id}>{option.name}</option>
                          ))}
                        </select>
                        <ChevronDown size={18} className="pointer-events-none absolute right-3 top-3.5 text-[#4B5563]" />
                      </label>
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setOpenRangePanel((prev) => (prev === 'rooms' ? null : 'rooms'))}
                          className="flex h-11 w-full items-center justify-between rounded-[8px] px-3 text-[15px] text-[#111827] outline-none"
                        >
                          <span>{formatRoomsRangeLabel(propertyFilters.roomsFrom, propertyFilters.roomsTo)}</span>
                          <ChevronDown size={18} className="text-[#4B5563]" />
                        </button>
                        {openRangePanel === 'rooms' && (
                          <div className="absolute left-0 top-[46px] z-20 w-full rounded-[10px] border border-[#E5E7EB] bg-white p-2 shadow-lg">
                            <div className="grid grid-cols-2 gap-2">
                              <input
                                value={propertyFilters.roomsFrom ?? ''}
                                onChange={(event) => setPropertyFilters((prev) => ({ ...prev, roomsFrom: event.target.value || undefined }))}
                                className="h-9 rounded-[8px] border border-[#E5E7EB] px-2 text-sm text-[#111827] outline-none"
                                placeholder="От"
                              />
                              <input
                                value={propertyFilters.roomsTo ?? ''}
                                onChange={(event) => setPropertyFilters((prev) => ({ ...prev, roomsTo: event.target.value || undefined }))}
                                className="h-9 rounded-[8px] border border-[#E5E7EB] px-2 text-sm text-[#111827] outline-none"
                                placeholder="До"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setOpenRangePanel((prev) => (prev === 'price' ? null : 'price'))}
                          className="flex h-11 w-full items-center justify-between rounded-[8px] px-3 text-[15px] text-[#111827] outline-none"
                        >
                          <span>{formatPriceRangeLabel(propertyFilters.priceFrom, propertyFilters.priceTo)}</span>
                          <ChevronDown size={18} className="text-[#4B5563]" />
                        </button>
                        {openRangePanel === 'price' && (
                          <div className="absolute left-0 top-[46px] z-20 w-full rounded-[10px] border border-[#E5E7EB] bg-white p-2 shadow-lg">
                            <div className="grid grid-cols-2 gap-2">
                              <input
                                value={propertyFilters.priceFrom ?? ''}
                                onChange={(event) => setPropertyFilters((prev) => ({ ...prev, priceFrom: event.target.value || undefined }))}
                                className="h-9 rounded-[8px] border border-[#E5E7EB] px-2 text-sm text-[#111827] outline-none"
                                placeholder="От"
                                inputMode="numeric"
                              />
                              <input
                                value={propertyFilters.priceTo ?? ''}
                                onChange={(event) => setPropertyFilters((prev) => ({ ...prev, priceTo: event.target.value || undefined }))}
                                className="h-9 rounded-[8px] border border-[#E5E7EB] px-2 text-sm text-[#111827] outline-none"
                                placeholder="До"
                                inputMode="numeric"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setOpenRangePanel((prev) => (prev === 'area' ? null : 'area'))}
                          className="flex h-11 w-full items-center justify-between rounded-[8px] px-3 text-[15px] text-[#111827] outline-none"
                        >
                          <span>{formatAreaRangeLabel(propertyFilters.areaFrom, propertyFilters.areaTo)}</span>
                          <ChevronDown size={18} className="text-[#4B5563]" />
                        </button>
                        {openRangePanel === 'area' && (
                          <div className="absolute left-0 top-[46px] z-20 w-full rounded-[10px] border border-[#E5E7EB] bg-white p-2 shadow-lg">
                            <div className="grid grid-cols-2 gap-2">
                              <input
                                value={propertyFilters.areaFrom ?? ''}
                                onChange={(event) => setPropertyFilters((prev) => ({ ...prev, areaFrom: event.target.value || undefined, total_areaFrom: event.target.value || undefined }))}
                                className="h-9 rounded-[8px] border border-[#E5E7EB] px-2 text-sm text-[#111827] outline-none"
                                placeholder="От, м2"
                                inputMode="numeric"
                              />
                              <input
                                value={propertyFilters.areaTo ?? ''}
                                onChange={(event) => setPropertyFilters((prev) => ({ ...prev, areaTo: event.target.value || undefined, total_areaTo: event.target.value || undefined }))}
                                className="h-9 rounded-[8px] border border-[#E5E7EB] px-2 text-sm text-[#111827] outline-none"
                                placeholder="До, м2"
                                inputMode="numeric"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowAdvancedFilters((prev) => !prev)}
                        className="flex h-11 items-center gap-2 rounded-[8px] px-3 text-[15px] text-[#111827]"
                      >
                        <SlidersHorizontal size={16} className="text-[#0036A5]" />
                        <span>{showAdvancedFilters ? 'Скрыть' : 'Фильтры'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleFind}
                        className="h-11 rounded-[8px] bg-[#0036A5] px-5 text-sm font-semibold text-white hover:bg-[#0036A5]"
                      >
                        Найти
                      </button>
                      {hasActivePropertyFilters && (
                        <button
                          type="button"
                          onClick={handleResetFilters}
                          className="h-11 rounded-[8px] bg-[#E2E8F0] px-6 text-sm font-semibold text-[#334155] hover:bg-[#CBD5E1]"
                        >
                          Сбросить
                        </button>
                      )}
                    </div>
                    <div
                      className={`grid gap-1 md:grid-cols-6 overflow-hidden transition-all duration-300 ease-out ${
                        showAdvancedFilters
                          ? 'mt-2 max-h-[1200px] opacity-100'
                          : 'max-h-0 opacity-0 pointer-events-none'
                      }`}
                    >
                        <label className="relative">
                          <select
                            value={asSelectValue(propertyFilters.repair_type_id)}
                            onChange={(event) => setPropertyFilters((prev) => ({ ...prev, repair_type_id: event.target.value || undefined }))}
                            className="h-10 w-full appearance-none rounded-[8px] border border-[#E5E7EB] px-3 pr-8 text-sm text-[#111827] outline-none"
                          >
                            <option value="">Тип ремонта</option>
                            {repairTypes.map((option) => (
                              <option key={option.id} value={option.id}>{option.name}</option>
                            ))}
                          </select>
                          <ChevronDown size={16} className="pointer-events-none absolute right-3 top-3 text-[#4B5563]" />
                        </label>
                        <label className="relative">
                          <select
                            value={asSelectValue(propertyFilters.contract_type_id)}
                            onChange={(event) => setPropertyFilters((prev) => ({ ...prev, contract_type_id: event.target.value || undefined }))}
                            className="h-10 w-full appearance-none rounded-[8px] border border-[#E5E7EB] px-3 pr-8 text-sm text-[#111827] outline-none"
                          >
                            <option value="">Тип договора</option>
                            {contractTypes.map((option) => (
                              <option key={option.id} value={option.id}>{option.name}</option>
                            ))}
                          </select>
                          <ChevronDown size={16} className="pointer-events-none absolute right-3 top-3 text-[#4B5563]" />
                        </label>
                        <select
                          value={propertyFilters.offer_type ?? 'sale'}
                          onChange={(event) => setPropertyFilters((prev) => ({ ...prev, offer_type: event.target.value }))}
                          className="h-10 rounded-[8px] border border-[#E5E7EB] px-3 text-sm text-[#111827] outline-none"
                        >
                          <option value="sale">Продажа</option>
                          <option value="rent">Аренда</option>
                        </select>
                        <select
                          value={propertyFilters.listing_type ?? 'regular'}
                          onChange={(event) => setPropertyFilters((prev) => ({ ...prev, listing_type: event.target.value }))}
                          className="h-10 rounded-[8px] border border-[#E5E7EB] px-3 text-sm text-[#111827] outline-none"
                        >
                          <option value="regular">Обычное</option>
                          <option value="vip">VIP</option>
                          <option value="urgent">Срочное</option>
                        </select>
                        <label className="relative">
                          <select
                            value={asSelectValue(propertyFilters.developer_id)}
                            onChange={(event) => setPropertyFilters((prev) => ({ ...prev, developer_id: event.target.value || undefined }))}
                            className="h-10 w-full appearance-none rounded-[8px] border border-[#E5E7EB] px-3 pr-8 text-sm text-[#111827] outline-none"
                          >
                            <option value="">Застройщик</option>
                            {allDevelopers.map((option) => (
                              <option key={option.id} value={option.id}>{option.name}</option>
                            ))}
                          </select>
                          <ChevronDown size={16} className="pointer-events-none absolute right-3 top-3 text-[#4B5563]" />
                        </label>
                        <label className="relative">
                          <select
                            value={asSelectValue(propertyFilters.heating_type_id)}
                            onChange={(event) => setPropertyFilters((prev) => ({ ...prev, heating_type_id: event.target.value || undefined }))}
                            className="h-10 w-full appearance-none rounded-[8px] border border-[#E5E7EB] px-3 pr-8 text-sm text-[#111827] outline-none"
                          >
                            <option value="">Отопление</option>
                            {heatingTypes.map((option) => (
                              <option key={option.id} value={option.id}>{option.name}</option>
                            ))}
                          </select>
                          <ChevronDown size={16} className="pointer-events-none absolute right-3 top-3 text-[#4B5563]" />
                        </label>
                        <label className="relative">
                          <select
                            value={asSelectValue(propertyFilters.parking_type_id)}
                            onChange={(event) => setPropertyFilters((prev) => ({ ...prev, parking_type_id: event.target.value || undefined }))}
                            className="h-10 w-full appearance-none rounded-[8px] border border-[#E5E7EB] px-3 pr-8 text-sm text-[#111827] outline-none"
                          >
                            <option value="">Парковка</option>
                            {parkingTypes.map((option) => (
                              <option key={option.id} value={option.id}>{option.name}</option>
                            ))}
                          </select>
                          <ChevronDown size={16} className="pointer-events-none absolute right-3 top-3 text-[#4B5563]" />
                        </label>
                        <input
                          value={propertyFilters.title ?? ''}
                          onChange={(event) => setPropertyFilters((prev) => ({ ...prev, title: event.target.value || undefined }))}
                          className="h-10 rounded-[8px] border border-[#E5E7EB] px-3 text-sm text-[#111827] outline-none"
                          placeholder="Поиск по названию"
                        />
                        <input
                          value={propertyFilters.district ?? ''}
                          onChange={(event) => setPropertyFilters((prev) => ({ ...prev, district: event.target.value || undefined }))}
                          className="h-10 rounded-[8px] border border-[#E5E7EB] px-3 text-sm text-[#111827] outline-none"
                          placeholder="Район"
                        />
                        <input
                          value={propertyFilters.address ?? ''}
                          onChange={(event) => setPropertyFilters((prev) => ({ ...prev, address: event.target.value || undefined }))}
                          className="h-10 rounded-[8px] border border-[#E5E7EB] px-3 text-sm text-[#111827] outline-none"
                          placeholder="Адрес"
                        />
                        <input
                          value={propertyFilters.landmark ?? ''}
                          onChange={(event) => setPropertyFilters((prev) => ({ ...prev, landmark: event.target.value || undefined }))}
                          className="h-10 rounded-[8px] border border-[#E5E7EB] px-3 text-sm text-[#111827] outline-none"
                          placeholder="Ориентир"
                        />
                        <input
                          value={propertyFilters.floorFrom ?? ''}
                          onChange={(event) => setPropertyFilters((prev) => ({ ...prev, floorFrom: event.target.value || undefined }))}
                          className="h-10 rounded-[8px] border border-[#E5E7EB] px-3 text-sm text-[#111827] outline-none"
                          placeholder="Этаж от"
                        />
                        <input
                          value={propertyFilters.floorTo ?? ''}
                          onChange={(event) => setPropertyFilters((prev) => ({ ...prev, floorTo: event.target.value || undefined }))}
                          className="h-10 rounded-[8px] border border-[#E5E7EB] px-3 text-sm text-[#111827] outline-none"
                          placeholder="Этаж до"
                        />
                        <select
                          value={propertyFilters.has_parking === undefined ? '' : String(propertyFilters.has_parking)}
                          onChange={(event) => setPropertyFilters((prev) => ({ ...prev, has_parking: event.target.value === '' ? undefined : event.target.value === 'true' }))}
                          className="h-10 rounded-[8px] border border-[#E5E7EB] px-3 text-sm text-[#111827] outline-none"
                        >
                          <option value="">Парковка (да/нет)</option>
                          <option value="true">Да</option>
                          <option value="false">Нет</option>
                        </select>
                        <select
                          value={propertyFilters.is_mortgage_available === undefined ? '' : String(propertyFilters.is_mortgage_available)}
                          onChange={(event) => setPropertyFilters((prev) => ({ ...prev, is_mortgage_available: event.target.value === '' ? undefined : event.target.value === 'true' }))}
                          className="h-10 rounded-[8px] border border-[#E5E7EB] px-3 text-sm text-[#111827] outline-none"
                        >
                          <option value="">Ипотека (да/нет)</option>
                          <option value="true">Да</option>
                          <option value="false">Нет</option>
                        </select>
                      </div>
                  </>
                )}

                {activeTab === 'cars' && (
                  <div className="grid gap-1 md:grid-cols-[1fr_1fr_1fr_1fr_1fr_auto_auto] md:gap-0 md:[&>*:not(:last-child)]:border-r md:[&>*:not(:last-child)]:border-[#E5E7EB]">
                    <label className="relative">
                      <select
                        value={carFilters.category_id ?? ''}
                        onChange={(event) => setCarFilters((prev) => ({ ...prev, category_id: event.target.value || undefined }))}
                        className="h-11 w-full appearance-none rounded-[8px] px-3 pr-8 text-[15px] text-[#111827] outline-none"
                      >
                        <option value="">Категория</option>
                        {carCategories.map((option) => (
                          <option key={option.id} value={option.id}>{option.name}</option>
                        ))}
                      </select>
                      <ChevronDown size={18} className="pointer-events-none absolute right-3 top-3.5 text-[#4B5563]" />
                    </label>
                    <label className="relative">
                      <select
                        value={carFilters.brand_id ?? ''}
                        onChange={(event) => setCarFilters((prev) => ({ ...prev, brand_id: event.target.value || undefined, model_id: undefined }))}
                        className="h-11 w-full appearance-none rounded-[8px] px-3 pr-8 text-[15px] text-[#111827] outline-none"
                      >
                        <option value="">Марка</option>
                        {carBrands.map((option) => (
                          <option key={option.id} value={option.id}>{option.name}</option>
                        ))}
                      </select>
                      <ChevronDown size={18} className="pointer-events-none absolute right-3 top-3.5 text-[#4B5563]" />
                    </label>
                    <label className="relative">
                      <select
                        value={carFilters.model_id ?? ''}
                        onChange={(event) => setCarFilters((prev) => ({ ...prev, model_id: event.target.value || undefined }))}
                        className="h-11 w-full appearance-none rounded-[8px] px-3 pr-8 text-[15px] text-[#111827] outline-none"
                      >
                        <option value="">Модель</option>
                        {carModels.map((option) => (
                          <option key={option.id} value={option.id}>{option.name}</option>
                        ))}
                      </select>
                      <ChevronDown size={18} className="pointer-events-none absolute right-3 top-3.5 text-[#4B5563]" />
                    </label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setOpenRangePanel((prev) => (prev === 'car-year' ? null : 'car-year'))}
                        className="flex h-11 w-full items-center justify-between rounded-[8px] px-3 text-[15px] text-[#111827] outline-none"
                      >
                        <span>{formatCarYearRangeLabel(carFilters.year_from, carFilters.year_to)}</span>
                        <ChevronDown size={18} className="text-[#4B5563]" />
                      </button>
                      {openRangePanel === 'car-year' && (
                        <div className="absolute left-0 top-[46px] z-20 w-full rounded-[10px] border border-[#E5E7EB] bg-white p-2 shadow-lg">
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              value={carFilters.year_from ?? ''}
                              onChange={(event) => setCarFilters((prev) => ({ ...prev, year_from: event.target.value || undefined }))}
                              className="h-9 rounded-[8px] border border-[#E5E7EB] px-2 text-sm text-[#111827] outline-none"
                              placeholder="От"
                              inputMode="numeric"
                            />
                            <input
                              value={carFilters.year_to ?? ''}
                              onChange={(event) => setCarFilters((prev) => ({ ...prev, year_to: event.target.value || undefined }))}
                              className="h-9 rounded-[8px] border border-[#E5E7EB] px-2 text-sm text-[#111827] outline-none"
                              placeholder="До"
                              inputMode="numeric"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setOpenRangePanel((prev) => (prev === 'car-price' ? null : 'car-price'))}
                        className="flex h-11 w-full items-center justify-between rounded-[8px] px-3 text-[15px] text-[#111827] outline-none"
                      >
                        <span>{formatPriceRangeLabel(carFilters.price_from, carFilters.price_to)}</span>
                        <ChevronDown size={18} className="text-[#4B5563]" />
                      </button>
                      {openRangePanel === 'car-price' && (
                        <div className="absolute left-0 top-[46px] z-20 w-full rounded-[10px] border border-[#E5E7EB] bg-white p-2 shadow-lg">
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              value={carFilters.price_from ?? ''}
                              onChange={(event) => setCarFilters((prev) => ({ ...prev, price_from: event.target.value || undefined }))}
                              className="h-9 rounded-[8px] border border-[#E5E7EB] px-2 text-sm text-[#111827] outline-none"
                              placeholder="От"
                              inputMode="numeric"
                            />
                            <input
                              value={carFilters.price_to ?? ''}
                              onChange={(event) => setCarFilters((prev) => ({ ...prev, price_to: event.target.value || undefined }))}
                              className="h-9 rounded-[8px] border border-[#E5E7EB] px-2 text-sm text-[#111827] outline-none"
                              placeholder="До"
                              inputMode="numeric"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={handleFind}
                      className="h-11 rounded-[8px] bg-[#0036A5] px-5 text-sm font-semibold text-white hover:bg-[#0036A5]"
                    >
                      Найти
                    </button>
                    {hasActiveCarFilters && (
                      <button
                        type="button"
                        onClick={handleResetFilters}
                        className="h-11 rounded-[8px] bg-[#E2E8F0] px-6 text-sm font-semibold text-[#334155] hover:bg-[#CBD5E1]"
                      >
                        Сбросить
                      </button>
                    )}
                  </div>
                )}

                {activeTab === 'new-buildings' && (
                  <div className="grid gap-1 md:grid-cols-[1fr_1fr_1fr_1fr_1fr_auto_auto] md:gap-0 md:[&>*:not(:last-child)]:border-r md:[&>*:not(:last-child)]:border-[#E5E7EB]">
                    <label className="relative">
                      <select
                        value={newBuildingFilters.developer_id ?? ''}
                        onChange={(event) => setNewBuildingFilters((prev) => ({ ...prev, developer_id: event.target.value || undefined }))}
                        className="h-11 w-full appearance-none rounded-[8px] px-3 pr-8 text-[15px] text-[#111827] outline-none"
                      >
                        <option value="">Застройщик</option>
                        {allDevelopers.map((option) => (
                          <option key={option.id} value={option.id}>{option.name}</option>
                        ))}
                      </select>
                      <ChevronDown size={18} className="pointer-events-none absolute right-3 top-3.5 text-[#4B5563]" />
                    </label>
                    <label className="relative">
                      <select
                        value={newBuildingFilters.stage_id ?? ''}
                        onChange={(event) => setNewBuildingFilters((prev) => ({ ...prev, stage_id: event.target.value || undefined }))}
                        className="h-11 w-full appearance-none rounded-[8px] px-3 pr-8 text-[15px] text-[#111827] outline-none"
                      >
                        <option value="">Стадия строительства</option>
                        {constructionStages.map((option) => (
                          <option key={option.id} value={option.id}>{option.name}</option>
                        ))}
                      </select>
                      <ChevronDown size={18} className="pointer-events-none absolute right-3 top-3.5 text-[#4B5563]" />
                    </label>
                    <label className="relative">
                      <select
                        value={newBuildingFilters.material_id ?? ''}
                        onChange={(event) => setNewBuildingFilters((prev) => ({ ...prev, material_id: event.target.value || undefined }))}
                        className="h-11 w-full appearance-none rounded-[8px] px-3 pr-8 text-[15px] text-[#111827] outline-none"
                      >
                        <option value="">Материал</option>
                        {materials.map((option) => (
                          <option key={option.id} value={option.id}>{option.name}</option>
                        ))}
                      </select>
                      <ChevronDown size={18} className="pointer-events-none absolute right-3 top-3.5 text-[#4B5563]" />
                    </label>
                    <input
                      value={newBuildingFilters.search ?? ''}
                      onChange={(event) => setNewBuildingFilters((prev) => ({ ...prev, search: event.target.value || undefined }))}
                      className="h-11 rounded-[8px] px-3 text-[15px] text-[#111827] outline-none"
                      placeholder="Поиск по названию"
                    />
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setOpenRangePanel((prev) => (prev === 'ceiling' ? null : 'ceiling'))}
                        className="flex h-11 w-full items-center justify-between rounded-[8px] px-3 text-[15px] text-[#111827] outline-none"
                      >
                        <span>{formatCeilingRangeLabel(newBuildingFilters.ceiling_height_min, newBuildingFilters.ceiling_height_max)}</span>
                        <ChevronDown size={18} className="text-[#4B5563]" />
                      </button>
                      {openRangePanel === 'ceiling' && (
                        <div className="absolute left-0 top-[46px] z-20 w-full rounded-[10px] border border-[#E5E7EB] bg-white p-2 shadow-lg">
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              value={newBuildingFilters.ceiling_height_min ?? ''}
                              onChange={(event) => setNewBuildingFilters((prev) => ({ ...prev, ceiling_height_min: event.target.value || undefined }))}
                              className="h-9 rounded-[8px] border border-[#E5E7EB] px-2 text-sm text-[#111827] outline-none"
                              placeholder="От"
                              inputMode="decimal"
                            />
                            <input
                              value={newBuildingFilters.ceiling_height_max ?? ''}
                              onChange={(event) => setNewBuildingFilters((prev) => ({ ...prev, ceiling_height_max: event.target.value || undefined }))}
                              className="h-9 rounded-[8px] border border-[#E5E7EB] px-2 text-sm text-[#111827] outline-none"
                              placeholder="До"
                              inputMode="decimal"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={handleFind}
                      className="h-11 rounded-[8px] bg-[#0036A5] px-5 text-sm font-semibold text-white hover:bg-[#0036A5]"
                    >
                      Найти
                    </button>
                    {hasActiveNewBuildingFilters && (
                      <button
                        type="button"
                        onClick={handleResetFilters}
                        className="h-11 rounded-[8px] bg-[#E2E8F0] px-6 text-sm font-semibold text-[#334155] hover:bg-[#CBD5E1]"
                      >
                        Сбросить
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        <MobileCatalogFiltersSheet
          isOpen={showMobileFilters}
          onClose={() => setShowMobileFilters(false)}
          defaultMode={activeTab === 'cars' ? 'cars' : activeTab === 'new-buildings' ? 'new-buildings' : propertyFilters.offer_type === 'rent' ? 'rent' : 'secondary'}
        />

        <section className="mt-2 md:mt-[60px] rounded-[18px] py-4 md:py-5">
          <h2 className="mb-3 text-2xl font-extrabold text-[#111827]">Категории</h2>
          <div className="hide-scrollbar flex gap-4 overflow-x-auto md:grid md:grid-cols-4 md:overflow-visible md:gap-5">
            {categoryCards.map((item) => (
              <Link
                key={item.title}
                href={item.href}
                className="group relative flex min-h-[108px] w-[170px] shrink-0 cursor-pointer items-start overflow-hidden rounded-2xl border border-transparent bg-[#FFFFFF] text-left transition-all duration-300 ease-out hover:cursor-pointer hover:-translate-y-0.5 hover:border-[#D6E2FF] hover:shadow-[0_6px_14px_rgba(15,23,42,0.07),0_0_14px_rgba(0,54,165,0.10)] md:h-[120px] md:max-h-[120px] md:w-auto md:shrink"
              >
                <span className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 bg-[radial-gradient(120px_80px_at_85%_90%,rgba(0,54,165,0.10),transparent_70%)]" />
                <div className="relative z-10 w-full p-3 md:p-4">
                  <span className="block max-w-[56%] text-[12px] leading-4 font-medium text-[#111827] transition-colors duration-300 group-hover:text-[#0B2E7A] md:max-w-[58%] md:text-lg md:leading-5">
                    {item.title}
                  </span>
                </div>
                {item.image ? (
                  <div className={`pointer-events-none absolute right-[10px] bottom-[0px] h-[72px] w-[72px] md:right-[10px] md:bottom-[-10px] md:h-[120px] md:w-[120px] ${item.imagePositionClass ?? ''}`}>
                    <Image
                      src={item.image}
                      alt={item.title}
                      fill
                      className="object-contain object-right-bottom opacity-95 transition-transform duration-300 ease-out group-hover:scale-110 md:scale-110 md:group-hover:scale-[1.17]"
                      sizes="120px"
                    />
                  </div>
                ) : (
                  <span className="absolute right-4 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-[#E8ECF3] text-[#7B859A] transition-all duration-300 group-hover:translate-x-0.5 group-hover:bg-[#DCE3EF] group-hover:text-[#0036A5]">
                    <MoveRight size={22} />
                  </span>
                )}
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-2 md:mt-[60px]">
          <SectionTitle title="Вторичка" href={buildListingsCatalogHref()} />
          <div className="md:hidden -mx-4 overflow-x-auto px-4 pb-2 hide-scrollbar">
            <div className="flex gap-2.5">
              {secondary.map((property) => (
                <div key={`home-property-${property.id}`} className="w-[calc(100%-72px)] min-w-[calc(100%-72px)]">
                  <BuyCard listing={property} isForClient />
                </div>
              ))}
            </div>
          </div>
          <div className="hidden md:grid md:grid-cols-2 xl:grid-cols-4 gap-4">
            {secondary.map((property) => (
              <BuyCard key={`home-property-grid-${property.id}`} listing={property} isForClient />
            ))}
          </div>
        </section>

        <section className="mt-2 md:mt-[60px]">
          <SectionTitle title="Новостройки" href="/new-buildings" />
          <div className="md:hidden -mx-4 overflow-x-auto px-4 pb-2 hide-scrollbar">
            <div className="flex gap-2.5">
              {newBuildings.slice(0, 8).map((building) => (
                <div
                  key={(building as { __uid?: string }).__uid || `nb_mobile_${building.id}`}
                  className="w-[calc(100%-72px)] min-w-[calc(100%-72px)]"
                >
                  <NewBuildingCardWithPhotos
                    building={building}
                    className="h-full"
                  />
                </div>
              ))}
            </div>
          </div>
          <div className="hidden md:grid md:grid-cols-4 gap-4">
            {newBuildings.slice(0, 8).map((building) => (
              <NewBuildingCardWithPhotos
                key={(building as { __uid?: string }).__uid || `nb_${building.id}`}
                building={building}
                className="h-full"
              />
            ))}
          </div>
        </section>

        <section className="relative mt-2 md:mt-[60px] h-[220px] overflow-hidden rounded-[16px]">
          <Image
            src="/images/buildings.jpg"
            alt="Новостройки"
            fill
            className="object-cover"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,#660653_0%,#1A5FEC_100%)] opacity-85" />
          <div className="relative z-10 flex h-full flex-col justify-center px-6 md:px-8">
            <p className=" text-[26px] font-extrabold uppercase leading-[1.25] text-white md:text-[40px]">
              Продавайте новостройки на нашей платформе!
            </p>
            <p className="mt-3 text-lg leading-[0.95] font-medium text-white/95 md:text-[20px] md:leading-tight">
              платформа для жителей, риэлторов и застройщиков по всему Таджикистану
            </p>
            <div className="mt-5">
              <Link
                href="/partners"
                className="inline-flex items-center justify-center rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-[#0B43B8] transition hover:bg-white/90 md:text-base"
              >
                Стать партнером
              </Link>
            </div>
          </div>
        </section>

        <section className="mt-2 md:mt-[60px]">
          <SectionTitle title="Автомобили" href="/cars" />
          <div className="md:hidden -mx-4 overflow-x-auto px-4 pb-2 hide-scrollbar">
            <div className="flex gap-2.5">
              {carsAsListings.map((carListing) => (
                <div key={`home-car-${carListing.id}`} className="w-[calc(100%-72px)] min-w-[calc(100%-72px)]">
                  <BuyCard listing={carListing} isForClient />
                </div>
              ))}
            </div>
          </div>
          <div className="hidden md:grid md:grid-cols-2 xl:grid-cols-4 gap-4">
            {carsAsListings.map((carListing) => (
              <BuyCard key={`home-car-grid-${carListing.id}`} listing={carListing} isForClient />
            ))}
          </div>
        </section>

        <section className="mt-2 md:mt-[60px] rounded-[18px] bg-[#F2F4F8] p-3 md:p-4">
          <h2 className="mb-3 text-lg font-extrabold text-[#111827] md:text-[36px] md:leading-[1.05]">
            Топовые застройщики
          </h2>
          <div className="grid grid-cols-2 gap-2.5 md:grid-cols-6 md:gap-3">
            {developers.slice(0, 10).map((developer) => (
              <DeveloperChip key={developer.id} developer={developer} />
            ))}
          </div>
        </section>

        <section className="mt-2 md:mt-[60px] rounded-[18px] bg-[#F2F4F8] p-3 md:p-4">
          <h2 className="mb-3 text-lg font-extrabold text-[#111827] md:text-[36px] md:leading-[1.05]">
            Отзывы наших пользователей
          </h2>
          <div className="grid gap-2.5 md:grid-cols-3 md:gap-3">
            {reviews.map((review) => (
              <article
                key={review.name}
                className="relative rounded-[14px] border border-[#D9E0EA] bg-white p-4 md:p-5"
              >
                <Quote
                  size={28}
                  className="absolute right-4 top-4 text-[#CBD5E1]"
                />
                <div className="mb-2 flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#E8ECF2] text-xs font-bold text-[#334155]">
                    {review.name.split(' ').map((part) => part[0]).join('').slice(0, 2)}
                  </div>
                  <div>
                    <p className="text-[15px] font-bold text-[#0F172A]">{review.name}</p>
                    <p className="text-[12px] text-[#8A96AB]">{review.role}</p>
                  </div>
                </div>
                <p className="pr-7 text-[14px] leading-5 text-[#475569]">{review.text}</p>
              </article>
            ))}
          </div>
        </section>

      </div>

      <section className="mx-auto mt-2 w-full max-w-[1520px] px-4 sm:px-6 lg:px-8 md:mt-[60px]">
        <div className="rounded-[18px] bg-white p-4 md:p-6">
          <h2 className="mb-4 text-xl font-extrabold text-[#111827] md:text-[32px]">
            Недвижимость в Таджикистане на manora.tj
          </h2>

          <div className="space-y-4 text-[15px] leading-7 text-[#475569] md:text-[17px]">
            <p>
              manora.tj — это платформа для поиска недвижимости в Таджикистане, где собраны актуальные предложения по новостройкам, вторичному жилью, аренде, домам, участкам и коммерческим объектам. На сайте можно сравнивать варианты, изучать характеристики объектов и быстро переходить к подходящим предложениям в нужном городе и районе.
            </p>

            <div>
              <h3 className="mb-1 text-[17px] font-bold text-[#111827] md:text-[20px]">
                Акции и выгодные условия
              </h3>
              <p>
                На manora.tj регулярно появляются новые предложения от застройщиков и собственников, включая объекты по специальным ценам, варианты с рассрочкой и предложения, подходящие под ипотеку. Это помогает быстрее ориентироваться в рынке и находить жилье с оптимальными условиями покупки.
              </p>
            </div>

            <div>
              <h3 className="mb-1 text-[17px] font-bold text-[#111827] md:text-[20px]">
                Удобный поиск и подбор с ИИ
              </h3>
              <p>
                С помощью ИИ на нашем сайте можно подобрать недвижимость под конкретные параметры: район, бюджет, количество комнат, тип жилья и другие важные критерии. Это упрощает поиск и позволяет быстрее находить варианты, которые действительно соответствуют вашим задачам и образу жизни.
              </p>
            </div>

            <p>
              Если вы планируете купить собственное жилье вместо аренды, manora.tj поможет изучить рынок более осознанно. В каталоге представлены квартиры и дома разного формата: от компактных студий и семейных квартир до просторных объектов с готовым ремонтом и современной планировкой.
            </p>

            <p>
              Платформа manora.tj помогает не просто смотреть объявления, а принимать решение на основе актуальных данных. Подробные описания, фотографии, планировки и фильтры по важным параметрам делают выбор недвижимости в Таджикистане более понятным, удобным и прозрачным.
            </p>

            <p>
              manora.tj — удобный цифровой инструмент для тех, кто ищет недвижимость в Таджикистане и хочет делать это быстрее, точнее и современнее.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
