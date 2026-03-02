'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowUpWideNarrow,
  ChevronDown,
  ChevronRight,
  MapIcon,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { Map, Placemark, YMaps } from '@pbe/react-yandex-maps';
import MainShell from '@/app/_components/manora/MainShell';
import {
  useCatalogNewBuildingPlans,
  useNewBuildings,
} from '@/services/new-buildings/hooks';
import type {
  CatalogNewBuildingPlan,
  CatalogNewBuildingsFilters,
  NewBuilding,
} from '@/services/new-buildings/types';
import { NewBuildingCardWithPhotos } from '@/app/new-buildings/[slug]/_components/NewBuildingCardWithPhotos';

type ViewMode = 'buildings' | 'plans' | 'map';
type SortMode = 'default' | 'title_asc' | 'title_desc' | 'price_asc' | 'price_desc';

type FeedPlanItem = {
  unit_id: number;
  building_id: number;
  building_title: string;
  building_address: string | null;
  building_latitude: number | null;
  building_longitude: number | null;
  rooms: number | null;
  area: number | null;
  price: number | null;
  currency: string | null;
  cover_photo: string | null;
  __source?: 'local' | 'aura';
};

const PAGE_SIZE = 20;

const VIEW_LABELS: Record<ViewMode, string> = {
  buildings: 'Квартиры в новостройках (ЖК)',
  plans: 'Планировки в новостройках',
  map: 'Новостройки и планировки на карте',
};

const SORT_LABELS: Record<SortMode, string> = {
  default: 'Сортировка по умолчанию',
  title_asc: 'По названию A-Я',
  title_desc: 'По названию Я-А',
  price_asc: 'Сначала дешевле',
  price_desc: 'Сначала дороже',
};

const formatCountLabel = (count: number): string => {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return 'новостройка';
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'новостройки';
  return 'новостроек';
};

const formatNumber = (value: number | null, suffix = ''): string => {
  if (value === null || Number.isNaN(value)) return 'Не указано';
  return `${new Intl.NumberFormat('ru-RU').format(value)}${suffix}`;
};

const parseNumeric = (value: unknown): number | null => {
  if (value === undefined || value === null || value === '') return null;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
};

const getBuildingSlug = (building: NewBuilding): string => {
  const source = building.__source === 'aura' ? '?source=aura' : '';
  return `${building.id}${source}`;
};

const getPlanHref = (plan: CatalogNewBuildingPlan | FeedPlanItem): string => {
  return `/new-buildings/${plan.building_id}${plan.__source === 'aura' ? '?source=aura' : ''}`;
};

const getBuildingAddress = (building: NewBuilding): string => {
  return [building.address, building.district].filter(Boolean).join(', ') || 'Таджикистан';
};

const toFeedPlanItems = (building: NewBuilding | null): FeedPlanItem[] => {
  if (!building?.units?.length) return [];

  return building.units.map((unit: any, index: number) => ({
    unit_id: unit.id ?? index + 1,
    building_id: building.id,
    building_title: building.title,
    building_address: getBuildingAddress(building),
    building_latitude: parseNumeric(building.latitude),
    building_longitude: parseNumeric(building.longitude),
    rooms: parseNumeric(unit.rooms ?? unit.bedrooms),
    area: parseNumeric(unit.area_from ?? unit.area),
    price: parseNumeric(unit.price_from ?? unit.price ?? unit.total_price),
    currency: unit.currency ?? 'TJS',
    cover_photo: unit.cover_photo ?? null,
    __source: building.__source === 'aura' ? 'aura' : 'local',
  }));
};

const sortToApi = (
  sort: SortMode
): { sort?: CatalogNewBuildingsFilters['sort']; dir?: 'asc' | 'desc' } => {
  switch (sort) {
    case 'title_asc':
      return { sort: 'title', dir: 'asc' };
    case 'title_desc':
      return { sort: 'title', dir: 'desc' };
    case 'price_asc':
      return { sort: 'min_price', dir: 'asc' };
    case 'price_desc':
      return { sort: 'min_price', dir: 'desc' };
    default:
      return {};
  }
};

