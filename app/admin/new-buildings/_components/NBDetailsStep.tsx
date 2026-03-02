'use client';

import {ChangeEvent, FormEvent, useRef, useState} from 'react';
import type * as ymaps from 'yandex-maps';
import {Map, Placemark, YMaps} from '@pbe/react-yandex-maps';
import {Input} from '@/ui-components/Input';
import {Select} from '@/ui-components/Select';
import {Button} from '@/ui-components/Button';
import type {LocationOption} from '@/services/new-buildings/types';
import type {SelectOption} from "@/services/add-post";

interface Props {
    values: {
        location_id: number | null;
        floors_range: string;
        completion_at: string;
        district: string;
        address: string;
        latitude?: string | number | null | undefined;
        longitude?: string | number | null | undefined;
        ceiling_height?: string | number | null | undefined;
    };
    locations: LocationOption[];
    onChange: (
        e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => void;
    onSubmit: (e: FormEvent) => void;
    isSubmitting: boolean;
    onBack: () => void;
}

const DISTRICTS: SelectOption[] = [
    {id: 1, name: 'Сино'},
    {id: 2, name: 'И Сомони'},
    {id: 3, name: 'Шохмансур'},
    {id: 4, name: 'Фирдавси'},
];

// Используем тип события из yandex-maps
type YMapClickEvent = ymaps.IEvent;

export default function NBDetailsStep({
                                          values,
                                          locations,
                                          onChange,
                                          onSubmit,
                                          isSubmitting,
                                          onBack,
                                      }: Props) {
    const [coordinates, setCoordinates] = useState<[number, number] | null>(
        values.latitude && values.longitude
            ? [Number(values.latitude), Number(values.longitude)]
            : null
    );
    const [addressCaption, setAddressCaption] = useState<string>('');

    const mapRef = useRef<ymaps.Map | undefined>(undefined);
    const ymapsRef = useRef<typeof ymaps | null>(null);

    const fireChange = (name: string, value: string) => {
        const evt = {
            target: {name, value},
        } as unknown as ChangeEvent<HTMLInputElement>;
        onChange(evt);
    };

    const handleMapClick = (e: YMapClickEvent) => {
        const coords = e.get('coords') as [number, number];
        setCoordinates([coords[0], coords[1]]);

        fireChange('latitude', String(coords[0]));
        fireChange('longitude', String(coords[1]));

        if (ymapsRef.current) {
            try {
                const geocoder = ymapsRef.current.geocode(coords);
                geocoder.then((res: ymaps.IGeocodeResult) => {
                    // Первый объект результата геокодирования
                    const firstGeoObject = res.geoObjects.get(0) as unknown as
                        | { getAddressLine: () => string }
                        | undefined;

                    if (firstGeoObject) {
                        const address = firstGeoObject.getAddressLine();
                        setAddressCaption(address);
                        fireChange('address', address);
                    }
                });
            } catch {
                // ignore geocode runtime errors
            }
        }
    };

    return (
        <form onSubmit={onSubmit} className="flex flex-col gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Select
                    label="Расположение"
                    name="location_id"
                    value={values.location_id?.toString() ?? ''}
                    options={locations.map((l) => ({id: l.id, name: l.city}))}
                    onChange={onChange}
                />
                <Select
                    label="Район"
                    name="district"
                    value={values.district}
                    options={DISTRICTS}
                    onChange={onChange}
                    valueField="name"
                />

                <Input
                    label="Диапазон этажей (например 3-14)"
                    name="floors_range"
                    value={values.floors_range}
                    onChange={onChange}
                    placeholder="3-14"
                />
                <Input
                    label="Срок сдачи (дата)"
                    name="completion_at"
                    type="date"
                    value={values.completion_at}
                    onChange={onChange}
                />
                <Input
                    label="Адрес"
                    name="address"
                    value={values.address}
                    onChange={onChange}
                    placeholder="Айни 51"
                />
                <Input
                    label="Высота потолков (м)"
                    name="ceiling_height"
                    type="number"
                    value={String(values.ceiling_height ?? '')}
                    onChange={onChange}
                    placeholder="Например: 2.80"
                />

                <Input
                    label="Широта"
                    name="latitude"
                    type="number"
                    value={String(values.latitude ?? '')}
                    onChange={onChange}
                    required
                    disabled
                />
                <Input
                    label="Долгота"
                    name="longitude"
                    type="number"
                    value={String(values.longitude ?? '')}
                    onChange={onChange}
                    required
                    disabled
                />
            </div>

            <div>
                <label className="block mb-2 text-sm text-[#666F8D]">
                    Расположение на карте (кликните для выбора)
                </label>
                <div className="h=[380px] w-full h-[380px]">
                    <YMaps
                        query={{
                            lang: 'ru_RU',
                            apikey: 'dbdc2ae1-bcbd-4f76-ab38-94ca88cf2a6f',
                        }}
                    >
                        <Map
                            defaultState={{center: [38.5597722, 68.7870384], zoom: 9}}
                            width="100%"
                            height="100%"
                            onClick={handleMapClick}
                            instanceRef={mapRef}
                            modules={['geocode']}
                            onLoad={(y) => {
                                ymapsRef.current = y;
                                return undefined;
                            }}
                        >
                            {coordinates && (
                                <Placemark
                                    geometry={coordinates}
                                    options={{preset: 'islands#blueHomeIcon', draggable: true}}
                                    properties={{
                                        iconCaption: addressCaption || 'Определение адреса...',
                                    }}
                                />
                            )}
                        </Map>
                    </YMaps>
                </div>
            </div>

            <div className="flex justify-between mt-2 flex-col sm:flex-row">
                <Button type="button" variant="outline" onClick={onBack} size="lg">
                    Назад
                </Button>
                <Button type="submit" loading={isSubmitting} size="lg">
                    {isSubmitting ? 'Сохранение...' : 'Сохранить'}
                </Button>
            </div>
        </form>
    );
}
