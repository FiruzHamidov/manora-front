'use client';

import {FC, FormEvent, useEffect, useMemo, useState} from 'react';
import MultiSelectInput, {MultiOption,} from '@/ui-components/MultiSelectInput';
import {PropertyFilters} from '@/services/properties/types';
import {
    type PropertyType,
    useGetLocationsQuery,
    useGetRepairTypesQuery,
} from '@/services/add-post';
import clsx from "clsx";
import { PROPERTY_DOCUMENT_TYPES } from '@/constants/property-document-types';
import { uniqueOptionsByName } from '@/utils/select-options';
import {useQuery} from '@tanstack/react-query';
import {axios} from '@/utils/axios';

interface AllFiltersProps {
    isOpen: boolean;
    onClose: () => void;
    onSearch: (filters: PropertyFilters) => void;
    initialFilters?: {
        propertyTypes?: string[];
        objectTypes?: string[];
        cities?: string[];
        areaCodes?: string[];
        repairs?: string[];
        priceFrom?: string;
        priceTo?: string;
        roomsFrom?: string;
        roomsTo?: string;
        areaFrom?: string;
        areaTo?: string;
        landAreaFrom?: string;
        landAreaTo?: string;
        floorFrom?: string;
        floorTo?: string;
        landmark?: string;
        offer_type?: string;
        document_type?: string;
        commercial_purpose?: string;
        power_kw_from?: string;
        power_kw_to?: string;
        vehicle_capacity_from?: string;
        vehicle_capacity_to?: string;
    };
    propertyTypes: PropertyType[]
}