const sortBuildings = (items: NewBuilding[], sort: SortMode): NewBuilding[] => {
  const sorted = [...items];

  switch (sort) {
    case 'title_asc':
      sorted.sort((a, b) => a.title.localeCompare(b.title, 'ru'));
      break;
    case 'title_desc':
      sorted.sort((a, b) => b.title.localeCompare(a.title, 'ru'));
      break;
    case 'price_asc':
      sorted.sort((a, b) => {
        const aPrice = Math.min(
          ...((a.units || []).map((unit: any) =>
            Number(unit.price_from || unit.price || unit.total_price || Number.MAX_SAFE_INTEGER)
          ))
        );
        const bPrice = Math.min(
          ...((b.units || []).map((unit: any) =>
            Number(unit.price_from || unit.price || unit.total_price || Number.MAX_SAFE_INTEGER)
          ))
        );
        return aPrice - bPrice;
      });
      break;
    case 'price_desc':
      sorted.sort((a, b) => {
        const aPrice = Math.max(
          ...((a.units || []).map((unit: any) =>
            Number(unit.price_from || unit.price || unit.total_price || 0)
          ))
        );
        const bPrice = Math.max(
          ...((b.units || []).map((unit: any) =>
            Number(unit.price_from || unit.price || unit.total_price || 0)
          ))
        );
        return bPrice - aPrice;
      });
      break;
    default:
      break;
  }

  return sorted;
};

const sortPlans = (items: CatalogNewBuildingPlan[], sort: SortMode): CatalogNewBuildingPlan[] => {
  const sorted = [...items];

  switch (sort) {
    case 'title_asc':
      sorted.sort((a, b) => a.building_title.localeCompare(b.building_title, 'ru'));
      break;
    case 'title_desc':
      sorted.sort((a, b) => b.building_title.localeCompare(a.building_title, 'ru'));
      break;
    case 'price_asc':
      sorted.sort((a, b) => (a.price ?? Number.MAX_SAFE_INTEGER) - (b.price ?? Number.MAX_SAFE_INTEGER));
      break;
    case 'price_desc':
      sorted.sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
      break;
    default:
      break;
  }

  return sorted;
};

