'use client';

import { useState } from 'react';
import { UnitModerationControls } from '../../_components/UnitModerationControls';
import { useParams } from 'next/navigation';
import {
  useBuildingUnits,
  useDeleteBuildingUnit,
  useManagedNewBuilding,
} from '@/services/new-buildings/hooks';
import Link from 'next/link';
import { Button } from '@/ui-components/Button';
import { Pencil, Plus, Trash2, Image as ImageIcon } from 'lucide-react';
import { toast } from 'react-toastify';
import { BuildingUnit } from '@/services/new-buildings/types';

type Paginated<T> = {
  data: T[];
  current_page: number;
  last_page: number;
  per_page?: number;
  total?: number;
};

const windowViewLabel = (v?: string | null) => {
  switch (v) {
    case 'courtyard':
      return 'Во двор';
    case 'street':
      return 'На улицу';
    case 'park':
      return 'На парк';
    case 'mountains':
      return 'На горы';
    case 'city':
      return 'На город';
    case 'panoramic':
      return 'Панорамный вид';
    default:
      return '—';
  }
};

export default function BuildingUnitsPage() {
  const params = useParams<{ id: string }>();
  const newBuildingId = Number(params.id);

  const [page, setPage] = useState(1);

  const { data: buildingResponse, isLoading: buildingLoading } =
    useManagedNewBuilding(newBuildingId);

  const rawUnitsQuery = useBuildingUnits(newBuildingId, page, 15);
  const {
    data: unitsResponseRaw,
    isLoading: unitsLoading,
    isFetching,
  } = rawUnitsQuery as unknown as {
    data?: Paginated<BuildingUnit>;
    isLoading: boolean;
    isFetching?: boolean;
  };

  const deleteUnit = useDeleteBuildingUnit(newBuildingId);

  const building = buildingResponse?.data;
  const canManage = buildingResponse?.capabilities?.manage ?? false;
  const canModerate = buildingResponse?.capabilities?.moderate ?? false;

  const handleDelete = async (unitId: number, title: string, version: number) => {
    if (!confirm(`Архивировать квартиру "${title}"?`)) return;

    try {
      await deleteUnit.mutateAsync({ id: unitId, version });
      toast.success('Квартира архивирована');
    } catch (err) {
      toast.error('Не удалось архивировать квартиру. Обновите список и проверьте её версию.');
      console.error(err);
    }
  };

  if (buildingLoading) {
    return <div className="text-sm text-gray-500">Загрузка...</div>;
  }

  if (!building) {
    return <div>Новостройка не найдена</div>;
  }
  const pagination = (unitsResponseRaw ?? null) as Paginated<BuildingUnit> | null;
  const unitsList = pagination?.data ?? [];

  if (!unitsResponseRaw && unitsLoading) {
    return <div className="text-sm text-gray-500">Загрузка квартир...</div>;
  }

  return (
    <div className="min-w-0 space-y-6">
      <div className="flex min-w-0 flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold">Квартиры</h1>
          <p className="text-sm text-gray-500 mt-1">{building.title}</p>
        </div>
        {canManage && <Link className="max-w-full" href={`/admin/new-buildings/${newBuildingId}/units/create`}>
          <Button className="max-w-full whitespace-normal">
            <Plus className="w-4 h-4 mr-2" />
            Добавить квартиру
          </Button>
        </Link>}
      </div>

      {canManage && <Link href={'/admin/new-buildings/' + newBuildingId + '/inventory'} className="inline-flex min-h-11 items-center text-green-800 underline">Массовые цены, доступность и импорт →</Link>}

      {unitsLoading ? (
        <div className="text-sm text-gray-500">Загрузка квартир...</div>
      ) : !unitsList || unitsList.length === 0 ? (
        <div className="border rounded-2xl p-8 text-center text-gray-500">
          <p className="mb-4">Квартиры не найдены</p>
          {canManage && <Link href={`/admin/new-buildings/${newBuildingId}/units/create`}>
            <Button variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Добавить первую квартиру
            </Button>
          </Link>}
        </div>
      ) : (
        <>
          <div className="min-w-0 max-w-full overflow-hidden rounded-2xl border [contain:paint]">
            <div className="max-w-full overflow-x-auto" tabIndex={0} aria-label="Таблица квартир — прокручивается по горизонтали">
              <table className="min-w-max">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Название</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Комнатность</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Санузлов</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Площадь</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Этаж</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Цена за м²</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Цена</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Статус</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Вид из окна</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Блок ID</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Действия</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {unitsList.map((unit: BuildingUnit) => {
                    const status = unit.availability_status;
                    const publicationLabel = ({ draft: 'Черновик', pending: 'На модерации', published: 'Опубликована', rejected: 'Отклонена', archived: 'Архив' })[unit.publication_status];
                    const availabilityLabel = ({ available: 'Свободна', reserved: 'Бронь', sold: 'Продана', withdrawn: 'Снята' })[unit.availability_status];
                    const statusLabel = `${publicationLabel} · ${availabilityLabel}`;

                    const statusClass =
                      status === 'available' ? 'bg-green-100 text-green-800' :
                      status === 'sold' ? 'bg-red-100 text-red-800' :
                      status === 'reserved' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800';

                    return (
                      <tr key={unit.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{unit.id}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{unit.name || `Квартира #${unit.id}`}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{unit.rooms === 0 ? 'Студия' : unit.rooms ?? 'Неизвестно'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{unit.bathrooms ?? '—'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{unit.area ?? '—'} м²</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{unit.floor ?? '—'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{unit.price_per_sqm ? Number(unit.price_per_sqm).toLocaleString() : '—'} {unit.currency ?? ''}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{unit.total_price ? Number(unit.total_price).toLocaleString() : '—'} {unit.currency ?? ''}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={`px-2 py-1 rounded-full text-xs ${statusClass}`}>
                            {statusLabel}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{windowViewLabel(unit.window_view)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{unit.block_id ?? '—'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              href={`/admin/new-buildings/${newBuildingId}/units/${unit.id}/photos`}
                              aria-label={`Фотографии квартиры ${unit.number || unit.id}`}
                              className="inline-flex items-center justify-center rounded-lg border border-[#BAC0CC] bg-white px-3 py-2 text-black transition-colors hover:bg-gray-50"
                            >
                              <ImageIcon aria-hidden="true" className="w-3 h-3" />
                            </Link>
                            {canManage && <><Link
                              href={`/admin/new-buildings/${newBuildingId}/units/${unit.id}/edit`}
                              aria-label={`Редактировать квартиру ${unit.number || unit.id}`}
                              className="inline-flex items-center justify-center rounded-lg border border-[#BAC0CC] bg-white px-3 py-2 text-black transition-colors hover:bg-gray-50"
                            >
                              <Pencil aria-hidden="true" className="w-3 h-3" />
                            </Link>
                            <Button variant="outline" size="sm" onClick={() => handleDelete(unit.id, unit.name || `Квартира #${unit.id}`, unit.version)} disabled={deleteUnit.isPending}>
                              <Trash2 aria-hidden="true" className="w-3 h-3 text-red-600" /><span className="sr-only">Архивировать квартиру</span>
                            </Button></>}
                            {canModerate && <UnitModerationControls key={`${unit.id}:${unit.version}`} buildingId={newBuildingId} unit={unit} />}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Пагинация */}
          <div className="mt-4 flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-gray-600">{isFetching ? 'Обновление...' : ''}</div>

            <div className="flex max-w-full items-center gap-2 overflow-x-auto pb-1">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={Boolean(pagination && pagination.current_page <= 1)} className="px-3 py-1 border rounded">← Назад</button>

              {Array.from({ length: pagination?.last_page ?? 1 }, (_, i) => i + 1).map((p) => (
                <button key={p} onClick={() => setPage(p)} className={`px-3 py-1 border rounded ${p === (pagination?.current_page ?? 1) ? 'bg-gray-200' : ''}`}>{p}</button>
              ))}

              <button onClick={() => setPage((p) => Math.min(pagination?.last_page ?? p, p + 1))} disabled={Boolean(pagination && pagination.current_page >= (pagination?.last_page ?? 1))} className="px-3 py-1 border rounded">Далее →</button>
            </div>
          </div>
        </>
      )}

      <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
        <Link href={`/admin/new-buildings/${newBuildingId}`}>
          <Button variant="outline">← Вернуться к новостройке</Button>
        </Link>
      </div>
    </div>
  );
}
