'use client';

import Image from 'next/image';
import { JSX, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useLogoutMutation, useProfile } from '@/services/login/hooks';
import { useGetMyPropertiesQuery } from '@/services/properties/hooks';
import {
  Building,
  Calendar as CalendarIcon,
  FileBarChart as ReportsIcon,
  Heart as HeartIcon,
  MessageCircle as MessageCircleIcon,
  LogOut as LogOutIcon,
  MapPin,
  Plus as PlusIcon,
  School,
  User as UserIcon,
  Users as UsersIcon,
  X,
  BriefcaseBusiness as BriefcaseBusinessIcon,
} from 'lucide-react';
import type { User } from '@/services/login/types';
import { resolveMediaUrl } from '@/constants/base-url';
import { RoleSlug, normalizeRoleSlug } from '@/constants/roles';
import { getAuthorizedMenuItems, ProfileMenuKey } from '@/constants/profile-menu';

type MenuItem = { href: string; label: string; icon: JSX.Element };

const MY_LISTINGS_SUBMENU = [
  { key: 'pending', label: 'На модерации' },
  { key: 'approved', label: 'Активные' },
  { key: 'sold', label: 'Продано' },
  { key: 'rented', label: 'Арендовано' },
] as const;

type MyListingsSubmenuKey = (typeof MY_LISTINGS_SUBMENU)[number]['key'];

const SIDEBAR_ICONS: Record<ProfileMenuKey, JSX.Element> = {
  reports: <ReportsIcon className="h-5 w-5" />,
  profile: <UserIcon className="h-5 w-5" />,
  messages: <MessageCircleIcon className="h-5 w-5" />,
  favorites: <HeartIcon className="h-5 w-5" />,
  myList: <School className="h-5 w-5" />,
  allList: <School className="h-5 w-5" />,
  moderation: <School className="h-5 w-5" />,
  booking: <CalendarIcon className="h-5 w-5" />,
  addPost: <PlusIcon className="h-5 w-5" />,
  users: <UsersIcon className="h-5 w-5" />,
  buildings: <Building className="h-5 w-5" />,
  branches: <MapPin className="h-5 w-5" />,
  crm: <BriefcaseBusinessIcon className="h-5 w-5" />,
};

