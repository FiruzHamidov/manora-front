import {FC, useMemo} from 'react';
import BuyCard from './buy-card';
import BuyCardSkeleton from '@/ui-components/BuyCardSkeleton';
import {PropertiesResponse, Property} from '@/services/properties/types';
import {useProfile} from "@/services/login/hooks";
import GoogleAdSlot from '@/app/_components/ads/GoogleAdSlot';
import { getBuyListAdStep } from '@/app/_components/ads/policy';

const Buy: FC<{
    properties: PropertiesResponse | undefined;
    hasTitle?: boolean;
    title?: string;
    isLoading?: boolean;
    injectAdsEveryTen?: boolean;
}> = ({properties, hasTitle = true, isLoading = false, title = 'Купить', injectAdsEveryTen = false}) => {
    const {data: user} = useProfile();
    const adSlots = ['6883589929'];
    const adInsertionStep = useMemo(
        () => (injectAdsEveryTen ? getBuyListAdStep() : 10),
        [injectAdsEveryTen]
    );

    const buyListings = useMemo(() => {
        if (!properties?.data) return [];

        return properties.data;
    }, [properties]);

    const gridItems = useMemo(() => {
        if (!buyListings.length) return [];

        const items: Array<
            { type: 'listing'; listing: Property } | { type: 'ad'; key: string; slot: string }
        > = [];

        buyListings.forEach((listing, index) => {
            items.push({ type: 'listing', listing });
            if (injectAdsEveryTen && (index + 1) % adInsertionStep === 0) {
                const adIndex = Math.floor((index + 1) / adInsertionStep) - 1;
                items.push({
                    type: 'ad',
                    key: `ad-after-${index + 1}`,
                    slot: adSlots[adIndex % adSlots.length],
                });
            }
        });

        return items;
    }, [buyListings, injectAdsEveryTen, adInsertionStep]);

    if (isLoading) {
        return (
            <section>
                <div className="mx-auto w-full max-w-[1520px] px-4 sm:px-6 lg:px-8">
                    {hasTitle && (
                        <h2 className="text-2xl md:text-4xl font-bold text-[#020617] mb-6 md:mb-10">
                            {title}
                        </h2>
                    )}
                    <div
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-[30px]">
                        {Array.from({length: 8}).map((_, index) => (
                            <BuyCardSkeleton key={index}/>
                        ))}
                    </div>
                </div>
            </section>
        );
    }

    if (!properties) {
        return (
            <section>
                <div className="mx-auto w-full max-w-[1520px] px-4 sm:px-6 lg:px-8">
                    {hasTitle && (
                        <h2 className="text-2xl md:text-4xl font-bold text-[#020617] mb-6 md:mb-10">
                            Купить
                        </h2>
                    )}
                    <div className="text-center py-6">Загрузка объявлений...</div>
                </div>
            </section>
        );
    }

    if (buyListings.length === 0) {
        return (
            <section>
                <div className="mx-auto w-full max-w-[1520px] px-4 sm:px-6 lg:px-8">
                    {hasTitle && (
                        <h2 className="text-2xl md:text-4xl font-bold text-[#020617] mb-6 md:mb-10">
                            Купить
                        </h2>
                    )}
                    <div className="text-center py-6">
                        Объявления по заданному фильтру не найдены
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section>
            <div className="mx-auto w-full max-w-[1520px] px-4 sm:px-6 lg:px-8">
                {hasTitle && (
                    <h2 className="text-2xl md:text-4xl font-bold text-[#020617] mb-6 md:mb-10">
                        {title}
                    </h2>
                )}

                <div
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-[30px]">
                    {gridItems.map((item, index) => {
                        if (item.type === 'listing') {
                            return (
                                <BuyCard
                                    listing={item.listing}
                                    user={user}
                                    key={`listing-${item.listing.id}-${index}`}
                                    isForClient={true}
                                />
                            );
                        }

                        return (
                            <div
                                key={item.key}
                                className="bg-white rounded-[22px] p-4 flex items-center justify-center min-h-[360px] shadow-sm"
                            >
                                <GoogleAdSlot
                                    slot={item.slot}
                                    format="fluid"
                                    fullWidthResponsive="true"
                                    layoutKey="-6t+ed+2i-1n-4w"
                                    className="w-full"
                                />
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
};

export default Buy;
