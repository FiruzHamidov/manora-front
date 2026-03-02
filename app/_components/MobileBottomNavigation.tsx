'use client';

import {FC, MouseEventHandler, TouchEventHandler, useEffect, useRef, useState} from 'react';
import Link from 'next/link';
import {usePathname} from 'next/navigation';
import {useLogoutMutation, useProfile} from '@/services/login/hooks';
import {
    Building2Icon,
    Home,
    LayoutDashboardIcon,
    LucideIcon,
    Plus,
    SearchIcon,
    Calendar,
    FileBarChart,
    Heart,
    List,
    MapPin,
    User,
    Users,
    BriefcaseBusiness,
} from 'lucide-react';
import {normalizeRoleSlug} from '@/constants/roles';
import {getAuthorizedMenuItems, ProfileMenuKey} from '@/constants/profile-menu';

const SCROLL_DELTA = 8;
const SHOW_TOP_OFFSET = 48;

type NavItem = {
    name: string;
    href: string;
    icon: LucideIcon;
    key?: string;
};

const SHEET_ICONS: Record<ProfileMenuKey, LucideIcon> = {
    reports: FileBarChart,
    profile: User,
    favorites: Heart,
    myList: List,
    allList: List,
    moderation: List,
    booking: Calendar,
    addPost: Plus,
    users: Users,
    buildings: Building2Icon,
    branches: MapPin,
    crm: BriefcaseBusiness,
};

