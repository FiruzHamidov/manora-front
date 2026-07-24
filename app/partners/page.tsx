import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight,
  BarChart3,
  Building2,
  Check,
  Headphones,
  Megaphone,
  Network,
  ShieldCheck,
  Users,
  WalletCards,
} from 'lucide-react';
import PartnerLeadForm from '@/app/services/_components/PartnerLeadForm';
import PartnersLogoSlider from '@/app/services/_components/PartnersLogoSlider';

const headlineBenefits = [
  {
    icon: Users,
    title: 'Целевые заявки',
    description: 'Клиенты, которые готовы к покупке или аренде.',
  },
  {
    icon: Network,
    title: 'Единая CRM',
    description: 'Все заявки сразу попадают в вашу систему.',
  },
  {
    icon: Headphones,
    title: 'Поддержка команды',
    description: 'Персональный менеджер и маркетинговая поддержка.',
  },
];

const partnerValue = [
  {
    icon: BarChart3,
    title: 'Больше точек входа в сделку',
    description: 'Ваши объекты видят покупатели и арендаторы на разных этапах выбора.',
  },
  {
    icon: Megaphone,
    title: 'Продвижение внутри Manora',
    description: 'Карточки, подборки и рекламные форматы помогают выделить предложения.',
  },
  {
    icon: WalletCards,
    title: 'Понятные условия',
    description: 'Сначала обсуждаем задачи и только потом подбираем формат сотрудничества.',
  },
  {
    icon: ShieldCheck,
    title: 'Контроль качества',
    description: 'Проверяем контент и поддерживаем единый стандарт коммуникации с клиентами.',
  },
];

const startSteps = [
  {
    number: '01',
    title: 'Оставьте заявку',
    description: 'Имя, телефон и ваш формат работы — этого достаточно для старта.',
  },
  {
    number: '02',
    title: 'Обсудим задачи',
    description: 'Уточним портфель, географию и нужный объём обращений.',
  },
  {
    number: '03',
    title: 'Запустим сотрудничество',
    description: 'Подключим инструменты Manora и поможем разместить предложения.',
  },
];

const audience = [
  { icon: Building2, title: 'Агентствам', text: 'Дополнительный поток обращений и удобная передача лидов.' },
  { icon: Users, title: 'Риелторам', text: 'Больше контактов с покупателями и усиление личной воронки.' },
  { icon: BarChart3, title: 'Застройщикам', text: 'Продвижение проектов и новый канал спроса на квартиры.' },
];