function PlanModal({
  plan,
  onClose,
}: {
  plan: CatalogNewBuildingPlan | FeedPlanItem | null;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!plan) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [plan]);

  if (!plan) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 p-3 md:p-6">
      <button
        type="button"
        aria-label="Закрыть"
        onClick={onClose}
        className="absolute inset-0"
      />
      <div className="relative z-10 w-full max-w-3xl overflow-hidden rounded-[28px] bg-white shadow-2xl">
        <div className="grid gap-0 md:grid-cols-[1.1fr_1fr]">
          <div className="relative min-h-[260px] bg-[#F8FAFC] md:min-h-[420px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={plan.cover_photo || '/images/no-image.png'}
              alt={plan.building_title}
              className="h-full w-full object-cover"
            />
          </div>

          <div className="p-5 md:p-7">
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#0036A5]">
                  Планировка
                </p>
                <h3 className="mt-2 text-2xl font-extrabold text-[#111827]">
                  {plan.building_title}
                </h3>
                <p className="mt-2 text-sm text-[#64748B]">
                  {plan.building_address || 'Таджикистан'}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full bg-[#F1F5F9] p-2 text-[#334155]"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3 rounded-2xl bg-[#F8FAFC] p-4 text-sm">
              <div>
                <p className="text-[#94A3B8]">Комнат</p>
                <p className="mt-1 font-bold text-[#111827]">{plan.rooms ?? 'Не указано'}</p>
              </div>
              <div>
                <p className="text-[#94A3B8]">Площадь</p>
                <p className="mt-1 font-bold text-[#111827]">
                  {plan.area ? `${plan.area} м²` : 'Не указано'}
                </p>
              </div>
              <div>
                <p className="text-[#94A3B8]">Цена</p>
                <p className="mt-1 font-bold text-[#111827]">
                  {plan.price ? `${formatNumber(plan.price)} ${plan.currency || 'TJS'}` : 'Не указано'}
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3">
              <Link
                href={getPlanHref(plan)}
                className="inline-flex items-center justify-center rounded-2xl bg-[#0036A5] px-4 py-3 text-sm font-semibold text-white"
              >
                Перейти к новостройке
              </Link>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center justify-center rounded-2xl border border-[#D6DEE8] px-4 py-3 text-sm font-semibold text-[#111827]"
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PlanCard({
  plan,
  onOpen,
}: {
  plan: CatalogNewBuildingPlan;
  onOpen: (plan: CatalogNewBuildingPlan) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onOpen(plan)}
      className="overflow-hidden rounded-3xl border border-[#E2E8F0] bg-white text-left transition-shadow hover:shadow-[0_12px_30px_rgba(15,23,42,0.08)]"
    >
      <div className="relative h-48 bg-[#F8FAFC]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={plan.cover_photo || '/images/no-image.png'}
          alt={plan.building_title}
          className="h-full w-full object-cover"
        />
      </div>
      <div className="space-y-3 p-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#0036A5]">
            Планировка
          </p>
          <h3 className="mt-1 text-xl font-extrabold text-[#111827]">{plan.building_title}</h3>
          <p className="mt-1 text-sm text-[#64748B]">{plan.building_address || 'Таджикистан'}</p>
        </div>

        <div className="grid grid-cols-3 gap-2 rounded-2xl bg-[#F8FAFC] p-3 text-sm text-[#334155]">
          <div>
            <p className="text-xs text-[#94A3B8]">Комнат</p>
            <p className="mt-1 font-bold">{plan.rooms ?? 'Не указано'}</p>
          </div>
          <div>
            <p className="text-xs text-[#94A3B8]">Площадь</p>
            <p className="mt-1 font-bold">{plan.area ? `${plan.area} м²` : 'Не указано'}</p>
          </div>
          <div>
            <p className="text-xs text-[#94A3B8]">Цена</p>
            <p className="mt-1 font-bold">
              {plan.price ? `${formatNumber(plan.price)} ${plan.currency || 'TJS'}` : 'Не указано'}
            </p>
          </div>
        </div>
      </div>
    </button>
  );
}

function NewBuildingCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-3xl border border-[#E2E8F0] bg-white animate-pulse">
      <div className="h-52 bg-[#E5E7EB]" />
      <div className="space-y-4 p-5">
        <div className="space-y-2">
          <div className="h-4 w-24 rounded-full bg-[#E5E7EB]" />
          <div className="h-6 w-4/5 rounded-full bg-[#E5E7EB]" />
          <div className="h-4 w-2/3 rounded-full bg-[#E5E7EB]" />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="h-16 rounded-2xl bg-[#F1F5F9]" />
          <div className="h-16 rounded-2xl bg-[#F1F5F9]" />
          <div className="h-16 rounded-2xl bg-[#F1F5F9]" />
        </div>
        <div className="h-11 rounded-2xl bg-[#E5E7EB]" />
      </div>
    </div>
  );
}

function PlanCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-3xl border border-[#E2E8F0] bg-white animate-pulse">
      <div className="h-48 bg-[#E5E7EB]" />
      <div className="space-y-4 p-5">
        <div className="space-y-2">
          <div className="h-4 w-24 rounded-full bg-[#E5E7EB]" />
          <div className="h-6 w-3/4 rounded-full bg-[#E5E7EB]" />
          <div className="h-4 w-2/3 rounded-full bg-[#E5E7EB]" />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="h-16 rounded-2xl bg-[#F1F5F9]" />
          <div className="h-16 rounded-2xl bg-[#F1F5F9]" />
          <div className="h-16 rounded-2xl bg-[#F1F5F9]" />
        </div>
      </div>
    </div>
  );
}

function MapViewSkeleton() {
  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
      <div className="overflow-hidden rounded-[28px] border border-[#E2E8F0] bg-white p-3 animate-pulse">
        <div className="h-[520px] rounded-[22px] bg-[#E5E7EB]" />
      </div>
      <aside className="rounded-[28px] border border-[#E2E8F0] bg-white p-5 animate-pulse">
        <div className="space-y-5">
          <div className="space-y-2">
            <div className="h-4 w-24 rounded-full bg-[#E5E7EB]" />
            <div className="h-7 w-4/5 rounded-full bg-[#E5E7EB]" />
            <div className="h-4 w-2/3 rounded-full bg-[#E5E7EB]" />
          </div>
          <div className="h-11 w-44 rounded-2xl bg-[#E5E7EB]" />
          <div className="space-y-3">
            <div className="h-5 w-40 rounded-full bg-[#E5E7EB]" />
            <div className="h-20 rounded-2xl bg-[#F1F5F9]" />
            <div className="h-20 rounded-2xl bg-[#F1F5F9]" />
            <div className="h-20 rounded-2xl bg-[#F1F5F9]" />
          </div>
        </div>
      </aside>
    </div>
  );
}

