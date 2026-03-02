'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const REPORT_NAV_ITEMS = [
  { label: 'Общий', href: '/profile/reports' },
  { label: 'Сравнение месяцев', href: '/profile/reports/monthly-comparison' },
  { label: 'Объекты', href: '/profile/reports/objects' },
  { label: 'Показы', href: '/profile/reports/bookings' },
  { label: 'Без телефона', href: '/profile/reports/missing-phone' },
] as const;

export function ReportsNavigation() {
  const pathname = usePathname();

  const isActive = (href: string) =>
    pathname === href || (href !== '/profile/reports' && pathname.startsWith(href));

  return (
    <div className="overflow-x-auto hide-scrollbar">
      <nav className="inline-flex min-w-full gap-2 rounded-2xl bg-white p-2 shadow">
        {REPORT_NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`whitespace-nowrap rounded-xl px-4 py-2 text-sm font-medium transition ${
              isActive(item.href)
                ? 'bg-[#0036A5] text-white'
                : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
