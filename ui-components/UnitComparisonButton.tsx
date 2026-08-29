'use client';

import Link from 'next/link';
import { useUnitComparison } from '@/services/new-buildings/use-unit-comparison';
import { unitReferenceKey, type UnitReference } from '@/services/new-buildings/unit-comparison';

export default function UnitComparisonButton({ buildingId, unitId }: UnitReference) {
  const comparison = useUnitComparison(), ref = { buildingId, unitId };
  const selected = comparison.units.some(unit => unitReferenceKey(unit) === unitReferenceKey(ref));
  return <div className="my-2 flex flex-wrap items-center gap-3 text-sm">
    <button type="button" aria-pressed={selected} disabled={comparison.busy} onClick={() => void comparison.change(ref, !selected)}
      className="min-h-11 rounded-xl border border-green-800 px-3 py-2 text-green-800 disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-800">
      {selected ? 'Убрать из сравнения' : 'Сравнить квартиру'}
    </button>
    {comparison.units.length > 0 && <Link className="inline-flex min-h-11 items-center text-green-800 underline" href="/comparison/units">К сравнению ({comparison.units.length}/4)</Link>}
    {comparison.error && <p role="alert" className="w-full text-red-800">{comparison.error}</p>}
  </div>;
}
