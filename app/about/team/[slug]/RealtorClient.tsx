'use client';

import {useEffect, useRef, useState} from 'react';
import {useParams, useRouter} from 'next/navigation';
import axios from 'axios';
import Image from 'next/image';
import TelegramNoBgIcon from '@/icons/TelegramNoBgIcon';
import PhoneNoBgIcon from '@/icons/PhoneNoBgIcon';
import WhatsAppNoBgIcon from '@/icons/WhatsappNoBgIcon';
import ThumbsUpIcon from '@/icons/ThumbsUp';
import PencilIcon from '@/icons/PencilIcon';
import {toast} from 'react-toastify';
import { getLeadErrorMessage, getSourceUrl, getUtmFromUrl, submitLead } from '@/services/leads/api';

import {STORAGE_URL} from "@/constants/base-url";
import {Chip, RealtorListings} from "@/app/buy/_components/RealtorListing";
import UserIcon from "@/icons/UserIcon";

interface Review {
    id: number;
    author: string;
    rating: number;
    date: string;
    text: string;
}

interface Realtor {
    id: number;
    name: string;
    position: string | null;
    avatar: string | null;
    phone: string;
    photo: string | null;
    rating: number;
    reviewCount: number;
    reviews: Review[];
    description?: string;
}

const Rating = ({value}: { value: number }) => (
    <div className="flex gap-1" aria-label={`Рейтинг ${value} из 5`}>
        {[...Array(5)].map((_, i) => (
            <svg
                key={i}
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill={i < value ? '#094BAD' : 'none'}
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
            >
                <path
                    d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
                    stroke={i < value ? '#094BAD' : '#D1D5DB'}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </svg>
        ))}
    </div>
);

export default function RealtorClient({slug: slugProp}: { slug?: string }) {
    const route = useParams() as { slug?: string };
    const slug = slugProp ?? route.slug ?? "";

    const router = useRouter();

    const [realtorData, setRealtorData] = useState<Realtor | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const reviewsPerPage = 4;

    const ROOM_CHIPS = [1, 2, 3, 4, 5]; // 5 = "5+"
    const [selectedRooms, setSelectedRooms] = useState<number[]>(() => {
        try {
            if (typeof window === 'undefined') return [1, 2, 3, 4, 5];
            const p = new URLSearchParams(window.location.search).get('rooms');
            if (!p) return [1, 2, 3, 4, 5];
            const arr = p.split(',').map(s => parseInt(s, 10)).filter(n => !isNaN(n));
            return arr.length > 0 ? arr : [1, 2, 3, 4, 5];
        } catch {
            return [1, 2, 3, 4, 5];
        }
    }); // "Все" по умолчанию
    const [listingsTotal, setListingsTotal] = useState<number | null>(null);

    const isAllSelected = selectedRooms.length === ROOM_CHIPS.length;

    const toggleRoom = (v: number) => {
        setSelectedRooms(prev => {
            const has = prev.includes(v);
            const next = has ? prev.filter(x => x !== v) : [...prev, v].sort((a, b) => a - b);
            return next.length === 0 ? [...ROOM_CHIPS] : next;
        });
    };

    const selectAll = () => setSelectedRooms([...ROOM_CHIPS]);

    const slugStr = slug?.toString();

    const fetchRealtor = async (slugStr: string) => {
        try {
            const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL ?? "https://back.manora.tj/api"}/user/${slugStr}`);
            const data = res.data as Realtor;
            const rawPhone: string = data.phone ?? '';
            let digits = rawPhone.replace(/\D/g, '');
            if (!digits.startsWith('992')) digits = `992${digits}`;

            const readable = digits.replace(/^992(\d{3})(\d{2})(\d{2})(\d{2})$/, '+992 $1 $2 $3 $4');
            const waDigits = digits; // для wa.me нужны только цифры с кодом страны
            const tgDigits = digits; // для tg:// тоже только цифры

            const realtor: Realtor = {
                id: data.id,
                name: data.name,
                position: 'Специалист по недвижимости',
                avatar: data.photo,
                phone: readable,
                photo: data.photo ?? null,
                description: data.description,
                rating: Number(data.rating ?? 5),
                reviewCount: Number(data.reviewCount ?? 0),
                reviews: Array.isArray(data.reviews) ? data.reviews : [],
            };

            setRealtorData(realtor);

            // сохраним нормализованные ссылки в state через замыкание
            setLinkData({
                telHref: `tel:+${digits}`,
                tgHref: `tg://resolve?phone=${tgDigits}`,
                waHref: `https://wa.me/${waDigits}`,
            });
        } catch (err) {
            toast.error(`Ошибка при загрузке данных риелтора ${err}`);
        }
    };

    useEffect(() => {
        if (slugStr) {
            fetchRealtor(slugStr);
        }
    }, [slugStr]); // теперь зависимость простая

    const [linkData, setLinkData] = useState<{ telHref: string; tgHref: string; waHref: string } | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!realtorData) return;

        const sourceUrl = getSourceUrl();
        const payload = {
            name: name.trim(),
            phone: phone.trim(),
            requestType: 'realtor_contact',
            title: `Заявка агенту: ${realtorData.name}`,
            pageUrl: sourceUrl,
            agentName: realtorData.name,
            agentId: String(realtorData.id),
            agentPhone: realtorData.phone,
        };

        try {
            const result = await submitLead({
                lead: {
                    service_type: 'Заявка агенту',
                    name: name.trim(),
                    phone: phone.trim(),
                    source: 'web-realtor-profile',
                    source_url: sourceUrl,
                    utm: getUtmFromUrl(sourceUrl),
                    context: {
                        request_type: 'realtor_contact',
                        agent_name: realtorData.name,
                        agent_id: realtorData.id,
                        agent_phone: realtorData.phone,
                    },
                },
                telegram: payload,
            });

            if (!result.ok) {
                console.error(result.message);
                toast.error(getLeadErrorMessage(result));
                return;
            }

            toast.success('Заявка отправлена');
            setName('');
            setPhone('');
        } catch (err) {
            console.error(err);
            toast.error('Ошибка сети. Попробуйте позже.');
        }
    };