function ToggleChipGroup({
    label,
    options,
    value,
    onChange,
}: {
    label: string;
    options: MultiOption[];
    value: Array<string | number>;
    onChange: (next: Array<string | number>) => void;
}) {
    const toggle = (id: string | number) => {
        if (value.includes(id)) {
            onChange(value.filter((item) => item !== id));
            return;
        }
        onChange([...value, id]);
    };

    return (
        <div className="flex flex-col gap-2.5">
            <label className="text-sm font-medium text-[#475569]">{label}</label>
            <div className="flex flex-wrap gap-2">
                {options.map((option) => {
                    const selected = value.includes(option.id);
                    return (
                        <button
                            key={option.id}
                            type="button"
                            onClick={() => toggle(option.id)}
                            className={clsx(
                                'inline-flex min-h-9 items-center rounded-xl border px-3 py-2 text-sm font-medium transition-colors',
                                selected
                                    ? 'border-[#006341] bg-[#EFFAF5] text-[#006341]'
                                    : 'border-[#D6DEE8] bg-white text-[#334155] hover:border-[#94A3B8]'
                            )}
                        >
                            {option.name}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

function RangeFilter({
    label,
    from,
    to,
    onFromChange,
    onToChange,
}: {
    label: string;
    from: string;
    to: string;
    onFromChange: (value: string) => void;
    onToChange: (value: string) => void;
}) {
    return (
        <div className="rounded-2xl border border-[#E2E8F0] p-3">
            <p className="text-sm font-medium text-[#334155]">{label}</p>
            <div className="mt-2 grid grid-cols-2 gap-2">
                <input
                    value={from}
                    onChange={(event) => onFromChange(event.target.value)}
                    className="h-10 rounded-lg border border-[#E2E8F0] px-3 text-sm outline-none"
                    inputMode="decimal"
                    placeholder="От"
                />
                <input
                    value={to}
                    onChange={(event) => onToChange(event.target.value)}
                    className="h-10 rounded-lg border border-[#E2E8F0] px-3 text-sm outline-none"
                    inputMode="decimal"
                    placeholder="До"
                />
            </div>
        </div>
    );
}

export const AllFilters: FC<AllFiltersProps> = ({
                                                    isOpen,
                                                    onClose,
                                                    onSearch,
                                                    initialFilters = {},
                                                    propertyTypes
                                                }) => {

    const {data: locationTypes} = useGetLocationsQuery();
    const {data: repairTypes} = useGetRepairTypesQuery();

    const propertyTypeOpts: MultiOption[] = (propertyTypes ?? []).map(
        (x: ApiEntity) => ({
            id: x.id ?? x.slug ?? x.name,
            name: x.name,
            slug: x.slug,
        })
    );

    const repairTypeOpts: MultiOption[] = useMemo(() => {
        const options = new Map<string, MultiOption>();
        for (const repairType of repairTypes ?? []) {
            const code = repairType.name === 'Без ремонта / коробка' ? 'shell' : 'renovated';
            options.set(code, {
                id: code,
                name: code === 'shell' ? 'Без ремонта / коробка' : 'С ремонтом',
            });
        }
        return [...options.values()];
    }, [repairTypes]);

    const cityOpts: MultiOption[] = uniqueOptionsByName((locationTypes ?? []).map(
        (loc: LocationEntity, index: number) => ({
            id: loc.id ?? loc.city ?? loc.name ?? `location-${index}`,
            name: loc.city ?? loc.name ?? 'Город',
        })
    ));

    const [selectedPropertyTypes, setSelectedPropertyTypes] = useState<
        Array<string | number>
    >([]);
    const [selectedObjectTypes, setSelectedObjectTypes] = useState<Array<string | number>>([]);
    const [selectedCities, setSelectedCities] = useState<Array<string | number>>(
        []
    );
    const [selectedAreaCodes, setSelectedAreaCodes] = useState<Array<string | number>>([]);
    const [repairs, setRepairs] = useState<Array<string | number>>([]);

    const [priceFrom, setPriceFrom] = useState('0');
    const [priceTo, setPriceTo] = useState('0');
    const [roomsFrom, setRoomsFrom] = useState('0');
    const [roomsTo, setRoomsTo] = useState('0');
    const [areaFrom, setAreaFrom] = useState('0');
    const [areaTo, setAreaTo] = useState('0');
    const [landAreaFrom, setLandAreaFrom] = useState('0');
    const [landAreaTo, setLandAreaTo] = useState('0');
    const [floorFrom, setFloorFrom] = useState('1');
    const [floorTo, setFloorTo] = useState('3');
    const [landmark, setLandmark] = useState('');
    const [offerType, setOfferType] = useState<'sale' | 'rent'>('sale');
    const [documentType, setDocumentType] = useState('');
    const [commercialPurpose, setCommercialPurpose] = useState('');
    const [powerKwFrom, setPowerKwFrom] = useState('');
    const [powerKwTo, setPowerKwTo] = useState('');
    const [vehicleCapacityFrom, setVehicleCapacityFrom] = useState('');
    const [vehicleCapacityTo, setVehicleCapacityTo] = useState('');
     
    // eslint-disable-next-line
    const [listingType, setListingType] = useState<'regular' | 'vip'>('regular');

    const selectedCategoryCodes = useMemo(() => new Set(
        (propertyTypes ?? [])
            .filter((type) => selectedPropertyTypes.includes(type.id))
            .map((type) => type.slug)
            .filter((code): code is string => Boolean(code))
    ), [propertyTypes, selectedPropertyTypes]);
    const objectTypeOpts = useMemo<MultiOption[]>(() => {
        const unique = new Map<string, MultiOption>();
        for (const category of propertyTypes ?? []) {
            if (!selectedPropertyTypes.includes(category.id)) continue;
            for (const objectType of category.object_types ?? []) {
                if (offerType === 'rent' ? !objectType.rent : !objectType.sale) continue;
                unique.set(objectType.code, {id: objectType.code, name: objectType.name});
            }
        }
        return [...unique.values()];
    }, [offerType, propertyTypes, selectedPropertyTypes]);
    const selectedCityIdsKey = selectedCities.map(String).sort().join(',');
    const {data: areaOptions = [], isSuccess: areAreasLoaded} = useQuery({
        queryKey: ['catalog-filter', 'areas', selectedCityIdsKey],
        queryFn: async (): Promise<MultiOption[]> => {
            const {data} = await axios.get<{items?: Array<{code: string; name: string}>}>('/districts', {
                params: selectedCities.length ? {city_ids: selectedCities.map(Number)} : undefined,
            });
            return (data.items ?? []).map((area) => ({id: area.code, name: area.name}));
        },
        staleTime: 5 * 60 * 1000,
    });
    const noCategorySelected = selectedCategoryCodes.size === 0;
    const showsRooms = noCategorySelected || ['apartments', 'houses', 'new-buildings']
        .some((code) => selectedCategoryCodes.has(code));
    const showsLandArea = ['houses', 'land', 'industrial']
        .some((code) => selectedCategoryCodes.has(code));
    const showsTotalArea = noCategorySelected
        || selectedCategoryCodes.size !== 1
        || !selectedCategoryCodes.has('land');
    const showsCommercialPurpose = selectedCategoryCodes.has('commercial');
    const showsPower = selectedCategoryCodes.has('commercial')
        || selectedCategoryCodes.has('industrial');
    const showsVehicleCapacity = selectedCategoryCodes.has('parking');
    const showsFloor = noCategorySelected || ['apartments', 'commercial', 'parking']
        .some((code) => selectedCategoryCodes.has(code));
    const showsRenovation = noCategorySelected || ['apartments', 'houses', 'commercial']
        .some((code) => selectedCategoryCodes.has(code));

    useEffect(() => {
        if (initialFilters) {
            setSelectedPropertyTypes(initialFilters.propertyTypes?.map(Number) || []);
            setSelectedObjectTypes(initialFilters.objectTypes || []);
            setSelectedCities(initialFilters.cities?.map(Number) || []);
            setRepairs(initialFilters.repairs || []);
            setSelectedAreaCodes(initialFilters.areaCodes || []);
            setPriceFrom(initialFilters.priceFrom || '');
            setPriceTo(initialFilters.priceTo || '');
            setRoomsFrom(initialFilters.roomsFrom || '');
            setRoomsTo(initialFilters.roomsTo || '');
            setAreaFrom(initialFilters.areaFrom || '');
            setAreaTo(initialFilters.areaTo || '');
            setLandAreaFrom(initialFilters.landAreaFrom || '');
            setLandAreaTo(initialFilters.landAreaTo || '');
            setFloorFrom(initialFilters.floorFrom || '');
            setFloorTo(initialFilters.floorTo || '');
            setLandmark(initialFilters.landmark || '');
            // parse boolean-like values reliably (handles true/false booleans and 'true'/'false' strings)
            setOfferType(initialFilters.offer_type === 'rent' ? 'rent' : 'sale');
            setDocumentType(initialFilters.document_type || '');
            setCommercialPurpose(initialFilters.commercial_purpose || '');
            setPowerKwFrom(initialFilters.power_kw_from || '');
            setPowerKwTo(initialFilters.power_kw_to || '');
            setVehicleCapacityFrom(initialFilters.vehicle_capacity_from || '');
            setVehicleCapacityTo(initialFilters.vehicle_capacity_to || '');
        }
    }, [initialFilters]);

    useEffect(() => {
        const allowed = new Set(objectTypeOpts.map((option) => String(option.id)));
        setSelectedObjectTypes((current) => current.filter((value) => allowed.has(String(value))));
    }, [objectTypeOpts]);

    useEffect(() => {
        if (!areAreasLoaded) return;
        const allowed = new Set(areaOptions.map((option) => String(option.id)));
        setSelectedAreaCodes((current) => current.filter((value) => allowed.has(String(value))));
    }, [areaOptions, areAreasLoaded]);

    useEffect(() => {
        if (!isOpen) return;

        const previous = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        return () => {
            document.body.style.overflow = previous;
        };
    }, [isOpen]);


    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();

        const filters = {
            propertyTypes: selectedPropertyTypes.length
                ? selectedPropertyTypes.map(String)
                : undefined,

            object_type_codes: selectedObjectTypes.length
                ? selectedObjectTypes.map(String).join(',')
                : undefined,

            cities: selectedCities.length ? selectedCities.map(String) : undefined,
            area_codes: selectedAreaCodes.length ? selectedAreaCodes.map(String).join(',') : undefined,

            renovation_codes: showsRenovation && repairs.length ? repairs.map(String).join(',') : undefined,

            priceFrom: priceFrom && priceFrom !== '0' ? priceFrom : undefined,
            priceTo: priceTo && priceTo !== '0' ? priceTo : undefined,
            roomsFrom: showsRooms && roomsFrom && roomsFrom !== '0' ? roomsFrom : undefined,
            roomsTo: showsRooms && roomsTo && roomsTo !== '0' ? roomsTo : undefined,

            areaFrom: showsTotalArea && areaFrom && areaFrom !== '0' ? areaFrom : undefined,
            areaTo: showsTotalArea && areaTo && areaTo !== '0' ? areaTo : undefined,
            land_area_sotka_from: showsLandArea && landAreaFrom && landAreaFrom !== '0' ? landAreaFrom : undefined,
            land_area_sotka_to: showsLandArea && landAreaTo && landAreaTo !== '0' ? landAreaTo : undefined,

            floorFrom:
                showsFloor && floorFrom && floorFrom !== '0' && floorFrom !== '1'
                    ? floorFrom
                    : undefined,
            floorTo:
                showsFloor && floorTo && floorTo !== '0' && floorTo !== '3' ? floorTo : undefined,

            listing_type: listingType === 'regular' ? undefined : listingType,
            landmark: landmark,
            offer_type: offerType,
            document_type: documentType || undefined,
            commercial_purpose: showsCommercialPurpose ? commercialPurpose || undefined : undefined,
            power_kw_from: showsPower ? powerKwFrom || undefined : undefined,
            power_kw_to: showsPower ? powerKwTo || undefined : undefined,
            vehicle_capacity_from: showsVehicleCapacity ? vehicleCapacityFrom || undefined : undefined,
            vehicle_capacity_to: showsVehicleCapacity ? vehicleCapacityTo || undefined : undefined,
        };

        const cleanedFilters = Object.fromEntries(
            // eslint-disable-next-line
            Object.entries(filters).filter(([_, value]) => value !== undefined)
        );

        onSearch(cleanedFilters as unknown as PropertyFilters);
    };

    const handleReset = () => {
        setSelectedPropertyTypes([]);
        setSelectedObjectTypes([]);
        setSelectedCities([]);
        setSelectedAreaCodes([]);
        setRepairs([]);
        setPriceFrom('');
        setPriceTo('');
        setRoomsFrom('');
        setRoomsTo('');
        setAreaFrom('');
        setAreaTo('');
        setLandAreaFrom('');
        setLandAreaTo('');
        setFloorFrom('');
        setFloorTo('');
        setLandmark('');
        setOfferType('sale');
        setDocumentType('');
        setCommercialPurpose('');
        setPowerKwFrom('');
        setPowerKwTo('');
        setVehicleCapacityFrom('');
        setVehicleCapacityTo('');
    };

    return (
        <div
            className={`${isOpen ? 'fixed' : 'hidden pointer-events-none'} inset-0 z-[9999999] flex items-start justify-center overflow-y-auto bg-[#020617]/45 px-3 py-4 sm:px-6 sm:py-6`}
        >
            <button
                type="button"
                aria-label="Закрыть фильтры"
                onClick={onClose}
                className="absolute inset-0 cursor-default"
            />

            <div
                className={`relative mx-auto min-h-[calc(100vh-2rem)] w-full max-w-[1520px] rounded-3xl bg-white px-4 py-5 shadow-lg transition-transform duration-300 sm:min-h-[calc(100vh-3rem)] sm:px-8 sm:py-6 md:px-12 lg:px-[56px] ${
                    isOpen ? 'translate-y-0 opacity-100' : 'translate-y-5 opacity-0'
                }`}
                onClick={(event) => event.stopPropagation()}
            >
                <div className="mb-5 flex items-center justify-between border-b border-[#E2E8F0] pb-4">
                    <div>
                        <h3 className="text-xl font-bold text-[#0F172A] sm:text-2xl">Все фильтры</h3>
                        <p className="mt-1 text-sm text-[#64748B]">Настройте параметры поиска недвижимости</p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex h-9 w-9 items-center justify-center rounded-full border border-[#D6DEE8] bg-white text-[#334155] transition-colors hover:border-[#006341] hover:text-[#006341] cursor-pointer"
                    >
                        ✕
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 relative">
                        <div className="lg:col-span-2">
                            <ToggleChipGroup
                                label="Тип недвижимости"
                                options={propertyTypeOpts}
                                value={selectedPropertyTypes}
                                onChange={setSelectedPropertyTypes}
                            />
                        </div>

                        {objectTypeOpts.length > 0 && <div className="lg:col-span-2">
                            <ToggleChipGroup
                                label="Тип объекта"
                                options={objectTypeOpts}
                                value={selectedObjectTypes}
                                onChange={setSelectedObjectTypes}
                            />
                        </div>}

                        <MultiSelectInput
                            label="Город"
                            options={cityOpts}
                            value={selectedCities}
                            onChange={setSelectedCities}
                            placeholder="Выберите города"
                            searchable
                            searchPlaceholder="Найдите город"
                        />

                        <ToggleChipGroup
                            label="Район"
                            options={areaOptions}
                            value={selectedAreaCodes}
                            onChange={setSelectedAreaCodes}
                        />
                    </div>

                    {/* числовые поля + ремонт */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <RangeFilter label="Цена, сомони" from={priceFrom} to={priceTo} onFromChange={setPriceFrom} onToChange={setPriceTo} />
                        {showsRooms && <RangeFilter label="Количество комнат" from={roomsFrom} to={roomsTo} onFromChange={setRoomsFrom} onToChange={setRoomsTo} />}
                        {showsTotalArea && <RangeFilter label="Площадь объекта, м²" from={areaFrom} to={areaTo} onFromChange={setAreaFrom} onToChange={setAreaTo} />}
                        {showsLandArea && <RangeFilter label="Площадь участка, сотки" from={landAreaFrom} to={landAreaTo} onFromChange={setLandAreaFrom} onToChange={setLandAreaTo} />}
                        {showsFloor && (
                            <RangeFilter label="Этаж" from={floorFrom} to={floorTo} onFromChange={setFloorFrom} onToChange={setFloorTo} />
                        )}
                        {showsPower && <RangeFilter label="Электрическая мощность, кВт" from={powerKwFrom} to={powerKwTo} onFromChange={setPowerKwFrom} onToChange={setPowerKwTo} />}
                        {showsVehicleCapacity && <RangeFilter label="Количество машиномест" from={vehicleCapacityFrom} to={vehicleCapacityTo} onFromChange={setVehicleCapacityFrom} onToChange={setVehicleCapacityTo} />}

                        {showsCommercialPurpose && <div className="md:col-span-2 flex flex-col gap-2">
                            <label className="text-sm font-medium text-[#475569]">Назначение помещения</label>
                            <input
                                value={commercialPurpose}
                                onChange={(event) => setCommercialPurpose(event.target.value)}
                                className="h-10 rounded-xl border border-[#E2E8F0] px-3 text-sm outline-none"
                                placeholder="Например: магазин, офис, склад"
                            />
                        </div>}

                        {showsRenovation && <div className="md:col-span-2">
                            <ToggleChipGroup
                                label="Ремонт"
                                options={repairTypeOpts}
                                value={repairs}
                                onChange={setRepairs}
                            />
                        </div>}

                        <div className="md:col-span-2">
                            <ToggleChipGroup
                                label="Тип документа"
                                options={[...PROPERTY_DOCUMENT_TYPES]}
                                value={documentType ? [documentType] : []}
                                onChange={(next) => setDocumentType(String(next.at(-1) ?? ''))}
                            />
                        </div>

                        <div className="md:col-span-2 flex flex-col gap-2">
                            <label className="text-sm font-medium text-[#475569]">Ориентир</label>
                            <input
                                value={landmark}
                                onChange={(event) => setLandmark(event.target.value)}
                                className="h-10 rounded-xl border border-[#E2E8F0] px-3 text-sm outline-none"
                                placeholder="Введите ориентир"
                            />
                        </div>

                        <div className="md:col-span-2 flex flex-col gap-2">
                            <label className="text-sm font-medium text-[#475569]">Тип объявления</label>
                            <select
                                value={offerType}
                                onChange={(event) => setOfferType(event.target.value as 'sale' | 'rent')}
                                className="h-10 rounded-xl border border-[#E2E8F0] px-3 text-sm outline-none"
                            >
                                <option value="sale">Покупка</option>
                                <option value="rent">Аренда</option>
                            </select>
                        </div>
                    </div>

                    <div className="sticky bottom-0 mt-8 border-t border-[#E2E8F0] bg-white/95 pt-4 backdrop-blur">
                        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                            <button
                                type="button"
                                onClick={handleReset}
                                className="inline-flex h-10 items-center justify-center rounded-xl border border-[#D6DEE8] px-4 text-sm font-semibold text-[#111827] transition-colors hover:border-[#006341] hover:text-[#006341]"
                            >
                                Сбросить
                            </button>
                            <button
                                type="submit"
                                className="inline-flex h-10 items-center justify-center rounded-xl bg-[#006341] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#004D33]"
                            >
                                Показать объекты
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

interface ApiEntity {
    id: string | number;
    name: string;
    slug?: string;
}

interface LocationEntity {
    id: string | number;
    city?: string;
    name?: string;
}
