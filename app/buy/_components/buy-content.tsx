'use client';

import {FC, useEffect, useMemo, useState, useRef} from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import {useRouter, useSearchParams} from 'next/navigation';
import clsx from 'clsx';
import Buy from '@/app/_components/buy/buy';
import {useGetPropertiesInfiniteQuery, useGetPropertiesStatsQuery} from '@/services/properties/hooks';
import {AllFilters} from '@/app/_components/filters';
import {PropertyFilters} from '@/services/properties/types';
import BuyCardSkeleton from '@/ui-components/BuyCardSkeleton';
import {useGetPropertyTypesQuery} from "@/services/add-post";
import {ArrowUpWideNarrow, ChevronRight, ListFilterPlus, ListIcon, MapIcon} from "lucide-react";

const SORT_OPTIONS = [
    {value: 'listing_type:desc', label: 'По типу'},
    {value: 'price:asc', label: 'Цена — по возрастанию'},
    {value: 'price:desc', label: 'Цена — по убыванию'},
    {value: 'total_area:asc', label: 'Площадь — по возрастанию'},
    {value: 'total_area:desc', label: 'Площадь — по убыванию'},
    {value: 'date:desc', label: 'Дата — новые сверху'},
    {value: 'date:asc', label: 'Дата — старые сверху'},
    {value: 'none', label: 'Без сортировки (по умолчанию)'},
] as const;

type FilterType = 'list' | 'map';

const BuyMap = dynamic(() => import('./BuyMap'), {
    ssr: false,
    loading: () => (
        <div className="h-[100vh] rounded-[22px] bg-gray-100 animate-pulse my-10"/>
    ),
});

