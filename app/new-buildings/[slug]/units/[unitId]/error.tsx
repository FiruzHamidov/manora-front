'use client';
import Link from 'next/link';
import { unitFailureCopy } from '@/services/new-buildings/public-unit-preflight';

export default function UnitError({ reset }: { reset: () => void }) {
  const copy = unitFailureCopy(503);
  return <article className="mx-auto max-w-3xl space-y-5 px-4 py-16">
    <h1 className="text-2xl font-bold">{copy.title}</h1>
    <p>{copy.description}</p>
    <button type="button" onClick={reset} className="rounded-xl bg-[#006341] px-5 py-3 text-white">Повторить загрузку</button>
    <p><Link href="/new-buildings" className="underline">Каталог жилых комплексов</Link></p>
  </article>;
}