function SidebarContent({
  menuToRender,
  pathname,
  activeMyListingsTab,
  myListingsTotals,
  collapsed = false,
  showCloseButton = false,
  onClose,
  onNavigate,
  onLogout,
  isLoggingOut,
  user,
}: {
  menuToRender: MenuItem[];
  pathname: string;
  activeMyListingsTab: MyListingsSubmenuKey;
  myListingsTotals: Record<MyListingsSubmenuKey, number>;
  collapsed?: boolean;
  showCloseButton?: boolean;
  onClose?: () => void;
  onNavigate?: () => void;
  onLogout: () => void;
  isLoggingOut: boolean;
  user?: User;
}) {
  const isActive = (href: string) =>
    href === '/profile' ? pathname === '/profile' : pathname.startsWith(href);
  const avatarSrc = user?.photo
    ? resolveMediaUrl(user.photo, '/images/no-image.png', 'local')
    : null;

  return (
    <div className={`relative flex h-full flex-col rounded-[28px] border border-[#D9E2EF] bg-white/92 p-4 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur transition-[width,padding] duration-300 ${collapsed ? 'items-center px-3' : ''}`}>
      {showCloseButton ? (
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#334155] shadow-sm"
          aria-label="Закрыть меню"
        >
          <X className="h-5 w-5" />
        </button>
      ) : null}

      <div className={`rounded-[22px] bg-[linear-gradient(135deg,#006341_0%,#008A5A_55%,#00A86B_100%)] p-4 text-white transition-all duration-300 ${collapsed ? 'w-full px-2 py-3' : ''}`}>
        <div className={`flex ${collapsed ? 'justify-center' : 'items-center gap-3'}`}>
          <div className={`relative overflow-hidden rounded-2xl border border-white/30 bg-white/15 shadow-[inset_0_1px_0_rgba(255,255,255,0.28)] ${collapsed ? 'h-12 w-12' : 'h-16 w-16'}`}>
            {avatarSrc ? (
              <Image
                src={avatarSrc}
                alt={user?.name || 'Профиль'}
                fill
                className="object-cover"
                sizes={collapsed ? '48px' : '64px'}
              />
            ) : (
              <div className={`flex h-full w-full items-center justify-center font-semibold text-white ${collapsed ? 'text-base' : 'text-xl'}`}>
                {(user?.name || 'U').trim().charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          {!collapsed ? (
            <div className="min-w-0 flex-1">
              <div className="truncate text-base font-semibold">{user?.name || 'Без имени'}</div>
              <div className="mt-1 truncate text-sm text-white/80">{user?.role?.name || 'Роль не указана'}</div>
            </div>
          ) : null}
        </div>
      </div>

      <nav className={`mt-4 flex-1 space-y-1 overflow-y-auto ${collapsed ? 'w-full' : 'pr-1'}`}>
        {menuToRender.map(({ href, icon, label }) => {
          const active = isActive(href);
          const hasMyListingsSubmenu = href === '/profile/my-listings' && !collapsed;

          return (
            <div key={`${href}-${label}`}>
              <Link
                href={href}
                prefetch={false}
                aria-current={active ? 'page' : undefined}
                onClick={onNavigate}
                title={collapsed ? label : undefined}
                className={`flex items-center rounded-2xl py-3 text-sm font-medium transition ${
                  active
                    ? 'bg-[#006341] text-white shadow-[0_10px_30px_rgba(0,99,65,0.24)]'
                    : 'text-[#334155] hover:bg-[#EFFAF5] hover:text-[#006341]'
                } ${collapsed ? 'justify-center px-3' : 'gap-3 px-4'}`}
              >
                {icon}
                {!collapsed ? <span className="truncate">{label}</span> : null}
              </Link>

              {hasMyListingsSubmenu ? (
                <div className="mt-2 space-y-1 pl-4">
                  {MY_LISTINGS_SUBMENU.map((item) => {
                    const subActive = pathname.startsWith('/profile/my-listings') && activeMyListingsTab === item.key;

                    return (
                      <Link
                        key={item.key}
                        href={`/profile/my-listings?tab=${item.key}`}
                        prefetch={false}
                        onClick={onNavigate}
                        className={`flex items-center justify-between rounded-xl px-4 py-2 text-sm transition ${
                          subActive
                            ? 'bg-[#EFFAF5] font-medium text-[#006341]'
                            : 'text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#334155]'
                        }`}
                      >
                        <span>{item.label}</span>
                        <span>({myListingsTotals[item.key] ?? 0})</span>
                      </Link>
                    );
                  })}
                </div>
              ) : null}
            </div>
          );
        })}
      </nav>

      <button
        type="button"
        onClick={onLogout}
        disabled={isLoggingOut}
        title={collapsed ? 'Выйти' : undefined}
        className={`mt-4 inline-flex items-center justify-center rounded-2xl border border-[#F3D0D0] py-3 text-sm font-medium text-[#B42318] transition hover:bg-[#FFF1F1] disabled:opacity-60 ${collapsed ? 'w-full px-3' : 'gap-2 px-4'}`}
      >
        <LogOutIcon className="h-5 w-5" />
        {!collapsed ? (isLoggingOut ? 'Выходим…' : 'Выйти') : null}
      </button>
    </div>
  );
}

export const Sidebar = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { data: user } = useProfile();
  const logoutMutation = useLogoutMutation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopExpanded, setDesktopExpanded] = useState(false);

  const role: RoleSlug = useMemo(
    () => normalizeRoleSlug((user as User)?.role?.slug),
    [user]
  );

  const menuToRender: MenuItem[] = getAuthorizedMenuItems(role).map((item) => ({
    href: item.href,
    label: item.label,
    icon: SIDEBAR_ICONS[item.key],
  }));
  const createdBy = user?.id?.toString();
  const activeMyListingsTab = (searchParams.get('tab') as MyListingsSubmenuKey | null) ?? 'approved';
  const canSeeMyListingsSubmenu = menuToRender.some((item) => item.href === '/profile/my-listings') && Boolean(createdBy);

  const { data: pendingMeta } = useGetMyPropertiesQuery(
    { listing_type: '', page: 1, per_page: 1, moderation_status: 'pending', created_by: createdBy },
    true
  );
  const { data: approvedMeta } = useGetMyPropertiesQuery(
    { listing_type: '', page: 1, per_page: 1, moderation_status: 'approved', created_by: createdBy },
    true
  );
  const { data: soldMeta } = useGetMyPropertiesQuery(
    { listing_type: '', page: 1, per_page: 1, moderation_status: 'sold', created_by: createdBy },
    true
  );
  const { data: rentedMeta } = useGetMyPropertiesQuery(
    { listing_type: '', page: 1, per_page: 1, moderation_status: 'rented', created_by: createdBy },
    true
  );

  const myListingsTotals: Record<MyListingsSubmenuKey, number> = {
    pending: canSeeMyListingsSubmenu ? pendingMeta?.total ?? 0 : 0,
    approved: canSeeMyListingsSubmenu ? approvedMeta?.total ?? 0 : 0,
    sold: canSeeMyListingsSubmenu ? soldMeta?.total ?? 0 : 0,
    rented: canSeeMyListingsSubmenu ? rentedMeta?.total ?? 0 : 0,
  };

  useEffect(() => {
    const openSidebar = () => setMobileOpen(true);
    window.addEventListener('open-auth-sidebar', openSidebar);
    return () => window.removeEventListener('open-auth-sidebar', openSidebar);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileOpen]);

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
      setMobileOpen(false);
    } catch {
    }
  };

  return (
    <>
      <aside
        className={`fixed left-4 top-[96px] z-30 hidden h-[calc(100vh-112px)] transition-[width] duration-300 lg:block xl:left-6 ${desktopExpanded ? 'w-[252px] xl:w-[268px]' : 'w-[88px]'}`}
        onMouseEnter={() => setDesktopExpanded(true)}
        onMouseLeave={() => setDesktopExpanded(false)}
      >
        <SidebarContent
          menuToRender={menuToRender}
          pathname={pathname}
          activeMyListingsTab={activeMyListingsTab}
          myListingsTotals={myListingsTotals}
          collapsed={!desktopExpanded}
          onLogout={handleLogout}
          isLoggingOut={logoutMutation.isPending}
          user={user as User | undefined}
        />
      </aside>

      <div className={`fixed inset-0 z-50 transition-all duration-300 lg:hidden ${mobileOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}>
        <button
          type="button"
          aria-label="Закрыть меню"
          onClick={() => setMobileOpen(false)}
          className={`absolute inset-0 bg-[#020617]/45 backdrop-blur-sm transition-opacity duration-300 ${mobileOpen ? 'opacity-100' : 'opacity-0'}`}
        />

        <div className={`absolute left-0 top-0 h-full w-[86vw] max-w-[320px] p-3 transition-transform duration-300 ease-out ${mobileOpen ? 'translate-x-0' : '-translate-x-[104%]'}`}>
          <SidebarContent
            menuToRender={menuToRender}
            pathname={pathname}
            activeMyListingsTab={activeMyListingsTab}
            myListingsTotals={myListingsTotals}
            showCloseButton
            onClose={() => setMobileOpen(false)}
            onNavigate={() => setMobileOpen(false)}
            onLogout={handleLogout}
            isLoggingOut={logoutMutation.isPending}
            user={user as User | undefined}
          />
        </div>
      </div>
    </>
  );
};
