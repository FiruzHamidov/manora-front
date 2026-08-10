'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

type DictionaryNavigationItem = {
  href: string;
  label: string;
  exact?: boolean;
};

const navigation: readonly DictionaryNavigationItem[] = [
  { href: '/admin/dictionaries', label: 'Обзор', exact: true },
  { href: '/admin/dictionaries/real-estate', label: 'Недвижимость' },
  { href: '/admin/dictionaries/geography', label: 'География' },
  { href: '/admin/dictionaries/transport', label: 'Транспорт' },
  { href: '/admin/dictionaries/organization', label: 'Организация' },
  { href: '/admin/dictionaries/new-buildings', label: 'Новостройки' },
] as const;

export default function DictionariesLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-[#101828]">Справочники</h1>
        <p className="mt-1 text-sm text-[#667085]">
          Каждый раздел открыт на отдельной странице — ссылка сохраняется при обновлении.
        </p>
      </header>

      <nav aria-label="Разделы справочников" className="flex flex-wrap gap-2">
        {navigation.map(({ href, label, ...item }) => {
          const active = item.exact ? pathname === href : pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? 'page' : undefined}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                active
                  ? 'bg-[#006341] text-white shadow-[0_6px_18px_rgba(0,99,65,0.18)]'
                  : 'border border-[#D0D5DD] bg-white text-[#344054] hover:border-[#9CCDBA] hover:text-[#006341]'
              }`}
            >
              {label}
            </Link>
          );
        })}
      </nav>

      {children}
    </div>
  );
}
