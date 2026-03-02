'use client';

import { useParams } from 'next/navigation';
import {
  useNewBuilding,
  useNewBuildingPhotos,
  useUploadNewBuildingPhoto,
  useDeleteNewBuildingPhoto,
  useReorderNewBuildingPhotos,
  useSetNewBuildingPhotoCover,
} from '@/services/new-buildings/hooks';
import { Button } from '@/ui-components/Button';
import { toast } from 'react-toastify';
import Link from 'next/link';
import Image from 'next/image';
import { Upload, Trash2, Star, GripVertical } from 'lucide-react';
import { ChangeEvent, useState } from 'react';
import { STORAGE_URL } from '@/constants/base-url';
import type { NewBuildingPhoto } from '@/services/new-buildings/types';

import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function SortablePhotoCard({
  photo,
  onDelete,
  onSetCover,
  isDeleting,
}: {
  photo: NewBuildingPhoto;
  onDelete: () => void;
  onSetCover: () => void;
  isDeleting: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: photo.id ?? 0 });

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
        <Image
          src={`${STORAGE_URL}/${photo.path}`}
          alt="Photo"
          fill
          className="object-cover"
        />
        {photo.is_cover && (
          <div className="absolute top-2 left-2 bg-yellow-500 text-white px-2 py-1 rounded text-xs font-medium flex items-center gap-1">
            <Star className="w-3 h-3 fill-current" />
            Обложка
          </div>
        )}
        <div
          {...attributes}
          {...listeners}
          className="absolute top-2 right-2 bg-white/90 p-2 rounded cursor-move opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <GripVertical className="w-4 h-4 text-gray-600" />
        </div>
      </div>
      <div className="p-3 flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onSetCover}
          disabled={photo.is_cover}
          className="flex-1"
        >
          <Star className="w-3 h-3 mr-1" />
          {photo.is_cover ? 'Обложка' : 'Сделать обложкой'}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onDelete}
          disabled={isDeleting}
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

export default function NewBuildingPhotosPage() {
  const params = useParams<{ id: string }>();
  const newBuildingId = Number(params.id);

  const { data: buildingResponse, isLoading: buildingLoading } =
    useNewBuilding(newBuildingId);
  const { data: photos, isLoading: photosLoading } =
    useNewBuildingPhotos(newBuildingId);

  const uploadPhoto = useUploadNewBuildingPhoto(newBuildingId);
  const deletePhoto = useDeleteNewBuildingPhoto(newBuildingId);
  const reorderPhotos = useReorderNewBuildingPhotos(newBuildingId);
  const setCover = useSetNewBuildingPhotoCover(newBuildingId);

  const [isUploading, setIsUploading] = useState(false);

  const building = buildingResponse?.data;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      for (const file of Array.from(files)) {
        await uploadPhoto.mutateAsync(file);
      }
      toast.success('Фото загружены успешно');

      e.target.value = '';
    } catch (err) {
      toast.error('Ошибка при загрузке фото');
      console.error(err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (photoId: number) => {
    if (!confirm('Удалить это фото?')) return;

    try {
      await deletePhoto.mutateAsync(photoId);
      toast.success('Фото удалено');
    } catch (err) {
      toast.error('Ошибка при удалении фото');
      console.error(err);
    }
  };

  const handleSetCover = async (photoId: number) => {
    try {
      await setCover.mutateAsync(photoId);
      toast.success('Обложка установлена');
    } catch (err) {
      toast.error('Ошибка при установке обложки');
      console.error(err);
    }
  };

  const onDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !photos) return;

    const oldIndex = photos.findIndex((p) => p.id === active.id);
    const newIndex = photos.findIndex((p) => p.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    const reorderedPhotos = arrayMove(photos, oldIndex, newIndex);
    const orders = reorderedPhotos.map((p, index) => ({
      id: p.id!,
      sort_order: index + 1, // можно 1-based, либо 0-based по API сервера
    }));

    try {
      await reorderPhotos.mutateAsync(orders);
      toast.success('Порядок фото обновлен');
    } catch (err) {
      toast.error('Ошибка при изменении порядка');
      console.error(err);
    }
  };

  if (buildingLoading) {
    return <div className="text-sm text-gray-500">Загрузка...</div>;
  }

  if (!building) {
    return <div>Новостройка не найдена</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Фотографии новостройки</h1>
          <p className="text-sm text-gray-500 mt-1">{building.title}</p>
        </div>
        <Link href={`/admin/new-buildings/${newBuildingId}`}>
          <Button variant="outline">← Назад к новостройке</Button>
        </Link>
      </div>

      <div className="border rounded-2xl p-6 bg-white">
        <div className="mb-4">
          <label
            htmlFor="photo-upload"
            className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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
            disabled={isUploading}
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
              items={photos.map((p) => p.id!)}
              strategy={rectSortingStrategy}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {photos.map((photo) => (
                  <SortablePhotoCard
                    key={photo.id}
                    photo={photo}
                    onDelete={() => handleDelete(photo.id!)}
                    onSetCover={() => handleSetCover(photo.id!)}
                    isDeleting={deletePhoto.isPending}
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
