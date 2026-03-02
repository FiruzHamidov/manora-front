'use client';

import Image from 'next/image';
import { ChangeEvent, useMemo } from 'react';
import { STORAGE_URL } from '@/constants/base-url';
import { PhotoItem } from '@/services/add-post/types';

// dnd-kit
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

type PhotoUploadProps = {
  photos: PhotoItem[];
  onPhotoChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onPhotoRemove: (index: number) => void;
  onReorder: (next: PhotoItem[]) => void; // ⬅️ новый проп
  label?: string;
  className?: string;
};

export function PhotoUpload({
                              photos,
                              onPhotoChange,
                              onPhotoRemove,
                              onReorder,
                              label = 'Фотографии',
                              className = '',
                            }: PhotoUploadProps) {
  // Сенсоры dnd-kit: мышь/тач. Можно добавить KeyboardSensor при желании.
  const sensors = useSensors(
      useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  // id’шники dnd = наши client-id
  const sortableIds = useMemo(() => photos.map((p) => p.id), [photos]);

  // 🔁 Обработка завершения перетаскивания: меняем порядок и уведомляем родителя
  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;

    const oldIndex = photos.findIndex((p) => p.id === active.id);
    const newIndex = photos.findIndex((p) => p.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const next = arrayMove(photos, oldIndex, newIndex);
    onReorder(next); // ⬅️ родитель обновит form.photos
  };

  return (
      <div className={className}>
        <label className="block mb-2 text-sm text-[#666F8D]">{label}</label>

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={sortableIds} strategy={rectSortingStrategy}>
            <div className="flex gap-3 flex-wrap">
              {photos.map((p, index) => (
                  <SortablePhotoCard
                      key={p.id}
                      photo={p}
                      index={index}
                      onRemove={() => onPhotoRemove(index)}
                  />
              ))}

              {/* Кнопка добавления фото */}
              <label className="w-24 h-24 border border-[#BAC0CC] border-dashed rounded-lg flex items-center justify-center text-3xl cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                +
                <input type="file" multiple accept="image/*" onChange={onPhotoChange} className="hidden" />
              </label>
            </div>
          </SortableContext>
        </DndContext>
      </div>
  );
}

/** Отдельная sortable-карточка */
function SortablePhotoCard({
                             photo,
                             index,
                             onRemove,
                           }: {
  photo: PhotoItem;
  index: number;
  onRemove: () => void;
}) {
  // useSortable связывает DOM-узел с dnd-системой
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: photo.id, // обязательно: тот же id, что и в SortableContext
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.85 : 1,
    cursor: 'grab',
  };

  // NB: для новых фото url — это objectURL; для серверных — полный CDN/Storage URL
  const url = photo.url.startsWith('blob:')
      ? photo.url
      : `${STORAGE_URL}/${photo.url}`.replace(/\/+$/, ''); // подстрой, если url уже полный

  return (
      <div
          ref={setNodeRef}
          style={style}
          {...attributes}
          {...listeners}
          className="w-24 h-24 border border-[#BAC0CC] border-dashed relative rounded-lg overflow-hidden"
          title={`Фото #${index + 1}`}
      >
        <Image
            src={url}
            alt="photo"
            className="object-cover w-full h-full"
            fill
            sizes="96px"
            // ⚠️ objectURL можно освободить, но только если он больше не используется.
            // Обычно освобождают при unmount, а не при onLoad, чтобы не сломать превью.
            // Тут оставим без revoke — это безопаснее.
        />
        <button
            type="button"
            onClick={onRemove}
            className="absolute top-0 right-0 w-6 h-6 text-white bg-red-500 rounded-full flex items-center justify-center text-xs hover:bg-red-600 transition-colors cursor-pointer"
            aria-label="Удалить"
            title="Удалить"
        >
          ×
        </button>
      </div>
  );
}