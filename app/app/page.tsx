import Image from 'next/image';
import Link from 'next/link';

const highlights = [
  {
    title: 'Быстрый поиск',
    description: 'Квартиры, авто и новостройки в одном приложении.',
    image: '/images/extra-pages/home-search.png',
  },
  {
    title: 'Умные фильтры',
    description: 'Подбор по цене, локации и параметрам за секунды.',
    image: '/images/services/calculator.png',
  },
  {
    title: 'Уведомления',
    description: 'Сразу узнавайте о новых объявлениях и изменениях цен.',
    image: '/images/extra-pages/document.png',
  },
];

export default function AppComingSoonPage() {
  return (
    <div className="md:pt-[69px] pb-14 md:pb-[116px]">
      <div className="mx-auto w-full max-w-[1520px] px-4 sm:px-6 lg:px-8">
        <section className="relative overflow-hidden rounded-[24px] bg-gradient-to-r from-[#0036A5] via-[#0D4BCC] to-[#1B5DCE] p-6 md:p-10">
          <div className="absolute -right-10 -top-10 h-44 w-44 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -left-10 -bottom-10 h-44 w-44 rounded-full bg-white/10 blur-2xl" />

          <div className="relative z-10 grid items-center gap-8 md:grid-cols-[1.2fr_1fr]">
            <div>
              <p className="inline-flex rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white">
                Скоро в App Store и Google Play
              </p>
              <h1 className="mt-4 text-3xl font-extrabold text-white md:text-5xl">
                Мобильное приложение Manora в разработке
              </h1>
              <p className="mt-3 max-w-[680px] text-sm text-white/90 md:text-lg">
                Мы готовим удобное приложение для поиска недвижимости и авто.
                Скоро вы сможете пользоваться всеми возможностями Manora прямо с телефона.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/"
                  className="rounded-[10px] bg-white px-5 py-2.5 text-sm font-semibold text-[#0036A5]"
                >
                  На главную
                </Link>
                <Link
                  href="/contacts"
                  className="rounded-[10px] border border-white/60 px-5 py-2.5 text-sm font-semibold text-white"
                >
                  Связаться с нами
                </Link>
              </div>
            </div>

            <div className="relative mx-auto h-[250px] w-full max-w-[360px] md:h-[340px]">
              <Image
                src="/images/personal-cta/img.png"
                alt="Мобильное приложение Manora"
                fill
                className="object-contain"
                priority
              />
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-3">
          {highlights.map((item) => (
            <article
              key={item.title}
              className="rounded-[18px] border border-[#E2E8F0] bg-white p-5"
            >
              <div className="relative h-[82px] w-[82px]">
                <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  className="object-contain"
                />
              </div>
              <h2 className="mt-3 text-lg font-extrabold text-[#0F172A]">{item.title}</h2>
              <p className="mt-1 text-sm text-[#64748B]">{item.description}</p>
            </article>
          ))}
        </section>
      </div>
    </div>
  );
}
