import { ReactNode } from 'react';
import Link from 'next/link';

const adminLinks = [
  { href: '/admin/users', label: 'Пользователи' },
  { href: '/admin/crm', label: 'CRM' },
  { href: '/admin/new-buildings', label: 'Новостройки' },
  { href: '/admin/reels', label: 'Рилсы' },
];

export default function ProfileLayout({ children }: { children: ReactNode }) {
  return (
      <div className="mx-auto w-full max-w-[1520px] px-4 sm:px-6 lg:px-8 pt-4 pb-24">
        <nav className="mb-5 flex flex-wrap gap-2 rounded-[22px] bg-white p-3 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
          {adminLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-xl border border-[#D0D5DD] px-4 py-2 text-sm font-medium text-[#344054] transition hover:border-[#B2CCFF] hover:bg-[#EEF4FF] hover:text-[#0B43B8]"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <main className="mt-1 min-w-0">
          {children}
        </main>
      </div>
  );
}
