'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

type MenuItem = { href: string; label: string };

const ALL_ITEMS: MenuItem[] = [
  {
    href: '/admin/new-buildings',
    label: 'Новостройки',
  },
  {
    href: '/admin/new-buildings/developers',
    label: 'Застройщики',
  },
  {
    href: '/admin/new-buildings/stages',
    label: 'Этапы строительства',
  },
  {
    href: '/admin/new-buildings/materials',
    label: 'Материалы',
  },
  {
    href: '/admin/new-buildings/features',
    label: 'Особенности',
  },
];

export const Navbar = () => {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/admin/new-buildings') {
      return pathname === '/admin/new-buildings';
    }
    return pathname.startsWith(href);
  };

  const itemCls = (active: boolean) =>
    `inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm transition-colors
     ${active ? 'bg-[#0036A5] text-white' : 'text-gray-700 hover:bg-gray-100'}`;

  return (
    <>
      <div className="mx-auto max-w-[1520px] hidden md:block sticky top-10">
        <div className="bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 rounded-xl">
          <nav className="flex items-center gap-2 overflow-x-auto scrollbar-none py-3 px-2">
            {ALL_ITEMS.map(({ href, label }) => {
              const active = isActive(href);
              return (
                <Link
                  key={href}
                  href={href}
                  prefetch={false}
                  aria-current={active ? 'page' : undefined}
                  className={itemCls(active)}
                >
                  <span className="whitespace-nowrap">{label}</span>
                </Link>
              );
            })}
          </nav>
          {/* нижняя синяя линия как у табов */}
          <div className="h-[1px] w-full bg-gray-100" />
        </div>
      </div>
    </>
  );
};
