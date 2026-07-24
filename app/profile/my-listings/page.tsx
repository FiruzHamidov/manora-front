'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import BuyCard from '@/app/_components/buy/buy-card';
import BuyCardSkeleton from '@/ui-components/BuyCardSkeleton';
import { useGetMyPropertiesQuery } from '@/services/properties/hooks';
import { Property } from '@/services/properties/types';
import { useProfile } from '@/services/login/hooks';
import HorizontalTabs from '@/app/profile/_components/HorizontalTabs';
import Link from 'next/link';
import { BellRing, CheckCircle2, Clock3, Plus, ShieldCheck } from 'lucide-react';

const TABS = [
    { key: 'pending',  label: 'На модерации' },
    { key: 'approved', label: 'Активные' },
    { key: 'rejected', label: 'Нужно исправить' },
    // { key: 'draft',    label: 'Черновики' },
    // { key: 'deleted',  label: 'Удаленные' },
    {key: 'deposit', label: 'Залог'},
    { key: 'sold',     label: 'Проданные агентом' },
    { key: 'sold_by_owner',     label: 'Проданные владельцем' },
    { key: 'rented',   label: 'Арендованные' },
] as const;

type TabKey = typeof TABS[number]['key'];

export default function MyListings() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const { data: user } = useProfile();

    const requestedTab = searchParams.get('tab');
    const wasCreated = searchParams.get('created') === '1';
    const wasUpdated = searchParams.get('updated') === '1';
    const initialTab = TABS.some((tab) => tab.key === requestedTab) ? (requestedTab as TabKey) : 'approved';

    const [selectedTab, setSelectedTab] = useState<TabKey>(initialTab);
    const [page, setPage] = useState(1);
    const perPage = 20;

    // Основной список (серверная пагинация + фильтр по вкладке)
    const {
        data: myProperties,
        isLoading,
        isFetching,
    } = useGetMyPropertiesQuery(
        { listing_type: '', page, per_page: perPage, moderation_status: selectedTab, sort: 'none', created_by: user?.id.toString() },
        true
    );

    // При смене вкладки возвращаемся на первую страницу
    useEffect(() => {
        if (selectedTab !== initialTab) {
            setSelectedTab(initialTab);
        }
    }, [initialTab, selectedTab]);

    useEffect(() => { setPage(1); }, [selectedTab]);

    // Лёгкие запросы для тоталов по всем вкладкам (per_page: 1)
    const { data: pendingMeta  } = useGetMyPropertiesQuery({ listing_type: '', page: 1, per_page: 1, moderation_status: 'pending', created_by: user?.id.toString()  }, true);
    const { data: approvedMeta } = useGetMyPropertiesQuery({ listing_type: '', page: 1, per_page: 1, moderation_status: 'approved', created_by: user?.id.toString() }, true);
    const { data: rejectedMeta } = useGetMyPropertiesQuery({ listing_type: '', page: 1, per_page: 1, moderation_status: 'rejected', created_by: user?.id.toString() }, true);
    // const { data: draftMeta    } = useGetMyPropertiesQuery({ listing_type: '', page: 1, per_page: 1, moderation_status: 'draft'    }, true);
    // const { data: deletedMeta  } = useGetMyPropertiesQuery({ listing_type: '', page: 1, per_page: 1, moderation_status: 'deleted'  }, true);
    const { data: soldMeta     } = useGetMyPropertiesQuery({ listing_type: '', page: 1, per_page: 1, moderation_status: 'sold', created_by: user?.id.toString()     }, true);
    const { data: depositMeta     } = useGetMyPropertiesQuery({ listing_type: '', page: 1, per_page: 1, moderation_status: 'deposit', created_by: user?.id.toString()     }, true);
    const { data: soldByOwnerMeta     } = useGetMyPropertiesQuery({ listing_type: '', page: 1, per_page: 1, moderation_status: 'sold_by_owner', created_by: user?.id.toString()     }, true);
    const { data: rentedMeta   } = useGetMyPropertiesQuery({ listing_type: '', page: 1, per_page: 1, moderation_status: 'rented', created_by: user?.id.toString()   }, true);

    // Данные активной вкладки
    const serverData: Property[] = myProperties?.data ?? [];
    const totalItems  = myProperties?.total ?? 0;
    const totalPages  = myProperties?.last_page ?? 1;
    const currentPage = myProperties?.current_page ?? page;
    const from        = myProperties?.from ?? 0;
    const to          = myProperties?.to ?? 0;

    // Тоталы для заголовков вкладок
    const tabTotals: Record<TabKey, number | undefined> = {
        pending : pendingMeta?.total,
        approved: approvedMeta?.total,
        rejected: rejectedMeta?.total,
        // draft   : draftMeta?.total,
        // deleted : deletedMeta?.total,
        sold    : soldMeta?.total,
        deposit   : depositMeta?.total,
        sold_by_owner    : soldByOwnerMeta?.total,
        rented  : rentedMeta?.total,
    };

    function changeTab(tab: TabKey) {
        setSelectedTab(tab);
        setPage(1);
        const nextSearchParams = new URLSearchParams(searchParams.toString());
        nextSearchParams.set('tab', tab);
        router.replace(`${pathname}?${nextSearchParams.toString()}`, { scroll: false });
    }

    function goTo(targetPage: number) {
        const safePage = Math.min(Math.max(1, targetPage), totalPages);
        setPage(safePage);
    }

    const pageNumbers = useMemo(() => {
        const delta = 1;
        const numbers: number[] = [];
        const fromPage = Math.max(1, currentPage - delta);
        const toPage   = Math.min(totalPages, currentPage + delta);
        for (let i = fromPage; i <= toPage; i++) numbers.push(i);
        if (numbers[0] !== 1) numbers.unshift(1);
        if (numbers[numbers.length - 1] !== totalPages) numbers.push(totalPages);
        return [...new Set(numbers)];
    }, [currentPage, totalPages]);

    // Скелетоны + tabs
    if (isLoading && !myProperties) {
        return (
            <div className="w-auto">
                <div className="mb-6 border-b pb-2">
                    <HorizontalTabs
                        tabs={TABS}
                        selectedKey={selectedTab}
                        totals={tabTotals}
                        onChange={(k) => changeTab(k as TabKey)}
                        loading
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[30px]">
                    {Array.from({ length: 6 }).map((_, i) => <BuyCardSkeleton key={i} />)}
                </div>
            </div>
        );
    }

    return (
        <div className="w-auto">
            <section className="mb-6 overflow-hidden rounded-[26px] border border-[#DCE8E2] bg-white shadow-[0_16px_45px_rgba(15,23,42,0.06)]">
                <div className="flex flex-col gap-5 bg-[linear-gradient(135deg,#EFFAF5_0%,#FFFFFF_72%)] px-5 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-7">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#08754F]">
                            Управление публикациями
                        </p>
                        <h1 className="mt-2 text-2xl font-black tracking-tight text-[#172033]">
                            Мои объявления
                        </h1>
                        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#64748B]">
                            Следите за проверкой, исправляйте замечания и управляйте опубликованными объектами в одном месте.
                        </p>
                    </div>
                    <Link
                        href="/profile/add-post"
                        className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#006341] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#07553D]"
                    >
                        <Plus className="h-4 w-4" />
                        Добавить объявление
                    </Link>
                </div>

                <div className="grid border-t border-[#E6EEE9] sm:grid-cols-3">
                    {[
                        {
                            icon: Clock3,
                            title: 'Проверка',
                            text: 'Новое или исправленное объявление получает статус «На модерации».',
                        },
                        {
                            icon: ShieldCheck,
                            title: 'Решение',
                            text: 'Модератор публикует объявление или оставляет понятный комментарий.',
                        },
                        {
                            icon: BellRing,
                            title: 'Уведомление',
                            text: 'Результат проверки появится в центре уведомлений.',
                        },
                    ].map((item, index) => {
                        const Icon = item.icon;
                        return (
                            <article
                                key={item.title}
                                className={`flex gap-3 px-5 py-4 sm:px-6 ${
                                    index > 0 ? 'border-t border-[#E6EEE9] sm:border-l sm:border-t-0' : ''
                                }`}
                            >
                                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#EAF6F0] text-[#08754F]">
                                    <Icon className="h-4 w-4" />
                                </span>
                                <div>
                                    <h2 className="text-sm font-bold text-[#172033]">{item.title}</h2>
                                    <p className="mt-1 text-xs leading-5 text-[#6B778A]">{item.text}</p>
                                </div>
                            </article>
                        );
                    })}
                </div>
            </section>

            {wasCreated || wasUpdated ? (
                <div className="mb-6 flex items-start gap-3 rounded-2xl border border-[#B8DEC9] bg-[#EFFAF5] px-4 py-4 text-[#075D40]">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
                    <div>
                        <p className="font-bold">
                            {wasCreated ? 'Объявление отправлено на проверку' : 'Изменения отправлены модератору'}
                        </p>
                        <p className="mt-1 text-sm leading-5 text-[#3E6C5A]">
                            Мы сообщим о решении в уведомлениях. Обычно проверка занимает один рабочий день.
                        </p>
                    </div>
                </div>
            ) : null}

            <div className="mb-6">
                <div className="flex flex-wrap items-end justify-between gap-3 border-b pb-2">
                    <div className="w-full">
                        <HorizontalTabs
                            tabs={TABS}
                            selectedKey={selectedTab}
                            totals={tabTotals}
                            onChange={(k) => changeTab(k as TabKey)}
                            loading={isFetching}
                        />
                    </div>

                    <div className="text-sm text-gray-500">
                        {totalItems > 0 && (
                            <>
                                Показываю <span className="font-medium">{from}–{to}</span> из{' '}
                                <span className="font-medium">{totalItems}</span>
                            </>
                        )}
                        {isFetching && <span className="ml-2 text-gray-400">Обновление…</span>}
                    </div>
                </div>
            </div>

            {serverData.length === 0 ? (
                <div className="rounded-[24px] border border-dashed border-[#C9D8D0] bg-white px-5 py-16 text-center">
                    <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EFF7F3] text-[#08754F]">
                        <Plus className="h-6 w-6" />
                    </span>
                    <p className="mt-4 text-lg font-bold text-[#26332D]">
                        В этом статусе пока нет объявлений
                    </p>
                    <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#6B778A]">
                        Создайте новое объявление или выберите другую вкладку, чтобы проверить текущие публикации.
                    </p>
                    <Link
                        href="/profile/add-post"
                        className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#006341] px-5 py-3 text-sm font-bold text-white"
                    >
                        <Plus className="h-4 w-4" />
                        Добавить объявление
                    </Link>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[30px]">
                        {serverData.map((listing: Property) => (
                            <BuyCard listing={listing} user={user} key={listing.id} isEditRoute />
                        ))}
                    </div>

                    <div className="mt-6 flex items-center justify-center gap-2">
                        <button
                            className="px-3 py-2 rounded-xl border text-sm hover:bg-gray-50 disabled:opacity-40"
                            onClick={() => goTo(currentPage - 1)}
                            disabled={currentPage <= 1}
                        >
                            Назад
                        </button>

                        {pageNumbers.map((pageNumber, index) => {
                            const needEllipsis = index > 0 && pageNumber - pageNumbers[index - 1] > 1;
                            return (
                                <span key={`${pageNumber}-${index}`} className="flex">
                  {needEllipsis && <span className="px-1 text-gray-400">…</span>}
                                    <button
                                        onClick={() => goTo(pageNumber)}
                                        className={`px-3 py-2 rounded-xl border text-sm mx-0.5 ${
                                            pageNumber === currentPage
                                                ? 'bg-[#006341] text-white border-[#006341]'
                                                : 'hover:bg-gray-50'
                                        }`}
                                    >
                    {pageNumber}
                  </button>
                </span>
                            );
                        })}

                        <button
                            className="px-3 py-2 rounded-xl border text-sm hover:bg-gray-50 disabled:opacity-40"
                            onClick={() => goTo(currentPage + 1)}
                            disabled={currentPage >= totalPages}
                        >
                            Вперёд
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}
