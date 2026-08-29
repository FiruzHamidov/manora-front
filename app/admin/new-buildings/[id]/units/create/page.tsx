'use client';

import { useParams } from 'next/navigation';
import UnitEditor from '@/app/admin/new-buildings/_components/UnitEditor';

export default function UnitPage() {
  const params = useParams<{ id: string; unitId?: string }>();
  return <UnitEditor buildingId={Number(params.id)} />;
}
