'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  CircleUserRound,
  Heart,
  LogOut,
  Phone,
  Search,
  SlidersHorizontal,
} from 'lucide-react';
import { useLogoutMutation, useProfile } from '@/services/login/hooks';
import { useGetPropertyTypesQuery } from '@/services/properties/hooks';
import { resolveMediaUrl } from '@/constants/base-url';
import { buildListingsCatalogHref, getPropertyTypeIdsBySlugs } from '@/constants/catalog-links';
import { normalizeRoleSlug } from '@/constants/roles';
import { getAuthorizedMenuItems } from '@/constants/profile-menu';
import { PRIMARY_CONTACT_PHONE, toTelHref } from '@/constants/contact';
import MobileCatalogFiltersSheet from '@/app/_components/manora/MobileCatalogFiltersSheet';

const MOBILE_SEARCH_HINTS = ['Новостройки', 'Вторичка', 'Квартиры в аренду', 'Автомобили'];

type MainHeaderProps = {
  hideMobileSearch?: boolean;
};

export default function MainHeader({ hideMobileSearch = false }: MainHeaderProps) {
  const pathname = usePathname();
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [mobileSearch, setMobileSearch] = useState('');
  const [typedHint, setTypedHint] = useState('');
  const [hintIndex, setHintIndex] = useState(0);
  const [isDeletingHint, setIsDeletingHint] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { data: user } = useProfile();
  const logoutMutation = useLogoutMutation();
  const { data: propertyTypes } = useGetPropertyTypesQuery();
  const userMenuRef = useRef<HTMLDivElement | null>(null);
  const hasUser = Boolean(user?.id);
  const role = normalizeRoleSlug(user?.role?.slug);
  const userMenuItems = useMemo(
    () => getAuthorizedMenuItems(role).filter((item) => ['profile', 'myList', 'addPost', 'booking'].includes(item.key)).slice(0, 4),
    [role]
  );
  const shouldShowMobileSearch =
    !hideMobileSearch && !/^\/new-buildings\/[^/]+$/.test(pathname);
  const commercialTypeIds = getPropertyTypeIdsBySlugs(propertyTypes, ['commercial']);
  const navItems = [
    { href: '/new-buildings', label: 'Новостройки' },
    { href: buildListingsCatalogHref(), label: 'Вторичка' },
    { href: buildListingsCatalogHref({ propertyTypeIds: commercialTypeIds }), label: 'Коммерческая' },
    { href: '/mortgage-calculator', label: 'Ипотека' },
    { href: '/cars', label: 'Транспорт' },
    { href: '/about/news', label: 'Журнал' },
    { href: '/partners', label: 'Партнеры' },
  ];
  const openLoginModal = () => {
    window.dispatchEvent(new Event('open-login-modal'));
  };
  const avatarSrc = user?.photo
    ? resolveMediaUrl(user.photo, '/images/no-image.png', 'local')
    : null;
  const userInitial = (user?.name || 'U').trim().charAt(0).toUpperCase();

  useEffect(() => {
    if (!showMobileFilters) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [showMobileFilters]);

  useEffect(() => {
    if (!isUserMenuOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (!userMenuRef.current?.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isUserMenuOpen]);

  useEffect(() => {
    const currentHint = MOBILE_SEARCH_HINTS[hintIndex % MOBILE_SEARCH_HINTS.length];
    const atEdge = !isDeletingHint
      ? typedHint.length >= currentHint.length
      : typedHint.length === 0;

    const timeout = window.setTimeout(() => {
      if (!isDeletingHint) {
        if (typedHint.length < currentHint.length) {
          setTypedHint(currentHint.slice(0, typedHint.length + 1));
          return;
        }
        setIsDeletingHint(true);
        return;
      }

      if (typedHint.length > 0) {
        setTypedHint(typedHint.slice(0, -1));
        return;
      }

      setIsDeletingHint(false);
      setHintIndex((prev) => (prev + 1) % MOBILE_SEARCH_HINTS.length);
    }, atEdge ? 900 : isDeletingHint ? 55 : 95);

    return () => window.clearTimeout(timeout);
  }, [hintIndex, isDeletingHint, typedHint]);

  return (
    <>
      <header className="border-b border-[#E5E7EB] bg-white">
        <div className="mx-auto w-full max-w-[1520px] px-3 md:px-6">
          <div className="flex items-center justify-between gap-3 py-2 md:py-2.5">
            <Link href="/" className="inline-flex items-center">
              <Image
                src="/logo.svg"
                alt="MANORA"
                width={154}
                height={28}
                className="h-6 w-auto md:h-7"
                priority
              />
            </Link>

            <div className="hidden items-center gap-4 md:flex">
              <a
                href={toTelHref(PRIMARY_CONTACT_PHONE)}
                className="inline-flex items-center gap-2 text-sm font-semibold text-[#334155]"
              >
                <Phone size={16} />
                {PRIMARY_CONTACT_PHONE}
              </a>

              <Link href="/favorites" className="p-1.5 text-[#64748B]" aria-label="Избранное">
                <Heart size={18} />
              </Link>

              {hasUser ? (
                <Link
                  href="/profile/add-post"
                  className="rounded-lg bg-[#FACC15] px-4 py-2 text-sm font-bold text-[#111827]"
                >
                  + Объявления
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={openLoginModal}
                  className="rounded-lg bg-[#FACC15] px-4 py-2 text-sm font-bold text-[#111827]"
                >
                  + Объявления
                </button>
              )}

              {hasUser ? (
                <div className="relative" ref={userMenuRef}>
                  <button
                    type="button"
                    onClick={() => setIsUserMenuOpen((prev) => !prev)}
                    className="inline-flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-[#CBD5E1] bg-[#F8FAFC]"
                    aria-label="Открыть меню пользователя"
                    title={user?.name || 'Профиль'}
                  >
                    {avatarSrc ? (
                      <Image
                        src={avatarSrc}
                        alt={user?.name || 'Профиль'}
                        width={40}
                        height={40}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <CircleUserRound size={20} className="text-[#475569]" />
                    )}
                  </button>

                  {isUserMenuOpen ? (
                    <div className="absolute right-0 top-full z-50 mt-3 w-[240px] rounded-2xl border border-[#E2E8F0] bg-white p-2 shadow-[0_18px_45px_rgba(15,23,42,0.12)]">
                      <div className="rounded-xl bg-[#F8FAFC] px-3 py-2">
                        <div className="truncate text-sm font-semibold text-[#0F172A]">{user?.name || 'Профиль'}</div>
                        <div className="mt-0.5 truncate text-xs text-[#64748B]">{user?.role?.name || 'Пользователь'}</div>
                      </div>

                      <div className="mt-2 space-y-1">
                        {userMenuItems.map((item) => (
                          <Link
                            key={item.key}
                            href={item.href}
                            onClick={() => setIsUserMenuOpen(false)}
                            className="block rounded-xl px-3 py-2 text-sm font-medium text-[#334155] transition hover:bg-[#F8FAFC] hover:text-[#0B43B8]"
                          >
                            {item.label}
                          </Link>
                        ))}
                      </div>

                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            await logoutMutation.mutateAsync();
                            setIsUserMenuOpen(false);
                          } catch {
                          }
                        }}
                        disabled={logoutMutation.isPending}
                        className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#F3D0D0] px-3 py-2 text-sm font-medium text-[#B42318] transition hover:bg-[#FFF1F1] disabled:opacity-60"
                      >
                        <LogOut size={16} />
                        {logoutMutation.isPending ? 'Выходим…' : 'Выйти'}
                      </button>
                    </div>
                  ) : null}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={openLoginModal}
                  className="rounded-lg bg-[#E2E8F0] px-4 py-2 text-sm font-semibold text-[#111827]"
                >
                  Войти
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 md:hidden">
              {hasUser ? (
                <button
                  type="button"
                  onClick={() => window.dispatchEvent(new Event('open-auth-sidebar'))}
                  className="inline-flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-[#CBD5E1] bg-[#F8FAFC] text-sm font-semibold text-[#334155]"
                  aria-label="Открыть меню пользователя"
                >
                  {avatarSrc ? (
                    <Image
                      src={avatarSrc}
                      alt={user?.name || 'Профиль'}
                      width={40}
                      height={40}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    userInitial
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={openLoginModal}
                  className="rounded-lg bg-[#FACC15] px-3 py-2 text-sm font-bold text-[#111827]"
                >
                  + Объявления
                </button>
              )}
            </div>
          </div>

          <nav className="hidden items-center gap-7 border-t border-[#E5E7EB] py-3 md:flex">
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="text-[15px] font-semibold text-[#334155] transition-colors hover:text-[#0036A5]"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      {shouldShowMobileSearch && (
        <div className="mx-auto mt-2 w-full max-w-[1520px] px-3 md:hidden">
          <div className="flex items-center gap-2">
            <label className="relative flex-1">
              <Search size={20} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#97A3B8]" />
              <input
                type="search"
                value={mobileSearch}
                onChange={(e) => setMobileSearch(e.target.value)}
                placeholder={typedHint || 'Поиск'}
                className="h-14 w-full rounded-2xl bg-[#FFFFFF] pl-11 pr-4 text-lg text-[#111827] outline-none placeholder:text-[#9CA7BA]"
              />
            </label>
            <button
              type="button"
              onClick={() => setShowMobileFilters(true)}
              className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0036A5] text-white"
              aria-label="Открыть фильтры"
            >
              <SlidersHorizontal size={21} />
            </button>
          </div>
        </div>
      )}

      <MobileCatalogFiltersSheet
        isOpen={showMobileFilters}
        onClose={() => setShowMobileFilters(false)}
      />
    </>
  );
}