// === sync selectedRooms -> URL (replace) but skip initial mount ===
    const roomsSyncInitialized = useRef(false);
    useEffect(() => {
        if (!roomsSyncInitialized.current) {
            roomsSyncInitialized.current = true;
            return;
        }
        if (typeof window === 'undefined') return;
        try {
            const params = new URLSearchParams(window.location.search);
            if (selectedRooms.length > 0) params.set('rooms', selectedRooms.join(','));
            else params.delete('rooms');
            const base = window.location.pathname;
            const qs = params.toString();
            const newUrl = `${base}${qs ? `?${qs}` : ''}${window.location.hash ?? ''}`;
            router.replace(newUrl);
        } catch {
            // ignore
        }
    }, [selectedRooms, router]);

    if (!realtorData) return <div className="p-6 text-center">Загрузка...</div>;

    const currentReviews = realtorData.reviews.slice(
        (currentPage - 1) * reviewsPerPage,
        currentPage * reviewsPerPage
    );

    const totalPages = Math.ceil(realtorData.reviews.length / reviewsPerPage);

    return (
        <div className="bg-gray-50 min-h-screen">
            <div className="mx-auto w-full max-w-[1520px] px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex flex-col md:flex-row gap-3.5">
                    {/* Левая часть */}
                    <div className="md:w-2/3">
                        <div className="flex gap-[22px] bg-white px-4 py-8 rounded-[22px] flex-wrap">
                            <div className="relative h-auto overflow-hidden flex-shrink-0">
                                {realtorData.photo ? (
                                    <Image
                                        src={`${STORAGE_URL}/${realtorData.photo}`}
                                        alt={realtorData.name}
                                        width={300}
                                        height={400}
                                        className="rounded-lg object-cover mr-2"
                                    />
                                ) : (
                                    <div
                                        className="rounded-full flex justify-center items-center  h-[120px] w-[120px] bg-[#F1F5F9] p-1.5 mr-1.5">
                                        <UserIcon className="w-6 h-7"/>
                                    </div>
                                )}
                            </div>

                            <div>
                                <div className="text-[#353E5C]">{realtorData.position}</div>
                                {/* H1 рендерится на сервере как sr-only */}
                                <div className="text-[32px] font-bold flex justify-beetwen"
                                     aria-hidden="true">{realtorData.name}
                                    <div>

                                        {/*<Link href={`/profile/reports/agent?created_by=${realtorData.id}`}*/}
                                        {/*      className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50">*/}
                                        {/*    <SquareChartGantt/>*/}
                                        {/*    <span>Посмотреть отчет</span>*/}
                                        {/*</Link>*/}

                                        {/*<Link href={`/apartment/${p.id}/logs`} className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50">*/}
                                        {/*    <HistoryIcon className="w-4 h-4" />*/}
                                        {/*    <span>Посмотреть историю</span>*/}
                                        {/*</Link>*/}
                                        {/*<Link href={`/profile/edit-post/${p.id}/logs`} className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50">*/}
                                        {/*    <EditIcon className="w-4 h-4" />*/}
                                        {/*    <span>Редактировать</span>*/}
                                        {/*</Link>*/}
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 mt-3 hidden">
                                    <div
                                        className="flex items-center gap-1 rounded-[26px] text-[#666F8D] bg-[#F7F8FA] px-2.5 py-2">
                                        <ThumbsUpIcon className="w-5 h-5"/>
                                        <span>{realtorData.rating ?? 0}</span>
                                    </div>
                                    {/*<div className="text-[#666F8D]">{realtorData.reviewCount ?? 0} отзывов</div>*/}
                                </div>

                                {realtorData.description && (
                                    <p className="mt-4 text-[#666F8D] text-lg leading-relaxed">
                                        {realtorData.description}
                                    </p>
                                )}

                                <div className="mt-3">
                                    <a
                                        href={linkData?.telHref ?? '#'}
                                        className="text-[24px] font-bold text-[#0036A5] block mb-3"
                                    >
                                        {realtorData.phone}
                                    </a>
                                    <div className="flex gap-2">
                                        <a href={linkData?.tgHref ?? '#'} target="_blank" aria-label="Telegram"
                                           rel="noopener">
                                            <TelegramNoBgIcon className="w-12 h-12"/>
                                        </a>
                                        <a href={linkData?.telHref ?? '#'} aria-label="Phone">
                                            <PhoneNoBgIcon className="w-12 h-12"/>
                                        </a>
                                        <a href={linkData?.waHref ?? '#'} target="_blank" aria-label="WhatsApp"
                                           rel="noopener">
                                            <WhatsAppNoBgIcon className="w-12 h-12"/>
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Отзывы (скрыты) */}
                        <div className="mt-[52px] hidden">
                            <h2 className="text-2xl md:text-4xl font-bold mb-6 md:mb-10">Отзывы</h2>
                            <div className="mb-6">
                                <button
                                    className="inline-flex items-center gap-1 p-2.5 rounded-full border border-[#BAC0CC] text-lg"
                                >
                                    <div className="bg-[#0036A5] p-1 rounded-full w-8 h-8">
                                        <PencilIcon className="w-6 h-6"/>
                                    </div>
                                    Оставить отзыв
                                </button>
                            </div>
                            <div className="grid md:grid-cols-2 gap-x-5 gap-y-5">
                                {currentReviews.map((review) => (
                                    <div key={review.id} className="bg-white rounded-[22px] p-5">
                                        <div className="mb-1">
                                            <div className="text-lg mb-2">{review.author}</div>
                                            <div className="flex items-center justify-between mb-3.5">
                                                <Rating value={review.rating}/>
                                                <div className="text-lg text-[#666F8D]">{review.date}</div>
                                            </div>
                                        </div>
                                        <p className="text-lg text-[#666F8D]">{review.text}</p>
                                    </div>
                                ))}
                            </div>

                            {totalPages > 1 && (
                                <div className="flex justify-start mt-6">
                                    <div className="flex items-center gap-2">
                                        {[...Array(totalPages)].map((_, i) => (
                                            <button
                                                key={i}
                                                onClick={() => setCurrentPage(i + 1)}
                                                className={`w-[62px] h-[62px] rounded-full flex items-center justify-center text-2xl cursor-pointer ${
                                                    currentPage === i + 1 ? 'bg-[#0036A5] text-white' : 'bg-white text-[#020617]'
                                                }`}
                                                aria-label={`Страница отзывов ${i + 1}`}
                                            >
                                                {i + 1}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Правая часть - форма */}
                    <div className="bg-white py-8 px-4 rounded-[22px] md:w-1/3 h-max">
                        <h2 className="text-2xl font-bold text-[#666F8D] mb-[30px] text-center">Обратная связь</h2>
                        <form onSubmit={handleSubmit}>
                            <div className="mb-4">
                                <input
                                    type="text"
                                    placeholder="Ваше имя"
                                    className="w-full p-3 text-lg rounded-full bg-[#F0F2F5] border-none text-center"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="mb-4">
                                <input
                                    type="tel"
                                    placeholder="Телефон"
                                    className="w-full p-3 text-lg rounded-full bg-[#F0F2F5] border-none text-center"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    required
                                />
                            </div>
                            <button
                                type="submit"
                                className="w-full text-lg bg-[#0036A5] text-white p-3 rounded-full font-bold"
                            >
                                Позвонить мне
                            </button>
                            <p className="text-sm text-[#666F8D] mt-[15px]">
                                Нажимая на кнопку «Позвоните мне», я даю согласие на обработку{' '}
                                <a href="#" className="underline">персональных данных</a>.
                            </p>
                        </form>
                    </div>
                </div>
            </div>

            <div className="mx-auto w-full max-w-[1520px] px-4 sm:px-6 lg:px-8">
                <h2 className="text-2xl md:text-4xl font-bold mt-10 mb-4">
                    Объявлений: {listingsTotal ?? '—'}
                </h2>

                <div className="bg-white rounded-[22px] p-[20px]">
                    <p className="mt-2 mb-3">Кол-во комнат:</p>
                    <div className="flex flex-wrap items-center gap-2">
                        <Chip active={isAllSelected} onClick={selectAll}>Все</Chip>
                        {[1, 2, 3, 4, 5].map(v => (
                            <Chip key={v} active={selectedRooms.includes(v)} onClick={() => toggleRoom(v)}>
                                {v === 5 ? '5+' : v}
                            </Chip>
                        ))}
                    </div>
                    <div className="text-sm text-[#666F8D] mt-3">
                        Выбрано: {isAllSelected ? 'Все' : selectedRooms.map(v => v === 5 ? '5+' : v).join(', ')} комнатные
                    </div>
                </div>
            </div>

            <div className="mb-4">
                <RealtorListings slug={slug as string} selectedRooms={selectedRooms} onCountChange={setListingsTotal}/>
            </div>
        </div>
    );
}

// --- PATCH BEGIN: RealtorListings changes below ---

// Find the RealtorListings component and update its function body as described.
// (The actual component is imported, but if it were defined here, the following changes would be made.)

// --- PATCH END ---
