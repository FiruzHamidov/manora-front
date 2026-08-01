'use client';

import {FC, useCallback, useEffect, useRef, useState} from 'react';
import Link from 'next/link';
import useEmblaCarousel from 'embla-carousel-react';
import FallbackImage from '@/app/_components/FallbackImage';
import LocationIcon from '@/icons/LocationIcon';
import FavoriteButton from '@/ui-components/favorite-button/favorite-button';

import {Property, PropertyPhoto,} from '@/services/properties/types';
import {resolveMediaUrl} from '@/constants/base-url';
import {User} from '@/services/login/types';
import ModerationModal from '@/app/_components/moderation-modal';
import {isListingModeratorRole, normalizeRoleSlug, RoleSlug} from '@/constants/roles';
import {
    Building,
    Calendar1Icon,
    CarFront,
    Eye,
    Fuel,
    Gauge,
    Pencil,
    Settings2,
} from "lucide-react";
import {PublicationRefreshControl} from '@/ui-components/PublicationRefreshControl';
import {getPublicationDate} from '@/services/publication-refresh/helpers';
import type {PublicationListingKind} from '@/services/publication-refresh/types';

interface BuyCardProps {
    listing: Property;
    user?: User | null;
    isLarge?: boolean;
    isEditRoute?: boolean;
    isForClient?: boolean;
}