export default function NewBuildingsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const initialView = (searchParams.get('view') as ViewMode) || 'buildings';
  const initialSort = (searchParams.get('sort') as SortMode) || 'default';

  const [view, setView] = useState<ViewMode>(
    ['buildings', 'plans', 'map'].includes(initialView) ? initialView : 'buildings'
  );
  const [sort, setSort] = useState<SortMode>(SORT_LABELS[initialSort] ? initialSort : 'default');
  const [selectedBuildingId, setSelectedBuildingId] = useState<number | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<CatalogNewBuildingPlan | FeedPlanItem | null>(null);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [buildingsPage, setBuildingsPage] = useState(1);
  const [plansPage, setPlansPage] = useState(1);
  const [loadedBuildings, setLoadedBuildings] = useState<NewBuilding[]>([]);
  const [loadedPlans, setLoadedPlans] = useState<CatalogNewBuildingPlan[]>([]);

  const buildingsSentinelRef = useRef<HTMLDivElement | null>(null);
  const plansSentinelRef = useRef<HTMLDivElement | null>(null);

  const { sort: apiSort, dir: apiDir } = useMemo(() => sortToApi(sort), [sort]);

  const baseFilters = useMemo<CatalogNewBuildingsFilters>(
    () => ({
      developer_id: searchParams.get('developer_id') || undefined,
      stage_id: searchParams.get('stage_id') || undefined,
      material_id: searchParams.get('material_id') || undefined,
      search: searchParams.get('search') || undefined,
      ceiling_height_min: searchParams.get('ceiling_height_min') || undefined,
      ceiling_height_max: searchParams.get('ceiling_height_max') || undefined,
      sort: apiSort,
      dir: apiDir,
    }),
    [apiDir, apiSort, searchParams]
  );

  const buildingQueryKey = useMemo(() => JSON.stringify(baseFilters), [baseFilters]);

  const buildingFilters = useMemo(
    () => ({
      ...baseFilters,
      page: buildingsPage,
      per_page: PAGE_SIZE,
    }),
    [baseFilters, buildingsPage]
  );

  const planQuerySort = useMemo(() => {
    switch (sort) {
      case 'title_asc':
        return { sort: 'building_title' as const, dir: 'asc' as const };
      case 'title_desc':
        return { sort: 'building_title' as const, dir: 'desc' as const };
      case 'price_asc':
        return { sort: 'price' as const, dir: 'asc' as const };
      case 'price_desc':
        return { sort: 'price' as const, dir: 'desc' as const };
      default:
        return {};
    }
  }, [sort]);

  const planFilters = useMemo(
    () => ({
      ...baseFilters,
      page: plansPage,
      per_page: PAGE_SIZE,
      sort: planQuerySort.sort,
      dir: planQuerySort.dir,
    }),
    [baseFilters, planQuerySort.dir, planQuerySort.sort, plansPage]
  );

  const planRequestKey = useMemo(
    () =>
      JSON.stringify({
        ...baseFilters,
        sort: planQuerySort.sort,
        dir: planQuerySort.dir,
      }),
    [baseFilters, planQuerySort.dir, planQuerySort.sort]
  );

  const {
    data: buildingsResponse,
    isLoading: isBuildingsLoading,
    isFetching: isBuildingsFetching,
  } = useNewBuildings(buildingFilters);

  const {
    data: plansResponse,
    isLoading: isPlansLoading,
    isFetching: isPlansFetching,
  } = useCatalogNewBuildingPlans(planFilters);

  useEffect(() => {
    setBuildingsPage(1);
    setLoadedBuildings([]);
  }, [buildingQueryKey]);

  useEffect(() => {
    setPlansPage(1);
    setLoadedPlans([]);
  }, [planRequestKey]);

  useEffect(() => {
    const pageItems = buildingsResponse?.data ?? [];
    if (!pageItems.length) return;

    setLoadedBuildings((prev) => {
      if (buildingsPage === 1) return pageItems;

      const seen = new Set(prev.map((item) => `${item.__source || 'local'}:${item.id}`));
      const appended = pageItems.filter((item) => {
        const key = `${item.__source || 'local'}:${item.id}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      return [...prev, ...appended];
    });
  }, [buildingsPage, buildingsResponse]);

  useEffect(() => {
    const pageItems = plansResponse?.data ?? [];
    if (!pageItems.length) return;

    setLoadedPlans((prev) => {
      if (plansPage === 1) return pageItems;

      const seen = new Set(prev.map((item) => `${item.__source || 'local'}:${item.unit_id}`));
      const appended = pageItems.filter((item) => {
        const key = `${item.__source || 'local'}:${item.unit_id}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      return [...prev, ...appended];
    });
  }, [plansPage, plansResponse]);

  const hasMoreBuildings = buildingsPage < (buildingsResponse?.last_page ?? 1);
  const hasMorePlans = plansPage < (plansResponse?.last_page ?? 1);

  useEffect(() => {
    const node = buildingsSentinelRef.current;
    if (!node || view !== 'buildings' || !hasMoreBuildings || isBuildingsFetching) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setBuildingsPage((prev) => prev + 1);
        }
      },
      { rootMargin: '240px' }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMoreBuildings, isBuildingsFetching, view]);

  useEffect(() => {
    const node = plansSentinelRef.current;
    if (!node || view !== 'plans' || !hasMorePlans || isPlansFetching) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setPlansPage((prev) => prev + 1);
        }
      },
      { rootMargin: '240px' }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMorePlans, isPlansFetching, view]);

  const mappedBuildings = useMemo(
    () =>
      loadedBuildings
        .map((building) => ({
          building,
          latitude: parseNumeric(building.latitude),
          longitude: parseNumeric(building.longitude),
        }))
        .filter((item) => item.latitude !== null && item.longitude !== null),
    [loadedBuildings]
  );

  const sortedBuildings = useMemo(() => sortBuildings(loadedBuildings, sort), [loadedBuildings, sort]);
  const sortedPlans = useMemo(() => sortPlans(loadedPlans, sort), [loadedPlans, sort]);

  const selectedMapBuilding = useMemo(() => {
    if (selectedBuildingId) {
      return loadedBuildings.find((building) => building.id === selectedBuildingId) ?? null;
    }
    return mappedBuildings[0]?.building ?? null;
  }, [loadedBuildings, mappedBuildings, selectedBuildingId]);

  const selectedBuildingPlans = useMemo(
    () => toFeedPlanItems(selectedMapBuilding),
    [selectedMapBuilding]
  );

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (view === 'buildings') params.delete('view');
    else params.set('view', view);

    if (sort === 'default') params.delete('sort');
    else params.set('sort', sort);

    const nextUrl = `${pathname}${params.toString() ? `?${params.toString()}` : ''}`;
    const currentUrl = `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;

    if (nextUrl !== currentUrl) {
      router.replace(nextUrl, { scroll: false });
    }
  }, [pathname, router, searchParams, sort, view]);

  useEffect(() => {
    if (!selectedBuildingId && mappedBuildings[0]?.building.id) {
      setSelectedBuildingId(mappedBuildings[0].building.id);
    }
  }, [mappedBuildings, selectedBuildingId]);

  const title = VIEW_LABELS[view];
  const buildingsTotal = buildingsResponse?.total ?? loadedBuildings.length;
  const plansTotal = plansResponse?.total ?? loadedPlans.length;
  const visibleCount = view === 'plans' ? plansTotal : buildingsTotal;
  const isInitialLoading =
    (view === 'buildings' && isBuildingsLoading && loadedBuildings.length === 0) ||
    (view === 'plans' && isPlansLoading && loadedPlans.length === 0) ||
    (view === 'map' && isBuildingsLoading && loadedBuildings.length === 0);

  return (
    <MainShell>
      <PlanModal plan={selectedPlan} onClose={() => setSelectedPlan(null)} />

      <section className="bg-[#F3F4F6]">
        <div className="mx-auto w-full max-w-[1520px] px-3 py-6 md:px-6 md:py-10">
          <nav className="mb-6 flex flex-wrap items-center gap-2 text-[15px] text-[#64748B] md:mb-10">
            <Link href="/" className="transition-colors hover:text-[#0036A5]">
              Главная
            </Link>
            <ChevronRight size={16} />
            {/*<Link href="/categories" className="transition-colors hover:text-[#0036A5]">*/}
            {/*  Каталог*/}
            {/*</Link>*/}
            {/*<ChevronRight size={16} />*/}
            <span>Новостройки</span>
          </nav>

          <div className="flex flex-col gap-6 md:gap-10">
            <div className="flex flex-col gap-2 md:flex-row md:items-end md:gap-4">
              <h1 className="text-2xl font-extrabold tracking-[-0.02em] text-[#111827] md:leading-none">
                {title}
              </h1>
              <p className="text-lg font-semibold text-[#475569] md:pb-1">
                {visibleCount} {view === 'plans' ? 'планировок' : formatCountLabel(visibleCount)}
              </p>
            </div>

            <div className="flex items-center gap-3 md:justify-between">
              <div className="flex min-w-0 flex-1 items-center gap-3 overflow-x-auto pb-1 md:overflow-visible">
                <button
                  type="button"
                  onClick={() => setView('buildings')}
                  className={`h-[56px] shrink-0 whitespace-nowrap rounded-2xl px-4 text-[12px] font-medium md:px-5 md:py-4 md:text-[14px] ${
                    view === 'buildings' ? 'bg-[#0036A5] text-white' : 'bg-white text-[#475569]'
                  }`}
                >
                  Новостройки
                </button>
                <button
                  type="button"
                  onClick={() => setView('plans')}
                  className={`h-[56px] shrink-0 whitespace-nowrap rounded-2xl px-4 text-[12px] font-medium md:px-5 md:py-4 md:text-[14px] ${
                    view === 'plans' ? 'bg-[#0036A5] text-white' : 'bg-white text-[#475569]'
                  }`}
                >
                  Планировки
                </button>
                <button
                  type="button"
                  onClick={() => setView('map')}
                  aria-label="На карте"
                  className={`inline-flex h-[56px] w-[56px] shrink-0 items-center justify-center rounded-2xl text-[14px] font-medium md:w-auto md:gap-2 md:px-7 ${
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
                    {Object.entries(SORT_LABELS).map(([value, label]) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => {
                          setSort(value as SortMode);
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
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1520px] px-3 py-6 md:px-6 md:py-10 !pt-0">
        {view === 'buildings' && (
          <>
            {isInitialLoading ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {Array.from({ length: 8 }).map((_, index) => (
                  <NewBuildingCardSkeleton key={`building-skeleton-${index}`} />
                ))}
              </div>
            ) : sortedBuildings.length > 0 ? (
              <>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {sortedBuildings.map((building) => (
                    <NewBuildingCardWithPhotos
                      key={`${building.__source || 'local'}-${building.id}`}
                      building={building}
                      className="h-full"
                    />
                  ))}
                </div>
                <div ref={buildingsSentinelRef} className="h-6" />
                {isBuildingsFetching && buildingsPage > 1 && (
                  <div className="grid grid-cols-1 gap-3 py-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {Array.from({ length: 4 }).map((_, index) => (
                      <NewBuildingCardSkeleton key={`building-loading-${index}`} />
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="rounded-2xl border border-[#E2E8F0] bg-white p-6 text-sm text-[#64748B]">
                Пока нет новостроек по выбранным фильтрам.
              </div>
            )}
          </>
        )}

        {view === 'plans' && (
          <>
            {isInitialLoading ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }).map((_, index) => (
                  <PlanCardSkeleton key={`plan-skeleton-${index}`} />
                ))}
              </div>
            ) : sortedPlans.length > 0 ? (
              <>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {sortedPlans.map((plan) => (
                    <PlanCard
                      key={`${plan.__source || 'local'}-${plan.unit_id}`}
                      plan={plan}
                      onOpen={setSelectedPlan}
                    />
                  ))}
                </div>
                <div ref={plansSentinelRef} className="h-6" />
                {isPlansFetching && plansPage > 1 && (
                  <div className="grid grid-cols-1 gap-4 py-2 md:grid-cols-2 xl:grid-cols-3">
                    {Array.from({ length: 3 }).map((_, index) => (
                      <PlanCardSkeleton key={`plan-loading-${index}`} />
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="rounded-2xl border border-[#E2E8F0] bg-white p-6 text-sm text-[#64748B]">
                Для выбранных новостроек пока нет доступных планировок.
              </div>
            )}
          </>
        )}

        {view === 'map' && (
          <>
            {isInitialLoading ? (
              <MapViewSkeleton />
            ) : mappedBuildings.length > 0 ? (
              <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
                <div className="overflow-hidden rounded-[28px] border border-[#E2E8F0] bg-white p-3">
                  <div className="h-[520px] overflow-hidden rounded-[22px]">
                    <YMaps>
                      <Map
                        defaultState={{
                          center: [mappedBuildings[0].latitude as number, mappedBuildings[0].longitude as number],
                          zoom: 12,
                        }}
                        width="100%"
                        height="100%"
                        modules={['geoObject.addon.balloon', 'geoObject.addon.hint']}
                      >
                        {mappedBuildings.map(({ building, latitude, longitude }) => (
                          <Placemark
                            key={`${building.__source || 'local'}-${building.id}`}
                            geometry={[latitude as number, longitude as number]}
                            properties={{
                              balloonContentHeader: building.title,
                              balloonContentBody: getBuildingAddress(building),
                              hintContent: building.title,
                            }}
                            options={{
                              preset:
                                selectedBuildingId === building.id
                                  ? 'islands#blueHomeCircleIcon'
                                  : 'islands#darkBlueHomeCircleIcon',
                            }}
                            onClick={() => setSelectedBuildingId(building.id)}
                          />
                        ))}
                      </Map>
                    </YMaps>
                  </div>
                </div>

                <aside className="rounded-[28px] border border-[#E2E8F0] bg-white p-5">
                  {selectedMapBuilding ? (
                    <div className="space-y-5">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#0036A5]">
                          Выбранный ЖК
                        </p>
                        <h2 className="mt-2 text-2xl font-extrabold text-[#111827]">
                          {selectedMapBuilding.title}
                        </h2>
                        <p className="mt-2 text-sm text-[#64748B]">
                          {getBuildingAddress(selectedMapBuilding)}
                        </p>
                      </div>

                      <Link
                        href={`/new-buildings/${getBuildingSlug(selectedMapBuilding)}`}
                        className="inline-flex rounded-2xl bg-[#0036A5] px-4 py-3 text-sm font-semibold text-white"
                      >
                        Открыть новостройку
                      </Link>

                      <div>
                        <p className="text-lg font-bold text-[#111827]">
                          Планировки в этом ЖК
                        </p>
                        <div className="mt-3 space-y-3">
                          {selectedBuildingPlans.length > 0 ? (
                            selectedBuildingPlans.map((plan) => (
                              <button
                                key={`${plan.__source || 'local'}-${plan.unit_id}-map`}
                                type="button"
                                onClick={() => setSelectedPlan(plan)}
                                className="block w-full rounded-2xl bg-[#F8FAFC] p-4 text-left"
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <p className="text-sm font-bold text-[#111827]">
                                      {plan.rooms ?? 'Студия'} комн. {plan.area ? `• ${plan.area} м²` : ''}
                                    </p>
                                    <p className="mt-1 text-sm text-[#64748B]">
                                      {plan.price ? `${formatNumber(plan.price)} ${plan.currency || 'TJS'}` : 'Цена не указана'}
                                    </p>
                                  </div>
                                  <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#0036A5]">
                                    План
                                  </span>
                                </div>
                              </button>
                            ))
                          ) : (
                            <div className="rounded-2xl bg-[#F8FAFC] p-4 text-sm text-[#64748B]">
                              Для этого ЖК планировки пока не добавлены.
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-2xl bg-[#F8FAFC] p-4 text-sm text-[#64748B]">
                      У новостроек пока нет координат для отображения на карте.
                    </div>
                  )}
                </aside>
              </div>
            ) : (
              <div className="rounded-2xl border border-[#E2E8F0] bg-white p-6 text-sm text-[#64748B]">
                Для карты пока нет новостроек с координатами.
              </div>
            )}
          </>
        )}
      </section>
    </MainShell>
  );
}
