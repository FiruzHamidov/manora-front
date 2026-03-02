'use client';

import {JSX, useMemo} from 'react';
import Link from 'next/link';
import {usePathname} from 'next/navigation';
import {useLogoutMutation, useProfile} from '@/services/login/hooks';
import {
    Building,
    Calendar as CalendarIcon,
    FileBarChart as ReportsIcon,
    Heart as HeartIcon,
    LogOut as LogOutIcon,
    Plus as PlusIcon,
    School,
    MapPin,
    User as UserIcon,
    Users as UsersIcon,
    BriefcaseBusiness as BriefcaseBusinessIcon,
} from 'lucide-react';
import type {User} from '@/services/login/types';
import {RoleSlug, normalizeRoleSlug} from '@/constants/roles';
import {getAuthorizedMenuItems, ProfileMenuKey} from '@/constants/profile-menu';

type MenuItem = { href: string; label: string; icon: JSX.Element };

const SIDEBAR_ICONS: Record<ProfileMenuKey, JSX.Element> = {
    reports: <ReportsIcon className="w-5 h-5"/>,
    profile: <UserIcon className="w-5 h-5"/>,
    favorites: <HeartIcon className="w-5 h-5"/>,
    myList: <School className="w-5 h-5"/>,
    allList: <School className="w-5 h-5"/>,
    moderation: <School className="w-5 h-5"/>,
    booking: <CalendarIcon className="w-5 h-5"/>,
    addPost: <PlusIcon className="w-5 h-5"/>,
    users: <UsersIcon className="w-5 h-5"/>,
    buildings: <Building className="w-5 h-5"/>,
    branches: <MapPin className="w-5 h-5"/>,
    crm: <BriefcaseBusinessIcon className="w-5 h-5"/>,
};

export const Sidebar = () => {
    const pathname = usePathname();
    const {data: user} = useProfile();
    const logoutMutation = useLogoutMutation();

    const role: RoleSlug = useMemo(
        () => normalizeRoleSlug((user as User)?.role?.slug),
        [user]
    );

    const menuToRender: MenuItem[] = getAuthorizedMenuItems(role).map((item) => ({
        href: item.href,
        label: item.label,
        icon: SIDEBAR_ICONS[item.key],
    }));

    const isActive = (href: string) =>
        href === '/profile' ? pathname === '/profile' : pathname.startsWith(href);

    const itemCls = (active: boolean) =>
        `inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm transition-colors
     ${active ? 'bg-[#0036A5] text-white' : 'text-gray-700 hover:bg-gray-100'}`;

    const handleLogout = async () => {
        try {
            await logoutMutation.mutateAsync();
        } catch {
        }
    };

    return (
        <>
            {/* DESKTOP: горизонтальные "табы" + sticky */}
            <div className="mx-auto max-w-[1520px] px-7 mt-5 hidden md:block sticky top-2 z-3 ">
                <div className="bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 rounded-xl">
                    <nav className="flex items-center gap-2 overflow-x-auto scrollbar-none py-3 px-2">
                        {menuToRender.map(({href, icon, label}) => {
                            const active = isActive(href);
                            return (
                                <Link
                                    key={`${href}-${label}`}
                                    href={href}
                                    prefetch={false}
                                    aria-current={active ? 'page' : undefined}
                                    className={itemCls(active)}
                                >
                                    {icon}
                                    <span className="whitespace-nowrap">{label}</span>
                                </Link>
                            );
                        })}
                        <div className="ml-auto">
                            <button
                                onClick={handleLogout}
                                disabled={logoutMutation.isPending}
                                className="inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
                            >
                                <LogOutIcon className="w-5 h-5"/>
                                {logoutMutation.isPending ? 'Выходим…' : 'Выйти'}
                            </button>
                        </div>
                    </nav>
                    {/* нижняя синяя линия как у табов */}
                    <div className="h-[1px] w-full bg-gray-100"/>
                </div>
            </div>
        </>
    );
};
