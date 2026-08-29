import {useGetPropertiesInfiniteQuery, useGetPropertiesStatsQuery} from "@/services/properties/hooks";
import {PropertyFilters} from "@/services/properties/types";
import Buy from "@/app/_components/buy/buy";
import {useEffect, useMemo} from 'react';

type RealtorListingsProps = {
    slug: string;
    selectedRooms: number[];
    onCountChange?: (total: number) => void;
};

const isContiguous = (arr: number[]) => {
    if (arr.length <= 1) return true;
    for (let i = 1; i < arr.length; i++) {
        const prev = arr[i - 1];
        const cur = arr[i];
        if (!(cur === prev + 1)) return false;
    }
    return true;
};

export const RealtorListings: React.FC<RealtorListingsProps> = ({slug, selectedRooms, onCountChange}) => {
    // если выбрано «Все» — не добавляем комнатные фильтры вообще
    const allSelected = selectedRooms.length === 5;

    const filters: PropertyFilters = useMemo(() => {
        const base: PropertyFilters = {
            created_by: slug,
        };

        if (allSelected) return base;

        const sorted = [...selectedRooms].sort((a, b) => a - b);

        if (isContiguous(sorted)) {
            base.rooms_from = String(sorted[0]);
            base.rooms_to = String(sorted[sorted.length - 1]);
            return base;
        }

        base.rooms = sorted.join(','); // 5 трактуется как 5+
        return base;
    }, [slug, allSelected, selectedRooms]);

    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
    } = useGetPropertiesInfiniteQuery(filters);
    const {data: stats} = useGetPropertiesStatsQuery(filters, true);
    const items = useMemo(() => data?.pages.flatMap((page) => page.data) ?? [], [data]);

    useEffect(() => {
        if (onCountChange && stats) onCountChange(stats.total);
    }, [onCountChange, stats]);

    const propertiesForBuy = {
        data: items,
        current_page: 1,
        last_page: 1,
        per_page: 10,
        total: stats?.total ?? items.length,
        from: items.length ? 1 : 0,
        to: items.length,
        first_page_url: '',
        last_page_url: '',
        links: [],
        next_page_url: hasNextPage ? 'cursor' : null,
        path: '',
        prev_page_url: null,
    };

    return (
        <div className="mt-6">
            <Buy
                properties={propertiesForBuy}
                isLoading={isLoading}
                hasTitle={false}
            />

            {hasNextPage ? (
                <div className="mt-6 flex justify-center">
                    <button
                        type="button"
                        onClick={() => void fetchNextPage()}
                        disabled={isFetchingNextPage}
                        className="rounded-full border border-[#006341] px-5 py-2 text-[#006341] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {isFetchingNextPage ? 'Загрузка…' : 'Показать ещё'}
                    </button>
                </div>
            ) : null}
        </div>
    );
};

// Chip — если у вас отдельный экспорт, можете удалить этот экспорт и держать единственный в модуле.
// Оставляю экспорт как у вас был раньше.
export const Chip: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> = ({
                                                                                                        active,
                                                                                                        onClick,
                                                                                                        children
                                                                                                    }) => (
    <button
        type="button"
        onClick={onClick}
        className={`px-4 py-2 rounded-full border transition
      ${active ? 'bg-[#006341] text-white border-[#006341]' : 'bg-white text-[#020617] border-[#BAC0CC]'}
    `}
    >
        {children}
    </button>
);
