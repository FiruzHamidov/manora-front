'use client';

import {useState} from 'react';
import {useMe} from '@/services/login/hooks';
import {useFavorites} from '@/services/favorites/hooks';
import {Tabs} from '@/ui-components/tabs/tabs';
import BuyCard from '../_components/buy/buy-card';
import BuyCardSkeleton from '@/ui-components/BuyCardSkeleton';
import {FavoriteResponse} from '@/services/favorites/types';
import {User} from "@/services/login/types";

type FilterType = 'all' | 'sale' | 'rent';

const FavoritesGrid = ({
                           favorites,
                           isLoading,
                           user
                       }: {
    favorites: FavoriteResponse[];
    isLoading: boolean;
    user?: User;

}) => {
    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-[30px] mb-10 md:mb-16">
                {Array.from({length: 8}).map((_, index) => (
                    <BuyCardSkeleton key={index}/>
                ))}
            </div>
        );
    }

    if (favorites.length === 0) {
        return (
            <div className="text-center py-16">
                <p className="text-gray-500 text-lg">Нет избранных объявлений</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-[30px] mb-10 md:mb-16">
            {favorites.map((favorite: FavoriteResponse) => (
                <BuyCard
                    key={`${favorite.source ?? 'local'}-${favorite.property?.id ?? favorite.property_id}-${favorite.id}`}
                    listing={favorite.property!}
                    user={user}
                />
            ))}
        </div>
    );
};

export default function Favorites() {
    const [activeFilter, setActiveFilter] = useState<FilterType>('all');
    const {data: user} = useMe();
    const {data: favorites = [], isLoading} = useFavorites(!!user);
    const allFavorites = favorites.filter((favorite) => favorite.property);


    const filteredFavorites =
        activeFilter === 'all'
            ? allFavorites
            : allFavorites.filter(
                (favorite) =>
                    favorite.property &&
                    (activeFilter === 'rent'
                        ? favorite.property.offer_type === 'rent'
                        : favorite.property.offer_type === 'sale' ||
                        favorite.property.offer_type !== 'rent')
            );

    return (
        <div className="mx-auto w-full max-w-[1520px] px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-[22px] p-[30px] my-10">
                <h1 className="text-2xl font-bold text-[#020617] mb-1">Избранное</h1>
                <p className="text-[#666F8D]">
                    {isLoading ? 'Загрузка...' : `${filteredFavorites.length} объекта`}
                </p>

                <div className="mt-6">
                    <Tabs
                        tabs={[
                            {key: 'all', label: 'Все'},
                            {key: 'sale', label: 'Купить'},
                            {key: 'rent', label: 'Снять'},
                        ]}
                        activeType={activeFilter}
                        setActiveType={setActiveFilter}
                    />
                </div>
            </div>

            <FavoritesGrid favorites={filteredFavorites} isLoading={isLoading} user={user ?? undefined}/>
        </div>
    );
}
