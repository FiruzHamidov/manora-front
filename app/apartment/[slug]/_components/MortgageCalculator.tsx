'use client';

import PaymentPrograms from '@/app/new-buildings/_components/PaymentPrograms';

export default function MortgageCalculator({ id, propertyPrice }: { id?: string; propertyPrice?: number | string | null }) {
  const value = propertyPrice === null || propertyPrice === undefined ? '' : String(propertyPrice);
  const initialPrice = /^\d{1,13}(?:\.\d{1,2})?$/.test(value) ? value : '';
  return <div id={id} className="mt-6 min-w-0 rounded-2xl bg-white p-4 md:p-6"><PaymentPrograms kind="mortgage" initialPrice={initialPrice} /></div>;
}
