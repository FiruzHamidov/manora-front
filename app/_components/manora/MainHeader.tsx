'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { type FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import {
  Bell,
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
import { CONTACT_PHONES, PRIMARY_CONTACT_PHONE, toTelHref } from '@/constants/contact';
import MobileCatalogFiltersSheet from '@/app/_components/manora/MobileCatalogFiltersSheet';
import ManoraStories from '@/app/_components/manora/ManoraStories';
import { useUnreadNotificationsCountQuery } from '@/services/notifications/hooks';

const MOBILE_SEARCH_HINTS = ['Новостройки', 'Вторичка', 'Квартиры в аренду', 'Автомобили'];

type MainHeaderProps = {
  hideMobileSearch?: boolean;
};

export default function MainHeader({ hideMobileSearch = false }: MainHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [mobileSearch, setMobileSearch] = useState('');
  const [typedHint, setTypedHint] = useState('');
  const [hintIndex, setHintIndex] = useState(0);
  const [isDeletingHint, setIsDeletingHint] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [areStoriesCompact, setAreStoriesCompact] = useState(false);
  const { data: user } = useProfile();
  const logoutMutation = useLogoutMutation();
  const { data: propertyTypes } = useGetPropertyTypesQuery();
  const userMenuRef = useRef<HTMLDivElement | null>(null);
  const storiesCompactRef = useRef(false);
  const previousScrollYRef = useRef(0);
  const storiesTransitionLockRef = useRef(0);
  const hasUser = Boolean(user?.id);
  const { data: unreadNotifications } = useUnreadNotificationsCountQuery(hasUser);
  const unreadCount = unreadNotifications?.unread_count ?? 0;
  const role = normalizeRoleSlug(user?.role?.slug);
  const userMenuItems = useMemo(
    () => getAuthorizedMenuItems(role).filter((item) => ['profile', 'myList', 'addPost', 'booking'].includes(item.key)).slice(0, 4),
    [role]
  );
  const shouldShowMobileSearch =
    !hideMobileSearch &&
    pathname !== '/' &&
    pathname !== '/partners' &&
    !/^\/new-buildings\/[^/]+$/.test(pathname);
  const desktopHeaderSurface = pathname === '/'
    ? areStoriesCompact
      ? 'md:border-white/45 md:bg-white/60 md:shadow-[0_8px_24px_rgba(43,52,48,0.05)] md:backdrop-blur-xl'
      : 'md:border-white/20 md:bg-white/24 md:shadow-none md:backdrop-blur-[3px]'
    : 'md:border-white/45 md:bg-white/72 md:shadow-[0_8px_24px_rgba(43,52,48,0.05)] md:backdrop-blur-xl';
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
  const handleMobileSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = mobileSearch.trim();
    router.push(query ? `/listings?title=${encodeURIComponent(query)}` : '/listings');
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
    let frame = 0;

    const updateStoriesState = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        const scrollY = Math.max(0, window.scrollY);
        const previousScrollY = previousScrollYRef.current;
        const isMovingDown = scrollY > previousScrollY + 0.5;
        const isMovingUp = scrollY < previousScrollY - 0.5;

        previousScrollYRef.current = scrollY;

        if (performance.now() < storiesTransitionLockRef.current) {
          return;
        }

        if (!storiesCompactRef.current && isMovingDown && scrollY >= 24) {
          storiesCompactRef.current = true;
          storiesTransitionLockRef.current = performance.now() + 380;
          setAreStoriesCompact(true);
          return;
        }

        if (storiesCompactRef.current && isMovingUp && scrollY <= 2) {
          storiesCompactRef.current = false;
          storiesTransitionLockRef.current = performance.now() + 380;
          setAreStoriesCompact(false);
        }
      });
    };

    previousScrollYRef.current = Math.max(0, window.scrollY);
    if (previousScrollYRef.current > 44) {
      storiesCompactRef.current = true;
      setAreStoriesCompact(true);
    }

    window.addEventListener('scroll', updateStoriesState, { passive: true });
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('scroll', updateStoriesState);
    };
  }, []);

  useEffect(() => {
    let firstFrame = 0;
    let secondFrame = 0;

    firstFrame = window.requestAnimationFrame(() => {
      secondFrame = window.requestAnimationFrame(() => {
        const shouldBeCompact = window.scrollY > 44;

        if (storiesCompactRef.current === shouldBeCompact) return;

        storiesCompactRef.current = shouldBeCompact;
        previousScrollYRef.current = Math.max(0, window.scrollY);
        storiesTransitionLockRef.current = performance.now() + 380;
        setAreStoriesCompact(shouldBeCompact);
      });
    });

    return () => {
      window.cancelAnimationFrame(firstFrame);
      window.cancelAnimationFrame(secondFrame);
    };
  }, [pathname]);

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
      <header
        className={`sticky top-0 z-[45] border-b bg-white/95 pt-[env(safe-area-inset-top)] shadow-[0_8px_24px_rgba(43,52,48,0.035)] backdrop-blur-xl transition-[background-color,backdrop-filter,border-color,box-shadow] duration-300 md:pt-0 ${desktopHeaderSurface} ${
          pathname === '/' ? 'md:fixed md:inset-x-0' : ''
        } ${
          pathname === '/partners' ? 'hidden md:block' : ''
        }`}
      >
        <div className="relative mx-auto w-full max-w-[1520px] px-4 md:px-6">
          <div className="grid min-h-16 grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 py-2 md:min-h-[72px] md:grid-cols-[auto_minmax(0,1fr)_auto] md:gap-x-6 md:py-0">
            <Link href="/" className="relative z-30 inline-flex min-w-0 shrink items-center pr-1">
              <Image
                src="/logo.svg"
                alt="MANORA"
                width={200}
                height={42}
                className="h-auto w-[168px] max-w-[48vw] md:w-[154px]"
                priority
              />
            </Link>

            <div className="order-3 col-span-2 min-w-0 border-t border-[#EEF2F0] md:order-none md:col-span-1 md:flex md:items-center md:gap-4 md:border-t-0">
              <nav className="hidden shrink-0 items-center gap-5 md:flex">
                {navItems.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="whitespace-nowrap text-[13px] font-semibold text-[#334155] transition-colors hover:text-[#006341] xl:text-[14px]"
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
              <div className="min-w-0 flex-1 md:border-l md:border-[#DCE6E1]/80 md:pl-4">
                <ManoraStories compact={areStoriesCompact} />
              </div>
            </div>

            <div className="hidden shrink-0 items-center gap-3 md:flex">
              {CONTACT_PHONES.length > 0 ? (
                <a
                  href={toTelHref(PRIMARY_CONTACT_PHONE)}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-[#334155]"
                >
                  <Phone size={16} />
                  {PRIMARY_CONTACT_PHONE}
                </a>
              ) : null}

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
                            className="block rounded-xl px-3 py-2 text-sm font-medium text-[#334155] transition hover:bg-[#F8FAFC] hover:text-[#006341]"
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

            <div className="relative z-30 flex shrink-0 items-center gap-1.5 md:hidden">
              {hasUser ? (
                <Link
                  href="/profile/notifications"
                  className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#E5ECE8] bg-white text-[#006341] shadow-[0_2px_10px_rgba(0,99,65,0.06)] transition active:scale-95"
                  aria-label="Открыть уведомления"
                >
                  <Bell size={19} strokeWidth={2} />
                  {unreadCount > 0 ? (
                    <span className="absolute -right-0.5 -top-0.5 flex min-h-4 min-w-4 items-center justify-center rounded-full bg-[#E5484D] px-1 text-[10px] font-bold leading-4 text-white">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  ) : null}
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={openLoginModal}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#E5ECE8] bg-white text-[#006341] shadow-[0_2px_10px_rgba(0,99,65,0.06)] transition active:scale-95"
                  aria-label="Войти, чтобы открыть уведомления"
                >
                  <Bell size={19} strokeWidth={2} />
                </button>
              )}

              {hasUser ? (
                <Link
                  href="/profile?menu=open"
                  className="inline-flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-[#B9DCCF] bg-[#EAF7F2] text-sm font-bold text-[#006341] shadow-[0_2px_10px_rgba(0,99,65,0.08)] transition active:scale-95"
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
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={openLoginModal}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#B9DCCF] bg-[#EAF7F2] text-[#006341] shadow-[0_2px_10px_rgba(0,99,65,0.08)] transition active:scale-95"
                  aria-label="Войти"
                >
                  <CircleUserRound size={20} strokeWidth={2} />
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <div
        data-testid="mobile-search-transition"
        aria-hidden={!shouldShowMobileSearch}
        inert={!shouldShowMobileSearch}
        className={`mx-auto w-full max-w-[1520px] overflow-hidden px-3 transition-[max-height,margin,opacity,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-[max-height,opacity,transform] motion-reduce:transition-none md:hidden ${
          shouldShowMobileSearch
            ? 'pointer-events-auto mt-2 max-h-16 translate-y-0 opacity-100'
            : 'pointer-events-none mt-0 max-h-0 -translate-y-2 opacity-0'
        }`}
      >
        <form className="flex items-center gap-2" onSubmit={handleMobileSearchSubmit}>
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
            type="submit"
            className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-[#006341]"
            aria-label="Найти"
          >
            <Search size={21} />
          </button>
          <button
            type="button"
            onClick={() => setShowMobileFilters(true)}
            className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#006341] text-white"
            aria-label="Открыть фильтры"
          >
            <SlidersHorizontal size={21} />
          </button>
        </form>
      </div>

      <MobileCatalogFiltersSheet
        isOpen={showMobileFilters}
        onClose={() => setShowMobileFilters(false)}
      />
    </>
  );
}
