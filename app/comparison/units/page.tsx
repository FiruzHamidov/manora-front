import type { Metadata } from 'next';
import UnitComparison from './UnitComparison';
import { notFound } from 'next/navigation';
import { RESIDENTIAL_V2_ENABLED } from '@/services/new-buildings/rollout';

export const metadata: Metadata = { title: 'Сравнение квартир ЖК — Manora', robots: { index: false, follow: false } };
export default function Page() { if (!RESIDENTIAL_V2_ENABLED) notFound(); return <UnitComparison />; }
