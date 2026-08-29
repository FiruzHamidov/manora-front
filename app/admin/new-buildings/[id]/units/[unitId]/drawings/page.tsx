'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import DrawingManager from '@/app/admin/new-buildings/_components/DrawingManager';
import { useManagedNewBuilding, useBuildingUnit } from '@/services/new-buildings/hooks';

export default function UnitDrawingsPage() {
  const params = useParams<{ id: string; unitId: string }>();
  const buildingId = Number(params.id); const unitId = Number(params.unitId);
  const building = useManagedNewBuilding(buildingId);
  const unit = useBuildingUnit(buildingId, unitId);
  if (building.isLoading || unit.isLoading) return <p>Загрузка…</p>;
  if (!building.data?.data || !unit.data) return <p role="alert">Квартира недоступна.</p>;
  return <div className="space-y-4">
    <h1 className="text-2xl font-semibold">Индивидуальные чертежи квартиры {unit.data.number || unitId}</h1>
    <Link href={`/admin/new-buildings/${buildingId}/units/${unitId}/edit`} className="text-green-800 underline">← К редактору квартиры</Link>
    <p>Эти изображения относятся только к выбранному лоту и имеют приоритет перед типовой планировкой. Фотографии интерьера хранятся отдельно.</p>
    <DrawingManager buildingId={buildingId} kind="units" ownerId={unitId} canManage={building.data.capabilities?.manage === true && unit.data.publication_status !== 'archived'} />
  </div>;
}
