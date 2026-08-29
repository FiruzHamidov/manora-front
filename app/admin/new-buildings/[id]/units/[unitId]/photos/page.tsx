'use client';

import { useParams } from 'next/navigation';
import {
  useBuildingUnit,
  useUnitPhotos,
  useUploadUnitPhoto,
  useDeleteUnitPhoto,
  useReorderUnitPhotos,
  useSetUnitPhotoCover,
  useManagedNewBuilding,
} from '@/services/new-buildings/hooks';
import { Button } from '@/ui-components/Button';
import { isAxiosError } from 'axios';
import { toast } from 'react-toastify';
import Link from 'next/link';
import ResidentialImage from '@/ui-components/ResidentialImage';
import { Upload, Trash2, Star, GripVertical } from 'lucide-react';
import { ChangeEvent, useState } from 'react';
import { resolveMediaUrl } from '@/constants/base-url';
import type { UnitPhoto } from '@/services/new-buildings/types';

import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  useSortable,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function SortablePhotoCard({
  photo,
  onDelete,
  onSetCover,
  isDeleting,
  canManage,
}: {
  photo: UnitPhoto;
  onDelete: () => void;
  onSetCover: () => void;
  isDeleting: boolean;
  canManage: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: photo.id, disabled: !canManage || isDeleting });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative border rounded-lg overflow-hidden bg-white group"
    >
      <div className="relative h-48 w-full">
        <ResidentialImage
          image={{ url: resolveMediaUrl(photo.url || photo.path), sources: photo.sources }}
          sizes="(max-width: 767px) 100vw, 320px"
          alt={photo.is_cover ? "Обложка" : `Изображение ${Number(photo.sort_order ?? 0) + 1}`}
          className="absolute inset-0 h-full w-full object-cover"
        />
        {photo.is_cover && (
          <div className="absolute top-2 left-2 bg-yellow-500 text-white px-2 py-1 rounded text-xs font-medium flex items-center gap-1">
            <Star className="w-3 h-3 fill-current" />
            Обложка
          </div>
        )}
        <button
          type="button"
          aria-label="Переместить изображение: пробел, затем стрелки"
          disabled={!canManage || isDeleting}
          {...attributes}
          {...listeners}
          className="absolute top-2 right-2 bg-white/90 p-2 rounded cursor-move opacity-100 sm:opacity-0 sm:group-hover:opacity-100 focus-visible:opacity-100 transition-opacity"
        >
          <GripVertical className="w-4 h-4 text-gray-600" />
        </button>
      </div>
      {photo.original_download_url && <a href={photo.original_download_url} className="block min-h-11 p-3 text-sm underline" rel="noreferrer">Скачать оригинал</a>}
      <div className="p-3 flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onSetCover}
          disabled={photo.is_cover || !canManage || isDeleting}
          className="flex-1"
        >
          <Star className="w-3 h-3 mr-1" />
          {photo.is_cover ? 'Обложка' : 'Сделать обложкой'}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onDelete}
          aria-label="Удалить изображение"
          disabled={isDeleting || !canManage}
        >
          <Trash2 className="w-3 h-3 text-red-600" />
        </Button>
      </div>
      <div className="px-3 pb-3 text-xs text-gray-500">
        Порядок: {photo.sort_order}
      </div>
    </div>
  );
}

