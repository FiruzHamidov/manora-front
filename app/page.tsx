'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowRight,
  Building2,
  CarFront,
  ChevronDown,
  Home,
  LoaderCircle,
  MapPin,
  Quote,
  Search,
  SlidersHorizontal,
  Sparkles,
} from 'lucide-react';
import FallbackImage from '@/app/_components/FallbackImage';
import MobileCatalogFiltersSheet from '@/app/_components/manora/MobileCatalogFiltersSheet';
import ManoraReelsSection from '@/app/_components/manora/ManoraReelsSection';
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
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { PROPERTY_DOCUMENT_TYPES } from '@/constants/property-document-types';
import { useCatalogSearchSuggestions } from '@/services/search/hooks';
import { SearchableSelect } from '@/ui-components/SearchableSelect';
import type {
  CatalogSearchResponse,
  CatalogSearchSuggestion,
  SearchCatalog,
} from '@/services/search/types';
import { uniqueOptionsByName } from '@/utils/select-options';

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

const buildCatalogSearchHref = (
  catalog: SearchCatalog,
  query: string,
  offerType?: 'sale' | 'rent' | null
): string => {
  const normalizedQuery = query.trim();

  if (catalog === 'cars') {
    const params = new URLSearchParams();
    if (normalizedQuery) params.set('search', normalizedQuery);
    return params.size ? `/cars?${params.toString()}` : '/cars';
  }

  if (catalog === 'new_buildings') {
    const params = new URLSearchParams();
    if (normalizedQuery) params.set('search', normalizedQuery);
    return params.size ? `/new-buildings?${params.toString()}` : '/new-buildings';
  }

  const params = new URLSearchParams({
    listing_type: 'regular',
    sort: 'created_at',
    dir: 'desc',
    offer_type: offerType ?? 'sale',
  });
  if (normalizedQuery) params.set('search', normalizedQuery);
  return `/listings?${params.toString()}`;
};

const buildSuggestionHref = (suggestion: CatalogSearchSuggestion): string => {
  const source = suggestion.source === 'aura' ? '?source=aura' : '';

  if (suggestion.entity_type === 'car') {
    return `/cars/${suggestion.entity_id}${source}`;
  }
  if (suggestion.entity_type === 'new_building') {
    return `/new-buildings/${suggestion.entity_id}${source}`;
  }
  return `/apartment/${suggestion.entity_id}${source}`;
};

const SEARCH_CATALOG_LABELS: Record<SearchCatalog, string> = {
  properties: 'недвижимость',
  cars: 'автомобили',
  new_buildings: 'новостройки',
};

