import Image from 'next/image';
import Link from 'next/link';
import MainShell from '@/app/_components/manora/MainShell';
import {buildListingsCatalogHref} from '@/constants/catalog-links';

const catalogCategories = [
  {
    title: 'Новостройки',
    description: 'Квартиры и планировки в жилых комплексах',
    href: '/new-buildings',
    image: '/categories/01_novostroyki-hq-v2.png',
  },
  {
    title: 'Вторичное жильё',
    description: 'Квартиры и дома от собственников и агентств',
    href: buildListingsCatalogHref(),
    image: '/categories/02_vtorichka-hq-v2.png',
  },
  {
    title: 'Аренда',
    description: 'Жильё для долгосрочной и посуточной аренды',
    href: buildListingsCatalogHref({offerType: 'rent'}),
    image: '/categories/05_arenda-hq-v2.png',
  },
  {
    title: 'Коммерческая недвижимость',
    description: 'Офисы, помещения и объекты для бизнеса',
    href: buildListingsCatalogHref({propertyTypeIds: [5]}),
    image: '/categories/06_kommercheskaya-hq-v2.png',
  },
  {
    title: 'Дома и участки',
    description: 'Частные дома, дачи и земельные участки',
    href: buildListingsCatalogHref({propertyTypeIds: [2, 3]}),
    image: '/categories/07_doma_uchastki-hq-v2.png',
  },
  {
    title: 'Транспорт',
    description: 'Автомобили с подробными характеристиками',
    href: '/cars',
    image: '/categories/03_transport-hq-v2.png',
  },
];

const services = [
  {title: 'Ипотечный калькулятор', href: '/mortgage-calculator', image: '/images/services/calculator.png'},
  {title: 'Оценка недвижимости', href: '/rate-property', image: '/images/extra-pages/rate-property-banner.png'},
  {title: 'Ремонт', href: '/repair', image: '/images/services/renovation.png'},
  {title: 'Дизайн', href: '/design', image: '/images/services/design.png'},
  {title: 'Клининг', href: '/cleaning', image: '/images/services/cleaning.png'},
  {title: 'Оформление документов', href: '/document-registration', image: '/images/services/documents.png'},
];

export default function CategoriesPage() {
  return (
    <MainShell>
      <main className="mx-auto w-full max-w-[1520px] px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-extrabold text-[#111827]">Все категории</h1>
        <p className="mt-2 max-w-2xl text-sm text-[#64748B] md:text-base">
          Выберите нужный каталог или сервис Manora.
        </p>

        <section className="mt-7">
          <h2 className="text-xl font-bold text-[#111827]">Объявления</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {catalogCategories.map((item) => (
              <Link
                key={item.title}
                href={item.href}
                className="group relative min-h-40 overflow-hidden rounded-[22px] border border-[#E2E8F0] bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.05)] transition hover:-translate-y-0.5 hover:border-[#BFD7CE] hover:shadow-[0_12px_30px_rgba(0,99,65,0.10)]"
              >
                <div className="relative z-10 max-w-[62%]">
                  <h3 className="text-lg font-extrabold text-[#111827] group-hover:text-[#006341]">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-5 text-[#64748B]">{item.description}</p>
                </div>
                <div className="pointer-events-none absolute inset-y-2 right-2 w-[42%]">
                  <Image src={item.image} alt="" fill className="object-contain object-right" sizes="220px" />
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-bold text-[#111827]">Сервисы</h2>
          <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
            {services.map((item) => (
              <Link
                key={item.title}
                href={item.href}
                className="rounded-[18px] border border-[#E2E8F0] bg-white p-4 transition hover:border-[#BFD7CE] hover:shadow-[0_8px_24px_rgba(0,99,65,0.08)]"
              >
                <div className="relative h-20 w-full">
                  <Image src={item.image} alt="" fill className="object-contain" sizes="180px" />
                </div>
                <h3 className="mt-3 text-sm font-bold text-[#1D2924]">{item.title}</h3>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </MainShell>
  );
}
