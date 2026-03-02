'use client';

import {FC, FormEvent, useEffect, useState} from 'react';
import MultiSelectInput, {MultiOption,} from '@/ui-components/MultiSelectInput';
import {PropertyFilters} from '@/services/properties/types';
import {
    type PropertyType,
    useGetBuildingTypesQuery,
    useGetLocationsQuery,
    useGetRepairTypesQuery,
} from '@/services/add-post';
import {Field, Label, Switch} from "@headlessui/react";
import clsx from "clsx";

interface Option {
    id: string | number;
    slug?: string;
    name: string;
    unavailable?: boolean;
}

const districtOptions: Option[] = [
    {id: 'Сино', name: 'Сино'},
    {id: 'Шохмансур', name: 'Шохмансур'},
    {id: 'Фирдавси', name: 'Фирдавси'},
    {id: 'И Сомони', name: 'И Сомони'},
];

interface AllFiltersProps {
    isOpen: boolean;
    onClose: () => void;
    onSearch: (filters: PropertyFilters) => void;
    initialFilters?: {
        propertyTypes?: string[];
        apartmentTypes?: string[];
        cities?: string[];
        districts?: string[];
        repairs?: string[];
        priceFrom?: string;
        priceTo?: string;
        roomsFrom?: string;
        roomsTo?: string;
        areaFrom?: string;
        areaTo?: string;
        floorFrom?: string;
        floorTo?: string;
        landmark?: string;
        is_full_apartment?: boolean;
        offer_type?: string;
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
                                    ? 'border-[#0036A5] bg-[#EEF4FF] text-[#0036A5]'
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

export const AllFilters: FC<AllFiltersProps> = ({
                                                    isOpen,
                                                    onClose,
                                                    onSearch,
                                                    initialFilters = {},
                                                    propertyTypes
                                                }) => {

    const {data: buildingTypes} = useGetBuildingTypesQuery();
    const {data: locationTypes} = useGetLocationsQuery();
    const {data: repairTypes} = useGetRepairTypesQuery();

    const propertyTypeOpts: MultiOption[] = (propertyTypes ?? []).map(
        (x: ApiEntity) => ({
            id: x.id ?? x.slug ?? x.name,
            name: x.name,
            slug: x.slug,
        })
    );

    const repairTypeOpts: MultiOption[] = (repairTypes ?? []).map(
        (x: ApiEntity) => ({
            id: x.id ?? x.slug ?? x.name,
            name: x.name,
            slug: x.slug,
        })
    );

    const buildingTypeOpts: MultiOption[] = (buildingTypes ?? []).map(
        (x: ApiEntity) => ({
            id: x.id ?? x.slug ?? x.name,
            name: x.name,
            slug: x.slug,
        })
    );

    const cityOpts: MultiOption[] = (locationTypes ?? []).map(
        (loc: LocationEntity) => ({
            id: loc.id ?? loc.city ?? loc.name ?? String(Math.random()),
            name: loc.city ?? loc.name ?? 'Город',
        })
    );

    const [selectedPropertyTypes, setSelectedPropertyTypes] = useState<
        Array<string | number>
    >([]);
    const [selectedApartmentTypes, setSelectedApartmentTypes] = useState<
        Array<string | number>
    >([]);
    const [selectedCities, setSelectedCities] = useState<Array<string | number>>(
        []
    );
    const [districts, setDistricts] = useState<Array<string | number>>([]);
    const [repairs, setRepairs] = useState<Array<string | number>>([]);

    const [priceFrom, setPriceFrom] = useState('0');
    const [priceTo, setPriceTo] = useState('0');
    const [roomsFrom, setRoomsFrom] = useState('0');
    const [roomsTo, setRoomsTo] = useState('0');
    const [areaFrom, setAreaFrom] = useState('0');
    const [areaTo, setAreaTo] = useState('0');
    const [floorFrom, setFloorFrom] = useState('1');
    const [floorTo, setFloorTo] = useState('3');
    const [is_full_apartment, setIsFullApartment] = useState(false);
    const [landmark, setLandmark] = useState('');
    const [offerType, setOfferType] = useState<'sale' | 'rent'>('sale');
    // eslint-disable-next-line
    const [mortgageOption] = useState<'mortgage' | 'developer'>('mortgage');
    // eslint-disable-next-line
    const [listingType, setListingType] = useState<'regular' | 'vip'>('regular');

    useEffect(() => {
        if (initialFilters) {
            setSelectedPropertyTypes(initialFilters.propertyTypes?.map(Number) || []);
            setSelectedApartmentTypes(
                initialFilters.apartmentTypes?.map(Number) || []
            );
            setSelectedCities(initialFilters.cities?.map(Number) || []);
            setRepairs(initialFilters.repairs?.map(Number) || []);
            setDistricts(initialFilters.districts || []);
            setPriceFrom(initialFilters.priceFrom || '');
            setPriceTo(initialFilters.priceTo || '');
            setRoomsFrom(initialFilters.roomsFrom || '');
            setRoomsTo(initialFilters.roomsTo || '');
            setAreaFrom(initialFilters.areaFrom || '');
            setAreaTo(initialFilters.areaTo || '');
            setFloorFrom(initialFilters.floorFrom || '');
            setFloorTo(initialFilters.floorTo || '');
            setLandmark(initialFilters.landmark || '');
            // parse boolean-like values reliably (handles true/false booleans and 'true'/'false' strings)
            setIsFullApartment(initialFilters.is_full_apartment || false);
            setOfferType(initialFilters.offer_type === 'rent' ? 'rent' : 'sale');
        }
    }, [initialFilters]);

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

            apartmentTypes: selectedApartmentTypes.length
                ? selectedApartmentTypes.map(String)
                : undefined,

            cities: selectedCities.length ? selectedCities.map(String) : undefined,

            districts: districts.length ? districts.map(String) : undefined,

            repairs: repairs.length ? repairs.map(String) : undefined,

            priceFrom: priceFrom && priceFrom !== '0' ? priceFrom : undefined,
            priceTo: priceTo && priceTo !== '0' ? priceTo : undefined,
            roomsFrom: roomsFrom && roomsFrom !== '0' ? roomsFrom : undefined,
            roomsTo: roomsTo && roomsTo !== '0' ? roomsTo : undefined,

            areaFrom: areaFrom && areaFrom !== '0' ? areaFrom : undefined,
            areaTo: areaTo && areaTo !== '0' ? areaTo : undefined,

            floorFrom:
                floorFrom && floorFrom !== '0' && floorFrom !== '1'
                    ? floorFrom
                    : undefined,
            floorTo:
                floorTo && floorTo !== '0' && floorTo !== '3' ? floorTo : undefined,

            listing_type: listingType === 'regular' ? undefined : listingType,
            landmark: landmark,
            offer_type: offerType,
            is_full_apartment: is_full_apartment
        };

        const cleanedFilters = Object.fromEntries(
            // eslint-disable-next-line
            Object.entries(filters).filter(([_, value]) => value !== undefined)
        );

        onSearch(cleanedFilters as unknown as PropertyFilters);
    };

