import Image from 'next/image';
import Link from 'next/link';
import GoogleAdSlot from '@/app/_components/ads/GoogleAdSlot';
import PartnerLeadForm from './_components/PartnerLeadForm';
import PartnersLogoSlider from './_components/PartnersLogoSlider';

const partnershipFormats = [
  {
    title: 'Лиды для агентств',
    description:
      'Даём поток входящих обращений для агентств недвижимости, чтобы менеджеры и брокеры работали с более тёплым спросом.',
  },
  {
    title: 'Инструмент для риелторов',
    description:
      'Риелторы получают больше точек входа в сделку: заявки, показы, сопровождение клиента и усиление личной воронки.',
  },
  {
    title: 'Решение для застройщиков и агентов',
    description:
      'Застройщики и агенты подключаются к партнёрской модели Manora и используют преимущества бренда, маркетинга и потока заявок.',
  },
];

const trustPoints = [
  'Заявки сразу попадают в CRM Manora без ручной обработки.',
  'Партнёрство рассчитано на агентства недвижимости, риелторов, агентов и застройщиков.',
  // 'Предложение на странице относится только к партнёрству с Manora.',
];

export default function PartnersPage() {
  return (
    <div className=" pb-14 pt-8 md:pb-24 md:pt-12">
      <div className="mx-auto flex w-full max-w-[1520px] flex-col gap-8 px-4 sm:px-6 lg:px-8">
        <PartnersLogoSlider />

        <section className="overflow-hidden rounded-[34px] bg-[linear-gradient(135deg,#0B1220_0%,#123A8F_48%,#F59E0B_130%)] px-6 py-8 text-white shadow-[0_24px_80px_rgba(11,18,32,0.18)] md:px-10 md:py-12 lg:px-14">
          <div className="grid items-center gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <div className="inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs uppercase tracking-[0.24em] text-white/75">
                Партнерство с Manora
              </div>
              <h1 className="mt-5 max-w-[760px] text-[34px] font-black leading-[1.02] md:text-[56px]">
                Manora для агентств недвижимости, риелторов, агентов и застройщиков
              </h1>
              <p className="mt-5 max-w-[650px] text-base leading-7 text-white/78 md:text-lg">
                Если вам нужны дополнительные заявки, поддержка сильного бренда и более понятный путь клиента до
                сделки, партнёрство с Manora даёт для этого рабочую площадку. Отдельный акцент сделан на выгодах для
                агентств недвижимости, риелторов, агентов и застройщиков.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="#partner-form"
                  className="inline-flex items-center justify-center rounded-2xl bg-[#F59E0B] px-6 py-3 text-sm font-semibold text-[#111827] transition hover:bg-[#FBBF24]"
                >
                  Стать партнёром
                </Link>
              </div>

              <div className="mt-8 grid gap-3 md:grid-cols-3">
                {trustPoints.map((point) => (
                  <div key={point} className="rounded-2xl border border-white/12 bg-white/8 p-4 text-sm leading-6 text-white/78">
                    {point}
                  </div>
                ))}
              </div>
            </div>

            <div className="relative overflow-hidden rounded-[30px] border border-white/10 bg-white/8 p-6 backdrop-blur-sm">
              <div className="absolute -right-12 -top-12 h-36 w-36 rounded-full bg-[#F59E0B]/20 blur-3xl" />
              <div className="absolute -bottom-12 -left-12 h-36 w-36 rounded-full bg-[#60A5FA]/20 blur-3xl" />

              <div className="relative z-10">
                <div className="mb-8 flex items-center justify-between gap-4 rounded-[26px] bg-white/95 p-5 text-[#0F172A]">
                  <div>
                    <div className="text-xs uppercase tracking-[0.2em] text-[#64748B]">Партнёрство с Manora</div>
                    <div className="mt-2 text-2xl font-extrabold">Выгоды, которые работают на продажи</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl bg-[#0F172A] p-3">
                      <Image src="/manora.svg" alt="Manora" width={74} height={24} className="h-6 w-auto" />
                    </div>
                  </div>
                </div>

                <div className="grid gap-4">
                  {partnershipFormats.map((item) => (
                    <div key={item.title} className="rounded-[24px] bg-[#F8FAFC] p-5 text-[#0F172A]">
                      <div className="text-lg font-bold">{item.title}</div>
                      <p className="mt-2 text-sm leading-6 text-[#475569]">{item.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[0.78fr_1.22fr]">
          <div className="rounded-[30px] bg-[#FFF7ED] p-6 shadow-[0_12px_36px_rgba(217,119,6,0.08)] md:p-8">
            <div className="inline-flex rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#B45309]">
              Почему это работает
            </div>
            <h2 className="mt-4 text-2xl font-extrabold text-[#111827] md:text-[34px]">
              Почему агентствам, риелторам, агентам и застройщикам выгодно быть партнёром Manora
            </h2>
            <div className="mt-6 space-y-4 text-sm leading-7 text-[#4B5563] md:text-base">
              <p>
                Партнёрство с Manora даёт доступ к более сильному входящему потоку, к узнаваемому бренду и к понятной
                системе работы с обращениями. Это особенно важно для агентств недвижимости, где результат строится на
                регулярном входящем спросе и скорости обратной связи. Для застройщиков это ещё и дополнительный канал
                спроса на объекты и усиление продаж по текущему портфелю.
              </p>
              <p>
                Для риелторов и агентов это означает больше возможностей закрывать показы, консультации и сделки. Для
                агентств это означает усиление отдела продаж без лишней ручной нагрузки на обработку лидов. Для
                застройщиков это означает больше целевых касаний, лучшее присутствие в рынке и удобную обработку
                входящих заявок через Manora.
              </p>
            </div>
          </div>

          <PartnerLeadForm />
        </section>

        <section className="rounded-[30px] bg-white p-4 shadow-[0_12px_40px_rgba(15,23,42,0.04)] md:p-6">
          <GoogleAdSlot slot="2404125144" format="auto" fullWidthResponsive="true" />
        </section>
      </div>
    </div>
  );
}
