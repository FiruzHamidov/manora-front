'use client';

import { useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import MainShell from '@/app/_components/manora/MainShell';
import MortgageCalculator from '@/app/apartment/[slug]/_components/MortgageCalculator';

const parsePriceParam = (value: string | null): number => {
  if (!value) return 450000;
  const numeric = Number(String(value).replace(/[^\d]/g, ''));
  if (Number.isNaN(numeric) || numeric <= 0) return 450000;
  return numeric;
};

export default function MortgageCalculatorPage() {
  const searchParams = useSearchParams();
  const initialPrice = useMemo(
    () => parsePriceParam(searchParams.get('price')),
    [searchParams]
  );

  return (
    <MainShell>
      <section className="mx-auto w-full max-w-[1520px] px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-2xl bg-white p-6 md:p-8">
          <h1 className="text-2xl font-extrabold text-[#111827] md:text-4xl">
            Ипотечный калькулятор
          </h1>
          <p className="mt-3 max-w-4xl text-sm leading-6 text-[#64748B] md:text-lg">
            Рассчитайте комфортный ежемесячный платеж, сравните предложения
            банков и отправьте заявку напрямую. Введите стоимость объекта,
            первоначальный взнос и срок, чтобы увидеть актуальные варианты.
          </p>
        </div>

        <MortgageCalculator id="mortgage-calculator" propertyPrice={initialPrice} />
      </section>
    </MainShell>
  );
}