    const handleReset = () => {
        setSelectedPropertyTypes([]);
        setSelectedApartmentTypes([]);
        setSelectedCities([]);
        setDistricts([]);
        setRepairs([]);
        setPriceFrom('');
        setPriceTo('');
        setRoomsFrom('');
        setRoomsTo('');
        setAreaFrom('');
        setAreaTo('');
        setFloorFrom('');
        setFloorTo('');
        setLandmark('');
        setIsFullApartment(false);
        setOfferType('sale');
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
                        className="flex h-9 w-9 items-center justify-center rounded-full border border-[#D6DEE8] bg-white text-[#334155] transition-colors hover:border-[#0036A5] hover:text-[#0036A5] cursor-pointer"
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

                        <div className="lg:col-span-2">
                            <ToggleChipGroup
                                label="Тип квартиры"
                                options={buildingTypeOpts}
                                value={selectedApartmentTypes}
                                onChange={setSelectedApartmentTypes}
                            />
                        </div>

                        <MultiSelectInput
                            label="Город"
                            options={cityOpts}
                            value={selectedCities}
                            onChange={setSelectedCities}
                            placeholder="Выберите города"
                        />

                        <ToggleChipGroup
                            label="Район"
                            options={districtOptions as MultiOption[]}
                            value={districts}
                            onChange={setDistricts}
                        />
                    </div>

                    {/* числовые поля + ремонт */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <div className="rounded-2xl border border-[#E2E8F0] p-3">
                            <p className="text-sm font-medium text-[#334155]">Цена</p>
                            <div className="mt-2 grid grid-cols-2 gap-2">
                                <input
                                    value={priceFrom}
                                    onChange={(event) => setPriceFrom(event.target.value)}
                                    className="h-10 rounded-lg border border-[#E2E8F0] px-3 text-sm outline-none"
                                    inputMode="numeric"
                                    placeholder="От"
                                />
                                <input
                                    value={priceTo}
                                    onChange={(event) => setPriceTo(event.target.value)}
                                    className="h-10 rounded-lg border border-[#E2E8F0] px-3 text-sm outline-none"
                                    inputMode="numeric"
                                    placeholder="До"
                                />
                            </div>
                        </div>

                        <div className="rounded-2xl border border-[#E2E8F0] p-3">
                            <p className="text-sm font-medium text-[#334155]">Количество комнат</p>
                            <div className="mt-2 grid grid-cols-2 gap-2">
                                <input
                                    value={roomsFrom}
                                    onChange={(event) => setRoomsFrom(event.target.value)}
                                    className="h-10 rounded-lg border border-[#E2E8F0] px-3 text-sm outline-none"
                                    inputMode="numeric"
                                    placeholder="От"
                                />
                                <input
                                    value={roomsTo}
                                    onChange={(event) => setRoomsTo(event.target.value)}
                                    className="h-10 rounded-lg border border-[#E2E8F0] px-3 text-sm outline-none"
                                    inputMode="numeric"
                                    placeholder="До"
                                />
                            </div>
                        </div>

                        <div className="rounded-2xl border border-[#E2E8F0] p-3">
                            <p className="text-sm font-medium text-[#334155]">Площадь</p>
                            <div className="mt-2 grid grid-cols-2 gap-2">
                                <input
                                    value={areaFrom}
                                    onChange={(event) => setAreaFrom(event.target.value)}
                                    className="h-10 rounded-lg border border-[#E2E8F0] px-3 text-sm outline-none"
                                    inputMode="numeric"
                                    placeholder="От"
                                />
                                <input
                                    value={areaTo}
                                    onChange={(event) => setAreaTo(event.target.value)}
                                    className="h-10 rounded-lg border border-[#E2E8F0] px-3 text-sm outline-none"
                                    inputMode="numeric"
                                    placeholder="До"
                                />
                            </div>
                        </div>

                        <div className="rounded-2xl border border-[#E2E8F0] p-3">
                            <p className="text-sm font-medium text-[#334155]">Этаж</p>
                            <div className="mt-2 grid grid-cols-2 gap-2">
                                <input
                                    value={floorFrom}
                                    onChange={(event) => setFloorFrom(event.target.value)}
                                    className="h-10 rounded-lg border border-[#E2E8F0] px-3 text-sm outline-none"
                                    inputMode="numeric"
                                    placeholder="От"
                                />
                                <input
                                    value={floorTo}
                                    onChange={(event) => setFloorTo(event.target.value)}
                                    className="h-10 rounded-lg border border-[#E2E8F0] px-3 text-sm outline-none"
                                    inputMode="numeric"
                                    placeholder="До"
                                />
                            </div>
                        </div>

                        <div className="md:col-span-2">
                            <ToggleChipGroup
                                label="Ремонт"
                                options={repairTypeOpts}
                                value={repairs}
                                onChange={setRepairs}
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

                    {/* переключатели (по желанию) */}
                    <div className="mt-6 rounded-2xl bg-[#F8FAFC] p-4">
                        <Field className="flex items-center">
                            <Switch
                                checked={is_full_apartment}
                                onChange={(checked) => setIsFullApartment(checked)}
                                className="group relative inline-flex h-6 w-11 items-center rounded-full bg-gray-200 transition cursor-pointer"
                            >
                            <span
                                className={clsx(
                                    'size-5 translate-x-0.5 rounded-full shadow-lg transition group-data-checked:translate-x-5',
                                    mortgageOption === 'mortgage' ? 'bg-[#0036A5]' : 'bg-[#BAC0CC]'
                                )}
                            />
                            </Switch>
                            <Label className="ml-3 text-sm font-medium text-[#334155]">Полноценная квартира</Label>
                        </Field>

                        {/*        <Field className="flex items-center">*/}
                        {/*            <Switch*/}
                        {/*                checked={mortgageOption === 'developer'}*/}
                        {/*                onChange={(checked) => setMortgageOption(checked ? 'developer' : 'mortgage')}*/}
                        {/*                className="group relative inline-flex h-6 w-11 items-center rounded-full bg-gray-200 transition focus:outline-none"*/}
                        {/*            >*/}
                        {/*<span*/}
                        {/*    className={clsx(*/}
                        {/*        'size-5 translate-x-0.5 rounded-full shadow-lg transition group-data-checked:translate-x-5',*/}
                        {/*        mortgageOption === 'developer' ? 'bg-[#0036A5]' : 'bg-[#BAC0CC]'*/}
                        {/*    )}*/}
                        {/*/>*/}
                        {/*            </Switch>*/}
                        {/*            <Label className="ml-3">От застройщика</Label>*/}
                        {/*        </Field>*/}
                    </div>

                    <div className="sticky bottom-0 mt-8 border-t border-[#E2E8F0] bg-white/95 pt-4 backdrop-blur">
                        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                            <button
                                type="button"
                                onClick={handleReset}
                                className="inline-flex h-10 items-center justify-center rounded-xl border border-[#D6DEE8] px-4 text-sm font-semibold text-[#111827] transition-colors hover:border-[#0036A5] hover:text-[#0036A5]"
                            >
                                Сбросить
                            </button>
                            <button
                                type="submit"
                                className="inline-flex h-10 items-center justify-center rounded-xl bg-[#0036A5] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#002b82]"
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
