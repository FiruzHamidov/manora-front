'use client';

import Image from 'next/image';
import useEmblaCarousel from 'embla-carousel-react';

type PartnerLogo = {
  name: string;
  logo: string;
};

const partnerLogos: PartnerLogo[] = [
  { name: 'Aura', logo: '/logo_aura.svg' },
];

export default function PartnersLogoSlider() {
  const [emblaRef] = useEmblaCarousel({
    align: 'start',
    loop: partnerLogos.length > 1,
    dragFree: true,
  });

  return (
    <section
      id="partners-slider"
      className="overflow-hidden rounded-[30px] bg-white px-5 py-6 shadow-[0_12px_40px_rgba(15,23,42,0.06)] md:px-8 md:py-8"
    >
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="inline-flex rounded-full bg-[#E8F0FF] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#0B43B8]">
            Партнеры
          </div>
          <h2 className="mt-3 text-2xl font-extrabold text-[#0F172A] md:text-[34px]">С нами уже работают</h2>
        </div>
      </div>

      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex">
          {partnerLogos.map((partner) => (
            <div key={partner.name} className="min-w-0 flex-[0_0_100%] pr-4 sm:flex-[0_0_50%] lg:flex-[0_0_33.3333%]">
              <div className="flex h-[128px] items-center justify-center rounded-[26px] border border-[#DCE6F5] bg-[linear-gradient(180deg,#FFFFFF_0%,#F8FAFC_100%)] px-6 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
                <Image
                  src={partner.logo}
                  alt={partner.name}
                  width={140}
                  height={48}
                  className="h-10 w-auto object-contain"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
