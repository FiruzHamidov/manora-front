'use client';

import { formatCompletion } from '@/services/new-buildings/completion';
import { useParams } from 'next/navigation';
import { useManagedNewBuilding } from '@/services/new-buildings/hooks';
import Link from 'next/link';
import { Button } from '@/ui-components/Button';
import { Map, Placemark, YMaps } from '@pbe/react-yandex-maps';
import { Pencil } from 'lucide-react';
import type { NewBuilding } from '@/services/new-buildings/types';
import BuildingPublicationPanel from '../_components/BuildingPublicationPanel';
import ManagedNewBuildingError from '../_components/ManagedNewBuildingError';

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
  const { data: buildingResponse, isLoading, error, refetch, isFetching } = useManagedNewBuilding(
    Number(params.id)
  );

  if (isLoading)
    return <div className="text-sm text-gray-500">Загрузка...</div>;
  if (error || !buildingResponse)
    return (
      <ManagedNewBuildingError
        error={error}
        isRetrying={isFetching}
        onRetry={() => void refetch()}
      />
    );

  const nb = buildingResponse.data;
  const withRels = nb as NBWithRelations;

  const coords =
    nb.latitude && nb.longitude
      ? ([Number(nb.latitude), Number(nb.longitude)] as [number, number])
      : null;
  // console.log(nb)
  return (
    <div className="min-w-0 space-y-6">
      <div className="flex min-w-0 flex-col items-start gap-4 sm:flex-row sm:justify-between">
        <div className="min-w-0">
          <h1 className="break-words text-2xl font-semibold">{nb.title}</h1>
          <p className="text-sm text-gray-500 capitalize mt-1">
            Статус: {nb.moderation_status}
          </p>
        </div>
        {buildingResponse.capabilities?.manage && <Link className="max-w-full" href={`/admin/new-buildings/${nb.id}/edit`}>
          <Button className="max-w-full whitespace-normal">
            <Pencil className="w-4 h-4 mr-2" /> Редактировать
          </Button>
        </Link>}
      </div>

      <Link href={`/admin/new-buildings/${nb.id}/structure`} className="block break-words rounded-xl border p-4 font-medium text-green-800">Подъезды и типовые планировки →</Link>
      <Link href={'/admin/new-buildings/' + nb.id + '/masterplan'} className="block break-words rounded-xl border p-4 font-medium text-green-800">Генплан и области корпусов →</Link>
      <Link href={'/admin/new-buildings/' + nb.id + '/videos'} className="block break-words rounded-xl border p-4 font-medium text-green-800">Видео ЖК →</Link>
      <Link href={'/admin/new-buildings/' + nb.id + '/nearby-places'} className="block break-words rounded-xl border p-4 font-medium text-green-800">Инфраструктура рядом →</Link>
      <Link href={'/admin/new-buildings/' + nb.id + '/payment-programs'} className="block break-words rounded-xl border p-4 font-medium text-green-800">Условия покупки: рассрочка и ипотека →</Link>

      {buildingResponse.capabilities?.moderate && <Link href={'/admin/new-buildings/' + nb.id + '/reviews'} className="block rounded-xl border p-4 font-medium text-green-800">Отзывы и жалобы: модерация →</Link>}

      {buildingResponse.capabilities?.manage && <Link href={'/admin/new-buildings/' + nb.id + '/inventory'} className="block rounded-xl border p-4 font-medium text-green-800">Массовые изменения и импорт фонда →</Link>}

      <BuildingPublicationPanel buildingId={nb.id} />

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
                {formatCompletion(nb)}
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

          <div className="min-w-0 border rounded-2xl p-4">
            <div className="mb-3 flex min-w-0 flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
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

          <div className="min-w-0 border rounded-2xl p-4">
            <div className="mb-3 flex min-w-0 flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
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

          <div className="min-w-0 border rounded-2xl p-4">
            <div className="mb-3 flex min-w-0 flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
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
