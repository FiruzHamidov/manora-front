import Link from 'next/link';
import { Building2, CarFront, Factory, MapPinned, Shapes } from 'lucide-react';

const sections = [
  {
    href: '/admin/dictionaries/real-estate',
    title: 'Недвижимость',
    description: 'Типы, статусы, строения, парковки, отопление, ремонт и договоры',
    icon: Building2,
  },
  {
    href: '/admin/dictionaries/geography',
    title: 'География',
    description: 'Города, координаты и районы',
    icon: MapPinned,
  },
  {
    href: '/admin/dictionaries/transport',
    title: 'Транспорт',
    description: 'Категории транспорта, марки и модели автомобилей',
    icon: CarFront,
  },
  {
    href: '/admin/dictionaries/organization',
    title: 'Организация',
    description: 'Филиалы, застройщики, этапы, материалы и особенности',
    icon: Factory,
  },
  {
    href: '/admin/dictionaries/new-buildings',
    title: 'Новостройки',
    description: 'Переход к управлению карточками новостроек',
    icon: Shapes,
  },
] as const;

export default function DictionariesOverviewPage() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {sections.map(({ href, title, description, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className="group rounded-2xl border border-[#D0D5DD] bg-white p-5 transition hover:-translate-y-0.5 hover:border-[#006341] hover:shadow-[0_12px_30px_rgba(0,99,65,0.10)]"
        >
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[#EFFAF5] text-[#006341] transition group-hover:bg-[#DDF4E9]">
            <Icon className="h-5 w-5" />
          </span>
          <h2 className="mt-4 text-lg font-semibold text-[#101828]">{title}</h2>
          <p className="mt-1 text-sm leading-5 text-[#667085]">{description}</p>
        </Link>
      ))}
    </div>
  );
}
