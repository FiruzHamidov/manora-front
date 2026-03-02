'use client';

import {FC, useCallback, useEffect, useMemo, useRef, useState} from 'react';
import Link from 'next/link';
import {Tabs} from '@/ui-components/tabs/tabs';
import ListingCard from './listing-card';
import ListingCardSkeleton from '@/ui-components/ListingCardSkeleton';
import {PropertiesResponse, Property} from '@/services/properties/types';
import {resolveMediaUrl} from '@/constants/base-url';
import {useGetPropertyTypesQuery} from '@/services/properties/hooks';
import type {Listing} from '@/app/_components/top-listing/types';
import {getContactRoleLabel} from '@/utils/contactRoleLabel';
// import {PropertyType} from "@/services/add-post";
import {ArrowLeft, ArrowRight} from "lucide-react";

type TabItem = { key: string; label: string };

const normalize = (s?: string | null) => (s ?? '').toString().trim().toLowerCase();

const fallbackTabs: ReadonlyArray<TabItem> = [
    {key: 'apartment', label: 'Квартира'},
    {key: 'house', label: 'Дом'},
    {key: 'land', label: 'Земельный участок'},
    {key: 'commercial', label: 'Коммерческая'},
] as const;

const PAGE_SIZE = 5;

const TopListings: FC<{
    title?: string;
    isLoading?: boolean;
    properties: PropertiesResponse | undefined;
    disableSlider?: boolean;
}> = ({title = 'Топовые объявления', properties, isLoading, disableSlider = false}) => {
    const {data: propertyTypesData, isLoading: isTypesLoading} = useGetPropertyTypesQuery();


    const tabs: TabItem[] = useMemo(() => {
        const raw = Array.isArray(propertyTypesData) ? propertyTypesData : [];

        const sorted = [...raw].sort((a, b) => {
            if (a.slug === "new-buildings") return -1; // a — первый
            if (b.slug === "new-buildings") return 1;  // b — первый
            return 0;
        });

        const mapped = sorted
            .map((t) => {
                const key = normalize(t?.slug) || normalize(t?.name);
                const label = t?.name ?? t?.slug ?? "";
                return key ? { key, label } : null;
            })
            .filter((x): x is TabItem => Boolean(x));

        return mapped.length > 0 ? mapped : [...fallbackTabs];
    }, [propertyTypesData]);

    const [activeType, setActiveType] = useState<string>(tabs[0]?.key ?? 'apartment');

    // Refs to detect focus inside tabs / content (pauses auto-advance)
    const tabsContainerRef = useRef<HTMLDivElement | null>(null);
    const contentRef = useRef<HTMLDivElement | null>(null);

    // Auto-advance / progress state
    const [isPaused, setIsPaused] = useState(true);
    const [progress, setProgress] = useState(0); // 0..100

    const TICK_MS = 100;
    const DURATION_MS = 9000;
    const CIRC = 2 * Math.PI * 16; // circumference for SVG progress circle (r=16)

    // Reset progress when active tab changes
    useEffect(() => {
        setProgress(0);
    }, [activeType]);

    // Auto-increment progress and advance to next tab when complete


    // Ensure clicking a tab resets progress immediately
    const handleSetActiveType = useCallback((k: string) => {
        setActiveType(k);
        setProgress(0);
    }, []);

    // Универсалка для строк
    const str = (v: unknown, fallback = ''): string => {
        if (v === null || v === undefined) return fallback;
        return String(v);
    };

    // Маппинг properties -> Listing
    const listings: Listing[] = useMemo(() => {
        if (!properties?.data) return [];
        return properties.data.map((property: Property): Listing => {
            const images =
                property.photos?.length
                    ? property.photos.map((photo) => ({
                        url: resolveMediaUrl(photo.file_path),
                        alt: property.title || 'Фото недвижимости',
                    }))
                    : [{url: '/images/no-image.png', alt: 'Нет фото'}];

            const locationName =
                typeof property.location === 'string'
                    ? property.location
                    : str(property.location?.city, 'не указано');

            const floorInfo =
                property.floor && property.total_floors
                    ? `${property.floor}/${property.total_floors} этаж`
                    : 'Этаж не указан';

            const roomCountLabel =
                str(property.apartment_type) || (property.rooms ? `${property.rooms}-ком` : 'не указано');

            const title =
                str(property.title) ||
                [roomCountLabel, property.total_area ? `${property.total_area} м²` : '']
                    .filter(Boolean)
                    .join(', ')
                    .trim();

            const typeSlug =
                normalize((property as Property)?.type?.slug) ||
                normalize((property as Property)?.type?.name) ||
                undefined;

            return {
                __source: property.__source,
                listing_type: property.listing_type, moderation_status: property.moderation_status,
                id: Number(property.id),
                images,
                price: parseFloat(String(property.price ?? 0)),
                currency: property.currency === 'TJS' ? 'с.' : str(property.currency, ''),
                title,
                locationName,
                description: str(property.description) || str(property.landmark) || 'Описание отсутствует',
                roomCountLabel,
                area: property.total_area ? parseFloat(String(property.total_area)) : 0,
                floorInfo,
                agent: property.creator
                    ? {
                        name: property.creator.name || 'не указано',
                        role: getContactRoleLabel(property),
                        avatarUrl: resolveMediaUrl(property.creator.photo, ''),
                    }
                    : undefined,
                date: property.created_at ? new Date(property.created_at).toLocaleDateString('ru-RU') : undefined,
                type: typeSlug,
                typeName: property.type.name,
                offer_type: property.offer_type ?? ''
            };
        });
    }, [properties]);

    // Предраcсчитываем количество по каждому табу
    const countsByType = useMemo(() => {
        const map = new Map<string, number>();
        tabs.forEach((t) => map.set(t.key, 0));
        listings.forEach((l) => {
            const k = l.type;
            if (k && map.has(k)) map.set(k, (map.get(k) || 0) + 1);
        });
        return map;
    }, [tabs, listings]);

    // Табы только с объявлениями
    const filteredTabs = useMemo<TabItem[]>(() => {
        const arr = tabs.filter(t => (countsByType.get(t.key) || 0) > 0);
        return arr.length ? arr : tabs; // если вдруг все пустые — не ломаем UI
    }, [tabs, countsByType]);

    // Выравниваем activeType: если текущий таб отсутствует или пуст — прыгаем на первый с count>0 (или просто первый)
    useEffect(() => {
        const exists = tabs.some((t) => t.key === activeType);
        const hasItems = (countsByType.get(activeType) || 0) > 0;
        if (!exists || !hasItems) {
            const nonEmpty = tabs.find((t) => (countsByType.get(t.key) || 0) > 0)?.key;
            setActiveType(nonEmpty || tabs[0]?.key || 'apartment');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tabs, countsByType]);

    // Фильтр по активному типу
    const filtered = useMemo(() => {
        return listings.filter((l) => !l.type || l.type === activeType);
    }, [listings, activeType]);

    const [slide, setSlide] = useState(0);
    const totalSlides = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

    useEffect(() => {
        if (!filteredTabs.find(t => t.key === activeType)) {
            setActiveType(filteredTabs[0]?.key ?? 'apartment');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filteredTabs]);

    useEffect(() => {
        setSlide(0);
    }, [activeType]);

    useEffect(() => {
        if (isPaused) return;
        if (!filteredTabs || filteredTabs.length <= 1) return;

        const id = setInterval(() => {
            setProgress((prev) => {
                const next = prev + (TICK_MS / DURATION_MS) * 100;
                if (next >= 100) {
                    // advance to next available tab
                    const idx = filteredTabs.findIndex((t) => t.key === activeType);
                    const nextIdx = (idx + 1) % filteredTabs.length;
                    const nextKey = filteredTabs[nextIdx]?.key;
                    if (nextKey) {
                        setActiveType(nextKey);
                    }
                    return 0;
                }
                return next;
            });
        }, TICK_MS);

        return () => clearInterval(id);
    }, [isPaused, filteredTabs, activeType]);

    // Pause when focus is inside tabs or content
    useEffect(() => {
        const tabsNode = tabsContainerRef.current;
        const contentNode = contentRef.current;
        if (!tabsNode && !contentNode) return;

        const onFocusIn = () => setIsPaused(true);
        const onFocusOut = () => {
            // if the newly focused element is still inside our nodes, keep paused
            const active = document.activeElement;
            const inside = (tabsNode && tabsNode.contains(active)) || (contentNode && contentNode.contains(active));
            setIsPaused(Boolean(inside));
        };

        tabsNode?.addEventListener('focusin', onFocusIn);
        tabsNode?.addEventListener('focusout', onFocusOut);
        contentNode?.addEventListener('focusin', onFocusIn);
        contentNode?.addEventListener('focusout', onFocusOut);

        return () => {
            tabsNode?.removeEventListener('focusin', onFocusIn);
            tabsNode?.removeEventListener('focusout', onFocusOut);
            contentNode?.removeEventListener('focusin', onFocusIn);
            contentNode?.removeEventListener('focusout', onFocusOut);
        };
    }, [tabsContainerRef, contentRef]);

    const pageStart = disableSlider ? 0 : slide * PAGE_SIZE;
    const pageItems = filtered.slice(pageStart, pageStart + PAGE_SIZE);

    // Скелетон
    if (isLoading || isTypesLoading) {
        return (
            <section>
                <div className="mx-auto w-full max-w-[1520px] px-4 sm:px-6 lg:px-8">
                    <h2 className="text-2xl md:text-4xl font-bold text-[#020617] mb-6 md:mb-10">{title}</h2>
                    <div className="mb-5 md:mb-8 overflow-auto hide-scrollbar">
                        <Tabs tabs={tabs} activeType={activeType} setActiveType={setActiveType}/>
                    </div>
                    <div className="grid md:grid-cols-2 gap-5">
                        <div className="md:h-full md:max-h-[576px]">
                            <ListingCardSkeleton isLarge/>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 md:max-h-[576px]">
                            {Array.from({length: 4}).map((_, i) => (
                                <ListingCardSkeleton key={i}/>
                            ))}
                        </div>
                    </div>
                </div>
            </section>
        );
    }

    // ВАЖНО: НЕ скрываем целиком секцию при пустом списке — иначе будет "мигание"
    const firstListing = pageItems[0];
    const smallListings = pageItems.slice(1, 5);

    return (
        <section>
            <div ref={contentRef} className="mx-auto w-full max-w-[1520px] px-4 sm:px-6 lg:px-8">
                <h2 className="text-2xl md:text-4xl font-bold text-[#020617] mb-6 md:mb-10">{title}</h2>

                <div ref={tabsContainerRef}
                     className="mb-5 md:mb-8 overflow-auto hide-scrollbar flex items-center justify-between">
                    <div className="flex gap-3 items-center" role="tablist" aria-label="Типы недвижимости">
                        {filteredTabs.map((t) => (
                            <button
                                key={t.key}
                                role="tab"
                                aria-selected={t.key === activeType}
                                tabIndex={0}
                                onClick={() => handleSetActiveType(t.key)}
                                className={['relative px-4 py-2 my-2 rounded-full flex items-center gap-3 focus:outline-none ', t.key === activeType ? 'bg-[#0036A5] text-white' : 'bg-white text-gray-700 shadow-sm'].join(' ')}
                            >
                                <span className="leading-5 h-8 flex items-center">{t.label}</span>
                                {t.key === activeType && (
                                <span className="ml-2 w-8 h-8 inline-flex items-center justify-center">

                                        <svg viewBox="0 0 36 36" className="w-6 h-6">
                                            <circle cx="18" cy="18" r="16" strokeWidth="2"
                                                    stroke={t.key === activeType ? '#756868' : '#ffffff'}
                                                    fill="none"/>
                                            <circle
                                                cx="18"
                                                cy="18"
                                                r="16"
                                                strokeWidth="2"
                                                stroke={t.key === activeType ? '#FFFFFF' : '#a3b0cc'}
                                                strokeLinecap="round"
                                                fill="none"
                                                strokeDasharray={`${CIRC}`}
                                                strokeDashoffset={t.key === activeType ? String(CIRC * (1 - progress / 100)) : String(CIRC)}
                                                transform="rotate(-90 18 18)"
                                            />
                                        </svg>

                                </span>
                                )}

                            </button>
                        ))}
                    </div>
                    {/*<div className="ml-4 flex gap-3" aria-hidden>*/}
                    {/*    {filteredTabs.map((t) => (*/}
                    {/*        <div key={t.key} className="w-8 h-8 relative">*/}
                    {/*            <svg viewBox="0 0 36 36" className="w-8 h-8">*/}
                    {/*                <circle cx="18" cy="18" r="16" strokeWidth="2" stroke="#E5E7EB" fill="none" />*/}
                    {/*                <circle*/}
                    {/*                    cx="18"*/}
                    {/*                    cy="18"*/}
                    {/*                    r="16"*/}
                    {/*                    strokeWidth="2"*/}
                    {/*                    stroke="#0036A5"*/}
                    {/*                    strokeLinecap="round"*/}
                    {/*                    fill="none"*/}
                    {/*                    strokeDasharray={`${CIRC}`}*/}
                    {/*                    strokeDashoffset={t.key === activeType ? String(CIRC * (1 - progress / 100)) : String(CIRC)}*/}
                    {/*                    transform="rotate(-90 18 18)"*/}
                    {/*                />*/}
                    {/*            </svg>*/}
                    {/*        </div>*/}
                    {/*    ))}*/}
                    {/*</div>*/}
                </div>

                {filtered.length === 0 ? (
                    <div className="py-12 text-center text-gray-500">
                        По выбранному типу пока нет объявлений.
                    </div>
                ) : (
                    <>
                        <div className="grid md:grid-cols-2 gap-5">
                            {firstListing && (
                                <div className="md:h-full md:max-h-[730px]">
                                    <Link
                                        href={`/apartment/${firstListing.id}?source=${firstListing.__source === 'aura' ? 'aura' : 'local'}`}
                                        className="max-h-[600px]"
                                    >
                                        <ListingCard listing={firstListing} isLarge/>
                                    </Link>
                                </div>
                            )}

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 md:max-h-[730px]">
                                {smallListings.map((l) => (
                                    <Link
                                        key={l.id}
                                        href={`/apartment/${l.id}?source=${l.__source === 'aura' ? 'aura' : 'local'}`}
                                        className="max-h-[350px] min-h-[350px]"
                                    >
                                        <ListingCard listing={l}/>
                                    </Link>
                                ))}
                            </div>
                        </div>

                        {!disableSlider && totalSlides > 1 && (
                            <div className="mt-6 flex items-center justify-center gap-3">
                                <button
                                    onClick={() => setSlide((s) => Math.max(0, s - 1))}
                                    disabled={slide === 0}
                                    className="w-12 h-12 justify-center items-center flex rounded-full disabled:bg-white disabled:text-gray-400 bg-[#0036A5] text-white">
                                    <ArrowLeft className="w-6 h-6"/>
                                </button>

                                <div className="flex items-center gap-2">
                                    {Array.from({length: totalSlides}).map((_, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setSlide(i)}
                                            className={['w-2.5 h-2.5 rounded-full', i === slide ? 'bg-[#0036A5]' : 'bg-gray-300'].join(' ')}
                                            aria-label={`Слайд ${i + 1}`}
                                        />
                                    ))}
                                </div>

                                <button
                                    onClick={() => setSlide((s) => Math.min(totalSlides - 1, s + 1))}
                                    disabled={slide === totalSlides - 1}
                                    className="w-12 h-12 justify-center items-center flex rounded-full disabled:bg-white disabled:text-gray-400 bg-[#0036A5] text-white">
                                    <ArrowRight className="w-6 h-6"/>
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </section>
    );
};

export default TopListings;
