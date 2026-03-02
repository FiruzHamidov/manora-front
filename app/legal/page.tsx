'use client';

import MainShell from '@/app/_components/manora/MainShell';

export default function LegalPage() {
  return (
    <MainShell>
      <section className="mx-auto w-full max-w-[1520px] px-4 py-8 md:px-6 md:py-12">
        <div className="rounded-2xl border border-[#E2E8F0] bg-white p-6 md:p-8">
          <h1 className="text-2xl font-extrabold text-[#111827] md:text-3xl">
            Юридическая информация
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-[#475569] md:text-base">
            В этом разделе будет размещена юридическая информация о сервисе
            Manora, порядке использования платформы и условиях обслуживания.
          </p>
        </div>
      </section>
    </MainShell>
  );
}
