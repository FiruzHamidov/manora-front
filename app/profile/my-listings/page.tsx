'use client';

import { useEffect, useMemo, useState } from 'react';
import BuyCard from '@/app/_components/buy/buy-card';
import BuyCardSkeleton from '@/ui-components/BuyCardSkeleton';
import { useGetMyPropertiesQuery } from '@/services/properties/hooks';
import { Property } from '@/services/properties/types';
import { useProfile } from '@/services/login/hooks';
import HorizontalTabs from '@/app/profile/_components/HorizontalTabs';

const TABS = [
    { key: 'pending',  label: 'На модерации' },
    { key: 'approved', label: 'Активные' },
    // { key: 'rejected', label: 'Отклонённые' },
    // { key: 'draft',    label: 'Черновики' },
    // { key: 'deleted',  label: 'Удаленные' },
    {key: 'deposit', label: 'Залог'},
    { key: 'sold',     label: 'Проданные агентом' },
    { key: 'sold_by_owner',     label: 'Проданные владельцем' },
    { key: 'rented',   label: 'Арендованные' },
] as const;

type TabKey = typeof TABS[number]['key'];

export default function MyListings() {
    const { data: user } = useProfile();

    const [selectedTab, setSelectedTab] = useState<TabKey>('approved');
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
    useEffect(() => { setPage(1); }, [selectedTab]);

    // Лёгкие запросы для тоталов по всем вкладкам (per_page: 1)
    const { data: pendingMeta  } = useGetMyPropertiesQuery({ listing_type: '', page: 1, per_page: 1, moderation_status: 'pending', created_by: user?.id.toString()  }, true);
    const { data: approvedMeta } = useGetMyPropertiesQuery({ listing_type: '', page: 1, per_page: 1, moderation_status: 'approved', created_by: user?.id.toString() }, true);
    // const { data: rejectedMeta } = useGetMyPropertiesQuery({ listing_type: '', page: 1, per_page: 1, moderation_status: 'rejected' }, true);
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
        // rejected: rejectedMeta?.total,
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
                <div className="text-center py-16">
                    <p className="text-gray-500 text-lg">Нет объявлений</p>
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
                                                ? 'bg-[#0036A5] text-white border-[#0036A5]'
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