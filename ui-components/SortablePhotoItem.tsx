import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

type ItemProps = { id: string; url: string; onRemove: () => void };
export const SortablePhotoItem: React.FC<ItemProps> = ({ id, url, onRemove }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
    const style: React.CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.7 : 1,
    };
    return (
        <li ref={setNodeRef} style={style} {...attributes} {...listeners}
            className="relative aspect-square overflow-hidden rounded-xl border">
            <img src={url} alt="photo" className="w-full h-full object-cover" />
            <button type="button" onClick={onRemove}
                    className="absolute top-1 right-1 bg-white/80 rounded-full px-2 py-1 text-xs">×</button>
        </li>
    );
};