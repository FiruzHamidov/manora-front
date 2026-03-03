'use client';

import Image from 'next/image';
import Link from 'next/link';
import {useMemo} from 'react';
import {useProfile} from '@/services/login/hooks';
import {buildListingsCatalogHref} from '@/constants/catalog-links';

type MenuItem = {
  title: string;
  description: string;
  href: string;
};

export default function MorePage() {
  const {data: user} = useProfile();
  const isAuthed = Boolean(user?.id);
  const menuItems = useMemo<MenuItem[]>(() => {
    return [
      {title: 'Партнеры', description: 'Партнерство с Manora', href: '/partners'},
      {title: 'Команда', description: 'Наши эксперты', href: '/about/team'},
      {title: 'Новости', description: 'Последние обновления', href: '/about/news'},
    ];
  }, []);
  const categoryCards = useMemo(() => ([
    { title: 'Новостройки', image: '/categories/novostroyki.png', href: '/new-buildings' },
    { title: 'Вторичка', image: '/categories/vtorichka.png', href: buildListingsCatalogHref() },
    { title: 'Транспорт', image: '/categories/cars.png', href: '/cars' },
    { title: 'Ипотека', image: '/categories/calc.png', href: '/mortgage-calculator' },
    { title: 'Аренда', image: '/categories/arenda.png', href: buildListingsCatalogHref({ offerType: 'rent' }) },
    { title: 'Категории', image: '/categories/commerce.png', href: '/categories' },
  ]), []);

  const openLoginModal = () => {
    window.dispatchEvent(new Event('open-login-modal'));
  };

  return (
    <div className="mx-auto w-full max-w-[1520px] px-4 py-8 md:px-6">
      <h1 className="mb-5 text-2xl font-bold text-gray-900">Ещё</h1>

      {!isAuthed ? (
        <>
          <div className="mb-8 rounded-[28px] bg-[linear-gradient(135deg,#0B43B8_0%,#2563EB_55%,#60A5FA_100%)] p-5 text-white shadow-[0_20px_50px_rgba(11,67,184,0.22)]">
            <div className="text-lg font-semibold">Авторизуйтесь, чтобы управлять объявлениями</div>
            <p className="mt-2 max-w-[420px] text-sm text-white/80">
              Публикация, избранное и личный кабинет доступны после входа.
            </p>
            <button
              type="button"
              onClick={openLoginModal}
              className="mt-4 rounded-2xl bg-[#FACC15] px-5 py-3 text-sm font-bold text-[#111827]"
            >
              Авторизоваться
            </button>
          </div>

          <div className="mb-8">
            <div className="mb-4 text-lg font-semibold text-[#0F172A]">Популярные разделы</div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              {categoryCards.map((item) => (
                <Link
                  key={item.title}
                  href={item.href}
                  className="relative overflow-hidden rounded-[24px] border border-[#E2E8F0] bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.06)]"
                >
                  <div className="relative z-10 max-w-[120px] text-sm font-semibold text-[#0F172A]">
                    {item.title}
                  </div>
                  <div className="pointer-events-none absolute inset-y-0 right-0 w-[54%]">
                    <Image
                      src={item.image}
                      alt={item.title}
                      fill
                      className="object-contain object-right-bottom"
                      sizes="200px"
                    />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </>
      ) : null}

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
