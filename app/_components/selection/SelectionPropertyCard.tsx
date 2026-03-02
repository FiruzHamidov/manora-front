'use client';

import Image from 'next/image';
import Link from 'next/link';
import clsx from 'clsx';
import { useCallback } from 'react';
import {axios} from "@/utils/axios";
import {Property} from "@/services/properties/types";

type Props = {
    selectionId: number;
    property: Property;
    onOpened?: (id: number) => void;
};

const STORAGE_URL = process.env.NEXT_PUBLIC_STORAGE_URL || `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}/storage`;

function fmtPrice(n: string, currency?: string | null) {
    const cur = currency === 'TJS' || !currency ? 'с.' : currency;
    return `${Number(n).toLocaleString('ru-RU')} ${cur}`;
}

function kindName(p: Property) {
    const slug = p.type?.slug;
    if (slug === 'commercial') return 'Коммерческое';
    if (slug === 'land-plots') return 'Участок';
    if (slug === 'houses') return 'Дом';
    if (slug === 'parking') return 'Парковка';
    return p.rooms ? `${p.rooms} комн. квартира` : 'Квартира';
}

export default function SelectionPropertyCard({ selectionId, property, onOpened }: Props) {
    const photo =
        property.photos?.[0]?.file_path
            ? `${STORAGE_URL}/${property.photos?.[0]?.file_path}`
            : '/images/no-image.png';

    const title = (() => {
        const base = kindName(property);
        const area = property.total_area ? `, ${property.total_area} м²` : '';
        const floor = property.floor ? `, ${property.floor} этаж` : '';
        return `${base}${area}${floor}`;
    })();

    const location =
        typeof property.location === 'object'
            ? property.location?.city || 'не указано'
            : property.location || 'не указано';

    const label = (() => {
        if (property.moderation_status === 'sold' || property.moderation_status === 'sold_by_owner') return 'Продан';
        if (property.moderation_status === 'rented') return 'Сдано';
        if (property.listing_type === 'regular') return property.offer_type === 'sale' ? 'Продаётся' : 'Сдаётся';
        return ''; // упростим — ваши LISTING_TYPE_META можно подключить при желании
    })();

    const onClickOpen = useCallback(async () => {
        try {
            onOpened?.(property.id);
            // Событие "opened"
            await axios.post(`/selections/${selectionId}/events`, {
                type: 'opened',
                payload: { property_id: property.id },
            });
        } catch {}
    }, [property.id, selectionId, onOpened]);

    return (
        <div className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow transition shadow-black/5">
            <div className="relative">
                <Link href={`/apartment/${property.id}`} onClick={onClickOpen}>
                    <Image
                        src={photo}
                        alt={property.title || 'Фото объекта'}
                        width={640}
                        height={480}
                        className="w-full aspect-[4/3] object-cover bg-gray-100"
                    />
                </Link>

                {label && (
                    <span
                        className={clsx(
                            'absolute top-3 left-3 text-[11px] font-bold px-3 py-1 rounded-full shadow backdrop-blur-sm ring-1 ring-black/10',
                            'bg-[#EFF6FF] text-[#0036A5]'
                        )}
                    >
            {label}
          </span>
                )}
            </div>

            <div className="p-3">
                <div className="flex items-center justify-between mb-1.5">
                    <div className="text-[#0036A5] font-bold text-xl">{fmtPrice(property.price, property.currency)}</div>
                    <div className="text-[11px] text-[#666F8D] bg-[#EFF6FF] px-2 py-1 rounded-full">{location}</div>
                </div>

                <Link href={`/apartment/${property.id}`} onClick={onClickOpen}>
                    <h3 className="text-sm font-semibold mb-1.5 line-clamp-2">{title}</h3>
                </Link>

                <p className="text-xs text-[#666F8D] line-clamp-2">
                    {property.address} {property.landmark ? `(${property.landmark})` : ''}
                </p>

                <div className="mt-3 flex gap-2">
                    <Link
                        href={`/apartment/${property.id}`}
                        onClick={onClickOpen}
                        className="inline-flex items-center justify-center px-3 py-2 rounded-lg text-sm font-semibold text-white bg-[#0036A5] hover:opacity-90"
                    >
                        Подробнее
                    </Link>
                    <button
                        onClick={async () => {
                            try {
                                await axios.post(`/selections/${selectionId}/events`, {
                                    type: 'requested_showing',
                                    payload: { property_id: property.id },
                                });
                                // Можно открыть модал / показать тост — тут просто alert
                                alert('Запрос на показ отправлен агенту');
                            } catch {}
                        }}
                        className="inline-flex items-center justify-center px-3 py-2 rounded-lg text-sm font-semibold text-[#0036A5] bg-[#EFF6FF] hover:bg-[#e3efff]"
                    >
                        Запросить показ
                    </button>
                </div>
            </div>
        </div>
    );
}