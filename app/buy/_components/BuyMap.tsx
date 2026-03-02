'use client';

import {AnimatePresence, motion, PanInfo} from 'framer-motion';
import {FC, ReactNode, useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
    FullscreenControl,
    GeolocationControl,
    Map,
    Placemark,
    TypeSelector,
    YMaps,
    ZoomControl,
} from '@pbe/react-yandex-maps';
import {
    MapBounds,
    MapClusterProperties,
    MapPointProperties,
    Property,
    PropertyFilters,
} from '@/services/properties/types';
import {useGetPropertiesMapQuery, useGetPropertyByIdQuery,} from '@/services/properties/hooks';
import BuyCard from '@/app/_components/buy/buy-card';
import {useProfile} from '@/services/login/hooks';
import {useSearchParams} from 'next/navigation';
import type * as ymaps from 'yandex-maps';
import {createPortal} from 'react-dom';
import {Eye, X} from "lucide-react";
import Link from "next/link";

const DEFAULT_CENTER: [number, number] = [38.559772, 68.787038];
const DEFAULT_ZOOM = 12;
const MAP_BOUNDS_DEBOUNCE_MS = 520;
const BOUNDS_EPSILON = 0.0008;
const MARKER_BG = '#0036a5';

const toNum = (v: unknown): number | null => {
    if (typeof v === 'number' && Number.isFinite(v)) return v;
    if (typeof v === 'string' && v.trim() !== '') {
        const normalized = v
            .replace(/\u00A0/g, ' ')
            .replace(/\s+/g, '')
            .replace(',', '.');
        const n = Number(normalized);
        return Number.isFinite(n) ? n : null;
    }
    return null;
};

type Point = { it: Property; coords: [number, number] };

type Props = {
    items: Property[];
    baseFilters?: Record<string, string | undefined>;
    /** смещение карточки относительно пина */
    offset?: { x?: number; y?: number };
};

const formatCompactPrice = (raw: unknown, currency?: string): string => {
    const n = toNum(raw);
    if (n === null || n <= 0) return '';

    const abs = Math.abs(n);
    const prefix = currency === 'USD' ? '$' : '';

    if (abs >= 1_000_000_000) {
        const value = (n / 1_000_000_000).toFixed(1).replace('.0', '');
        return `${prefix}${value} млрд`;
    }
    if (abs >= 1_000_000) {
        const value = (n / 1_000_000).toFixed(1).replace('.0', '');
        return `${prefix}${value} млн`;
    }
    if (abs >= 1_000) {
        const value = (n / 1_000).toFixed(1).replace('.0', '');
        return `${prefix}${value} тыс`;
    }
    return `${prefix}${Math.round(n).toLocaleString('ru-RU')}`;
};

const DEFAULT_CLUSTER_FROM_LABEL = 'от 750к';

const pickPriceFromUnknown = (raw: unknown): unknown => {
    if (raw === null || raw === undefined) return null;
    if (typeof raw === 'number' || typeof raw === 'string') return raw;
    if (typeof raw !== 'object') return null;

    const obj = raw as Record<string, unknown>;
    return (
        obj.amount ??
        obj.value ??
        obj.price ??
        obj.min_price ??
        obj.price_from ??
        null
    );
};

const escapeXml = (value: string) =>
    value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');

