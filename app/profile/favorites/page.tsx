'use client';

import { useMe } from '@/services/login/hooks';
import { useFavorites } from '@/services/favorites/hooks';
import BuyCard from '@/app/_components/buy/buy-card';
import BuyCardSkeleton from '@/ui-components/BuyCardSkeleton';

export default function ProfileFavorites() {
  const { data: user } = useMe();
  const { data: favorites = [], isLoading } = useFavorites(!!user);
  const mergedFavorites = favorites.filter((favorite) => favorite.property);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-[30px] h-max mb-10 md:mb-16">
        {Array.from({ length: 6 }).map((_, index) => (
          <BuyCardSkeleton key={index} />
        ))}
      </div>
    );
  }

  if (mergedFavorites.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500 text-lg">
          У вас пока нет избранных объявлений
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-[30px] h-max mb-10 md:mb-16">
      {mergedFavorites.map((favorite) => (
        <BuyCard
          key={`${favorite.source ?? 'local'}-${favorite.property?.id ?? favorite.property_id}-${favorite.id}`}
          listing={favorite.property!}
          user={user}
        />
      ))}
    </div>
  );
}