const inferFallbackSearch = (query: string): {
  catalog: SearchCatalog;
  offerType: 'sale' | 'rent' | null;
} => {
  const normalized = query.toLowerCase();
  const hasAnyWord = (words: string[]) => words.some((word) => normalized.includes(word));

  const catalog: SearchCatalog = hasAnyWord(['авто', 'автомобил', 'машин'])
    ? 'cars'
    : hasAnyWord(['новостро', 'застройщик', 'жк'])
      ? 'new_buildings'
      : 'properties';
  const offerType = hasAnyWord(['аренд', 'снять', 'сниму'])
    ? 'rent'
    : hasAnyWord(['купить', 'покуп', 'продаж'])
      ? 'sale'
      : null;

  return { catalog, offerType };
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
      <Link href={href} className="cursor-pointer text-xs font-bold text-[#006341] md:text-sm">
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
  const [isRealEstateInfoExpanded, setIsRealEstateInfoExpanded] = useState(false);
  const debouncedMobileSearch = useDebouncedValue(mobileSearch, 250);
  const {
    data: catalogSearchData,
    isFetching: isCatalogSearchFetching,
    isError: isCatalogSearchError,
  } = useCatalogSearchSuggestions(debouncedMobileSearch);

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
  const locations = useMemo(
    () => uniqueOptionsByName(toOptions(locationsData, 'city')),
    [locationsData]
  );
  const parkingTypes = useMemo(() => toOptions(parkingTypesData), [parkingTypesData]);
  const heatingTypes = useMemo(() => toOptions(heatingTypesData), [heatingTypesData]);
  const repairTypes = useMemo(() => toOptions(repairTypesData), [repairTypesData]);
  const carCategories = useMemo(() => toOptions(carCategoriesData), [carCategoriesData]);
  const carBrands = useMemo(() => toOptions(carBrandsData), [carBrandsData]);
  const carModels = useMemo(() => toOptions(carModelsData), [carModelsData]);
  const constructionStages = useMemo(() => toOptions(stagesData), [stagesData]);
  const materials = useMemo(() => toOptions(materialsData), [materialsData]);

  const { data: newBuildingsData } = useNewBuildings({ page: 1, per_page: 8 });
  const { data: developersData } = useDevelopers({ page: 1, per_page: 100 });
  const { data: propertiesData } = useGetPropertiesQuery({ listing_type: 'regular', per_page: 30 });
  const { data: carsData } = useGetCarsQuery({ page: 1, per_page: 8 });

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
        __source: source,
        __entity: 'car',
        moderation_status: car.moderation_status || 'approved',
        created_by: car.created_by ?? 0,
        created_at: car.created_at || '',
        updated_at: car.updated_at || '',
        published_at: car.published_at ?? null,
        publication_expires_at: car.publication_expires_at ?? null,
        can_refresh_publication: car.can_refresh_publication,
        next_refresh_at: car.next_refresh_at ?? null,
        refresh_available_in: car.refresh_available_in,
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
  const categoryCards = useMemo(() => ([
    {
      title: 'Новостройки',
      image: '/categories/01_novostroyki-hq-v2.png',
      href: '/new-buildings',
      mobileGridClass: 'order-2 col-span-3',
      imageWrapperClass: 'pointer-events-none absolute right-[3px] bottom-0 h-[88px] w-[94px] md:right-[4px] md:top-[3px] md:h-[120px] md:w-[127px]',
    },
    {
      title: 'Вторичка',
      image: '/categories/02_vtorichka-hq-v2.png',
      href: buildListingsCatalogHref(),
      mobileGridClass: 'order-5 col-span-2',
      imageWrapperClass: 'pointer-events-none absolute right-[4px] bottom-[0px] h-[74px] w-[80px] md:right-[4px] md:top-[0px] md:h-[125px] md:w-[131px]',
    },
    {
      title: 'Транспорт',
      image: '/categories/03_transport-hq-v2.png',
      href: '/cars',
      mobileGridClass: 'order-6 col-span-2',
      imageWrapperClass: 'pointer-events-none absolute right-[4px] bottom-[0px] h-[72px] w-[90px] md:right-[3px] md:top-[0px] md:h-[120px] md:w-[148px]',
    },
    {
      title: 'Ипотечный калькулятор',
      image: '/categories/04_ipotechny_kalkulyator-hq-v2.png',
      href: '/mortgage-calculator',
      mobileGridClass: 'order-7 col-span-2',
      imageWrapperClass: 'pointer-events-none absolute right-[1px] bottom-0 h-[76px] w-[84px] md:right-[9px] md:top-[4px] md:h-[113px] md:w-[127px]',
    },
    {
      title: 'Аренда',
      image: '/categories/05_arenda-hq-v2.png',
      href: buildListingsCatalogHref({ offerType: 'rent' }),
      mobileGridClass: 'order-3 col-span-2',
      imageWrapperClass: 'pointer-events-none absolute right-[1px] bottom-0 h-[78px] w-[78px] md:right-[20px] md:top-[5px] md:h-[110px] md:w-[110px]',
    },
    {
      title: 'Коммерческая',
      image: '/categories/06_kommercheskaya-hq-v2.png',
      href: buildListingsCatalogHref({ propertyTypeIds: propertyTypeIdsBySlug.commercial }),
      mobileGridClass: 'order-1 col-span-3',
      imageWrapperClass: 'pointer-events-none absolute right-[1px] bottom-0 h-[76px] w-[98px] md:right-[0px] md:top-[4px] md:h-[112px] md:w-[145px]',
    },
    {
      title: 'Дома, участки',
      image: '/categories/07_doma_uchastki-hq-v2.png',
      href: buildListingsCatalogHref({ propertyTypeIds: propertyTypeIdsBySlug.housesAndLand }),
      mobileGridClass: 'order-4 col-span-2',
      imageWrapperClass: 'pointer-events-none absolute right-0 bottom-0 h-[76px] w-[92px] md:right-[0px] md:top-[0px] md:h-[120px] md:w-[156px]',
    },
    {
      title: 'Другие категории',
      image: '/categories/08_drugie_kategorii.svg',
      href: '/categories',
      mobileGridClass: 'order-8 col-span-2',
      imageWrapperClass: 'pointer-events-none absolute right-[7px] bottom-[9px] h-[58px] w-[58px] md:right-[33px] md:top-1/2 md:h-[66px] md:w-[66px] md:-translate-y-1/2',
    },
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

  const handleFind = (searchOverride?: string) => {
    const normalizedSearch = (searchOverride ?? mobileSearch).trim();

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

  const navigateToCatalogSearch = (response: CatalogSearchResponse) => {
    router.push(buildCatalogSearchHref(
      response.intent.catalog || response.recommended_catalog,
      response.intent.normalized_query,
      response.intent.offer_type
    ));
  };

  const handleSmartSearch = () => {
    const query = mobileSearch.trim();
    if (!query) return;

    setShowMobileSuggestions(false);

    if (
      query.length >= 2 &&
      catalogSearchData?.query.toLowerCase() === query.toLowerCase()
    ) {
      navigateToCatalogSearch(catalogSearchData);
      return;
    }

    const fallback = inferFallbackSearch(query);
    router.push(buildCatalogSearchHref(fallback.catalog, query, fallback.offerType));
  };

  const handleSuggestionSelect = (suggestion: CatalogSearchSuggestion) => {
    setShowMobileSuggestions(false);
    router.push(buildSuggestionHref(suggestion));
  };

  return (
    <div className="min-h-screen">
      <div className="mx-auto w-full max-w-[1520px] px-3 pb-6 md:px-6">
        <section className="relative mt-3 overflow-hidden rounded-[28px] bg-[#075C43] px-5 pb-5 pt-6 shadow-[0_14px_34px_rgba(0,75,52,0.18)] md:hidden">
          <div className="absolute inset-0 bg-[url('/images/banner/main.jpg')] bg-cover bg-[center_38%] opacity-[0.18]" />
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(0,57,40,0.97)_0%,rgba(0,99,65,0.88)_62%,rgba(14,132,94,0.76)_100%)]" />

          <div className="relative z-10">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[11px] font-semibold text-white/90 backdrop-blur-sm">
              <MapPin size={13} />
              Весь Таджикистан
            </div>

            <h1 className="mt-4 max-w-[310px] text-[28px] font-extrabold leading-[1.08] tracking-[-0.035em] text-white">
              Найдите место, которое станет вашим
            </h1>
            <p className="mt-2 max-w-[300px] text-[13px] leading-5 text-white/72">
              Квартиры, дома, новостройки и авто — в одном понятном поиске.
            </p>

            <form
              className="mt-5 rounded-[20px] bg-white p-2 shadow-[0_12px_30px_rgba(0,35,24,0.22)]"
              onSubmit={(event) => {
                event.preventDefault();
                handleSmartSearch();
              }}
            >
              <div className="flex items-center gap-2">
                <label className="relative min-w-0 flex-1">
                  <Search size={19} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#7B8798]" />
                  <input
                    type="search"
                    role="combobox"
                    autoComplete="off"
                    value={mobileSearch}
                    onFocus={() => setShowMobileSuggestions(true)}
                    onChange={(event) => {
                      setMobileSearch(event.target.value);
                      setShowMobileSuggestions(true);
                    }}
                    placeholder={typedHint || 'Квартира, район, ЖК'}
                    className="h-12 w-full rounded-[14px] bg-[#F3F6F5] pl-10 pr-3 text-[15px] font-medium text-[#15231E] outline-none placeholder:text-[#8A9691]"
                    aria-expanded={showMobileSuggestions && Boolean(mobileSearch.trim())}
                    aria-controls="mobile-search-suggestions"
                    aria-autocomplete="list"
                  />
                </label>
                <button
                  type="button"
                  onClick={() => setShowMobileFilters(true)}
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] bg-[#E7F2EE] text-[#006341] transition active:scale-95"
                  aria-label="Открыть фильтры"
                >
                  <SlidersHorizontal size={20} />
                </button>
                <button
                  type="submit"
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] bg-[#F6C945] text-[#173B2E] transition active:scale-95"
                  aria-label="Найти"
                >
                  <ArrowRight size={21} />
                </button>
              </div>

              {showMobileSuggestions && mobileSearch.trim() && (
                <div
                  id="mobile-search-suggestions"
                  className="mt-2 overflow-hidden rounded-[14px] border border-[#E1EAE6] bg-white text-[#18352B] shadow-[0_12px_30px_rgba(0,35,24,0.14)]"
                >
                  {mobileSearch.trim().length < 2 && (
                    <p className="px-3 py-3 text-xs text-[#6E7D77]">
                      Введите минимум 2 символа
                    </p>
                  )}

                  {mobileSearch.trim().length >= 2 && isCatalogSearchFetching && (
                    <div className="flex items-center gap-2 px-3 py-3 text-xs text-[#60736B]">
                      <LoaderCircle size={15} className="animate-spin" />
                      Ищем по всем категориям…
                    </div>
                  )}

                  {!isCatalogSearchFetching && catalogSearchData?.suggestions.map((suggestion) => {
                    const Icon = suggestion.entity_type === 'car'
                      ? CarFront
                      : suggestion.entity_type === 'new_building'
                        ? Building2
                        : Home;

                    return (
                      <button
                        key={suggestion.key}
                        type="button"
                        onClick={() => handleSuggestionSelect(suggestion)}
                        className="flex w-full items-center gap-3 border-b border-[#EDF2EF] px-3 py-2.5 text-left transition last:border-b-0 hover:bg-[#F4F8F6]"
                      >
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-[#E7F2EE] text-[#006341]">
                          <Icon size={16} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[13px] font-bold">
                            {suggestion.title}
                          </span>
                          <span className="mt-0.5 block truncate text-[11px] text-[#718079]">
                            {suggestion.subtitle}
                          </span>
                        </span>
                        <ArrowRight size={15} className="shrink-0 text-[#8A9993]" />
                      </button>
                    );
                  })}

                  {!isCatalogSearchFetching &&
                    mobileSearch.trim().length >= 2 &&
                    catalogSearchData &&
                    catalogSearchData.suggestions.length === 0 && (
                      <p className="px-3 py-3 text-xs text-[#6E7D77]">
                        Точных совпадений нет — можно поискать по всему каталогу
                      </p>
                    )}

                  {isCatalogSearchError && !isCatalogSearchFetching && (
                    <p className="px-3 py-3 text-xs text-[#8A5A3B]">
                      Подсказки временно недоступны. Поиск по Enter продолжит работать.
                    </p>
                  )}

                  {catalogSearchData && !isCatalogSearchFetching && (
                    <button
                      type="button"
                      onClick={() => navigateToCatalogSearch(catalogSearchData)}
                      className="flex w-full items-center justify-between bg-[#F2F7F4] px-3 py-3 text-left text-xs font-bold text-[#006341]"
                    >
                      <span>
                        Показать все: {SEARCH_CATALOG_LABELS[catalogSearchData.intent.catalog]}
                      </span>
                      <ArrowRight size={15} />
                    </button>
                  )}
                </div>
              )}
            </form>

            <button
              type="button"
              onClick={() => window.dispatchEvent(new Event('open-ai-chat'))}
              className="mt-4 flex w-full items-center justify-between rounded-[16px] border border-white/16 bg-[#0A4E3A]/70 px-4 py-3 text-left text-white transition active:scale-[0.985]"
            >
              <span className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#F6C945] text-[#173B2E]">
                  <Sparkles size={17} />
                </span>
                <span>
                  <span className="block text-[12px] font-bold">Подобрать с AI</span>
                  <span className="mt-0.5 block text-[10px] text-white/65">Опишите, что вам нужно</span>
                </span>
              </span>
              <ArrowRight size={18} className="text-white/75" />
            </button>
          </div>
        </section>

        <section className="relative left-1/2 right-1/2 hidden w-screen -mx-[50vw] bg-[#006341] md:block">
          <div className="relative h-[480px]">
            <div className="absolute inset-0 overflow-hidden">
              <iframe
                className="pointer-events-none absolute left-0 top-1/2 h-[56.25vw] min-h-full w-full -translate-y-1/2"
                src="https://www.youtube-nocookie.com/embed/vfRFp_s-W1g?start=5&autoplay=1&mute=1&controls=0&loop=1&playlist=vfRFp_s-W1g&modestbranding=1&rel=0&playsinline=1&iv_load_policy=3&disablekb=1&fs=0&cc_load_policy=0"
                title="Manora banner background video"
                allow="autoplay; encrypted-media; picture-in-picture"
                referrerPolicy="strict-origin-when-cross-origin"
              />
              <div className="absolute inset-0 bg-black/55" />
            </div>

            <div className="relative z-10 mx-auto flex h-full w-full max-w-[1520px] flex-col justify-center px-3 md:px-6">
              <h1 className="max-w-[900px] text-3xl font-extrabold text-white md:text-5xl">
                Найди дом и авто своей мечты прямо сейчас
              </h1>

              <div className="mt-5 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('properties')}
                  className={`rounded-[10px] px-4 py-2 text-sm font-medium text-white transition-colors ${
                    activeTab === 'properties' ? 'bg-[#006341]' : 'bg-black/45 hover:bg-black/60'
                  }`}
                >
                  Недвижимость
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('cars')}
                  className={`rounded-[10px] px-4 py-2 text-sm font-medium text-white transition-colors ${
                    activeTab === 'cars' ? 'bg-[#006341]' : 'bg-black/45 hover:bg-black/60'
                  }`}
                >
                  Авто
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('new-buildings')}
                  className={`rounded-[10px] px-4 py-2 text-sm font-medium text-white transition-colors ${
                    activeTab === 'new-buildings' ? 'bg-[#006341]' : 'bg-black/45 hover:bg-black/60'
                  }`}
                >
                  Новостройки
                </button>
              </div>

              <div className="mt-3 rounded-[12px] bg-white p-1.5 shadow-[0_10px_24px_rgba(0,0,0,0.18)]">
                {activeTab === 'properties' && (
                  <>
                    <div className="grid gap-1 md:grid-cols-[1fr_1fr_1fr_1fr_1fr_auto_auto_auto] md:gap-0 md:[&>*:not(:last-child)]:border-r md:[&>*:not(:last-child)]:border-[#E5E7EB]">
                      <SearchableSelect
                        label="Тип недвижимости"
                        name="home-property-type"
                        value={asSelectValue(propertyFilters.type_id)}
                        options={propertyTypes}
                        onValueChange={(value) =>
                          setPropertyFilters((prev) => ({
                            ...prev,
                            type_id: value || undefined,
                          }))
                        }
                        placeholder="Тип недвижимости"
                        searchPlaceholder="Найдите тип недвижимости"
                        emptyMessage="Тип недвижимости не найден"
                        icon={Building2}
                        variant="compact"
                      />
                      <SearchableSelect
                        label="Город"
                        name="home-property-location"
                        value={asSelectValue(propertyFilters.location_id)}
                        options={locations}
                        onValueChange={(value) =>
                          setPropertyFilters((prev) => ({
                            ...prev,
                            location_id: value || undefined,
                          }))
                        }
                        placeholder="Весь Таджикистан"
                        searchPlaceholder="Найдите город"
                        variant="compact"
                      />
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
                        <SlidersHorizontal size={16} className="text-[#006341]" />
                        <span>{showAdvancedFilters ? 'Скрыть' : 'Фильтры'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleFind()}
                        className="h-11 rounded-[8px] bg-[#006341] px-5 text-sm font-semibold text-white hover:bg-[#006341]"
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
                            value={asSelectValue(propertyFilters.document_type)}
                            onChange={(event) => setPropertyFilters((prev) => ({ ...prev, document_type: event.target.value || undefined }))}
                            className="h-10 w-full appearance-none rounded-[8px] border border-[#E5E7EB] px-3 pr-8 text-sm text-[#111827] outline-none"
                          >
                            <option value="">Тип документа</option>
                            {PROPERTY_DOCUMENT_TYPES.map((option) => (
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
                      onClick={() => handleFind()}
                      className="h-11 rounded-[8px] bg-[#006341] px-5 text-sm font-semibold text-white hover:bg-[#006341]"
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
                      onClick={() => handleFind()}
                      className="h-11 rounded-[8px] bg-[#006341] px-5 text-sm font-semibold text-white hover:bg-[#006341]"
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

        <section className="mt-7 rounded-[18px] md:mt-[60px] md:py-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[22px] font-extrabold tracking-[-0.025em] text-[#111827] md:text-2xl">Категории</h2>
            <Link href="/categories" className="text-xs font-bold text-[#006341] md:hidden">Все категории</Link>
          </div>
          <div className="grid auto-rows-[96px] grid-cols-6 gap-2 md:grid-cols-4 md:auto-rows-auto md:gap-5">
            {categoryCards.map((item) => (
              <Link
                key={item.title}
                href={item.href}
                data-category={item.title}
                className={`group relative flex cursor-pointer items-start overflow-hidden rounded-[16px] border border-[#E8ECEA] bg-white text-left shadow-[0_4px_14px_rgba(20,45,35,0.04)] transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-[#BFD7CE] hover:shadow-[0_8px_20px_rgba(15,60,44,0.09)] md:order-none md:col-span-1 md:h-[120px] md:max-h-[120px] md:rounded-[20px] ${item.mobileGridClass}`}
              >
                <span className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 bg-[radial-gradient(120px_80px_at_85%_90%,rgba(0,54,165,0.10),transparent_70%)]" />
                <div className="relative z-10 w-full p-3 md:p-4">
                  <span className="block max-w-[68%] text-[12px] font-semibold leading-[15px] text-[#1D2924] transition-colors duration-300 group-hover:text-[#006341] md:max-w-[58%] md:text-lg md:leading-5">
                    {item.title}
                  </span>
                </div>
                {item.image ? (
                  <div className={item.imageWrapperClass}>
                    <Image
                      src={item.image}
                      alt={item.title}
                      fill
                      className="object-contain object-right-bottom opacity-95"
                      sizes="(min-width: 768px) 160px, 96px"
                      quality={85}
                    />
                  </div>
                ) : null}
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-8 md:mt-[60px]">
          <SectionTitle title="Вторичка" href={buildListingsCatalogHref()} />
          <div className="md:hidden -mx-3 overflow-x-auto px-3 pb-2 hide-scrollbar">
            <div className="flex gap-2.5">
              {secondary.map((property) => (
                <div key={`home-property-${property.id}`} className="w-[88%] min-w-[88%]">
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

        <section className="mt-8 md:mt-[60px]">
          <SectionTitle title="Новостройки" href="/new-buildings" />
          <div className="md:hidden -mx-3 overflow-x-auto px-3 pb-2 hide-scrollbar">
            <div className="flex gap-2.5">
              {newBuildings.slice(0, 8).map((building) => (
                <div
                  key={(building as { __uid?: string }).__uid || `nb_mobile_${building.id}`}
                  className="w-[88%] min-w-[88%]"
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

        <ManoraReelsSection />

        <section
          id="partner-banner"
          className="relative mt-8 min-h-[292px] overflow-hidden rounded-[24px] md:mt-[60px] md:min-h-[320px] md:rounded-[20px]"
        >
          <Image
            src="/images/buildings.jpg"
            alt="Новостройки"
            fill
            className="object-cover"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,#003E2A_0%,#006341_52%,#008A5A_100%)] opacity-85" />
          <div className="relative z-10 flex min-h-[292px] flex-col justify-center px-5 py-8 sm:px-8 md:min-h-[320px] md:px-12 md:py-10 lg:px-14">
            <p className="max-w-[720px] text-[clamp(22px,6.6vw,28px)] font-extrabold uppercase leading-[1.08] tracking-[-0.025em] text-white md:text-[40px] md:leading-[1.08] lg:text-[44px]">
              Продавайте новостройки на нашей платформе!
            </p>
            <p className="mt-3 max-w-[640px] text-[clamp(15px,4.3vw,18px)] font-medium leading-[1.35] text-white/90 md:mt-4 md:text-[20px] md:leading-[1.35]">
              платформа для жителей, риэлторов и застройщиков по всему Таджикистану
            </p>
            <div className="mt-6 shrink-0 md:mt-7">
              <Link
                href="/partners"
                className="inline-flex min-h-12 max-w-full items-center justify-center rounded-[14px] bg-white px-6 py-3 text-[15px] font-semibold text-[#006341] shadow-[0_8px_20px_rgba(0,45,31,0.16)] transition hover:-translate-y-0.5 hover:bg-white active:translate-y-0 active:scale-[0.98] md:px-7 md:text-base"
              >
                Стать партнером
              </Link>
            </div>
          </div>
        </section>

        <section className="mt-8 md:mt-[60px]">
          <SectionTitle title="Автомобили" href="/cars" />
          <div className="md:hidden -mx-3 overflow-x-auto px-3 pb-2 hide-scrollbar">
            <div className="flex gap-2.5">
              {carsAsListings.map((carListing) => (
                <div key={`home-car-${carListing.id}`} className="w-[88%] min-w-[88%]">
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

        <section className="mt-8 rounded-[22px] bg-[#EAF0ED] p-4 md:mt-[60px]">
          <h2 className="mb-3 text-lg font-extrabold text-[#111827] md:text-[36px] md:leading-[1.05]">
            Топовые застройщики
          </h2>
          <div className="grid grid-cols-2 gap-2.5 md:grid-cols-6 md:gap-3">
            {developers.slice(0, 10).map((developer) => (
              <DeveloperChip key={developer.id} developer={developer} />
            ))}
          </div>
        </section>

        <section className="mt-8 rounded-[22px] bg-[#EAF0ED] p-4 md:mt-[60px]">
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

          <div className="text-[15px] leading-7 text-[#475569] md:text-[17px]">
            <p>
              manora.tj — это платформа для поиска недвижимости в Таджикистане, где собраны актуальные предложения по новостройкам, вторичному жилью, аренде, домам, участкам и коммерческим объектам. На сайте можно сравнивать варианты, изучать характеристики объектов и быстро переходить к подходящим предложениям в нужном городе и районе.
            </p>

            <div
              id="real-estate-info-details"
              className={`grid transition-[grid-template-rows] duration-300 ease-out ${
                isRealEstateInfoExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
              }`}
            >
              <div className="overflow-hidden">
                <div className="space-y-4 pt-4">
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
            </div>

            <button
              type="button"
              onClick={() => setIsRealEstateInfoExpanded((current) => !current)}
              aria-expanded={isRealEstateInfoExpanded}
              aria-controls="real-estate-info-details"
              className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-[#CFE0D8] bg-[#F2F8F5] px-4 text-sm font-bold text-[#006341] transition active:scale-[0.985] md:w-auto"
            >
              {isRealEstateInfoExpanded ? 'Скрыть' : 'Показать полностью'}
              <ChevronDown
                size={18}
                className={`transition-transform duration-300 ${isRealEstateInfoExpanded ? 'rotate-180' : ''}`}
              />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