const createMarkerDataUri = (label: string) => {
    const safeLabel = (label || 'цена').trim();
    const width = Math.max(84, Math.min(168, safeLabel.length * 9 + 28));
    const height = 40;
    const rx = 16;
    const tailW = 14;
    const tailH = 9;
    const cx = Math.round(width / 2);
    const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect x="1" y="1" width="${width - 2}" height="${height - tailH - 1}" rx="${rx}" fill="${MARKER_BG}"/>
  <path d="M ${cx - tailW / 2} ${height - tailH} L ${cx + tailW / 2} ${height - tailH} L ${cx} ${height - 1} Z" fill="${MARKER_BG}"/>
  <text x="50%" y="16" text-anchor="middle" fill="#ffffff" font-size="14" font-weight="700" font-family="Arial, sans-serif" dominant-baseline="middle">${escapeXml(safeLabel)}</text>
</svg>`;
    return {
        href: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
        size: [width, height] as [number, number],
        offset: [-Math.round(width / 2), -height] as [number, number],
    };
};

const hasSignificantBoundsChange = (a: MapBounds | null, b: MapBounds | null): boolean => {
    if (!a || !b) return true;
    return (
        Math.abs(a.south - b.south) > BOUNDS_EPSILON ||
        Math.abs(a.west - b.west) > BOUNDS_EPSILON ||
        Math.abs(a.north - b.north) > BOUNDS_EPSILON ||
        Math.abs(a.east - b.east) > BOUNDS_EPSILON
    );
};

export const BuyMap: FC<Props> = ({items, offset = {x: 32, y: -468}}) => {
    const searchParams = useSearchParams();
    const wrapRef = useRef<HTMLDivElement | null>(null);
    const mapRef = useRef<ymaps.Map | null>(null);
    const {data: user} = useProfile();

    const [bounds, setBounds] = useState<MapBounds | null>(null);
    const [zoom, setZoom] = useState<number>(DEFAULT_ZOOM);
    const [useMapApi, setUseMapApi] = useState<boolean>(false);
    const [selectedApiPointId, setSelectedApiPointId] = useState<number | null>(
        null
    );
    const points: Point[] = useMemo(() => {
        return (items ?? [])
            .map((it) => {
                const lat = toNum(it.latitude);
                const lng = toNum(it.longitude);
                if (lat === null || lng === null) return null;
                return {it, coords: [lat, lng] as [number, number]};
            })
            .filter(Boolean) as Point[];
    }, [items]);

    const firstCenter = points[0]?.coords ?? DEFAULT_CENTER;

    const mapFilters: PropertyFilters = useMemo(() => {
        // helper: вернуть строку или undefined, если пусто
        const g = (k: string) => {
            const v = searchParams.get(k);
            return v && v.trim() !== '' ? v : undefined;
        };

        return {
            // цены
            priceFrom: g('priceFrom'),
            priceTo: g('priceTo'),

            // гео/категории
            city: g('cities'),
            districts: g('districts'),

            repair_type_id: g('repairs'),

            type_id: g('propertyTypes') ?? g('type_id'),

            // комнаты/площади/этажи
            roomsFrom: g('roomsFrom'),
            roomsTo: g('roomsTo'),
            areaFrom: g('areaFrom'),
            areaTo: g('areaTo'),
            floorFrom: g('floorFrom'),
            floorTo: g('floorTo'),

            // самое важное: читаем из URL, ничего не хардкодим
            listing_type: g('listing_type'),
            offer_type: g('offer_type'),
            landmark: g('landmark'),
            is_full_apartment: g('is_full_apartment'),
        } as PropertyFilters;
    }, [searchParams]);

    const {data: mapData, isFetching: isMapDataFetching} = useGetPropertiesMapQuery(
        bounds,
        zoom,
        mapFilters,
        false,
        !!bounds
    );

    const boundsDebounceRef = useRef<number | null>(null);
    const boundsRef = useRef<MapBounds | null>(null);
    const markerCacheRef = useRef(new globalThis.Map<string, { href: string; size: [number, number]; offset: [number, number] }>());

    useEffect(() => {
        boundsRef.current = bounds;
    }, [bounds]);

    useEffect(() => {
        return () => {
            if (boundsDebounceRef.current) {
                window.clearTimeout(boundsDebounceRef.current);
                boundsDebounceRef.current = null;
            }
        };
    }, []);

    const itemsById = useMemo(() => {
        const map = new globalThis.Map<number, Property>();
        (items ?? []).forEach((item) => map.set(Number(item.id), item));
        return map;
    }, [items]);

    const getPointPriceLabel = useCallback(
        (pointProps: MapPointProperties) => {
            const pp = pointProps as MapPointProperties & Record<string, unknown>;

            const stringCandidates = [
                pp.price_label,
                pp.label,
                pp.formatted_price,
                pp.price_formatted,
                pp.price_text,
                pp.price_human,
            ];
            for (const candidate of stringCandidates) {
                if (typeof candidate === 'string' && candidate.trim() !== '') return candidate.trim();
            }

            const numericCandidates = [
                pp.price,
                pp.amount,
                pp.price_value,
                pp.min_price,
                pp.price_from,
            ];
            for (const candidate of numericCandidates) {
                const resolved = pickPriceFromUnknown(candidate);
                if (resolved !== undefined && resolved !== null) {
                    const formatted = formatCompactPrice(
                        resolved,
                        typeof pp.currency === 'string' ? pp.currency : undefined
                    );
                    if (formatted) return formatted;
                }
            }

            const fromItems = itemsById.get(Number(pointProps.id));
            if (fromItems) {
                const formatted = formatCompactPrice(fromItems.price, fromItems.currency);
                if (formatted) return formatted;
            }

            return 'по запросу';
        },
        [itemsById]
    );

    const getClusterFromLabel = useCallback((clusterProps: MapClusterProperties) => {
        const cp = clusterProps as MapClusterProperties & Record<string, unknown>;
        const stringCandidates = [cp.min_price_label, cp.price_from_label];
        for (const candidate of stringCandidates) {
            if (typeof candidate === 'string' && candidate.trim() !== '') {
                return candidate.trim().startsWith('от')
                    ? candidate.trim()
                    : `от ${candidate.trim()}`;
            }
        }

        const numericCandidates = [cp.min_price, cp.price_from];
        for (const candidate of numericCandidates) {
            const resolved = pickPriceFromUnknown(candidate);
            const formatted = formatCompactPrice(
                resolved,
                typeof cp.currency === 'string' ? cp.currency : undefined
            );
            if (formatted) return `от ${formatted.replace(' тыс', 'к')}`;
        }

        return DEFAULT_CLUSTER_FROM_LABEL;
    }, []);

    const {data: selectedProperty, isLoading: isLoadingProperty} =
        useGetPropertyByIdQuery(
            selectedApiPointId?.toString() || '',
            !!selectedApiPointId
        );

    const displayPoints = useMemo(() => {
        return points;
    }, [points]);

    // const [hovered, setHovered] = useState<Point | null>(null);
    const [selected, setSelected] = useState<Point | null>(null);
    // const [hoverPos, setHoverPos] = useState<{
    //   left: number;
    //   top: number;
    // } | null>(null);
    const [selectPos, setSelectPos] = useState<{
        left: number;
        top: number;
    } | null>(null);

    const project = useCallback(
        (
            coords: [number, number] | null,
            set: (p: { left: number; top: number } | null) => void
        ) => {
            const map = mapRef.current;
            if (!map || !coords) {
                set(null);
                return;
            }

            try {
                const rawProj =
                    (map.options.get('projection', {}) as unknown) ??
                    ((typeof window !== 'undefined' &&
                        (
                            window as unknown as {
                                ymaps?: { projection?: { wgs84Mercator?: unknown } };
                            }
                        ).ymaps?.projection?.wgs84Mercator) as unknown);

                if (
                    !rawProj ||
                    typeof (rawProj as ymaps.IProjection).toGlobalPixels !== 'function'
                ) {
                    set(null);
                    return;
                }

                const projection = rawProj as ymaps.IProjection;
                const zoomLevel = map.getZoom();
                const globalPx = projection.toGlobalPixels(coords, zoomLevel);
                const pagePt = map.converter.globalToPage(globalPx);

                const left = pagePt[0] + (offset.x ?? 0);
                const top = pagePt[1] + (offset.y ?? 0);

                set({left, top});
            } catch (e) {
                console.warn('project error', e);
                set(null);
            }
        },
        [offset.x, offset.y]
    );

    useEffect(() => {
        const map = mapRef.current;
        if (!map) return;
        const recalc = () => {
            // project(hovered?.coords ?? null, setHoverPos);
            project(selected?.coords ?? null, setSelectPos);
        };
        // map.events.add('actiontick', recalc);
        // map.events.add('boundschange', recalc);
        const ro = new ResizeObserver(recalc);
        if (wrapRef.current) ro.observe(wrapRef.current);
        recalc();
        return () => {
            map.events.remove('actiontick', recalc);
            map.events.remove('boundschange', recalc);
            ro.disconnect();
        };
    }, [selected, project]);

    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const mq = window.matchMedia('(max-width: 768px)');

        // типобезопасный слушатель
        const onChange = (e: MediaQueryListEvent) => setIsMobile(e.matches);

        // установить текущее состояние
        setIsMobile(mq.matches);

        // современный API
        if (typeof mq.addEventListener === 'function') {
            mq.addEventListener('change', onChange);
        } else if (typeof mq.addListener === 'function') {
            // совместимость со старыми WebKit
            mq.addListener(onChange);
        }

        return () => {
            if (typeof mq.removeEventListener === 'function') {
                mq.removeEventListener('change', onChange);
            } else if (typeof mq.removeListener === 'function') {
                mq.removeListener(onChange);
            }
        };
    }, []);

    const onMapInstance = useCallback(
        (map: ymaps.Map) => {
            if (!map) {
                console.warn('Map instance is null');
                return;
            }

            mapRef.current = map;

            setTimeout(() => {
                try {
                    if (!mapRef.current) return;

                    if (points.length > 1) {
                        const lats = points.map((p) => p.coords[0]);
                        const lngs = points.map((p) => p.coords[1]);

                        const padding = 0.01;
                        const bounds: [[number, number], [number, number]] = [
                            [Math.min(...lats) - padding, Math.min(...lngs) - padding],
                            [Math.max(...lats) + padding, Math.max(...lngs) + padding],
                        ];

                        try {
                            mapRef.current.setBounds(bounds, {
                                checkZoomRange: true,
                                // @ts-expect-error undocumented option
                                zoomMargin: 100,
                                duration: 500,
                            });
                        } catch (e) {
                            console.warn('Error setting bounds:', e);
                        }
                    } else if (points.length === 1) {
                        mapRef.current.setCenter(points[0].coords, 15, {
                            duration: 500,
                        });
                    }

                    try {
                        const ymapsBounds = mapRef.current.getBounds();
                        if (ymapsBounds) {
                            setBounds({
                                south: ymapsBounds[0][0],
                                west: ymapsBounds[0][1],
                                north: ymapsBounds[1][0],
                                east: ymapsBounds[1][1],
                            });
                        }
                        setZoom(mapRef.current.getZoom());

                        setUseMapApi(points.length === 0 || points.length > 100);
                    } catch (e) {
                        console.warn('Error getting initial bounds:', e);
                    }

                    mapRef.current.events.add('boundschange', () => {
                        if (!mapRef.current) return;

                        try {
                            const newBounds = mapRef.current.getBounds();
                            const nextBounds = newBounds
                                ? {
                                    south: newBounds[0][0],
                                    west: newBounds[0][1],
                                    north: newBounds[1][0],
                                    east: newBounds[1][1],
                                }
                                : null;
                            const nextZoom = mapRef.current.getZoom();

                            if (boundsDebounceRef.current) {
                                window.clearTimeout(boundsDebounceRef.current);
                            }
                            boundsDebounceRef.current = window.setTimeout(() => {
                                if (nextBounds && hasSignificantBoundsChange(boundsRef.current, nextBounds)) {
                                    setBounds(nextBounds);
                                }
                                setZoom(nextZoom);
                            }, MAP_BOUNDS_DEBOUNCE_MS);
                        } catch (e) {
                            console.warn('Error in boundschange:', e);
                        }
                    });
                } catch (e) {
                    console.error('Error initializing map:', e);
                }
            }, 300);
        },
        [points]
    );

    const getPriceMarkerOptions = useCallback(() => {
        const marker = createMarkerDataUri('цена');
        return {
            iconLayout: 'default#image',
            iconImageHref: marker.href,
            iconImageSize: marker.size,
            iconImageOffset: marker.offset,
            zIndex: 1000,
        } as const;
    }, []);

    const getMarkerByLabel = useCallback((label: string) => {
        const normalized = (label || 'цена').trim();
        const fromCache = markerCacheRef.current.get(normalized);
        if (fromCache) return fromCache;
        const created = createMarkerDataUri(normalized);
        markerCacheRef.current.set(normalized, created);
        if (markerCacheRef.current.size > 600) {
            markerCacheRef.current.clear();
            markerCacheRef.current.set(normalized, created);
        }
        return created;
    }, []);

    useEffect(() => {
        if (selectedProperty && selectedApiPointId) {
            const lat = toNum(selectedProperty.latitude);
            const lng = toNum(selectedProperty.longitude);

            if (lat !== null && lng !== null) {
                const point: Point = {
                    it: selectedProperty,
                    coords: [lat, lng],
                };

                setSelected(point);
                project(point.coords, setSelectPos);
            }

            setSelectedApiPointId(null);
        }
    }, [selectedProperty, selectedApiPointId, project]);

    const handleApiPointClick = useCallback(
        (propertyId: number, coords: [number, number]) => {
            setSelectedApiPointId(propertyId);

            project(coords, setSelectPos);

            setSelected(null);
        },
        [project]
    );

    useEffect(() => {
        setUseMapApi(Boolean(mapData?.features?.length));
    }, [mapData]);

    const handleClusterClick = useCallback((coords: [number, number]) => {
        if (!mapRef.current) return;

        const newZoom = Math.min(14, Math.max(mapRef.current.getZoom() + 2, 12));

        mapRef.current.setCenter(coords, newZoom, {
            duration: 500,
        });
    }, []);

    return (
        <div ref={wrapRef} className="relative rounded-[22px] overflow-hidden">
            <YMaps query={{apikey: process.env.NEXT_PUBLIC_YANDEX_MAPS_API_KEY}}>
                <Map
                    defaultState={{center: firstCenter, zoom: DEFAULT_ZOOM}}
                    width="100%"
                    height="100%"
                    instanceRef={onMapInstance}
                    modules={[
                        'control.ZoomControl',
                        'control.GeolocationControl',
                        'control.FullscreenControl',
                        'control.TypeSelector',
                    ]}
                    options={{suppressMapOpenBlock: true}}
                    // onClick={() => setHovered(null)}
                >
                    <ZoomControl
                        options={{size: 'large', position: {right: 16, top: 16}}}
                    />
                    <GeolocationControl options={{position: {right: 16, top: 280}}}/>
                    <FullscreenControl options={{position: {right: 16, top: 240}}}/>
                    <TypeSelector/>

                    {mapData && mapData?.features?.length > 0 && zoom <= 11 && (
                        <>
                            {mapData.features.map((feature) => {
                                const props = feature.property || feature.properties;
                                const isCluster = props && 'cluster' in props;

                                if (isCluster) {
                                    const clusterProps = props as MapClusterProperties;
                                    const label = getClusterFromLabel(clusterProps);
                                    const marker = getMarkerByLabel(label);
                                    return (
                                        <Placemark
                                            key={`cluster-${feature.geometry.coordinates[0]}-${feature.geometry.coordinates[1]}-${clusterProps.point_count}`}
                                            geometry={feature.geometry.coordinates}
                                            options={{
                                                iconLayout: 'default#image',
                                                iconImageHref: marker.href,
                                                iconImageSize: marker.size,
                                                iconImageOffset: marker.offset,
                                                zIndex: 1000,
                                            }}
                                            properties={{
                                                hintContent: `${clusterProps.point_count} объектов в этой зоне`,
                                            }}
                                            onClick={() =>
                                                handleClusterClick(feature.geometry.coordinates)
                                            }
                                        />
                                    );
                                }
                                return null;
                            })}
                        </>
                    )}

                    {mapData && mapData?.features?.length > 0 && zoom > 11 && (
                        <>
                            {mapData.features.map((feature) => {
                                const props = feature.property || feature.properties;
                                const isPoint = props && !('cluster' in props);

                                if (isPoint) {
                                    const pointProps = props as MapPointProperties;
                                    const label = getPointPriceLabel(pointProps);
                                    const marker = getMarkerByLabel(label);
                                    return (
                                        <Placemark
                                            key={`point-${pointProps.id}`}
                                            geometry={feature.geometry.coordinates}
                                            options={{
                                                iconLayout: 'default#image',
                                                iconImageHref: marker.href,
                                                iconImageSize: marker.size,
                                                iconImageOffset: marker.offset,
                                                zIndex: 1000,
                                            }}
                                            properties={{
                                                hintContent:
                                                    pointProps.title || `Объект №${pointProps.id}`,
                                            }}
                                            onClick={() =>
                                                handleApiPointClick(
                                                    pointProps.id,
                                                    feature.geometry.coordinates
                                                )
                                            }
                                        />
                                    );
                                }
                                return null;
                            })}
                        </>
                    )}

                    {!mapData?.features?.length && (
                        <>
                            {displayPoints.map((p) => {
                                const label = formatCompactPrice(p.it.price, p.it.currency) || 'цена';
                                const marker = getMarkerByLabel(label);
                                return (
                                    <Placemark
                                        key={String(p.it.id)}
                                        geometry={p.coords}
                                        options={{
                                            iconLayout: 'default#image',
                                            iconImageHref: marker.href,
                                            iconImageSize: marker.size,
                                            iconImageOffset: marker.offset,
                                            zIndex: 1000,
                                            hasHint: false,
                                            hasBalloon: false,
                                        }}
                                        properties={{
                                            hintContent: p.it.title || `Объект №${p.it.id}`,
                                        }}
                                        onClick={() => {
                                            setSelected(p);
                                            project(p.coords, setSelectPos);
                                        }}
                                    />
                                );
                            })}
                        </>
                    )}
                </Map>

                {isMapDataFetching && (
                    <div className="pointer-events-none absolute top-4 left-1/2 -translate-x-1/2 z-[5]">
                        <div className="inline-flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 shadow-md border border-gray-200 text-[#0036A5] text-sm font-medium">
                            <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#0A62FF] animate-pulse"/>
                            Обновляем объекты на карте...
                        </div>
                    </div>
                )}

                {/*{hovered &&*/}
                {/*  hoverPos &&*/}
                {/*  (!selected || selected.it.id !== hovered.it.id) &&*/}
                {/*  typeof document !== 'undefined' &&*/}
                {/*  createPortal(*/}
                {/*    <div*/}
                {/*      className="pointer-events-none fixed z-[2147483647] max-w-[360px]"*/}
                {/*      style={{ left: hoverPos.left, top: hoverPos.top }}*/}
                {/*    >*/}
                {/*      <div className="scale-[0.95] origin-bottom-left opacity-95">*/}
                {/*        <div className="pointer-events-none">*/}
                {/*          <BuyCard listing={hovered.it} user={user} />*/}
                {/*        </div>*/}
                {/*      </div>*/}
                {/*    </div>,*/}
                {/*    document.body*/}
                {/*  )}*/}

                {/* ВЫБОР объекта */}
                {selected &&
                    typeof document !== 'undefined' &&
                    (isMobile ? (
                        <BottomSheet
                            open={!!selected}
                            onClose={() => setSelected(null)}
                            initialHeight={600}
                            maxHeightPct={0.92}
                            showCloseButton
                            actions={
                                <div className="flex gap-8 w-full">
                                    {/*<button*/}
                                    {/*    type="button"*/}
                                    {/*    onClick={() => setSelected(null)}*/}
                                    {/*    className="flex-1 h-12 rounded-xl border border-neutral-300 font-medium"*/}
                                    {/*>*/}
                                    {/*  Закрыть*/}
                                    {/*</button>*/}

                                    <Link
                                        href={`/apartment/${selected.it.id}?source=${selected.it.__source === 'aura' ? 'aura' : 'local'}`}
                                        className="flex-1 h-12 inline-flex items-center justify-center gap-2 rounded-xl bg-[#0036A5] text-white font-semibold"
                                    >
                                        <Eye className="h-5 w-5"/>
                                        Посмотреть объект
                                    </Link>
                                </div>
                            }
                        >
                            <BuyCard listing={selected.it} user={user}/>
                        </BottomSheet>
                    ) : (
                        selectPos &&
                        createPortal(
                            <div
                                className="fixed z-[2147483647] max-w-[320px]"
                                style={{left: selectPos.left, top: selectPos.top}}
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="relative">
                                    <button
                                        onClick={() => setSelected(null)}
                                        className="absolute -right-2 -top-2 h-8 w-8 rounded-full bg-black/80 text-white text-sm"
                                        aria-label="Close"
                                    >
                                        ✕
                                    </button>
                                    <BuyCard listing={selected.it} user={user}/>
                                </div>
                            </div>,
                            document.body
                        )
                    ))
                }

                {isLoadingProperty &&
                    selectPos &&
                    typeof document !== 'undefined' &&
                    createPortal(
                        <div
                            className="fixed z-[2147483647] max-w-[320px]"
                            style={{left: selectPos.left, top: selectPos.top}}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="bg-white p-4 rounded-[12px] shadow-lg">
                                <div className="animate-pulse">
                                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                                </div>
                            </div>
                        </div>,
                        document.body
                    )}
            </YMaps>
        </div>
    );
};

export default BuyMap;

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

type BottomSheetProps = {
    open: boolean;
    onClose: () => void;
    children: ReactNode;
    initialHeight?: number; // px
    maxHeightPct?: number;  // 0..1
    showCloseButton?: boolean;
    actions?: ReactNode;
};

export function BottomSheet({
                                open,
                                onClose,
                                children,
                                initialHeight = 600,
                                maxHeightPct = 0.92,
                                showCloseButton = false,
                                actions,
                            }: BottomSheetProps) {
    useEffect(() => {
        if (!open) return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', onKey);
        return () => {
            document.body.style.overflow = prev;
            window.removeEventListener('keydown', onKey);
        };
    }, [open, onClose]);

    const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
    const maxH = Math.floor(vh * maxHeightPct);
    const targetH = clamp(initialHeight, Math.min(360, Math.floor(vh * 0.5)), maxH);

    const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        const dragged = info.offset.y;
        const velocity = info.velocity.y;
        if (dragged > 120 || velocity > 1000) onClose();
    };

    return (
        <AnimatePresence>
            {open && typeof document !== 'undefined' && (
                <>
                    {createPortal(
                        <motion.div
                            className="fixed inset-0 z-[2147483646] bg-black/40"
                            initial={{opacity: 0}}
                            animate={{opacity: 1}}
                            exit={{opacity: 0}}
                            onClick={onClose}
                        />,
                        document.body
                    )}

                    {createPortal(
                        <motion.div
                            className="fixed left-0 right-0 bottom-0 z-[2147483647] pointer-events-none"
                            initial={{y: '100%'}}
                            animate={{y: 0}}
                            exit={{y: '100%'}}
                            transition={{type: 'spring', stiffness: 280, damping: 30}}
                        >
                            <motion.div
                                role="dialog"
                                aria-modal="true"
                                className="pointer-events-auto mx-auto w-full max-w-[640px]"
                                style={{height: targetH}}
                                drag="y"
                                dragDirectionLock
                                dragConstraints={{top: 0, bottom: 0}}
                                onDragEnd={handleDragEnd}
                            >
                                <div className="relative rounded-t-2xl bg-white shadow-2xl h-full flex flex-col">
                                    {/* header */}
                                    <div className="flex items-center justify-center pt-2 pb-1 relative">
                                        <div className="h-1.5 w-12 rounded-full bg-neutral-300"/>
                                        {showCloseButton && (
                                            <button
                                                type="button"
                                                aria-label="Закрыть"
                                                onClick={onClose}
                                                className="absolute right-2 top-2 inline-flex h-9 w-9 items-center justify-center rounded-full bg-neutral-100"
                                            >
                                                <X className="h-5 w-5"/>
                                            </button>
                                        )}
                                    </div>

                                    {/* content */}
                                    <div className="px-3 pb-3 overflow-y-auto flex-1">
                                        {children}
                                        {/* запас под футер, чтобы контент не перекрывался */}
                                        {actions ? <div className="h-6"/> : null}
                                    </div>

                                    {/* footer actions */}
                                    {actions && (
                                        <div
                                            className="sticky bottom-0 left-0 right-0 px-3 pb-[max(16px,env(safe-area-inset-bottom))] pt-3 bg-white border-t border-neutral-200"
                                        >
                                            {actions}
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        </motion.div>,
                        document.body
                    )}
                </>
            )}
        </AnimatePresence>
    );
}
