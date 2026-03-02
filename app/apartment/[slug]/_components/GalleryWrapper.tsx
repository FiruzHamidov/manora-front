'use client';
import {useEffect, useRef, useState} from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {Map, Placemark, YMaps} from '@pbe/react-yandex-maps';
import {Property} from '@/services/properties/types';
import {useProfile} from '@/services/login/hooks';
import MortgageCalculator from '../_components/MortgageCalculator';
import PhotoGalleryModal from '@/ui-components/PhotoGalleryModal';
import SmoothGalleryImage from '@/ui-components/SmoothGalleryImage';
import {
    ChevronDown,
    ChevronUp,
    Bath,
    Building2,
    Calendar1Icon,
    CopyIcon, Download,
    EyeIcon,
    Flame,
    Grid2X2Check,
    Hammer,
    HistoryIcon,
    Home,
    MapPin,
    ParkingSquare, PhoneCallIcon, PhoneIcon,
    Pickaxe,
    Ruler,
    MessageCircle,
    Send,
    Share2,
} from 'lucide-react';
import {axios} from '@/utils/axios';
import {AxiosError} from 'axios';

import {toast} from 'react-toastify';
import AdBanner from "@/app/apartment/[slug]/_components/AdBanner";
import {resolveMediaUrl} from "@/constants/base-url";
import UserIcon from "@/icons/UserIcon";
import TelegramNoBgIcon from "@/icons/TelegramNoBgIcon";
import WhatsAppNoBgIcon from "@/icons/WhatsappNoBgIcon";
import BuyCard from "@/app/_components/buy/buy-card";
import {isListingModeratorRole} from '@/constants/roles';
import {getContactRoleLabel} from '@/utils/contactRoleLabel';
import FavoriteButton from '@/ui-components/favorite-button/favorite-button';


interface Props {
    apartment: Property;
    photos: string[];
}

