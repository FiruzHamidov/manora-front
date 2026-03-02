'use client';

import { useParams } from 'next/navigation';
import { useNewBuilding } from '@/services/new-buildings/hooks';
import Link from 'next/link';
import { Button } from '@/ui-components/Button';
import { Map, Placemark, YMaps } from '@pbe/react-yandex-maps';
import { Pencil } from 'lucide-react';
import type { NewBuilding } from '@/services/new-buildings/types';

// Локальный тип с отношениями, чтобы не использовать any
type NBWithRelations = NewBuilding & {
  developer?: { id: number | string; name: string } | null;
  stage?: { id: number | string; name: string } | null;
  material?: { id: number | string; name: string } | null;
  location?: { city?: string | null } | null;
  features?: Array<{ id: number | string; name: string }>;
};

export default function NewBuildingShowPage() {
  const params = useParams<{ id: string }>();
  const { data: buildingResponse, isLoading } = useNewBuilding(
    Number(params.id)
  );

  if (isLoading)
    return <div className="text-sm text-gray-500">Загрузка...</div>;
  if (!buildingResponse) return <div>Не найдено</div>;

  const nb = buildingResponse.data;
  const withRels = nb as NBWithRelations;

  const coords =
    nb.latitude && nb.longitude
      ? ([Number(nb.latitude), Number(nb.longitude)] as [number, number])
      : null;
  // console.log(nb)
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{nb.title}</h1>
          <p className="text-sm text-gray-500 capitalize mt-1">
            Статус: {nb.moderation_status}
          </p>
        </div>
        <Link href={`/admin/new-buildings/${nb.id}/edit`}>
          <Button>
            <Pencil className="w-4 h-4 mr-2" /> Редактировать
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          <div className="border rounded-2xl p-4">
            <h2 className="font-medium mb-2">Описание</h2>
            <p className="text-sm text-gray-700 whitespace-pre-line">
              {nb.description || '—'}
            </p>
          </div>

          <div className="border rounded-2xl p-4">
            <h2 className="font-medium mb-3">Параметры</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
              <div>
                <span className="text-gray-500">Застройщик:</span>{' '}
                {withRels.developer?.name ?? '—'}
              </div>
              <div>
                <span className="text-gray-500">Этап:</span>{' '}
                {withRels.stage?.name ?? '—'}
              </div>
              <div>
                <span className="text-gray-500">Материал:</span>{' '}
                {withRels.material?.name ?? '—'}
              </div>
              <div>
                <span className="text-gray-500">Город:</span>{' '}
                {withRels.location?.city ?? '—'}
              </div>

              <div>
                <span className="text-gray-500">Адрес:</span>{' '}
                {nb.address ?? '—'}
              </div>
              <div>
                <span className="text-gray-500">Район:</span>{' '}
                {nb.district ?? '—'}
              </div>
              <div>
                <span className="text-gray-500">Этажность:</span>{' '}
                {nb.floors_range || '—'}
              </div>

              <div>
                <span className="text-gray-500">Срок сдачи:</span>{' '}
                {nb.completion_at
                    ? new Date(nb.completion_at).toLocaleDateString()
                    : '—'}
              </div>
              <div>
                <span className="text-gray-500">Рассрочка:</span>{' '}
                {nb.installment_available ? 'Да' : 'Нет'}
              </div>
              <div>
                <span className="text-gray-500">Отопление:</span>{' '}
                {nb.heating ? 'Да' : 'Нет'}
              </div>
              <div>
                <span className="text-gray-500">Терраса:</span>{' '}
                {nb.has_terrace ? 'Да' : 'Нет'}
              </div>
            </div>
          </div>

          <div className="border rounded-2xl p-4">
            <h2 className="font-medium mb-3">Удобства</h2>
            <div className="flex flex-wrap gap-2">
              {(withRels.features ?? []).length === 0 && (
                <span className="text-sm text-gray-500">—</span>
              )}
              {(withRels.features ?? []).map((f) => (
                <span
                  key={String(f.id)}
                  className="px-3 py-1 rounded-full bg-gray-100 text-sm"
                >
                  {f.name}
                </span>
              ))}
            </div>
          </div>

          <div className="border rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-medium">Блоки</h2>
              <Link href={`/admin/new-buildings/${nb.id}/blocks`}>
                <Button variant="outline" size="sm">
                  Управление блоками
                </Button>
              </Link>
            </div>
            <p className="text-sm text-gray-500">
              Управляйте блоками новостройки: добавляйте, редактируйте или
              удаляйте блоки.
            </p>
          </div>

          <div className="border rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-medium">Квартиры</h2>
              <Link href={`/admin/new-buildings/${nb.id}/units`}>
                <Button variant="outline" size="sm">
                  Управление квартирами
                </Button>
              </Link>
            </div>
            <p className="text-sm text-gray-500">
              Управляйте квартирами новостройки: добавляйте, редактируйте или
              удаляйте квартиры.
            </p>
          </div>

          <div className="border rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-medium">Фотографии</h2>
              <Link href={`/admin/new-buildings/${nb.id}/photos`}>
                <Button variant="outline" size="sm">
                  Управление фото
                </Button>
              </Link>
            </div>
            <p className="text-sm text-gray-500">
              Загружайте, удаляйте и меняйте порядок фотографий новостройки.
            </p>
          </div>
        </div>

        <div className="md:col-span-1">
          <div className="border rounded-2xl overflow-hidden">
            <div className="p-3 border-b">
              <h3 className="font-medium">Карта</h3>
            </div>
            <div className="h-[320px]">
              <YMaps
                query={{
                  lang: 'ru_RU',
                  apikey: 'dbdc2ae1-bcbd-4f76-ab38-94ca88cf2a6f',
                }}
              >
                <Map
                  defaultState={{
                    center: coords ?? [38.5597722, 68.7870384],
                    zoom: coords ? 14 : 9,
                  }}
                  width="100%"
                  height="100%"
                >
                  {coords && (
                    <Placemark
                      geometry={coords}
                      options={{ preset: 'islands#blueHomeIcon' }}
                    />
                  )}
                </Map>
              </YMaps>
            </div>
            <div className="p-3 text-sm text-gray-600">
              {nb.address ?? 'Адрес не указан'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
