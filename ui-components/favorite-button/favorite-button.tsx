'use client';

import type { FC, MouseEvent } from 'react';
import { Heart } from 'lucide-react';
import { toast } from 'react-toastify';
import { isAxiosError } from 'axios';
import { useFavoritesState } from '@/services/favorites/hooks';
import { favoriteKey, validFavoriteTarget, type FavoriteType } from '@/services/favorites/types';

interface FavoriteButtonProps {
  propertyId: number | string;
  source?: 'local' | 'aura';
  targetType?: FavoriteType;
  listingType?: string;
  className?: string;
  activeClassName?: string;
  iconClassName?: string;
  activeIconClassName?: string;
  label?: string;
  activeLabel?: string;
}
const FavoriteButton: FC<FavoriteButtonProps> = ({ propertyId, source = 'local', targetType, listingType,
  className = 'flex min-h-11 min-w-11 items-center justify-center rounded-full bg-white/80 p-2 shadow', activeClassName = '',
  iconClassName = 'h-[18px] w-[18px] text-[#006341]', activeIconClassName = 'fill-[#006341]', label, activeLabel = 'Удалить из избранного' }) => {
  const favorites = useFavoritesState();
  const target = { type: targetType ?? (listingType === 'new-buildings' ? 'new_building' : 'property'), id: Number(propertyId), source };
  const valid = validFavoriteTarget(target), saved = valid && favorites.targets.some(item => favoriteKey(item) === favoriteKey(target));
  const disabled = !valid || favorites.loading || favorites.busy || !!favorites.error;
  async function click(event: MouseEvent) {
    event.preventDefault(); event.stopPropagation();
    if (disabled) return;
    try {
      await favorites.change(target, !saved);
      toast.success(saved ? 'Объект удалён из избранного' : favorites.userId ? 'Объект добавлен в избранное' : 'Сохранено в этом браузере. После входа избранное объединится.', { autoClose: 2500 });
    } catch (error) {
      toast.error(isAxiosError(error) ? error.response?.data?.message || 'Не удалось изменить избранное. Попробуйте снова.' : error instanceof Error ? error.message : 'Не удалось изменить избранное.');
    }
  }
  return <button type="button" className={className + ' focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-800 disabled:opacity-50 ' + (saved ? activeClassName : '')}
    disabled={disabled} onClick={click} aria-pressed={saved} aria-label={saved ? activeLabel : label || 'В избранное'} title={favorites.error || undefined}>
    <Heart aria-hidden="true" className={iconClassName + (saved ? ' ' + activeIconClassName : '')} />
    {label && <span>{saved ? activeLabel : label}</span>}
  </button>;
};
export default FavoriteButton;