export const BuyContent: FC<{ offer_type_props?: string; listing_type_props?: string }> = ({
    offer_type_props = 'sale',
    listing_type_props = '',
}) => {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [activeFilter, setActiveFilter] = useState<FilterType>('list');
    const [isAllFiltersOpen, setIsAllFiltersOpen] = useState(false);
    const [isSortOpen, setIsSortOpen] = useState(false);
    const {data: propertyTypesList} = useGetPropertyTypesQuery();
    const formattedInitialFilters = useMemo(
        () => ({
            propertyTypes: searchParams.get('propertyTypes')?.split(',') || undefined,
            apartmentTypes:
                searchParams.get('apartmentTypes')?.split(',') || undefined,
            cities: searchParams.get('cities')?.split(',') || undefined,
            districts: searchParams.get('districts')?.split(',') || undefined,
            repairs: searchParams.get('repairs')?.split(',') || undefined,
            priceFrom: searchParams.get('priceFrom') || undefined,
            priceTo: searchParams.get('priceTo') || undefined,
            roomsFrom: searchParams.get('roomsFrom') || undefined,
            roomsTo: searchParams.get('roomsTo') || undefined,
            areaFrom: searchParams.get('areaFrom') || undefined,
            areaTo: searchParams.get('areaTo') || undefined,
            floorFrom: searchParams.get('floorFrom') || undefined,
            floorTo: searchParams.get('floorTo') || undefined,
            landmark: searchParams.get('landmark') || undefined,
            sort: searchParams.get('sort') || undefined,
            dir: searchParams.get('dir') || undefined,
            is_full_apartment: Boolean(searchParams.get('is_full_apartment')),
        }),
        [searchParams]
    );

    const listingType = searchParams.get('listing_type') || listing_type_props || '';
    const currentOfferType = searchParams.get('offer_type') || offer_type_props || 'sale';

    const filters = {
        priceFrom: searchParams.get('priceFrom') || undefined,
        priceTo: searchParams.get('priceTo') || undefined,
        location_id: searchParams.get('cities') || undefined,
        repair_type_id: searchParams.get('repairs') || undefined,
        type_id: searchParams.get('propertyTypes') || '',
        roomsFrom: searchParams.get('roomsFrom') || undefined,
        roomsTo: searchParams.get('roomsTo') || undefined,
        districts: searchParams.get('districts') || undefined,
        areaFrom: searchParams.get('areaFrom') || undefined,
        areaTo: searchParams.get('areaTo') || undefined,
        floorFrom: searchParams.get('floorFrom') || undefined,
        floorTo: searchParams.get('floorTo') || undefined,
        landmark: searchParams.get('landmark') || undefined,
        sort: searchParams.get('sort') || 'listing_type',
        dir: searchParams.get('dir') || 'desc',
        listing_type: listingType,
        offer_type: currentOfferType,
        is_full_apartment: searchParams.get('is_full_apartment') || '',
    };

    const {
        data: propertiesData,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
        isFetching,
    } = useGetPropertiesInfiniteQuery(filters);
    const {data: listingsStats, isLoading: isStatsLoading} = useGetPropertiesStatsQuery(filters, true);

    const selectedTypeNames = useMemo(() => {
        const idsParam = searchParams.get('propertyTypes');
        if (!idsParam || !propertyTypesList) return null;

        const ids = idsParam.split(',').map((n) => Number(n)).filter(Boolean);
        const names = propertyTypesList
            .filter((t) => ids.includes(t.id))
            .map((t) => t.name);

        if (names.length === 0) return null;
        if (names.length === 1) return names[0];
        if (names.length === 2) return `${names[0]} и ${names[1]}`;
        return `${names[0]} и ещё ${names.length - 1}`;
    }, [searchParams, propertyTypesList]);

    const listingTypeLabel = useMemo(() => {
        if (listingType === 'vip') return 'VIP объявления';
        if (listingType === 'urgent') return 'Срочные объявления';
        return null;
    }, [listingType]);

    const roomCategories = useMemo(() => {
        const defaults = [
            {label: '1 ком.', count: '...', value: '1', isLoading: true},
            {label: '2 ком.', count: '...', value: '2', isLoading: true},
            {label: '3 ком.', count: '...', value: '3', isLoading: true},
            {label: '4 ком.', count: '...', value: '4', isLoading: true},
            {label: '5 ком.', count: '...', value: '5', isLoading: true},
        ];

        if (isStatsLoading || !listingsStats) return defaults;

        return defaults.map((item) => ({
            ...item,
            count: String(listingsStats.room_counts?.[item.value] ?? 0),
            isLoading: false,
        }));
    }, [isStatsLoading, listingsStats]);

    const properties = useMemo(
        () => propertiesData?.pages.flatMap((page) => page.data) || [],
        [propertiesData]
    );

    const propertiesForBuy = {
        data: properties,
        current_page: 1,
        last_page:
            propertiesData?.pages[propertiesData.pages.length - 1]?.last_page || 1,
        per_page: 10,
        total:
            listingsStats?.total ||
            propertiesData?.pages[propertiesData.pages.length - 1]?.total ||
            properties.length,
        from: 1,
        to: properties.length,
        first_page_url: '',
        last_page_url: '',
        links: [],
        next_page_url: hasNextPage ? 'next' : null,
        path: '',
        prev_page_url: null,
    };

    const [selectedRooms, setSelectedRooms] = useState<string[]>(() => {
        const roomsFrom = searchParams.get('roomsFrom');
        const roomsTo = searchParams.get('roomsTo');

        if (roomsFrom && roomsTo) {
            const minRoom = parseInt(roomsFrom, 10);
            const maxRoom = parseInt(roomsTo, 10);

            if (!isNaN(minRoom) && !isNaN(maxRoom)) {
                const selectedRoomValues = [];
                for (let i = minRoom; i <= maxRoom; i++) {
                    selectedRoomValues.push(i.toString());
                }
                return selectedRoomValues;
            } else if (roomsFrom === roomsTo) {
                return [roomsFrom];
            }
        }
        return [];
    });

    const handleRoomFilterClick = (roomValue: string) => {
        const newSelectedRooms = [...selectedRooms];
        const roomIndex = newSelectedRooms.indexOf(roomValue);

        if (roomIndex > -1) {
            newSelectedRooms.splice(roomIndex, 1);
        } else {
            newSelectedRooms.push(roomValue);
        }

        setSelectedRooms(newSelectedRooms);

        const params = new URLSearchParams(searchParams.toString());

        if (newSelectedRooms.length === 0) {
            params.delete('roomsFrom');
            params.delete('roomsTo');
        } else {
            const roomValues = newSelectedRooms.map((r) => parseInt(r, 10));
            const minRoom = Math.min(...roomValues);
            const maxRoom = Math.max(...roomValues);

            params.set('roomsFrom', minRoom.toString());
            params.set('roomsTo', maxRoom.toString());
        }

        router.push(`/listings?${params.toString()}`);
    };

    const applySortSelection = (value: string) => {
        const params = new URLSearchParams(window.location.search);

        if (value === 'none') {
            params.delete('sort');
            params.delete('dir');
        } else {
            const [sort, dir] = value.split(':');
            params.set('sort', sort);
            params.set('dir', dir as 'asc' | 'desc');
        }

        const base = '/listings';
        const qs = params.toString();
        window.history.pushState({}, '', `${base}${qs ? `?${qs}` : ''}`);
        window.dispatchEvent(new PopStateEvent('popstate'));
        setIsSortOpen(false);
    };

    const handleAdvancedSearch = (filters: PropertyFilters) => {
        // Start from current URL params so we preserve existing sort/dir and any other params
        const params = new URLSearchParams(window.location.search);

        // Apply/overwrite filter values from the form. If a value is empty/falsey, remove it.
        Object.entries(filters).forEach(([key, value]) => {
            if (value === undefined) return;
            if (value && value !== '' && value !== '0') {
                params.set(key, value as string);
            } else {
                params.delete(key);
            }
        });

        // Keep existing sort/dir in params (we didn't touch them above)
        const queryString = params.toString();
        router.push(`/listings${queryString ? `?${queryString}` : ''}`);
        setIsAllFiltersOpen(false);
    };

    useEffect(() => {
        if (activeFilter !== 'list') return;
        const handleScroll = () => {
            if (
                window.innerHeight + document.documentElement.scrollTop >=
                document.documentElement.offsetHeight - 1000 &&
                hasNextPage &&
                !isFetching
            ) {
                fetchNextPage();
            }
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [fetchNextPage, hasNextPage, isFetching, activeFilter]);

    // Reload / reapply filters when sort/dir query params change.
    // We store previous values to avoid calling repeatedly.
    const prevSortRef = useRef<string | null>(null);
    const prevDirRef = useRef<string | null>(null);

    useEffect(() => {
        const currentSort = searchParams.get('sort');
        const currentDir = searchParams.get('dir') || 'desc';

        // if no change — do nothing
        if (prevSortRef.current === currentSort && prevDirRef.current === currentDir) return;

        // update prev values
        prevSortRef.current = currentSort;
        prevDirRef.current = currentDir;

        // call handleAdvancedSearch to reapply current filters together with new sort
        // formattedInitialFilters comes from searchParams and represents current filter state
        try {
            handleAdvancedSearch(filters);
        } catch {
            // fallback — refresh router
            router.refresh();
        }
    }, [searchParams.toString()]);

    return (
        <div className="mb-[60px] relative">
            <div
                className={clsx(
                    ' mx-auto w-full max-w-[1520px]  px-4 sm:px-6 lg:px-8 z-5 relative',
                    isAllFiltersOpen && 'rounded-b-none',
                    activeFilter === 'map' ? 'mt-2' : 'mt-8'
                )}
            >
                <div className={`rounded-[22px] ${activeFilter === 'map' ? 'p-0 sm:p-2' : ''}`}>
                    <nav className={`mb-6 flex flex-wrap items-center gap-2 text-[15px] text-[#64748B] ${activeFilter === 'map' ? 'hidden md:flex' : ''}`}>
                        <Link href="/" className="transition-colors hover:text-[#0036A5]">
                            Главная
                        </Link>
                        <ChevronRight size={16} />

                        <span>{currentOfferType === 'rent' ? 'Аренда' : 'Недвижимость'}</span>
                    </nav>

                    <div className={`flex flex-col gap-4 md:flex-row md:items-center ${activeFilter === 'map' ? 'justify-start' : 'justify-between'}`}>
                        <div className={`${activeFilter === 'map' ? 'hidden' : ''}`}>
                            <h1 className="text-2xl font-bold text-[#020617] mb-1">
                                {listingTypeLabel
                                    ? listingTypeLabel
                                    : selectedTypeNames
                                        ? `${currentOfferType === 'rent' ? 'Аренда' : 'Купить'}: ${selectedTypeNames}`
                                        : `${currentOfferType === 'rent' ? 'Аренда недвижимости' : 'Купить недвижимость'}`}
                            </h1>
                            <p className="text-[#666F8D]">
                                {isLoading
                                    ? 'Загрузка объявлений...'
                                    : `Найдено ${propertiesForBuy.total || 0} объектов`}
                            </p>
                        </div>

                        <div
                            className={clsx(
                                'flex items-center gap-3 md:mt-0 w-full md:w-auto',
                                activeFilter === 'map' ? 'justify-start' : 'justify-start'
                            )}>
                            <div className="flex min-w-0 flex-1 items-center gap-3 overflow-x-auto pb-1 md:flex-none md:overflow-visible hide-scrollbar">
                                <button
                                    type="button"
                                    onClick={() => setActiveFilter('list')}
                                    className={clsx(
                                        'inline-flex h-[56px] shrink-0 items-center gap-2 rounded-2xl px-4 text-[12px] font-medium md:px-6 md:text-[18px]',
                                        activeFilter === 'list'
                                            ? 'bg-[#0036A5] text-white'
                                            : 'bg-white text-[#475569]'
                                    )}
                                >
                                    <ListIcon size={20} />
                                    <span>Список</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setActiveFilter('map')}
                                    aria-label="На карте"
                                    className={clsx(
                                        'inline-flex h-[56px] w-[56px] shrink-0 items-center justify-center rounded-2xl text-[18px] font-medium md:w-auto md:gap-2 md:px-7',
                                        activeFilter === 'map'
                                            ? 'bg-[#0036A5] text-white'
                                            : 'bg-white text-[#0036A5]'
                                    )}
                                >
                                    <MapIcon size={22} />
                                    <span className="hidden md:inline">На карте</span>
                                </button>
                            </div>

                            <div className={clsx('relative shrink-0', isSortOpen && 'z-[60]')}>
                                <button
                                    onClick={() => setIsSortOpen((prev) => !prev)}
                                    aria-label="Сортировка"
                                    className={`inline-flex h-[56px] w-[56px] shrink-0 items-center justify-center rounded-2xl bg-white ${activeFilter === 'map' ? 'hidden md:inline-flex' : ''}`}
                                >
                                    <ArrowUpWideNarrow className="h-5 w-5 md:h-6 md:w-6 text-[#0036A5]"/>
                                </button>

                                {isSortOpen && (
                                    <div className="absolute right-0 top-[64px] z-[70] w-[260px] rounded-2xl border border-[#E2E8F0] bg-white p-2 shadow-xl">
                                        {SORT_OPTIONS.map(({value, label}) => {
                                            const currentSort = searchParams.get('sort');
                                            const currentDir = searchParams.get('dir') || 'desc';
                                            const currentValue = currentSort ? `${currentSort}:${currentDir}` : 'none';

                                            return (
                                                <button
                                                    key={value}
                                                    type="button"
                                                    onClick={() => applySortSelection(value)}
                                                    className={`flex w-full items-center rounded-xl px-3 py-3 text-left text-sm ${
                                                        currentValue === value
                                                            ? 'bg-[#EEF4FF] font-semibold text-[#0036A5]'
                                                            : 'text-[#334155]'
                                                    }`}
                                                >
                                                    {label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                            <button
                                onClick={() => setIsAllFiltersOpen(!isAllFiltersOpen)}
                                className={clsx(
                                    'shrink-0 inline-flex items-center justify-center rounded-2xl bg-white cursor-pointer transition-all duration-300',
                                    activeFilter === 'map'
                                        ? 'shadow-lg w-[56px] h-[56px] p-0'
                                        : 'w-[56px] h-[56px] p-0'
                                )}
                            >
                                <ListFilterPlus
                                    className={clsx(
                                        'text-[#0036A5] transition-transform duration-300',
                                        activeFilter === 'map' ? 'h-4 w-4' : 'h-5 w-5 md:h-6 md:w-6'
                                    )}
                                />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            <div className="container px-0 ">
                <AllFilters
                    isOpen={isAllFiltersOpen}
                    onClose={() => setIsAllFiltersOpen(false)}
                    onSearch={handleAdvancedSearch}
                    initialFilters={formattedInitialFilters}
                    propertyTypes={propertyTypesList ?? []}
                />
            </div>

            {/* Room filter chips */}
            <div
                className={clsx(
                    'mx-auto w-full max-w-[1520px] px-4 sm:px-6 lg:px-8 relative z-0 my-4',
                    activeFilter === 'map' && 'hidden'
                )}
            >
                <div className="overflow-x-auto hide-scrollbar">
                    <div className="flex gap-2 py-2">
                        {roomCategories.map((category, index) => {
                            const isSelected = selectedRooms.includes(category.value);
                            return (
                                <button
                                    key={index}
                                    onClick={() => handleRoomFilterClick(category.value)}
                                    className={`cursor-pointer shrink-0 whitespace-nowrap px-6 py-3 rounded-2xl transition-all ${
                                        isSelected
                                            ? 'bg-[#0036A5] text-white border border-[#0036A5]'
                                            : 'bg-white border border-gray-200 hover:bg-gray-50'
                                    }`}
                                >
                                    <span className="font-medium">{category.label}</span>
                                    <span
                                        className={`ml-1 ${
                                            isSelected ? 'text-white' : 'text-[#666F8D]'
                                        }`}
                                    >
                    {category.isLoading ? '...' : category.count}
                  </span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Property listings */}
            {activeFilter === 'list' ? (
                <>
                    <Buy
                        properties={propertiesForBuy}
                        hasTitle={false}
                        isLoading={isLoading}
                        injectAdsEveryTen
                    />
                    {isFetchingNextPage && (
                        <section>
                            <div className="mx-auto w-full max-w-[1520px] px-4 sm:px-6 lg:px-8">
                                <div
                                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-[30px] my-8">
                                    {Array.from({length: 4}).map((_, index) => (
                                        <BuyCardSkeleton key={`loading-${index}`}/>
                                    ))}
                                </div>
                            </div>
                        </section>
                    )}
                    {!hasNextPage && properties.length > 0 && (
                        <div className="text-center py-4 text-gray-500">
                            Больше объявлений нет
                        </div>
                    )}
                </>
            ) :    (
                // Map view
                <div className='relative h-[70vh] min-h-[560px]'>
                    <div className="h-full w-full">
                        <BuyMap items={properties} baseFilters={filters}/>
                    </div>
                </div>
            )}
        </div>
    );
};