const MobileBottomNavigation: FC = () => {
    const pathname = usePathname();
    const {data: user} = useProfile();
    const logoutMutation = useLogoutMutation();

    const isAuthed = !!user;
    const role = normalizeRoleSlug(user?.role?.slug);

    // --- авто-скрытие
    const [hidden, setHidden] = useState(false);
    const lastYRef = useRef(0);

    useEffect(() => {
        const onScroll = () => {
            const y = window.scrollY || 0;
            const diff = y - lastYRef.current;
            if (y <= SHOW_TOP_OFFSET) setHidden(false);
            else if (diff > SCROLL_DELTA) setHidden(true);
            else if (diff < -SCROLL_DELTA) setHidden(false);
            lastYRef.current = y;
        };
        lastYRef.current = window.scrollY || 0;
        window.addEventListener('scroll', onScroll, {passive: true});
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    // --- меню навигации снизу
    const navItems: NavItem[] = [
        {name: 'Главная', href: '/', icon: Home},
        {name: 'Новостройки', href: '/new-buildings', icon: Building2Icon},
        {name: 'Добавить', href: '/profile/add-post', icon: Plus},
        {name: 'Вторичка', href: '/listings', icon: SearchIcon},
        {name: 'Ещё', href: '/more', icon: LayoutDashboardIcon, key: 'more'},
    ];

    // --- Bottom Sheet (открывается по «Ещё» для авторизованных)
    const [sheetOpen, setSheetOpen] = useState(false);
    const sheetRef = useRef<HTMLDivElement>(null);
    const startY = useRef<number | null>(null);
    const translateY = useRef(0);

    const openSheet = () => setSheetOpen(true);
    const closeSheet = () => {
        setSheetOpen(false);
        translateY.current = 0;
    };

    // Esc для закрытия
    useEffect(() => {
        if (!sheetOpen) return;
        const onKey = (e: KeyboardEvent) => e.key === 'Escape' && closeSheet();
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [sheetOpen]);

    // простейший свайп вниз
    const onTouchStart: TouchEventHandler<HTMLDivElement> = (e) => {
        startY.current = e.touches[0].clientY;
    };
    const onTouchMove: TouchEventHandler<HTMLDivElement> = (e) => {
        if (startY.current == null) return;
        const dy = e.touches[0].clientY - startY.current;
        if (dy > 0) {
            translateY.current = Math.min(dy, 300);
            if (sheetRef.current) sheetRef.current.style.transform = `translateY(${translateY.current}px)`;
        }
    };
    const onTouchEnd: TouchEventHandler<HTMLDivElement> = () => {
        if (translateY.current > 120) closeSheet();
        else {
            translateY.current = 0;
            if (sheetRef.current) sheetRef.current.style.transform = '';
        }
        startY.current = null;
    };

    const isActive = (href: string) =>
        pathname === href || (href === '/favorites' && pathname === '/profile/favorites');
    const activeIndex = navItems.findIndex((i) => isActive(i.href));
    const hasActiveItem = activeIndex >= 0;
    const safeActiveIndex = hasActiveItem ? activeIndex : 0;

    return (
        <>
            {/* Bottom Nav (iOS-like frosted capsule) */}
            <nav
                aria-label="Primary"
                className={`
          md:hidden fixed left-1 right-1 z-40
          bottom-[max(12px,env(safe-area-inset-bottom))]
          rounded-2xl
          bg-gradient-to-b from-white/45 to-white/20
          supports-[backdrop-filter]:backdrop-blur-2xl
          backdrop-saturate-[1.8]
          border border-white/45
          shadow-[0_12px_40px_rgba(15,23,42,0.20),inset_0_1px_0_rgba(255,255,255,0.65)]
          transition-all duration-500 [transition-timing-function:cubic-bezier(.22,1,.36,1)]
          ${hidden ? 'translate-y-10 opacity-0 pointer-events-none scale-[0.97]' : 'translate-y-0 opacity-100 scale-100'}
          px-1 py-1.5
        `}
            >
                <div className="relative flex items-center justify-between gap-1">
                    <span
                        className="pointer-events-none absolute inset-x-4 -top-0.5 h-px bg-gradient-to-r from-transparent via-white/90 to-transparent"
                    />
                    <span
                        className="absolute top-0.5 bottom-0.5 rounded-xl
                        bg-white/22
                        supports-[backdrop-filter]:backdrop-blur-xl
                        backdrop-saturate-150
                        border border-white/45
                        shadow-[0_6px_18px_rgba(59,130,246,0.18),inset_0_1px_0_rgba(255,255,255,0.5)]
                        transition-all duration-500
                        [transition-timing-function:cubic-bezier(.22,1,.36,1)] h-[50px]"

                        style={{
                            width: `${100 / navItems.length}%`,
                            transform: `translateX(${safeActiveIndex * 100}%)`,
                            opacity: hasActiveItem ? 1 : 0,
                        }}
                    />
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const handleClick: MouseEventHandler<HTMLAnchorElement> = (e) => {
                            if (!isAuthed && item.href === '/profile/add-post') {
                                e.preventDefault();
                                openLoginModal();
                                return;
                            }
                            if (isAuthed && item.key === 'more') {
                                e.preventDefault();
                                openSheet();
                            }
                        };
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                onClick={handleClick}
                                className="flex-1 min-w-0 flex flex-col items-center justify-center p-1 py-2 active:scale-[0.97] transition-transform duration-200"
                            >
                                <div className="relative flex items-center justify-center">
                                    <Icon
                                        className={`
                                            w-5.5 h-5.5 transition-all duration-500
                                            [transition-timing-function:cubic-bezier(.22,1,.36,1)]
                                            ${isActive(item.href)
                                                ? 'text-[#0A62FF] scale-100 -translate-y-[2px] drop-shadow-[0_2px_8px_rgba(10,98,255,0.5)]'
                                                : 'text-gray-500 scale-95 translate-y-0 opacity-85'}
                                        `}
                                    />
                                    {/* active indicator */}
                                </div>
                                <span
                                    className={`
                                        mt-1 text-[11px] leading-none text-center
                                        transition-all duration-500
                                        [transition-timing-function:cubic-bezier(.22,1,.36,1)]
                                        ${isActive(item.href)
                                            ? 'text-[#0A62FF] font-semibold opacity-100 -translate-y-[1px]'
                                            : 'text-gray-600 opacity-75'}
                                    `}
                                >
                                    {item.name}
                                </span>
                                {/* small iOS-like active dot */}
                                {/*<span className={`mt-1 block h-1 w-1 rounded-full ${isActive(item.href) ? 'bg-[#0A62FF]' : 'bg-transparent'}`} />*/}
                            </Link>
                        );
                    })}
                </div>
            </nav>

            {/* Bottom Sheet: iOS-style rounded sheet */}
            {isAuthed && sheetOpen && (
                <div className="md:hidden fixed inset-0 z-71">
                    {/* overlay */}
                    <div className="absolute inset-0 bg-black/35 backdrop-blur-sm transition-opacity duration-300" onClick={closeSheet} aria-hidden/>

                    {/* SHEET */}
                    <div
                        ref={sheetRef}
                        className={`
              absolute left-0 right-0 bottom-0 rounded-t-3xl bg-white/68
              supports-[backdrop-filter]:backdrop-blur-2xl
              border-t border-white/50
              shadow-[0_-16px_40px_rgba(2,6,23,0.25)]
              flex flex-col max-h-[85vh] overflow-hidden
              animate-[sheetIn_.42s_cubic-bezier(.22,1,.36,1)]
            `}
                        role="dialog"
                        aria-modal="true"
                        onTouchStart={onTouchStart}
                        onTouchMove={onTouchMove}
                        onTouchEnd={onTouchEnd}
                    >
                        {/* pull indicator + header */}
                        <div className="px-5 pt-3 pb-2">
                            <div className="flex items-center justify-center">
                                <div className="h-1.5 w-12 rounded-full bg-gray-300"/>
                            </div>
                            <div className="mt-3 flex items-center justify-between">
                                <span className="font-medium text-base"></span>
                                <button
                                    onClick={closeSheet}
                                    aria-label="Закрыть"
                                    className="rounded-lg p-1.5 hover:bg-gray-100"
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="w-5 h-5 text-gray-700"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                              d="M6 18 18 6M6 6l12 12"/>
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {/* content area */}
                        <div className="flex-1 overflow-y-auto px-3 py-2">
                            <nav className="flex flex-col gap-2">
                                {getAuthorizedMenuItems(role).map((item) => (
                                    <SheetLink
                                        key={item.key}
                                        href={item.href}
                                        icon={SHEET_ICONS[item.key]}
                                        label={item.label}
                                        onClick={closeSheet}
                                    />
                                ))}
                            </nav>

                            <div className="mt-6 px-4">
                                <button
                                    onClick={async () => {
                                        await logoutMutation.mutateAsync();
                                        closeSheet();
                                    }}
                                    disabled={logoutMutation.isPending}
                                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="w-5 h-5"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"
                                        />
                                    </svg>
                                    {logoutMutation.isPending ? 'Выходим…' : 'Выйти'}
                                </button>
                            </div>
                        </div>

                        <div className="h-[max(env(safe-area-inset-bottom),0px)]"/>
                    </div>

                    <style jsx global>{`
                        @keyframes sheetIn {
                            from {
                                transform: translateY(18%);
                                opacity: 0.35;
                            }
                            to {
                                transform: translateY(0);
                                opacity: 1;
                            }
                        }
                    `}</style>
                </div>
            )}
        </>
    );
};

export default MobileBottomNavigation;

type SheetLinkProps = {
    href: string;
    icon: LucideIcon;
    label: string;
    onClick: () => void;
};

function SheetLink({href, icon: Icon, label, onClick}: SheetLinkProps) {
    return (
        <Link
            href={href}
            onClick={onClick}
            className="flex items-center gap-3 rounded-xl px-4 py-3 text-[15px] text-gray-800 hover:bg-gray-50"
        >
            <Icon className="w-5 h-5"/>
            <span className="truncate">{label}</span>
        </Link>
    );
}
    const openLoginModal = () => {
        window.dispatchEvent(new Event('open-login-modal'));
    };