export default function UnitPhotosPage() {
  const params = useParams<{ id: string; unitId: string }>();
  const newBuildingId = Number(params.id);
  const unitId = Number(params.unitId);

  const { data: buildingResponse } = useManagedNewBuilding(newBuildingId);
  const { data: unit, isLoading: unitLoading } = useBuildingUnit(
    newBuildingId,
    unitId
  );
  const { data: photos, isLoading: photosLoading } = useUnitPhotos(
    newBuildingId,
    unitId
  );

  const uploadPhoto = useUploadUnitPhoto(newBuildingId, unitId);
  const deletePhoto = useDeleteUnitPhoto(newBuildingId, unitId);
  const reorderPhotos = useReorderUnitPhotos(newBuildingId, unitId);
  const setCover = useSetUnitPhotoCover(newBuildingId, unitId);

  const mediaVersion = photos?.[0]?.inventory_version ?? unit?.version ?? 0;
  const canManage = buildingResponse?.capabilities?.manage === true;

  const [isUploading, setIsUploading] = useState(false);

  const building = buildingResponse?.data;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !canManage) return;

    setIsUploading(true);
    try {
      let version = mediaVersion;
      for (const file of Array.from(files)) {
        const saved = await uploadPhoto.mutateAsync({ file, version });
        version = saved.inventory_version ?? version;
      }
      toast.success('Фото загружены успешно');

      e.target.value = '';
    } catch (err) {
      toast.error(isAxiosError(err) && err.response?.status === 409 ? 'Объект изменён. Обновите страницу и проверьте фотографии перед повтором.' : 'Ошибка при загрузке фото');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (photoId: number) => {
    if (!canManage || !confirm('Удалить это фото?')) return;

    try {
      await deletePhoto.mutateAsync({ photoId, version: mediaVersion });
      toast.success('Фото удалено');
    } catch (err) {
      toast.error(isAxiosError(err) && err.response?.status === 409 ? 'Объект изменён. Обновите страницу и проверьте фотографии перед повтором.' : 'Ошибка при удалении фото');
    }
  };

  const handleSetCover = async (photoId: number) => {
    if (!canManage) return;
    try {
      await setCover.mutateAsync({ photoId, version: mediaVersion });
      toast.success('Обложка установлена');
    } catch (err) {
      toast.error(isAxiosError(err) && err.response?.status === 409 ? 'Объект изменён. Обновите страницу и проверьте фотографии перед повтором.' : 'Ошибка при установке обложки');
    }
  };

  const onDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!canManage || !over || active.id === over.id || !photos) return;

    const oldIndex = photos.findIndex((p) => p.id === active.id);
    const newIndex = photos.findIndex((p) => p.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    const reorderedPhotos = arrayMove(photos, oldIndex, newIndex);
    const photoIds = reorderedPhotos.map((p) => p.id);

    try {
      await reorderPhotos.mutateAsync({ photoIds, version: mediaVersion });
      toast.success('Порядок фото обновлен');
    } catch (err) {
      toast.error(isAxiosError(err) && err.response?.status === 409 ? 'Объект изменён. Обновите страницу и проверьте фотографии перед повтором.' : 'Ошибка при изменении порядка');
    }
  };

  if (unitLoading) {
    return <div className="text-sm text-gray-500">Загрузка...</div>;
  }

  if (!unit) {
    return <div>Квартира не найдена</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Фотографии квартиры</h1>
          <p className="text-sm text-gray-500 mt-1">
            {unit.name} в {building?.title}
          </p>
        </div>
        <Link href={`/admin/new-buildings/${newBuildingId}/units`}>
          <Button variant="outline">← Назад к квартирам</Button>
        </Link>
      </div>

      <div className="border rounded-2xl p-6 bg-white">
        <div className="mb-4">
          <label
            htmlFor="photo-upload"
            className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-[#006341] text-white rounded-lg hover:bg-[#004D33] transition-colors"
          >
            <Upload className="w-4 h-4" />
            {isUploading ? 'Загрузка...' : 'Загрузить фото'}
          </label>
          <input
            id="photo-upload"
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileChange}
            disabled={isUploading || deletePhoto.isPending || setCover.isPending || reorderPhotos.isPending || !canManage}
            className="hidden"
          />
          <p className="text-sm text-gray-500 mt-2">
            Можно выбрать несколько файлов. Перетаскивайте фото для изменения
            порядка.
          </p>
        </div>

        {photosLoading ? (
          <div className="text-sm text-gray-500">Загрузка фото...</div>
        ) : !photos || photos.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>Фотографии не найдены</p>
            <p className="text-sm mt-2">Загрузите первое фото</p>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={onDragEnd}
          >
            <SortableContext
              items={photos.map((p) => p.id)}
              strategy={rectSortingStrategy}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {photos.map((photo) => (
                  <SortablePhotoCard
                    key={photo.id}
                    photo={photo}
                    onDelete={() => handleDelete(photo.id)}
                    onSetCover={() => handleSetCover(photo.id)}
                    canManage={canManage}
                    isDeleting={isUploading || deletePhoto.isPending || setCover.isPending || reorderPhotos.isPending}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>
    </div>
  );
}
