'use client';

import Link from 'next/link';
import {useMemo} from 'react';
import {useProfile} from '@/services/login/hooks';
import {normalizeRoleSlug} from '@/constants/roles';
import {getAuthorizedMenuItems} from '@/constants/profile-menu';

type MenuItem = {
  title: string;
  description: string;
  href: string;
};

export default function MorePage() {
  const {data: user} = useProfile();
  const role = normalizeRoleSlug(user?.role?.slug);
  const isAuthed = Boolean(user?.id);

  const menuItems = useMemo<MenuItem[]>(() => {
    const publicItems: MenuItem[] = [
      {title: 'Сервисы', description: 'Дополнительные услуги', href: '/services'},
      {title: 'Команда', description: 'Наши эксперты', href: '/about/team'},
      {title: 'Новости', description: 'Последние обновления', href: '/about/news'},
    ];

    if (!isAuthed) return publicItems;

    return [
      ...publicItems,
      ...getAuthorizedMenuItems(role).map((item) => ({
        title: item.label,
        description: item.description,
        href: item.href,
      })),
    ];
  }, [isAuthed, role]);

  return (
    <div className="container py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-5">Ещё</h1>

      <div className="space-y-3">
        {menuItems.map((item) => (
          <Link key={item.href} href={item.href}>
            <div className="bg-white mb-4 rounded-xl p-4 flex items-center space-x-4">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">{item.title}</h3>
                <p className="text-sm text-gray-600">{item.description}</p>
              </div>
              <svg
                className="w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