export default function PartnersPage() {
  return (
    <main className="bg-[#F3F6F4] pb-28 md:pb-24 md:pt-8">
      <div className="mx-auto w-full max-w-[1520px] px-0 sm:px-6 lg:px-8">
        <section className="overflow-hidden bg-[#064F38] text-white sm:rounded-[32px] md:rounded-[40px]">
          <div className="grid lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div className="px-6 pb-5 pt-6 sm:px-10 sm:py-12 lg:px-14 lg:py-16">
              <p className="inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[0.22em] text-white/80 sm:px-4 sm:py-2 sm:text-[11px]">
                Партнёрство с Manora
              </p>
              <h1 className="mt-4 max-w-[680px] text-[34px] font-black leading-[0.98] tracking-[-0.035em] sm:mt-6 sm:text-5xl lg:text-[68px]">
                Больше заявок.
                <br />
                Больше сделок.
              </h1>
              <p className="mt-3 max-w-[580px] text-[9px] leading-[1.45] text-white/78 sm:mt-5 sm:text-lg sm:leading-7">
                Manora — маркетплейс недвижимости в Таджикистане. Приводим целевых клиентов и увеличиваем ваши продажи.
              </p>

              <div className="mt-4 flex flex-col gap-2.5 sm:mt-7 sm:flex-row sm:gap-3">
                <Link
                  href="#partner-form"
                  className="inline-flex min-h-10 items-center justify-center rounded-xl bg-[#F5A313] px-7 py-2.5 text-xs font-bold text-[#111827] transition hover:bg-[#F7B436] sm:min-h-13 sm:rounded-2xl sm:py-3.5 sm:text-sm"
                >
                  Стать партнёром
                </Link>
                <Link
                  href="#partner-benefits"
                  className="inline-flex min-h-7 items-center justify-center gap-2 px-7 py-0 text-[11px] font-semibold text-white underline decoration-white/50 underline-offset-4 transition hover:text-[#F5C86A] sm:min-h-13 sm:rounded-2xl sm:border sm:border-white/22 sm:py-3.5 sm:text-sm sm:no-underline sm:hover:bg-white/10 sm:hover:text-white"
                >
                  Узнать условия
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            <div className="relative px-3 pb-0 sm:px-5 sm:pb-5 lg:h-full lg:min-h-[610px] lg:p-5">
              <div className="relative h-[240px] overflow-hidden rounded-t-[24px] sm:h-[500px] sm:rounded-[28px] lg:h-full lg:min-h-[570px]">
                <Image
                  src="/images/partners/manora-partner-team.png"
                  alt="Команда партнёров Manora обсуждает жилой проект"
                  fill
                  priority
                  sizes="(max-width: 1023px) 100vw, 55vw"
                  className="object-cover object-center"
                />
              </div>
            </div>
          </div>

          <div className="relative z-10 mx-3 -mt-16 grid grid-cols-3 overflow-hidden rounded-t-2xl border border-white/12 bg-[#063F2F]/95 sm:mx-0 sm:mt-0 sm:rounded-none sm:border-x-0 sm:border-b-0 sm:bg-transparent">
            {headlineBenefits.map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <article
                  key={benefit.title}
                  className={`flex flex-col items-center gap-2 px-2 py-3 text-center sm:flex-row sm:items-start sm:gap-4 sm:px-8 sm:py-6 sm:text-left ${
                    index > 0 ? 'border-l border-white/12' : ''
                  }`}
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-[#F5C86A] sm:h-11 sm:w-11 sm:rounded-2xl">
                    <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                  </span>
                  <div>
                    <h2 className="text-[11px] font-bold leading-tight sm:text-base">{benefit.title}</h2>
                    <p className="mt-1 text-[8px] leading-3 text-white/68 sm:text-sm sm:leading-6">{benefit.description}</p>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section id="partner-benefits" className="scroll-mt-24 px-5 py-7 sm:px-0 sm:py-14 md:py-20">
          <div className="grid gap-5 sm:gap-10 lg:grid-cols-[0.72fr_1.28fr] lg:items-start">
            <div className="lg:sticky lg:top-24">
              <p className="hidden text-xs font-bold uppercase tracking-[0.2em] text-[#08754F] sm:block">Что получает партнёр</p>
              <h2 className="max-w-[560px] text-lg font-black leading-tight tracking-[-0.025em] text-[#13251F] sm:mt-4 sm:text-3xl md:text-[46px]">
                <span className="sm:hidden">Что получает партнёр</span>
                <span className="hidden sm:inline">Не просто размещение, а рабочий канал продаж</span>
              </h2>
              <p className="mt-4 hidden max-w-lg text-base leading-7 text-[#627069] sm:block">
                Мы выстраиваем путь от первого просмотра до обращения так, чтобы вашей команде было проще доводить клиента до сделки.
              </p>
            </div>

            <div className="overflow-hidden rounded-[30px] border border-[#DCE6E1] bg-white">
              {partnerValue.map((item, index) => {
                const Icon = item.icon;
                return (
                  <article
                    key={item.title}
                    className={`flex gap-4 p-5 sm:p-7 ${index > 0 ? 'border-t border-[#E5ECE8]' : ''}`}
                  >
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#E9F6EF] text-[#006341]">
                      <Icon className="h-5 w-5" />
                    </span>
                    <div>
                      <h3 className="text-lg font-extrabold text-[#17241F]">{item.title}</h3>
                      <p className="mt-1 text-sm leading-6 text-[#64736C] sm:text-base">{item.description}</p>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="rounded-[34px] bg-white px-5 py-8 sm:px-8 md:px-12 md:py-12">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#08754F]">Кому подходит</p>
              <h2 className="mt-3 text-3xl font-black tracking-[-0.025em] text-[#13251F] md:text-[42px]">
                Один продукт — разные задачи
              </h2>
            </div>
            <p className="max-w-md text-sm leading-6 text-[#64736C]">
              Формат партнёрства подбирается под ваш бизнес, команду и объём объектов.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {audience.map((item) => {
              const Icon = item.icon;
              return (
                <article key={item.title} className="rounded-[26px] border border-[#DFE8E3] p-6">
                  <Icon className="h-6 w-6 text-[#006341]" />
                  <h3 className="mt-7 text-xl font-extrabold text-[#15251F]">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[#64736C]">{item.text}</p>
                  <div className="mt-5 flex items-center gap-2 text-sm font-semibold text-[#08754F]">
                    <Check className="h-4 w-4" />
                    Подключение под задачу
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="py-14 md:py-20">
          <div className="mb-8">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#08754F]">Как начать</p>
            <h2 className="mt-3 text-3xl font-black tracking-[-0.025em] text-[#13251F] md:text-[42px]">
              Три простых шага
            </h2>
          </div>
          <div className="grid overflow-hidden rounded-[32px] border border-[#DCE6E1] bg-white md:grid-cols-3">
            {startSteps.map((step, index) => (
              <article
                key={step.number}
                className={`p-6 sm:p-8 ${index > 0 ? 'border-t border-[#E5ECE8] md:border-l md:border-t-0' : ''}`}
              >
                <span className="text-sm font-black text-[#0A7B53]">{step.number}</span>
                <h3 className="mt-8 text-xl font-extrabold text-[#17241F]">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-[#64736C]">{step.description}</p>
              </article>
            ))}
          </div>
        </section>

        <PartnersLogoSlider />

        <section className="grid gap-6 py-14 md:py-20 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <div className="px-1 py-3 lg:sticky lg:top-24">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#08754F]">Начнём с разговора</p>
            <h2 className="mt-4 text-3xl font-black leading-tight tracking-[-0.025em] text-[#13251F] md:text-[46px]">
              Расскажите, чем вы занимаетесь
            </h2>
            <p className="mt-4 max-w-md text-base leading-7 text-[#64736C]">
              Никаких длинных анкет. Оставьте три контакта — команда Manora сама уточнит остальное.
            </p>
            <div className="mt-7 space-y-3 text-sm text-[#43534B]">
              <p className="flex items-center gap-3">
                <Check className="h-4 w-4 text-[#08754F]" />
                Ответим в течение рабочего дня
              </p>
              <p className="flex items-center gap-3">
                <Check className="h-4 w-4 text-[#08754F]" />
                Подберём формат без обязательств
              </p>
            </div>
          </div>
          <PartnerLeadForm variant="compact" />
        </section>
      </div>
    </main>
  );
}
