import Link from 'next/link';
import { unitFailureCopy } from '@/services/new-buildings/public-unit-preflight';
export default function UnitNotFound() {
  const copy = unitFailureCopy(404);
  return <article className="mx-auto max-w-3xl space-y-5 px-4 py-16">
    <h1 className="text-2xl font-bold">{copy.title}</h1>
    <p>{copy.description}</p>
    <Link href="/new-buildings" className="inline-block min-h-11 underline">Вернуться в каталог ЖК</Link>
  </article>;
}