const BuyCard: FC<BuyCardProps> = ({listing, user, isLarge = false, isEditRoute = false, isForClient = false}) => {
    const formattedPrice = Number(listing.price).toLocaleString('ru-RU');
    const isTransport = listing.type?.slug === 'transport';
    const transportListing = listing as Property & {
        category?: { name?: string };
        brand?: { name?: string };
        model?: { name?: string };
        year?: number | string;
        mileage?: number | string;
        fuel_type?: string;
        transmission?: string;
        drive_type?: string;
        condition?: string;
    };

    const [emblaRef, emblaApi] = useEmblaCarousel({loop: true});
    const [selectedIndex, setSelectedIndex] = useState(0);

    const hoverCooldownRef = useRef<number>(0);
    const HOVER_COOLDOWN_MS = 220; // milliseconds between allowed auto-steps

    // Optional small dwell to avoid accidental flicks
    const hoverDwellRef = useRef<number | null>(null);
    const HOVER_DWELL_MS = 90;

    // lock to prevent issuing another hover-driven step until embla finished moving
    const hoverLockedRef = useRef<boolean>(false);

    const handleHoverMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!emblaApi || displayImages.length <= 1) return;
        // if a hover-driven step is already in progress (embla hasn't settled), ignore
        if (hoverLockedRef.current) return;

        const el = e.currentTarget as HTMLDivElement;
        const rect = el.getBoundingClientRect();
        const x = e.clientX - rect.left;

        // divide the container into N equal pixel zones (N = number of visible slides)
        const zones = displayImages.length;
        const zoneWidth = rect.width / Math.max(1, zones);
        // compute the zone index under cursor
        let zoneIndex = Math.floor(x / zoneWidth);
        if (zoneIndex < 0) zoneIndex = 0;
        if (zoneIndex > zones - 1) zoneIndex = zones - 1;

        // if the cursor is in the same zone as the currently selected slide, do nothing
        if (zoneIndex === selectedIndex) {
            // clear any scheduled dwell
            if (hoverDwellRef.current) {
                window.clearTimeout(hoverDwellRef.current as number);
                hoverDwellRef.current = null;
            }
            return;
        }

        // determine direction: move only one step toward the zone
        const direction = zoneIndex > selectedIndex ? 1 : -1;
        const targetIndex = selectedIndex + direction;
        if (targetIndex < 0 || targetIndex > displayImages.length - 1) return;

        const now = Date.now();
        // if cooldown passed, issue a single step immediately and lock
        if (now - hoverCooldownRef.current >= HOVER_COOLDOWN_MS) {
            hoverLockedRef.current = true;
            scrollTo(targetIndex);
            hoverCooldownRef.current = now;
            if (hoverDwellRef.current) {
                window.clearTimeout(hoverDwellRef.current as number);
                hoverDwellRef.current = null;
            }
            return;
        }

        // otherwise schedule a short dwell-triggered single step (if not already scheduled)
        if (hoverDwellRef.current) return;
        hoverLockedRef.current = true; // lock to avoid duplicates
        hoverDwellRef.current = window.setTimeout(() => {
            scrollTo(targetIndex);
            hoverCooldownRef.current = Date.now();
            hoverDwellRef.current = null;
        }, HOVER_DWELL_MS) as unknown as number;
    };

    const handleHoverLeave = () => {
        if (hoverDwellRef.current) {
            window.clearTimeout(hoverDwellRef.current as number);
            hoverDwellRef.current = null;
        }
        hoverCooldownRef.current = 0;
        hoverLockedRef.current = false;
    };

    const [isModalOpen, setIsModalOpen] = useState(false);

    const role = normalizeRoleSlug(user?.role?.slug);
    const [publicationDates, setPublicationDates] = useState({
        publishedAt: listing.published_at ?? null,
        expiresAt: listing.publication_expires_at ?? null,
    });

    useEffect(() => {
        setPublicationDates({
            publishedAt: listing.published_at ?? null,
            expiresAt: listing.publication_expires_at ?? null,
        });
    }, [listing.published_at, listing.publication_expires_at]);

    const canModerate = isListingModeratorRole(role);

    const scrollTo = useCallback(
        (index: number) => emblaApi && emblaApi.scrollTo(index),
        [emblaApi]
    );

    const onSelect = useCallback(() => {
        if (!emblaApi) return;
        setSelectedIndex(emblaApi.selectedScrollSnap());
        // embla finished selecting a snap; allow next hover-driven step
        hoverLockedRef.current = false;
    }, [emblaApi]);

    useEffect(() => {
        if (!emblaApi) return;
        emblaApi.on('select', onSelect);
        onSelect();
        return () => {
            emblaApi.off('select', onSelect);
        };
    }, [emblaApi, onSelect]);

    const rawImages =
        listing.photos && listing.photos.length > 0
            ? listing.photos.map((photo: PropertyPhoto & { path?: string; url?: string }, index: number) => ({
                url: resolveMediaUrl(
                    photo.file_path || photo.path || photo.url,
                    '/images/no-image.png',
                    listing.__source === 'aura' ? 'aura' : 'local'
                ),
                alt: `Фото ${listing.title || 'объявления'} ${index + 1}`,
            }))
            : [{url: '/images/no-image.png', alt: 'Нет фото'}];

    const totalImages = rawImages.length;
    const maxShown = 6;
    const shownImages = rawImages.slice(0, maxShown);
    const extraImages = Math.max(0, totalImages - maxShown);
    const displayImages = shownImages;

    const getKindName = (l: Property) => {
        const slug = l.type?.slug;

        switch (slug) {
            case 'transport':
                return l.title || 'автомобиль';
            case 'commercial':
                return 'Коммерческое помещение';
            case 'land-plots':
                return 'Земельный участок';
            case 'houses':
                return 'дом'; // при желании можно развести на коттедж/таунхаус по отдельному полю
            case 'parking':
                return 'парковка';
            // квартиры идут в двух категориях: secondary и new-buildings
            case 'secondary':
            case 'new-buildings':
            default:
                // если есть уточнение типа квартиры — используем его
                return l.apartment_type || 'квартира';
        }
    };

    const buildTitle = (l: Property) => {
        const kind = getKindName(l);
        const slug = l.type?.slug;

        if (slug === 'commercial') {
            // комнаты не показываем, фокус на площади/этаже
            return `${kind}${l.total_area ? `, ${l.total_area} м²` : ''}${
                l.floor ? `, ${l.floor}/${l.total_floors} этаж` : ''
            }`;
        }

        if (slug === 'land-plots') {
            // для участка чаще показывают площадь (если есть поле под сотки — подставь его)
            return `${kind}${l.land_size ? `, ${l.land_size} соток` : ''}`;
        }

        if (slug === 'houses') {
            // для домов комнатность опционально
            return `${l.rooms ? `${l.rooms} комн. ` : ''}${kind}${
                l.land_size ? `, ${l.land_size} соток` : ''
            }${l.floor ? `, ${l.floor}/${l.total_floors} этаж` : ''}`;
        }

        if (slug === 'parking') {
            return kind; // можно добавить «подземная/наземная» по отдельному полю, если появится
        }

        if (slug === 'transport') {
            return kind;
        }

        // квартиры: secondary / new-buildings (или дефолт)
        return `${l.rooms ? `${l.rooms} комн. ` : ''}${kind}${
            l.floor ? `, ${l.floor}/${l.total_floors} этаж` : ''
        }${l.total_area ? `, ${l.total_area} м²` : ''}`;
    };

    const displayTitle = buildTitle(listing);

    const displayLocation =
        typeof listing.location === 'object'
            ? listing.location?.city || 'не указано'
            : listing.location || 'не указано';

    // const displayRooms = listing.rooms || 'не указано';
    // const displayArea = listing.total_area || 0;
    // const displayFloorInfo =
    //     listing.floor && listing.total_floors ? `${listing.floor}/${listing.total_floors} этаж` : 'Этаж не указан';
    const displayCurrency =
        isTransport ? 'с.' : listing.currency === 'TJS' ? 'с.' : listing.currency || 'с.';
    const source = listing.__source === 'aura' ? 'aura' : 'local';
    const transportMeta = [
        {
            icon: <CarFront className="h-4 w-4 text-[#006341]"/>,
            label: transportListing.category?.name || 'Автомобиль',
        },
        {
            icon: <Calendar1Icon className="h-4 w-4 text-[#006341]"/>,
            label: transportListing.year ? String(transportListing.year) : 'Год не указан',
        },
        {
            icon: <Gauge className="h-4 w-4 text-[#006341]"/>,
            label: transportListing.mileage
                ? `${Number(transportListing.mileage).toLocaleString('ru-RU')} км`
                : 'Пробег не указан',
        },
        {
            icon: <Fuel className="h-4 w-4 text-[#006341]"/>,
            label: transportListing.fuel_type === 'petrol'
                ? 'Бензин'
                : transportListing.fuel_type === 'diesel'
                    ? 'Дизель'
                    : transportListing.fuel_type === 'hybrid'
                        ? 'Гибрид'
                        : transportListing.fuel_type === 'electric'
                            ? 'Электро'
                            : transportListing.fuel_type === 'gas'
                                ? 'Газ'
                                : transportListing.fuel_type === 'other'
                                    ? 'Другое'
                                    : 'Топливо не указано',
        },
        {
            icon: <Settings2 className="h-4 w-4 text-[#006341]"/>,
            label: transportListing.transmission === 'manual'
                ? 'Механика'
                : transportListing.transmission === 'automatic'
                    ? 'Автомат'
                    : transportListing.transmission === 'robot'
                        ? 'Робот'
                        : transportListing.transmission === 'variator'
                            ? 'Вариатор'
                            : 'КПП не указана',
        },
        {
            icon: <Settings2 className="h-4 w-4 text-[#006341]"/>,
            label: transportListing.drive_type === 'front'
                ? 'Передний привод'
                : transportListing.drive_type === 'rear'
                    ? 'Задний привод'
                    : transportListing.drive_type === 'all_wheel'
                        ? 'Полный привод'
                        : 'Привод не указан',
        },
    ];

    const listingHref = isEditRoute
        ? `/profile/edit-post/${listing.id}`
        : listing.type?.slug === 'transport'
            ? `/cars/${listing.id}?source=${source}`
            : `/apartment/${listing.id}?source=${source}`;
    const isApproved = listing.moderation_status === 'approved';
    const isActualOwner = Boolean(
        user?.id && Number(listing.created_by) === Number(user.id)
    );
    const canManageOwnPublication = isEditRoute && source === 'local' && isActualOwner;
    const showRefreshPublication = canManageOwnPublication && isApproved;
    const publicationKind: PublicationListingKind =
        listing.__entity === 'car' || isTransport ? 'car' : 'property';
    const publicationDate = getPublicationDate(
        publicationDates.publishedAt,
        listing.created_at
    );
    const publicationDateLabel = publicationDate.value
        ? new Date(publicationDate.value).toLocaleDateString('ru-RU')
        : undefined;
    const moderationPresentation = {
        pending: {
            label: 'На проверке',
            className: 'border-[#F6D68A] bg-[#FFF8E6] text-[#8A5B00]',
        },
        approved: {
            label: 'Опубликовано',
            className: 'border-[#B8DEC9] bg-[#ECF8F1] text-[#08754F]',
        },
        rejected: {
            label: 'Нужно исправить',
            className: 'border-[#F2B8BE] bg-[#FFF1F2] text-[#B42332]',
        },
        denied: {
            label: 'Отклонено',
            className: 'border-[#F2B8BE] bg-[#FFF1F2] text-[#B42332]',
        },
        draft: {
            label: 'Черновик',
            className: 'border-[#D7DEE8] bg-[#F4F6F8] text-[#596579]',
        },
    }[listing.moderation_status ?? ''];
    const moderationComment = listing.status_comment || listing.rejection_comment;

    return (
        <div
            className="bg-white rounded-xl overflow-hidden flex flex-col h-full hover:shadow-sm transition-shadow duration-200 p-4 min-w-[312px]">
            <div className="relative mb-3 -mx-4 -mt-4">
                {isEditRoute && moderationPresentation ? (
                    <span
                        className={`absolute left-3 top-3 z-10 rounded-full border px-3 py-1 text-xs font-bold shadow-sm ${moderationPresentation.className}`}
                    >
                        {moderationPresentation.label}
                    </span>
                ) : null}
                <div className="overflow-hidden rounded-lg" ref={emblaRef} onMouseMove={handleHoverMove}
                     onMouseLeave={handleHoverLeave}>
                    <div className="flex">
                        {displayImages.map((image, index) => (
                            <div className="min-w-full relative" key={index}>
                                <Link
                                    href={listingHref}
                                    onClick={(e) => isModalOpen && e.preventDefault()}
                                >
                                    <FallbackImage
                                        src={image.url}
                                        alt={image.alt}
                                        width={600}
                                        height={400}
                                        className="w-full object-cover aspect-[4/3] bg-gray-100"
                                    />

                                    {(index === 5 && extraImages > 0) && (
                                        <div
                                            className="absolute right-0 top-0 flex w-full h-full bg-black/50 justify-center items-center">
                                            {extraImages > 0 && (
                                                <span
                                                    className="text-[32px] font-semibold items-center justify-center flex text-xs font-bold px-[18px] py-1 rounded-full text-white/90">Еще {extraImages} фото</span>
                                            )}
                                        </div>
                                    )}
                                </Link>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="absolute top-2 md:top-[22px] right-2 md:right-[22px] flex flex-col space-y-2">
                    <FavoriteButton
                        propertyId={listing.id}
                        source={source}
                        className="bg-white/30 flex items-center justify-center cursor-pointer p-2 rounded-full shadow transition w-9 h-9 hover:bg-white/70"
                    />

                    {canModerate && (
                        <div
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setIsModalOpen(true);
                            }}
                            className="bg-white/30 flex items-center justify-center cursor-pointer p-2 rounded-full shadow transition w-9 h-9 hover:bg-white/70"
                            role="button"
                            aria-label="Открыть модерацию"
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                <path
                                    d="M12 20H21"
                                    stroke="#006341"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                                <path
                                    d="M16.5 3.5C16.8978 3.10218 17.4374 2.87868 18 2.87868C18.2786 2.87868 18.5544 2.93355 18.8118 3.04016C19.0692 3.14676 19.303 3.30301 19.5 3.5C19.697 3.69699 19.8532 3.9308 19.9598 4.18819C20.0665 4.44558 20.1213 4.72142 20.1213 5C20.1213 5.27858 20.0665 5.55442 19.9598 5.81181C19.8532 6.0692 19.697 6.30301 19.5 6.5L7 19L3 20L4 16L16.5 3.5Z"
                                    stroke="#006341"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                        </div>
                    )}

                    {isEditRoute && (
                        <Link href={listingHref}
                              className='bg-white/30 flex items-center justify-center cursor-pointer p-2 rounded-full shadow transition w-9 h-9 hover:bg-white/70'>
                            <Eye color="#006341"/>
                        </Link>
                    )}
                </div>

                <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex space-x-1.5">
                    {displayImages.map((_, index) => (
                        <button
                            key={index}
                            className={`block w-2 h-2 bg-white rounded-full ${
                                index === selectedIndex ? 'opacity-90' : 'opacity-50'
                            }`}
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                scrollTo(index);
                            }}
                            aria-label={`Go to slide ${index + 1}`}
                        />
                    ))}
                </div>
            </div>

            <div className="flex flex-col flex-grow ">
                <div className="flex justify-between items-center mb-3">
                    <Link
                        className="transition-transform duration-200 hover:scale-105"
                        href={listingHref}
                        onClick={(e) => isModalOpen && e.preventDefault()}
                    >
            <span className="font-bold text-[#006341] text-2xl ">
              {formattedPrice} {displayCurrency}
            </span>
                    </Link>
                    <div className="flex items-center text-xs text-[#666F8D] bg-[#EFF6FF] px-2 py-1 rounded-full">
                        <LocationIcon className="mr-1 w-[18px] h-[18px]"/>
                        {displayLocation}
                    </div>
                </div>
                    <Link
                    href={listingHref}
                    onClick={(e) => isModalOpen && e.preventDefault()}
                >
                    <h3
                        className={`font-semibold text-base mb-2  ${
                            isLarge ? 'lg:text-lg' : ''
                        }`}
                    >
                        {displayTitle}
                    </h3>
                </Link>

                {isTransport ? (
                    <div className="mb-2 grid grid-cols-2 gap-2">
                        {transportMeta.map((item) => (
                            <div
                                key={item.label}
                                className="flex items-center gap-2 rounded-xl bg-[#F8FAFC] px-3 py-2 text-xs text-[#475569]"
                            >
                                {item.icon}
                                <span className="line-clamp-1">{item.label}</span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <>
                        <div className="flex items-center space-x-3 text-sm text-[#666F8D] mb-2">
                            <LocationIcon className="mr-1 w-[18px] h-[18px] min-w-[18px]"/>
                            <div className="relative min-w-0 group/address">
                                <span className="block truncate" title={`${listing.address || ''} ${listing.landmark ? `(${listing.landmark})` : ''}`.trim()}>
                                    {listing.address} {listing.landmark && `(${listing.landmark})`}
                                </span>
                                <div className="pointer-events-none absolute left-0 top-full z-20 mt-1 hidden max-w-[320px] rounded-md bg-[#0F172A] px-2 py-1 text-xs text-white shadow-lg md:group-hover/address:block">
                                    {listing.address} {listing.landmark && `(${listing.landmark})`}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center space-x-3 text-sm text-[#666F8D] mb-2">
                            <Building className="mr-1 mt-1 w-[18px] h-[18px] min-w-[18px]"/>
                            <span className='mt-1'>
                                {listing.type?.name}
                            </span>
                        </div>
                    </>
                )}

                {publicationDateLabel ? (
                    <div className="mb-2 flex items-center gap-2 text-xs text-[#667085]">
                        <Calendar1Icon className="h-4 w-4 text-[#006341]"/>
                        <span>
                            {publicationDate.label} {publicationDateLabel}
                        </span>
                    </div>
                ) : null}

                {canManageOwnPublication && (
                    <div className="mb-2 rounded-xl border border-[#D9E2F2] bg-[#F8FBFF] p-3">
                        <div className="text-xs text-[#2D3A5A]">
                            {isApproved ? (
                                <>Управление активной публикацией</>
                            ) : (
                                <>Обновление доступно после одобрения модератором</>
                            )}
                        </div>
                        {showRefreshPublication && (
                            <>
                                <Link
                                    href={listingHref}
                                    className="mt-2 inline-flex min-h-9 w-full items-center justify-center gap-2 rounded-lg border border-[#B9CBC3] bg-white px-3 py-2 text-xs font-semibold text-[#006341] hover:bg-[#F2F8F5]"
                                >
                                    <Pencil className="h-3.5 w-3.5"/>
                                    Редактировать
                                </Link>
                                <PublicationRefreshControl
                                    kind={publicationKind}
                                    listing={{
                                        ...listing,
                                        published_at: publicationDates.publishedAt,
                                        publication_expires_at: publicationDates.expiresAt,
                                    }}
                                    onUpdated={(updated) => {
                                        setPublicationDates({
                                            publishedAt: updated.published_at ?? null,
                                            expiresAt: updated.publication_expires_at ?? null,
                                        });
                                    }}
                                />
                            </>
                        )}
                    </div>
                )}

                {canManageOwnPublication &&
                ['rejected', 'denied'].includes(listing.moderation_status ?? '') &&
                moderationComment ? (
                    <div className="mb-2 rounded-xl border border-[#F2B8BE] bg-[#FFF6F7] p-3">
                        <div className="text-xs font-bold text-[#A51D2D]">Комментарий модератора</div>
                        <p className="mt-1 line-clamp-3 text-xs leading-5 text-[#7A3540]">
                            {moderationComment.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()}
                        </p>
                        <Link
                            href={listingHref}
                            className="mt-2 inline-flex text-xs font-bold text-[#006341]"
                        >
                            Исправить объявление
                        </Link>
                    </div>
                ) : null}

            </div>

            {isModalOpen && role !== 'guest' && (
                <ModerationModal
                    property={listing}
                    onClose={() => setIsModalOpen(false)}
                    onUpdated={(updated) => {
                        Object.assign(listing, updated);
                    }}
                    userRole={role as RoleSlug}
                />
            )}
        </div>
    );
};

export default BuyCard;