export default function GalleryWrapper({apartment, photos}: Props) {
    const {data: user} = useProfile();

    const userRole = user?.role?.slug;
    const isAdminUser = isListingModeratorRole(userRole);
    const isAgentUser = userRole === 'agent';
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isShareMenuOpen, setIsShareMenuOpen] = useState(false);
    const [isPhoneRevealed, setIsPhoneRevealed] = useState(false);
    const [isSendingPhoneReveal, setIsSendingPhoneReveal] = useState(false);
    const shareMenuRef = useRef<HTMLDivElement | null>(null);

    const openModal = (index?: number) => {
        if (index !== undefined) setSelectedIndex(index);
        setIsModalOpen(true);
    };
    const closeModal = () => setIsModalOpen(false);

    // helper: форматирование телефона в +992 XXX XX XX XX и чистый +992XXXXXXXXX
    const formatPhone = (rawPhone?: string | null) => {
        const rp = rawPhone ?? '';
        let cleanPhone = rp.replace(/[^\d+]/g, '');
        let digits = rp.replace(/\D/g, '');

        if (digits.startsWith('992')) {
            digits = digits.slice(3);
        }

        const formatted = digits.replace(
            /^(\d{3})(\d{2})(\d{2})(\d{2})$/,
            '$1 $2 $3 $4'
        );
        let display = formatted || rp;

        if (!cleanPhone.startsWith('+992')) {
            // если в raw нет +992 — добавим для ссылки
            cleanPhone = `+992${digits}`;
            if (formatted) display = `+992 ${formatted}`;
        }

        return {cleanPhone, display};
    };

    // creator phone (раньше был inline) — оставляем, но теперь через helper
    const creatorPhoneData = formatPhone(apartment.creator?.phone ?? '');
    const creatorCleanPhone = creatorPhoneData.cleanPhone;
    const creatorDisplayPhone = creatorPhoneData.display;
    const contactRoleLabel = getContactRoleLabel(apartment);

    const [coordinates] = useState<[number, number] | null>(
        apartment.latitude && apartment.longitude
            ? [parseFloat(apartment.latitude), parseFloat(apartment.longitude)]
            : null
    );

    // --- similar properties (fetched from backend) ---
    const [similarProperties, setSimilarProperties] = useState<Property[]>([]);
    const [loadingSimilar, setLoadingSimilar] = useState(false);

    useEffect(() => {
        let mounted = true;
        const loadSimilar = async () => {
            if (!apartment?.id) return;
            setLoadingSimilar(true);
            try {
                const {data} = await axios.get(`/properties/${apartment.id}/similar`);
                if (mounted && Array.isArray(data)) {
                    setSimilarProperties(data);
                }
            } catch (err) {
                console.error('Load similar properties error', err);
            } finally {
                if (mounted) setLoadingSimilar(false);
            }
        };

        loadSimilar();
        return () => {
            mounted = false;
        };
    }, [apartment.id]);

    const handleCopyLink = async () => {
        try {
            const url =
                typeof window !== 'undefined'
                    ? window.location.href
                    : `https://manora.tj/apartment/${apartment.id}`;

            await navigator.clipboard.writeText(url);
            toast.success('Ссылка скопирована успешно!', {
                position: 'top-center',
                autoClose: 2000,
                hideProgressBar: true,
                closeOnClick: true,
                pauseOnHover: false,
                draggable: false,
                theme: 'colored',
            });
        } catch {
            toast.error('Не удалось скопировать ссылку', {
                position: 'top-center',
                autoClose: 2000,
                hideProgressBar: true,
                theme: 'colored',
            });
        }
    };

    useEffect(() => {
        const controller = new AbortController();

        const sendView = async () => {
            try {
                await axios.post(
                    `/properties/${apartment.id}/view`,
                    {},
                    {signal: controller.signal}
                );
            } catch (e) {
                const error = e as AxiosError<{
                    message?: string;
                    errors?: Record<string, string[]>;
                }>;
            }
        };

        sendView();

        return () => controller.abort();
    }, [apartment.id]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (shareMenuRef.current && !shareMenuRef.current.contains(event.target as Node)) {
                setIsShareMenuOpen(false);
            }
        };

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setIsShareMenuOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEscape);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    }, []);


    const mapRef = useRef(undefined);
    const ymapsRef = useRef(null);

    const canEdit =
        isAdminUser ||
        (apartment.creator &&
            (user?.id === apartment.creator.id ||
                (apartment.agent_id && user?.id === apartment.agent_id)));

    // === Нормализация типа под человеко-понятное имя ===
    const getKindName = (p: Property) => {
        const slug = p.type?.slug;
        switch (slug) {
            case 'commercial':
                return 'Коммерческое помещение';
            case 'land-plots':
                return 'Земельный участок';
            case 'houses':
                return 'дом';
            case 'parking':
                return 'Парковка';
            case 'secondary':
            case 'new-buildings':
            default:
                return p.apartment_type || 'квартира';
        }
    };

    // короткие генераторы кусков
    const areaLabel = (p: Property) => (p.total_area ? `${p.total_area} м²` : '');
    const floorLabel = (p: Property) => (p.floor ? `${p.floor} этаж` : '');
    const roomsLabel = (p: Property) => (p.rooms ? `${p.rooms} комн.` : '');
    const getDealLabel = (p: Property) => (p.offer_type === 'rent' ? 'Сдается' : 'Продается');

    // === Итоговый TITLE без адреса (адрес добавим в JSX) ===
    const buildPageTitle = (p: Property) => {
        const kind = getKindName(p);
        const slug = p.type?.slug;

        if (slug === 'commercial') {
            // для коммерции не показываем "комнат", фокус на площади и этаже
            return [kind, areaLabel(p), floorLabel(p)].filter(Boolean).join(', ');
        }
        if (slug === 'land-plots') {
            return [kind, areaLabel(p)].filter(Boolean).join(', ');
        }
        if (slug === 'houses') {
            return [roomsLabel(p), kind, areaLabel(p), floorLabel(p)]
                .filter(Boolean)
                .join(', ');
        }
        if (slug === 'parking') {
            return kind;
        }
        // квартиры: secondary/new-buildings (и дефолт)
        return [roomsLabel(p), kind, floorLabel(p), areaLabel(p)]
            .filter(Boolean)
            .join(', ');
    };

    // Подпись к типу в характеристиках
    const typeFieldLabel = (p: Property) =>
        'Тип объекта';

    const heroTitle = `${getDealLabel(apartment)} ${buildPageTitle(apartment)}`;
    const currentShareUrl =
        typeof window !== 'undefined'
            ? window.location.href
            : `https://www.manora.tj/apartment/${apartment.id}`;
    const telegramShareUrl = `https://t.me/share/url?url=${encodeURIComponent(currentShareUrl)}&text=${encodeURIComponent(heroTitle)}`;
    const whatsappShareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(`${heroTitle} - ${currentShareUrl}`)}`;
    const infoCards = [
        {
            icon: <Ruler size={18} className="text-[#0036A5]"/>,
            value: apartment.total_area ? `${apartment.total_area} м²` : '-',
            label: 'Площадь объекта',
        },
        {
            icon: <Home size={18} className="text-[#0036A5]"/>,
            value: apartment.living_area ? `${apartment.living_area} м²` : '-',
            label: 'Жилая площадь',
        },
        {
            icon: <Building2 size={18} className="text-[#0036A5]"/>,
            value: apartment.floor
                ? apartment.total_floors
                    ? `${apartment.floor} из ${apartment.total_floors}`
                    : apartment.floor
                : '-',
            label: 'Этаж',
        },
        {
            icon: <Bath size={18} className="text-[#0036A5]"/>,
            value: apartment.bathroom_count ? String(apartment.bathroom_count) : '-',
            label: 'Санузел',
        },
    ];

    function timeAgo(date: Date) {
        const diff = Date.now() - date.getTime();
        const minutes = Math.floor(diff / 60000);
        if (minutes < 1) return 'только что';
        if (minutes < 60) return `${minutes} мин назад`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours} ч назад`;
        const days = Math.floor(hours / 24);
        return `${days} дней назад`;
    }

    const handleDownloadPhoto = async (url: string, index: number) => {
        try {
            const response = await fetch(url, { mode: 'cors' });
            const blob = await response.blob();

            const blobUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');

            link.href = blobUrl;
            link.download = `photo_${index + 1}.jpg`;
            document.body.appendChild(link);
            link.click();

            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);
        } catch (e) {
            console.error('Ошибка скачивания', e);
        }
    };

    const isAuthorizedForDownload =
        isAdminUser || isAgentUser;

    const trackPhoneReveal = async (device: 'mobile' | 'desktop') => {
        try {
            await axios.post(`/properties/${apartment.id}/reveal-phone`, {
                device,
                source: apartment.__source ?? 'local',
            });
        } catch (error) {
            console.error('Reveal phone tracking error', error);
        }
    };

    const handleRevealPhone = async () => {
        if (!creatorCleanPhone || isSendingPhoneReveal) return;

        const isMobileDevice =
            typeof window !== 'undefined' &&
            window.matchMedia('(max-width: 767px)').matches;

        setIsSendingPhoneReveal(true);
        await trackPhoneReveal(isMobileDevice ? 'mobile' : 'desktop');
        setIsSendingPhoneReveal(false);
        setIsPhoneRevealed(true);

        if (isMobileDevice) {
            window.location.href = `tel:${creatorCleanPhone}`;
        }
    };

    return (
        <>
            <div className="mx-auto w-full max-w-[1520px] px-4 sm:px-6 lg:px-8 pt-6 pb-12">
                <div className="rounded-[28px] bg-[#F3F4F6]">
                <div className="flex flex-col lg:flex-row gap-5">
                    {/* Левая часть */}
                    <div className="lg:w-3/4">
                        <div className="bg-white rounded-[22px] md:p-6 p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                            <div className="flex flex-col gap-4 mb-5">
                                <div>
                                    <h1 className="text-xl leading-tight md:text-[32px] md:leading-[1.15] font-bold text-[#111827]">
                                        {heroTitle}
                                        {apartment.address ? `, ${apartment.address}` : ''}
                                    </h1>
                                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm md:text-base text-[#667085]">
                                        <div className="flex items-center gap-1.5">
                                            <MapPin size={16} className="text-[#0036A5]"/>
                                            <span>
                                                {apartment.location?.city || 'Душанбе'}
                                                {apartment.district ? `, район ${apartment.district}` : ''}
                                            </span>
                                        </div>
                                        <div className="flex gap-1.5 items-center">
                                            <Calendar1Icon className='w-4 h-4'/>
                                            {(() => {
                                                const d = new Date(apartment.created_at);
                                                const full = d.toLocaleString('ru-RU', {
                                                    year: 'numeric', month: 'long', day: '2-digit',
                                                    hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Dushanbe'
                                                });
                                                return (
                                                    <time dateTime={apartment.created_at} title={full}>
                                                        {timeAgo(d)}
                                                    </time>
                                                );
                                            })()}
                                        </div>
                                        <div>Номер объявления: {apartment.id}</div>
                                        <div className="flex gap-1.5 items-center">
                                            <EyeIcon className="w-4 h-4"/>
                                            {apartment.views_count ?? 0}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Галерея */}
                            {photos.length > 0 && (
                                <div className="mb-6">
                                    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_108px] gap-3">
                                        <div className="relative">
                                            <div
                                                className="relative w-full aspect-[16/10] rounded-[20px] overflow-hidden bg-gray-100 cursor-pointer"
                                                onClick={() => openModal(selectedIndex)}
                                                title="Нажмите для увеличения"
                                            >
                                                <div className="absolute inset-0">
                                                    <SmoothGalleryImage
                                                        src={photos[selectedIndex]}
                                                        alt={`Фото ${selectedIndex + 1}`}
                                                        className="object-cover"
                                                        sizes="(max-width: 1024px) 100vw, 900px"
                                                        priority
                                                    />
                                                </div>

                                                {isAuthorizedForDownload && (
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDownloadPhoto(photos[selectedIndex], selectedIndex);
                                                        }}
                                                        className="
                                                            absolute top-3 right-3 z-10
                                                            w-10 h-10
                                                            bg-white/90
                                                            rounded-full
                                                            flex items-center justify-center
                                                            shadow
                                                            hover:bg-white
                                                            transition cursor-pointer
                                                        "
                                                        aria-label="Скачать фото"
                                                        title="Скачать фото"
                                                    >
                                                        <Download size={20} className="text-[#0036A5]" />
                                                    </button>
                                                )}

                                                {/* Стрелки навигации */}
                                                {photos.length > 1 && (
                                                    <>
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setSelectedIndex(
                                                                    (i) => (i - 1 + photos.length) % photos.length
                                                                );
                                                            }}
                                                            className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 rounded-full flex items-center justify-center shadow hover:bg-white transition"
                                                            aria-label="Предыдущее фото"
                                                        >
                                                            <svg
                                                                width="20"
                                                                height="20"
                                                                viewBox="0 0 24 24"
                                                                fill="none"
                                                            >
                                                                <path
                                                                    d="M15 18L9 12L15 6"
                                                                    stroke="#333"
                                                                    strokeWidth="2"
                                                                    strokeLinecap="round"
                                                                    strokeLinejoin="round"
                                                                />
                                                            </svg>
                                                        </button>

                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setSelectedIndex(
                                                                    (i) => (i + 1) % photos.length
                                                                );
                                                            }}
                                                            className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 rounded-full flex items-center justify-center shadow hover:bg-white transition"
                                                            aria-label="Следующее фото"
                                                        >
                                                            <svg
                                                                width="20"
                                                                height="20"
                                                                viewBox="0 0 24 24"
                                                                fill="none"
                                                            >
                                                                <path
                                                                    d="M9 18L15 12L9 6"
                                                                    stroke="#333"
                                                                    strokeWidth="2"
                                                                    strokeLinecap="round"
                                                                    strokeLinejoin="round"
                                                                />
                                                            </svg>
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        {photos.length > 1 && (
                                            <>
                                                <Thumbs
                                                    photos={photos}
                                                    selectedIndex={selectedIndex}
                                                    onSelect={setSelectedIndex}
                                                />

                                                <div className="mt-3 md:hidden col-span-1">
                                                    <Thumbs
                                                        photos={photos}
                                                        selectedIndex={selectedIndex}
                                                        onSelect={setSelectedIndex}
                                                        mobile
                                                    />
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            )}

                            <section className="mb-7">
                                <h2 className="text-[28px] font-bold mb-4">Информация</h2>
                                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                                    {infoCards.map((item) => (
                                        <div
                                            key={item.label}
                                            className="rounded-[18px] border border-[#E5E7EB] bg-[#F8FAFC] px-4 py-3"
                                        >
                                            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[#E8F0FF]">
                                                {item.icon}
                                            </div>
                                            <div className="text-xl font-bold text-[#111827]">{item.value}</div>
                                            <div className="text-sm text-[#667085]">{item.label}</div>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            <div className="mb-6 flex gap-8 flex-col md:flex-row">
                                <div className="md:w-[317px]">
                                    <h2 className="text-2xl font-bold mb-4">Об объекте</h2>
                                    <div className="space-y-0.5 text-sm">
                                            <div className="flex justify-between py-2 border-b border-gray-100">
                                                <span className="text-[#666F8D] flex items-center gap-2">
                                                  <Home size={16}/> {typeFieldLabel(apartment)}
                                                </span>
                                                <span className="font-medium">
                                                  {apartment.type?.name || getKindName(apartment)}
                                                </span>
                                            </div>

                                            <div className="flex justify-between py-2 border-b border-gray-100">
                                                <span className="text-[#666F8D] flex items-center gap-2">
                                                  <Ruler size={16}/> Общая площадь
                                                </span>
                                                <span className="font-medium">
                                                  {apartment.total_area
                                                      ? apartment.total_area + 'м²'
                                                      : '-'}
                                                </span>
                                            </div>

                                            <div className="flex justify-between py-2 border-b border-gray-100">
                                                <span className="text-[#666F8D] flex items-center gap-2">
                                                  <Grid2X2Check size={16}/> Полноценная квартира?
                                                </span>
                                                <span className="font-medium">
                                                  {apartment.is_full_apartment
                                                      ? 'Да'
                                                      : 'Нет'}
                                                </span>
                                            </div>

                                            {(apartment.type.slug === 'houses' || apartment.type.slug === 'land_spots') && (
                                                <div className="flex justify-between py-2 border-b border-gray-100">
                                                <span className="text-[#666F8D] flex items-center gap-2">
                                                  <Ruler size={16}/> Площадь в сотках
                                                </span>
                                                    <span className="font-medium">
                                                  {apartment.land_size
                                                      ? apartment.land_size + 'соток'
                                                      : '-'}
                                                </span>
                                                </div>
                                            )}

                                            {/* Санузел показываем только для квартир/домов */}
                                            {['secondary', 'new-buildings', 'houses'].includes(
                                                apartment.type?.slug || ''
                                            ) && (
                                                <div className="flex justify-between py-2 border-b border-gray-100">
                                                  <span className="text-[#666F8D] flex items-center gap-2">
                                                    <Bath size={16}/> Санузел
                                                  </span>
                                                    <span className="font-medium">
                                                    {apartment.bathroom_count ?? '1'}
                                                  </span>
                                                </div>
                                            )}

                                            <div className="flex justify-between py-2 border-b border-gray-100">
                                                <span className="text-[#666F8D] flex items-center gap-2">
                                                  <Hammer size={16}/> Ремонт
                                                </span>
                                                <span className="font-medium">
                                                  {apartment.repair_type?.name || 'Косметический'}
                                                </span>
                                            </div>

                                            <div className="flex justify-between py-2 border-b border-gray-100">
                                                <span className="text-[#666F8D] flex items-center gap-2">
                                                  <MapPin size={16}/> Район
                                                </span>
                                                <span className="font-medium">
                                                  {apartment.district || '-'}
                                                </span>
                                            </div>

                                    </div>
                                </div>

                                <div className="md:w-[317px]">
                                        <h2 className="text-2xl font-bold mb-4">О доме</h2>
                                        <div className="space-y-0.5 text-sm">
                                            <div className="flex justify-between py-2 border-b border-gray-100">
                                                <span className="text-[#666F8D] flex items-center gap-2">
                                                  <Building2 size={16}/> Год постройки
                                                </span>
                                                <span className="font-medium">
                                                  {apartment.year_built || '-'}
                                                </span>
                                            </div>

                                            <div className="flex justify-between py-2 border-b border-gray-100">
                                                <span className="text-[#666F8D] flex items-center gap-2">
                                                  <Pickaxe size={16}/>Застройщик
                                                </span>
                                                <span className="font-medium">
                                                  {apartment.developer?.name || '-'}
                                                </span>
                                            </div>


                                            {/*<div className="flex justify-between py-2 border-b border-gray-100">*/}
                                            {/*    <span className="text-[#666F8D] flex items-center gap-2">*/}
                                            {/*      <ArrowUpDown size={16}/> Количество лифтов*/}
                                            {/*    </span>*/}
                                            {/*    <span className="font-medium">*/}
                                            {/*      {apartment.elevator_count || '-'}*/}
                                            {/*    </span>*/}
                                            {/*</div>*/}

                                            <div className="flex justify-between py-2 border-b border-gray-100">
                                                <span className="text-[#666F8D] flex items-center gap-2">
                                                  <Building2 size={16}/> Тип дома
                                                </span>
                                                <span className="font-medium">
                                                  {apartment.building_type?.name || '-'}
                                                </span>
                                            </div>

                                            <div className="flex justify-between py-2 border-b border-gray-100">
                                                <span className="text-[#666F8D] flex items-center gap-2">
                                                  <ParkingSquare size={16}/> Парковка
                                                </span>
                                                <span className="font-medium">
                                                  {apartment.parking?.name || '-'}
                                                </span>
                                            </div>

                                            <div className="flex justify-between py-2 border-b border-gray-100">
                                                <span className="text-[#666F8D] flex items-center gap-2">
                                                  <Flame size={16}/> Отопление
                                                </span>
                                                <span className="font-medium">
                                                  {apartment.heating?.name || '-'}
                                                </span>
                                            </div>

                                </div>
                            </div>
                            </div>

                            <div className="mt-6">
                                <h2 className="text-2xl font-bold mb-4">Описание</h2>
                                <div className="text-[#666F8D] whitespace-pre-line">
                                    {apartment.description || 'Описание не указано'}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="lg:w-[320px] lg:min-w-[320px]">
                        <div className="sticky top-4 space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="flex h-12 items-center justify-center rounded-[14px] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                                <FavoriteButton
                                    propertyId={apartment.id}
                                    source={apartment.__source === 'aura' ? 'aura' : 'local'}
                                    className="flex h-12 w-full items-center justify-center gap-2 rounded-[14px] bg-white px-3 text-sm font-medium text-[#344054]"
                                    iconClassName="h-5 w-5 text-[#667085]"
                                    label="В избранное"
                                />
                            </div>
                            <div className="relative" ref={shareMenuRef}>
                                <button
                                    type="button"
                                    onClick={() => setIsShareMenuOpen((prev) => !prev)}
                                    className="flex h-12 w-full items-center justify-center gap-2 rounded-[14px] bg-white px-3 text-sm font-medium text-[#344054] shadow-[0_1px_2px_rgba(15,23,42,0.04)] cursor-pointer"
                                >
                                    <Share2 className="h-4 w-4"/>
                                    Поделиться
                                </button>

                                {isShareMenuOpen && (
                                    <div className="absolute right-0 top-[calc(100%+8px)] z-20 w-56 rounded-[16px] border border-[#EAECF0] bg-white p-2 shadow-[0_12px_32px_rgba(15,23,42,0.12)]">
                                        <a
                                            href={telegramShareUrl}
                                            target="_blank"
                                            rel="noopener"
                                            className="flex items-center gap-3 rounded-[12px] px-3 py-2 text-sm text-[#344054] hover:bg-[#F8FAFC]"
                                            onClick={() => setIsShareMenuOpen(false)}
                                        >
                                            <Send className="h-4 w-4"/>
                                            Telegram
                                        </a>
                                        <a
                                            href={whatsappShareUrl}
                                            target="_blank"
                                            rel="noopener"
                                            className="flex items-center gap-3 rounded-[12px] px-3 py-2 text-sm text-[#344054] hover:bg-[#F8FAFC]"
                                            onClick={() => setIsShareMenuOpen(false)}
                                        >
                                            <MessageCircle className="h-4 w-4"/>
                                            WhatsApp
                                        </a>
                                        <button
                                            type="button"
                                            onClick={async () => {
                                                await handleCopyLink();
                                                setIsShareMenuOpen(false);
                                            }}
                                            className="flex w-full items-center gap-3 rounded-[12px] px-3 py-2 text-left text-sm text-[#344054] hover:bg-[#F8FAFC]"
                                        >
                                            <CopyIcon className="h-5 w-5"/>
                                            Копировать ссылку
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                        {apartment.creator && (
                            <div className="bg-white rounded-[22px] px-4 py-5 md:px-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                                <div className='flex items-start gap-3'>
                                    <div
                                        className="relative h-14 w-14 rounded-full overflow-hidden flex-shrink-0">
                                        <Link href={`/about/team/${apartment.creator.id}`}>
                                            {apartment.creator.photo ? (
                                                <Image
                                                    src={resolveMediaUrl(
                                                        apartment.creator.photo,
                                                        '/images/no-image.png',
                                                        apartment.__source === 'aura' ? 'aura' : 'local'
                                                    )}
                                                    alt={apartment.creator.name}
                                                    width={56}
                                                    height={56}
                                                    className="rounded-full object-cover h-14 w-14"
                                                />
                                            ) : (
                                                <div
                                                    className="rounded-full flex justify-center items-center h-14 w-14 bg-[#F1F5F9]">
                                                    <UserIcon className="w-6 h-7"/>
                                                </div>
                                            )}
                                        </Link>
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold leading-tight text-[#111827]">
                                            <Link href={`/about/team/${apartment.creator.id}`}>
                                                {apartment.creator.name}
                                            </Link>
                                        </h3>
                                        <div className="text-sm text-[#667085]">{contactRoleLabel}</div>
                                    </div>
                                </div>

                                <div className="mt-4 border-t border-[#EAECF0] pt-4">
                                    <div className="text-sm text-[#667085] mb-1">Цена</div>
                                    <div className="text-[34px] font-bold leading-none text-[#0036A5]">
                                        {Number(apartment.price).toLocaleString('ru-RU')} {apartment.currency}
                                    </div>
                                </div>

                                <div className="mt-3 flex flex-col gap-3">
                                    <button
                                        type="button"
                                        onClick={handleRevealPhone}
                                        disabled={isSendingPhoneReveal}
                                        className="flex min-h-12 items-center justify-center gap-3 rounded-[12px] bg-[#0036A5] px-4 py-3 text-center text-white transition-colors hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-70"
                                    >
                                        {isPhoneRevealed ? <PhoneCallIcon className="h-5 w-5"/> : <PhoneIcon className="h-5 w-5"/>}
                                        <span className="font-medium">
                                            {isPhoneRevealed ? creatorDisplayPhone : isSendingPhoneReveal ? 'Загрузка...' : 'Показать'}
                                        </span>
                                    </button>
                                    <Link
                                        href={`https://wa.me/${creatorCleanPhone}?text=${encodeURIComponent(
                                            `Здравствуйте! Интересует объект: ${heroTitle} - https://www.manora.tj/apartment/${apartment.id}&utm_source=whatsAppAgentShare`
                                        )}`}
                                        className="flex items-center justify-center gap-3 w-full py-3 border border-[#D0D5DD] text-[#111827] rounded-[12px] text-center hover:bg-[#F8FAFC] transition"
                                        target="_blank"
                                    >
                                        Консультация
                                    </Link>
                                </div>
                            </div>
                        )}

                        {canEdit && (
                            <div className="grid grid-cols-2 gap-3">
                                <Link
                                    href={`/profile/edit-post/${apartment.id}`}
                                    className="flex h-12 items-center justify-center rounded-[14px] bg-[#0036A5] text-sm font-medium text-white hover:bg-blue-800 transition-colors"
                                >
                                    Редактировать
                                </Link>
                                <Link
                                    href={`/apartment/${apartment.id}/logs`}
                                    className="flex h-12 items-center justify-center gap-2 rounded-[14px] bg-white text-sm font-medium text-[#344054] shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
                                >
                                    <HistoryIcon className="h-4 w-4"/>
                                    Логи
                                </Link>
                            </div>
                        )}

                        <div className="bg-white rounded-[22px] min-w-[200px] md:px-[26px] px-4 py-5 md:py-6 flex justify-center items-center shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                            <AdBanner
                                data-ad-slot="5085881730"
                                data-full-width-responsive="true"
                                data-ad-layout="in-article"
                                data-ad-format="auto"
                            />
                        </div>

                    </div>
                </div>
                </div>
                </div>

                {/* === Similar properties carousel === */}
                {similarProperties.length > 0 && (
                    <div className="">
                        <div className="flex items-center justify-between mb-3 bg-white rounded-[22px] p-4 my-6">
                            <h3 className="text-lg md:text-xl font-bold">Похожие объекты</h3>
                            <div
                                className="text-sm text-[#666F8D]">{loadingSimilar ? 'Загрузка...' : `${similarProperties.length} найдено`}</div>
                        </div>

                        <div className="flex gap-3 overflow-x-auto pb-2">
                            {similarProperties.map((p) => (
                                <div className='w-[420px]' key={p.id}>
                                    <BuyCard listing={p} user={user ?? undefined} isForClient={true}/>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {apartment.latitude && (
                    <div className="bg-white px-4 py-5 md:px-9 md:py-10 rounded-[14px] md:rounded-[22px] mt-4">
                        <div className="text-lg md:text-2xl mb-3 md:mb-6 font-bold">
                            Расположение на карте
                        </div>
                        <div className="h-[145px] md:h-[500px] w-full rounded-[12px] overflow-hidden">
                            <YMaps
                                query={{
                                    lang: 'ru_RU',
                                    apikey: 'dbdc2ae1-bcbd-4f76-ab38-94ca88cf2a6f',
                                }}
                            >
                                <Map
                                    state={{
                                        center: coordinates ?? [38.5597722, 68.7870384],
                                        zoom: coordinates ? 15 : 9,
                                    }}
                                    width="100%"
                                    height="100%"
                                    // onClick={handleMapClick}
                                    instanceRef={mapRef}
                                    modules={["geocode"]}
                                    onLoad={(ymaps) => {
                                        // @ts-expect-error type error disabling
                                        ymapsRef.current = ymaps;
                                        return undefined;
                                    }}
                                >
                                    {coordinates && (
                                        <Placemark
                                            geometry={coordinates}
                                            options={{
                                                iconLayout: 'default#image',
                                                iconImageHref: '/images/pin.svg',
                                                iconImageSize: [44, 44],
                                                iconImageOffset: [-22, -44],
                                                draggable: true,
                                            }}
                                            properties={{
                                                iconCaption: apartment.address,
                                            }}
                                        />
                                    )}
                                </Map>
                            </YMaps>
                        </div>
                    </div>
                )}


                <MortgageCalculator propertyPrice={apartment.price}/>
                <div
                    className="bg-white rounded-[22px] min-w-[200px] md:px-[26px] px-4 py-5 md:py-6 my-6 flex justify-center items-center">

                    <AdBanner
                        data-ad-slot="5694010534"
                        data-full-width-responsive="true"
                        data-ad-layout="in-article"
                        data-ad-format="auto"
                    />
                </div>
            </div>

            <PhotoGalleryModal
                isOpen={isModalOpen}
                onClose={closeModal}
                photos={photos}
                initialIndex={selectedIndex}
            />
        </>
    );
}

function Thumbs({
                    photos,
                    selectedIndex,
                    onSelect,
                    mobile = false,
                }: {
    photos: string[];
    selectedIndex: number;
    onSelect: (i: number) => void;
    mobile?: boolean;
}) {
    const THUMB = mobile ? 92 : 128;
    const desktopVisibleCount = 4;
    const maxStartIndex = Math.max(0, photos.length - desktopVisibleCount);
    const selectedWindowStart = Math.min(
        Math.max(selectedIndex - 1, 0),
        maxStartIndex
    );
    const [activeStartIndex, setActiveStartIndex] = useState(selectedWindowStart);
    const [showAllThumbs, setShowAllThumbs] = useState(false);
    const desktopPhotos = photos.slice(activeStartIndex, activeStartIndex + desktopVisibleCount);

    useEffect(() => {
        setActiveStartIndex(selectedWindowStart);
    }, [selectedWindowStart]);

    if (mobile) {
        return (
            <div
                className="flex gap-2 overflow-x-auto scroll-smooth pb-1"
            >
                {photos.map((src, i) => (
                    <button
                        key={i}
                        type="button"
                        onClick={() => onSelect(i)}
                        className={`relative flex-none overflow-hidden rounded-lg border-2 transition ${
                            i === selectedIndex
                                ? 'border-[#0036A5]'
                                : 'border-transparent hover:border-blue-300'
                        }`}
                        style={{width: THUMB, height: THUMB}}
                        title={`Фото ${i + 1}`}
                    >
                        <Image
                            src={src}
                            alt={`Миниатюра ${i + 1}`}
                            fill
                            className="object-cover"
                            sizes="120px"
                        />
                    </button>
                ))}
            </div>
        );
    }
    return (
        <div
            className="
                    hidden
                    lg:flex
                    lg:flex-col
                    gap-3
                    relative
                    shrink-0
                  "
        >
            {photos.length > desktopVisibleCount && (
                <button
                    type="button"
                    onClick={() => {
                        setActiveStartIndex((prev) => Math.max(0, prev - 1));
                        setShowAllThumbs(false);
                    }}
                    disabled={activeStartIndex === 0}
                    className="flex h-8 w-[128px] items-center justify-center rounded-full bg-[#E5E7EB] text-[#344054] transition hover:bg-[#DDE5F5] disabled:cursor-not-allowed disabled:opacity-50"
                    aria-label="Показать предыдущие миниатюры"
                >
                    <ChevronUp className="h-4 w-4"/>
                </button>
            )}

            {desktopPhotos.map((src, index) => {
                const photoIndex = activeStartIndex + index;
                return (
                    <button
                        key={`${src}-${photoIndex}`}
                        type="button"
                        onClick={() => onSelect(photoIndex)}
                        className={`relative overflow-hidden rounded-lg border-2 transition ${
                            photoIndex === selectedIndex
                                ? 'border-[#0036A5]'
                                : 'border-transparent hover:border-blue-300'
                        }`}
                        style={{width: THUMB, height: THUMB}}
                        title={`Фото ${photoIndex + 1}`}
                    >
                        <Image
                            src={src}
                            alt={`Миниатюра ${photoIndex + 1}`}
                            fill
                            className="object-cover"
                            sizes="120px"
                        />
                    </button>
                );
            })}

            {photos.length > desktopVisibleCount && (
                <button
                    type="button"
                    onClick={() => {
                        setActiveStartIndex((prev) => Math.min(maxStartIndex, prev + 1));
                        setShowAllThumbs(false);
                    }}
                    disabled={activeStartIndex >= maxStartIndex}
                    className="flex h-8 w-[128px] items-center justify-center rounded-full bg-[#E5E7EB] text-[#344054] transition hover:bg-[#DDE5F5] disabled:cursor-not-allowed disabled:opacity-50"
                    aria-label="Показать следующие миниатюры"
                >
                    <ChevronDown className="h-4 w-4"/>
                </button>
            )}

            {photos.length > desktopVisibleCount && (
                <button
                    type="button"
                    onClick={() => setShowAllThumbs((prev) => !prev)}
                    className={`flex h-8 w-[128px] items-center justify-center rounded-full text-xs font-medium transition ${
                        showAllThumbs
                            ? 'bg-[#0036A5] text-white'
                            : 'bg-[#E5E7EB] text-[#344054] hover:bg-[#DDE5F5]'
                    }`}
                >
                    Все фото
                </button>
            )}

            {showAllThumbs && (
                <div className="absolute left-[calc(100%+12px)] top-0 z-20 w-[432px] rounded-[20px] border border-[#E5E7EB] bg-white p-3 shadow-[0_20px_50px_rgba(15,23,42,0.14)]">
                    <div className="mb-3 flex items-center justify-between">
                        <div className="text-sm font-semibold text-[#111827]">Все миниатюры</div>
                        <button
                            type="button"
                            onClick={() => setShowAllThumbs(false)}
                            className="rounded-full bg-[#F3F4F6] px-3 py-1 text-xs font-medium text-[#344054]"
                        >
                            Закрыть
                        </button>
                    </div>
                    <div className="grid max-h-[560px] grid-cols-3 gap-3 overflow-y-auto pr-1">
                        {photos.map((src, index) => (
                            <button
                                key={`${src}-all-${index}`}
                                type="button"
                                onClick={() => {
                                    onSelect(index);
                                    setShowAllThumbs(false);
                                }}
                                className={`relative aspect-square overflow-hidden rounded-xl border-2 transition ${
                                    index === selectedIndex
                                        ? 'border-[#0036A5]'
                                        : 'border-transparent hover:border-blue-300'
                                }`}
                                title={`Фото ${index + 1}`}
                            >
                                <Image
                                    src={src}
                                    alt={`Миниатюра ${index + 1}`}
                                    fill
                                    className="object-cover"
                                    sizes="144px"
                                />
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
