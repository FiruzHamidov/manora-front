'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  CircleUserRound,
  Heart,
  Menu,
  Phone,
  Search,
  SlidersHorizontal,
} from 'lucide-react';
import { useProfile } from '@/services/login/hooks';
import { useGetPropertyTypesQuery } from '@/services/properties/hooks';
import { resolveMediaUrl } from '@/constants/base-url';
import { buildListingsCatalogHref, getPropertyTypeIdsBySlugs } from '@/constants/catalog-links';
import { normalizeRoleSlug } from '@/constants/roles';
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
  const { data: user } = useProfile();
  const { data: propertyTypes } = useGetPropertyTypesQuery();
  const hasUser = Boolean(user?.id);
  const role = normalizeRoleSlug(user?.role?.slug);
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
    { href: '/services', label: 'Партнеры' },
  ];
  const openLoginModal = () => {
    window.dispatchEvent(new Event('open-login-modal'));
  };
  const avatarSrc = user?.photo
    ? resolveMediaUrl(user.photo, '/images/no-image.png', 'local')
    : null;

  useEffect(() => {
    if (!showMobileFilters) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [showMobileFilters]);

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
                <Link
                  href={role === 'developer' ? '/admin/new-buildings' : '/profile'}
                  className="inline-flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-[#CBD5E1] bg-[#F8FAFC]"
                  aria-label="Профиль"
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
                </Link>
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

            <Link href="/more" className="rounded-lg border border-[#E2E8F0] p-2 text-[#334155] md:hidden">
              <Menu size={18} />
            </Link>
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
