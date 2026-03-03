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
      ? { name: 'Меню', href: '/profile', icon: Menu, opensSidebar: true }
      : { name: 'Ещё', href: '/more', icon: LayoutDashboardIcon },
  ];

  const isActive = (item: NavItem) => {
    if (item.opensSidebar) {
      return pathname.startsWith('/profile') || pathname.startsWith('/admin');
    }

    return pathname === item.href || (item.href === '/favorites' && pathname === '/profile/favorites');
  };

  const activeIndex = navItems.findIndex((item) => isActive(item));
  const hasActiveItem = activeIndex >= 0;
  const safeActiveIndex = hasActiveItem ? activeIndex : 0;

  return (
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
        <span className="pointer-events-none absolute inset-x-4 -top-0.5 h-px bg-gradient-to-r from-transparent via-white/90 to-transparent" />
        <span
          className="absolute top-0.5 bottom-0.5 h-[50px] rounded-xl border border-white/45 bg-white/22 supports-[backdrop-filter]:backdrop-blur-xl backdrop-saturate-150 shadow-[0_6px_18px_rgba(59,130,246,0.18),inset_0_1px_0_rgba(255,255,255,0.5)] transition-all duration-500 [transition-timing-function:cubic-bezier(.22,1,.36,1)]"
          style={{
            width: `${100 / navItems.length}%`,
            transform: `translateX(${safeActiveIndex * 100}%)`,
            opacity: hasActiveItem ? 1 : 0,
          }}
        />

        {navItems.map((item) => {
          const Icon = item.icon;

          const handleClick: MouseEventHandler<HTMLAnchorElement> = (event) => {
            if (item.requiresAuth && !isAuthed) {
              event.preventDefault();
              openLoginModal();
              return;
            }

            if (item.opensSidebar) {
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
              className="flex min-w-0 flex-1 flex-col items-center justify-center p-1 py-2 transition-transform duration-200 active:scale-[0.97]"
            >
              <div className="relative flex items-center justify-center">
                <Icon
                  className={`
                    h-5.5 w-5.5 transition-all duration-500 [transition-timing-function:cubic-bezier(.22,1,.36,1)]
                    ${active
                      ? 'scale-100 -translate-y-[2px] text-[#0A62FF] drop-shadow-[0_2px_8px_rgba(10,98,255,0.5)]'
                      : 'translate-y-0 scale-95 text-gray-500 opacity-85'}
                  `}
                />
              </div>
              <span
                className={`
                  mt-1 text-center text-[11px] leading-none transition-all duration-500 [transition-timing-function:cubic-bezier(.22,1,.36,1)]
                  ${active ? 'font-semibold text-[#0A62FF] opacity-100 -translate-y-[1px]' : 'text-gray-600 opacity-75'}
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
