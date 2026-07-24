'use client';

import { FC, MouseEventHandler, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useProfile } from '@/services/login/hooks';
import {
  Building2Icon,
  Home,
  LayoutDashboardIcon,
  LucideIcon,
  Menu,
  Plus,
  SearchIcon,
} from 'lucide-react';

const SCROLL_DELTA = 8;
const SHOW_TOP_OFFSET = 48;

type NavItem = {
  name: string;
  href: string;
  icon: LucideIcon;
  opensSidebar?: boolean;
  requiresAuth?: boolean;
};

const openLoginModal = () => {
  window.dispatchEvent(new Event('open-login-modal'));
};

const MobileBottomNavigation: FC = () => {
  const pathname = usePathname();
  const { data: user } = useProfile();
  const isAuthed = Boolean(user?.id);

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
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navItems: NavItem[] = [
    { name: 'Главная', href: '/', icon: Home },
    { name: 'Новостройки', href: '/new-buildings', icon: Building2Icon },
    { name: 'Добавить', href: '/profile/add-post', icon: Plus, requiresAuth: true },
    { name: 'Вторичка', href: '/listings', icon: SearchIcon },
    isAuthed
      ? { name: 'Меню', href: '/profile?menu=open', icon: Menu, opensSidebar: true }
      : { name: 'Ещё', href: '/more', icon: LayoutDashboardIcon },
  ];

  const isActive = (item: NavItem) => {
    if (item.opensSidebar) {
      return pathname.startsWith('/profile') || pathname.startsWith('/admin');
    }

    return pathname === item.href || (item.href === '/favorites' && pathname === '/profile/favorites');
  };

  return (
    <nav
      aria-label="Primary"
      className={`
        md:hidden fixed left-3 right-3 z-40
        bottom-[max(10px,env(safe-area-inset-bottom))]
        rounded-[22px]
        bg-white/95
        supports-[backdrop-filter]:backdrop-blur-xl
        border border-[#DDE6E1]
        shadow-[0_14px_38px_rgba(17,45,35,0.18)]
        transition-all duration-300
        ${hidden ? 'translate-y-10 opacity-0 pointer-events-none scale-[0.97]' : 'translate-y-0 opacity-100 scale-100'}
        px-1.5 pb-1.5 pt-2
      `}
    >
      <div className="relative flex items-center justify-between gap-1">
        {navItems.map((item) => {
          const Icon = item.icon;

          const handleClick: MouseEventHandler<HTMLAnchorElement> = (event) => {
            if (item.requiresAuth && !isAuthed) {
              event.preventDefault();
              openLoginModal();
              return;
            }

            if (item.opensSidebar && pathname.startsWith('/profile')) {
              event.preventDefault();
              window.dispatchEvent(new Event('open-auth-sidebar'));
            }
          };

          const active = isActive(item);

          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={handleClick}
              className={`flex min-w-0 flex-1 flex-col items-center justify-center rounded-2xl px-1 py-1.5 transition-transform duration-200 active:scale-[0.96] ${
                item.requiresAuth ? '-mt-5' : ''
              }`}
            >
              <div className={`relative flex items-center justify-center ${
                item.requiresAuth
                  ? 'h-11 w-11 rounded-2xl bg-[#006341] text-white shadow-[0_8px_18px_rgba(0,99,65,0.28)]'
                  : 'h-7 w-7'
              }`}>
                <Icon
                  className={`
                    h-5 w-5 transition-all duration-300
                    ${active
                      ? item.requiresAuth ? 'text-white' : 'text-[#006341]'
                      : item.requiresAuth ? 'text-white' : 'text-[#748079]'}
                  `}
                />
              </div>
              <span
                className={`
                  mt-1 text-center text-[10px] leading-none transition-all duration-300
                  ${active ? 'font-bold text-[#006341]' : 'font-medium text-[#6E7973]'}
                `}
              >
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileBottomNavigation;
