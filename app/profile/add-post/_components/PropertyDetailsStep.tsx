'use client';

import {ChangeEvent, FormEvent, useEffect, useRef, useState} from 'react';
import {Map, Placemark, YMaps} from '@pbe/react-yandex-maps';
import {Input} from '@/ui-components/Input';
import {Select} from '@/ui-components/Select';
import {PhotoUpload} from '@/ui-components/PhotoUpload';
import {Button} from '@/ui-components/Button';
import type {FormState as RawFormState, PhotoItem, SelectOption} from '@/services/add-post/types';

type FormWithPhotos = Omit<RawFormState, 'photos'> & { photos: PhotoItem[] };

interface AgentOption {
    id: number;
    name: string;
}

interface PropertyDetailsStepProps {
    form: FormWithPhotos;
    locations: SelectOption[];
    repairTypes: SelectOption[];
    developers: SelectOption[];
    heatingTypes: SelectOption[];
    parkingTypes: SelectOption[];
    contractTypes: SelectOption[];
    onSubmit: (e: FormEvent) => void;
    onChange: (
        e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => void;
    onPhotoChange: (e: ChangeEvent<HTMLInputElement>) => void;
    onPhotoRemove: (index: number) => void;
    onReorder: (next: PhotoItem[]) => void;
    isSubmitting: boolean;
    onBack?: () => void;
    selectedPropertyType: number | null;
    propertyTypes: SelectOption[];

    /* --- new props for admin agent selection --- */
    isAdmin?: boolean;
    agents?: AgentOption[];
    agentsLoading?: boolean;
}

type YMapClickEvent = {
    // Yandex maps event minimal interface we use
    get: (key: 'coords') => [number, number];
};

interface GeoObject {
    getAddressLine: () => string;
    getAdministrativeAreas: () => string[];
}

interface GeocoderResult {
    geoObjects: {
        get: (index: number) => GeoObject | undefined;
    };
}

export function PropertyDetailsStep({
                                        form,
                                        locations,
                                        repairTypes,
                                        developers,
                                        heatingTypes,
                                        parkingTypes,
                                        contractTypes,
                                        onSubmit,
                                        onChange,
                                        onPhotoChange,
                                        onPhotoRemove,
                                        onReorder,
                                        isSubmitting,
                                        onBack,
                                        selectedPropertyType,
                                        propertyTypes,
                                        isAdmin = false,
                                        agents = [],
                                        agentsLoading = false,
                                    }: PropertyDetailsStepProps) {
    const [coordinates, setCoordinates] = useState<[number, number] | null>(
        form.latitude && form.longitude
            ? [parseFloat(String(form.latitude)), parseFloat(String(form.longitude))]
            : null
    );

    const [addressCaption, setAddressCaption] = useState<string>('');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mapRef = useRef<any>(null);
    const ymapsRef = useRef<{ geocode: (coords: [number, number]) => Promise<GeocoderResult> } | null>(null);

    const DISTRICTS: SelectOption[] = [
        {id: 1, name: 'Сино'},
        {id: 2, name: 'И Сомони'},
        {id: 3, name: 'Шохмансур'},
        {id: 4, name: 'Фирдавси'},
    ];

    const [showOptions, setShowOptions] = useState(false);
    const wrapperRef = useRef<HTMLDivElement | null>(null);

    const options = ["У риелтора", "У владельца"];

    const selectedProperty = propertyTypes?.find(p => p.id === selectedPropertyType);
    const isLandOrHouse = Boolean(
        selectedProperty && /(?:участ|земл|дом|house|land)/i.test(String(selectedProperty.name))
    );

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                wrapperRef.current &&
                !wrapperRef.current.contains(event.target as Node)
            ) {
                setShowOptions(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSelect = (value: string) => {
        const syntheticEvent = {
            target: {name: 'object_key', value},
            currentTarget: {name: 'object_key', value},
        } as unknown as ChangeEvent<HTMLInputElement>;

        onChange(syntheticEvent);
        setShowOptions(false);
    };

    const handleMapClick = (e: YMapClickEvent) => {
        // Получаем координаты (типизированный get)
        const coords = e.get('coords');
        if (!coords || !Array.isArray(coords) || coords.length < 2) return;

        setCoordinates([coords[0], coords[1]]);

        // Создаём синтетические события с корректным типом вместо `as any`
        const latEvent = {
            target: {
                name: 'latitude',
                value: coords[0].toString(),
            },
        } as unknown as ChangeEvent<HTMLInputElement>;

        const lngEvent = {
            target: {
                name: 'longitude',
                value: coords[1].toString(),
            },
        } as unknown as ChangeEvent<HTMLInputElement>;

        onChange(latEvent);
        onChange(lngEvent);

        if (ymapsRef.current) {
            try {
                const geocoder = ymapsRef.current.geocode(coords);
                geocoder
                    // eslint-disable-next-line
                    .then((res: { geoObjects: { get: (index: number) => any } }) => {
                        const firstGeoObject = res.geoObjects.get(0);
                        if (firstGeoObject) {
                            const address = firstGeoObject.getAddressLine?.() ?? '';
                            setAddressCaption(address);

                            const addressEvent = {
                                target: {
                                    name: 'address',
                                    value: address,
                                },
                            } as React.ChangeEvent<HTMLInputElement>;

                            onChange(addressEvent);

                            try {
                                const district =
                                    firstGeoObject.getAdministrativeAreas()[0] || '';
                                if (district) {
                                    const districtEvent = {
                                        target: {
                                            name: 'district',
                                            value: district,
                                        },
                                    } as React.ChangeEvent<HTMLInputElement>;

                                    onChange(districtEvent);
                                }
                            } catch (error) {
                            }
                        }
                    })
                    .catch((error: Error) => {
                        console.error('Geocoding error:', error);
                    });
            } catch (error) {
                console.error('Error initializing geocoder:', error);
            }
        }
    };

    return (
        <form onSubmit={onSubmit} className="flex flex-col gap-6">
            <h2 className="text-xl font-bold mb-4 text-[#666F8D]">Детали объекта</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {isAdmin && (
                    <div className="md:col-span-2">
                        <label className="block mb-2 text-sm text-[#666F8D]">Агент</label>
                        <select
                            name="created_by"
                            value={String(form.created_by ?? '')}
                            onChange={onChange}
                            className="w-full px-3 py-2 rounded border border-[#BAC0CC] bg-white"
                        >
                            <option value="">Не назначено</option>
                            {agentsLoading ? (
                                <option disabled>Загрузка...</option>
                            ) : (
                                agents.map((a) => (
                                    <option key={a.id} value={String(a.id)}>
                                        {a.name}
                                    </option>
                                ))
                            )}
                        </select>
                    </div>
                )}

                <Select
                    label="Расположение"
                    name="location_id"
                    value={form.location_id}
                    options={locations}
                    labelField="city"
                    onChange={onChange}
                    required
                />

                <Select
                    label="Район"
                    name="district"
                    value={form.district}
                    options={DISTRICTS}
                    onChange={onChange}
                    valueField="name"
                />

                <Input
                    label="Адрес"
                    name="address"
                    value={form.address}
                    onChange={onChange}
                    type="text"
                    placeholder="Айни 51"
                />

                <Input
                    label="Ориентир"
                    name="landmark"
                    type="text"
                    value={form.landmark}
                    onChange={onChange}
                    placeholder="Например: Пайкари гумрук"
                />

                <Select
                    label="Застройщик"
                    name="developer_id"
                    value={form.developer_id}
                    options={developers}
                    onChange={onChange}
                />

                <Select
                    label="Ремонт"
                    name="repair_type_id"
                    value={form.repair_type_id}
                    options={repairTypes}
                    onChange={onChange}
                    required
                />

                <Select
                    label="Отопление"
                    name="heating_type_id"
                    value={form.heating_type_id}
                    options={heatingTypes}
                    onChange={onChange}
                />

                <Select
                    label="Парковка"
                    name="parking_type_id"
                    value={form.parking_type_id}
                    options={parkingTypes}
                    onChange={onChange}
                />

                <Select
                    label="Тип контракта"
                    name="contract_type_id"
                    value={form.contract_type_id}
                    options={contractTypes}
                    onChange={onChange}
                    required
                />

                <Input
                    label="Телефон владельца"
                    name="owner_phone"
                    value={form.owner_phone}
                    onChange={onChange}
                    type="tel"
                    placeholder="+992 XX XXX XX XX"
                    required
                />

                <Input
                    label="ФИО владельца"
                    name="owner_name"
                    value={form.owner_name}
                    onChange={onChange}
                    type="text"
                    placeholder="Эшматов Тошмат"
                    required
                />

                <div className="flex items-center gap-3">
                    <label htmlFor="is_business_owner" className="text-gray-700 text-base cursor-pointer">
                        Владелец бизнесмен?
                    </label>
                    <input
                        type="checkbox"
                        id="is_business_owner"
                        name="is_business_owner"
                        checked={form.is_business_owner}
                        onChange={(e) => {
                            const syntheticEvent = {
                                target: {name: 'is_business_owner', value: e.target.checked ? '1' : ''},
                                currentTarget: {name: 'is_business_owner', value: e.target.checked ? '1' : ''},
                            } as unknown as ChangeEvent<HTMLInputElement>;
                            onChange(syntheticEvent);
                        }}
                        className="w-6 h-6 accent-blue-600 rounded-md cursor-pointer"
                    />
                </div>
                <div className="flex items-center gap-3">
                    <label htmlFor="is_full_apartment" className="text-gray-700 text-base cursor-pointer">
                        Полноценная квартира?
                    </label>
                    <input
                        type="checkbox"
                        id="is_full_apartment"
                        name="is_full_apartment"
                        checked={form.is_full_apartment}
                        onChange={(e) => {
                            const syntheticEvent = {
                                target: {name: 'is_full_apartment', value: e.target.checked ? '1' : ''},
                                currentTarget: {name: 'is_full_apartment', value: e.target.checked ? '1' : ''},
                            } as unknown as ChangeEvent<HTMLInputElement>;
                            onChange(syntheticEvent);
                        }}
                        className="w-6 h-6 accent-blue-600 rounded-md cursor-pointer"
                    />
                </div>

                <div className="relative w-full" ref={wrapperRef}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Ключ от объекта *
                    </label>
                    <input
                        type="text"
                        name="object_key"
                        value={form.object_key || ""}
                        placeholder="У кого ключ от объекта?"
                        onChange={onChange}
                        onFocus={() => setShowOptions(true)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                        required
                    />

                    {showOptions && (
                        <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg">
                            {options.map((option) => (
                                <button
                                    key={option}
                                    type="button"
                                    onClick={() => handleSelect(option)}
                                    className="block w-full text-left px-4 py-2 hover:bg-blue-50 transition-colors"
                                >
                                    {option}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <Input
                    label="Цена"
                    name="price"
                    type="number"
                    value={form.price}
                    onChange={onChange}
                    placeholder="0"
                    required
                />

                <div className="flex items-center gap-3">
                    <label htmlFor="is_for_aura" className="text-gray-700 text-base cursor-pointer">
                        Только для manora.tj?
                    </label>
                    <input
                        type="checkbox"
                        id="is_for_aura"
                        name="is_for_aura"
                        checked={form.is_for_aura}
                        onChange={(e) => {
                            const syntheticEvent = {
                                target: {name: 'is_for_aura', value: e.target.checked ? '1' : ''},
                                currentTarget: {name: 'is_for_aura', value: e.target.checked ? '1' : ''},
                            } as unknown as ChangeEvent<HTMLInputElement>;
                            onChange(syntheticEvent);
                        }}
                        className="w-6 h-6 accent-blue-600 rounded-md cursor-pointer"
                    />
                </div>

                <Input
                    label="Площадь (общая)"
                    name="total_area"
                    type="number"
                    value={form.total_area}
                    onChange={onChange}
                    placeholder="0"
                    required
                />
                {isLandOrHouse && (
                    <Input
                        label="Площадь участка (сотки)"
                        name="land_size"
                        type="number"
                        value={form.land_size}
                        onChange={onChange}
                        placeholder="0"
                    />
                )}

                <Input
                    label="Площадь (жилая)"
                    name="living_area"
                    type="number"
                    value={form.living_area}
                    onChange={onChange}
                    placeholder="0"
                />

                <Input
                    label="Этаж"
                    name="floor"
                    type="number"
                    value={form.floor}
                    onChange={onChange}
                    placeholder="1"
                    required
                />

                <Input
                    label="Всего этажей"
                    name="total_floors"
                    type="number"
                    value={form.total_floors}
                    onChange={onChange}
                    placeholder="1"
                    required
                />

                <Input
                    label="Год постройки"
                    name="year_built"
                    type="number"
                    value={form.year_built}
                    onChange={onChange}
                    placeholder="2024"
                />

                <Input
                    label="YouTube ссылка"
                    name="youtube_link"
                    value={form.youtube_link}
                    onChange={onChange}
                    placeholder="https://youtube.com/..."
                />

                {isAdmin && (
                    <Input
                        label="Фактическая дата продажи"
                        name="sold_at"
                        type="datetime-local"
                        value={form.sold_at}
                        onChange={onChange}
                    />


                )}

                <Input
                    label="Широта"
                    name="latitude"
                    type="number"
                    value={form.latitude}
                    onChange={onChange}
                    placeholder="1"
                    required
                    disabled
                />

                <Input
                    label="Долгота"
                    name="longitude"
                    type="number"
                    value={form.longitude}
                    onChange={onChange}
                    placeholder="1"
                    required
                    disabled
                />
            </div>

            <PhotoUpload
                photos={form.photos}
                onPhotoChange={onPhotoChange}
                onPhotoRemove={onPhotoRemove}
                onReorder={onReorder}
                className="mt-6"
            />

            <Input
                label="Описание"
                name="description"
                value={form.description}
                onChange={onChange}
                textarea
                placeholder="Подробное описание объекта..."
                className="mt-4"
            />

            <div className="mt-4">
                <label className="block mb-2 text-sm  text-[#666F8D]">
                    Расположение на карте (кликните для выбора)
                </label>
                <div className="h-[400px] w-full">
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
                            onLoad={(ymaps) => {
                                // store a small typed wrapper that exposes geocode if available
                                const maybe = (ymaps as unknown) as {
                                    geocode?: (coords: [number, number]) => Promise<GeocoderResult>
                                };
                                if (maybe && typeof maybe.geocode === 'function') {
                                    ymapsRef.current = {
                                        geocode: (coords: [number, number]) => maybe.geocode!(coords),
                                    };
                                } else {
                                    ymapsRef.current = null;
                                }
                                return undefined;
                            }}
                        >
                            {coordinates && (
                                <Placemark
                                    geometry={coordinates}
                                    options={{
                                        preset: 'islands#blueHomeIcon',
                                        draggable: true,
                                    }}
                                    properties={{
                                        iconCaption: addressCaption || 'Определение адреса...',
                                    }}
                                />
                            )}
                        </Map>
                    </YMaps>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                    Точные координаты будут автоматически заполнены при клике на карту
                </p>
            </div>

            <div className="flex justify-between mt-2 flex-col sm:flex-row">
                {onBack && (
                    <Button
                        className="mt-4"
                        type="button"
                        variant="outline"
                        onClick={onBack}
                        size="lg"
                    >
                        Назад
                    </Button>
                )}
                <Button className="mt-4" type="submit" loading={isSubmitting} size="lg">
                    {isSubmitting ? 'Сохранение...' : 'Сохранить'}
                </Button>
            </div>
        </form>
    );
}
