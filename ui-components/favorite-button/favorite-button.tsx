'use client';

import { FC, MouseEvent, useEffect, useState } from 'react';
import { useMe } from '@/services/login/hooks';
import { useToggleFavorite, useFavorites } from '@/services/favorites/hooks';
import { toast } from 'react-toastify';
import { FavoriteResponse } from '@/services/favorites/types';
import { Heart } from 'lucide-react';

interface FavoriteButtonProps {
  propertyId: number | string;
  source?: 'local' | 'aura';
  className?: string;
  iconClassName?: string;
  label?: string;
  activeLabel?: string;
}

const FavoriteButton: FC<FavoriteButtonProps> = ({
  propertyId,
  source = 'local',
  className = '!bg-white/30 flex items-center justify-center cursor-pointer p-2 rounded-full shadow transition w-[37px] h-[37px]',
  iconClassName = 'w-[18px] h-[18px] text-[#0036A5]',
  label,
  activeLabel = 'Удалить',
}) => {
  const { data: user } = useMe();
  const normalizedPropertyId = Number(propertyId);
  const hasValidPropertyId = Number.isFinite(normalizedPropertyId) && normalizedPropertyId > 0;

  const { data: favorites = [] } = useFavorites(!!user);
  const toggleFavorite = useToggleFavorite();

  const isFavorite = !hasValidPropertyId
    ? false
    : Array.isArray(favorites) && favorites.some(
      (favorite: FavoriteResponse) =>
        (favorite.source ?? 'local') === source &&
        (
          Number(favorite.property?.id) === normalizedPropertyId ||
          Number(favorite.property_id) === normalizedPropertyId ||
          Number(favorite.external_property_id) === normalizedPropertyId
        )
    );

  const [isLoading, setIsLoading] = useState(false);
  const [optimisticIsFavorite, setOptimisticIsFavorite] = useState(isFavorite);

  useEffect(() => {
    setOptimisticIsFavorite(isFavorite);
  }, [isFavorite]);

  const handleClick = async (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isLoading) return;
    if (!hasValidPropertyId) return;

    if (!user) {
      toast.warning(
        'Войдите в аккаунт, чтобы добавить объявление в избранное',
        {
          position: 'top-center',
          autoClose: 3000,
        }
      );

      window.dispatchEvent(new Event('open-login-modal'));
      return;
    }

    setIsLoading(true);
    const nextIsFavorite = !optimisticIsFavorite;
    setOptimisticIsFavorite(nextIsFavorite);

    try {
      await toggleFavorite.mutateAsync({
        propertyId: normalizedPropertyId,
        isFavorite: optimisticIsFavorite,
        source,
      });

      if (optimisticIsFavorite) {
        toast.success('Объявление удалено из избранного', {
          position: 'top-center',
          autoClose: 2000,
        });
      } else {
        toast.success('Объявление добавлено в избранное', {
          position: 'top-center',
          autoClose: 2000,
        });
      }
    } catch (error) {
      setOptimisticIsFavorite(!nextIsFavorite);
      console.error('Error toggling favorite:', error);
      toast.error('Произошла ошибка. Попробуйте еще раз', {
        position: 'top-center',
        autoClose: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resolvedLabel = label
    ? optimisticIsFavorite
      ? activeLabel
      : label
    : undefined;

  return (
    <button
      type="button"
      className={className}
      onClick={handleClick}
      aria-pressed={optimisticIsFavorite}
      aria-label={resolvedLabel ?? 'Избранное'}
    >
      <Heart
        className={`${iconClassName} ${
          optimisticIsFavorite
            ? 'text-[#0036A5] fill-[#0036A5] opacity-100 scale-110'
            : ''
        } ${isLoading ? 'opacity-50' : ''} transition-all duration-200 ease-out ${
          optimisticIsFavorite ? 'animate-[pulse_0.35s_ease-out]' : ''
        }`}
      />
      {resolvedLabel ? <span>{resolvedLabel}</span> : null}
    </button>
  );
};

export default FavoriteButton;
