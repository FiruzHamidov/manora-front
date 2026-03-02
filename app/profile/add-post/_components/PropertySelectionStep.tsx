'use client';

import {SelectToggle} from '@/ui-components/SelectToggle';
import {Button} from '@/ui-components/Button';
import {Input} from '@/ui-components/Input';
import {type FormState as RawFormState, type PhotoItem, SelectOption} from '@/services/add-post/types';
import {ChangeEvent, useEffect, useMemo, useState} from "react";

type FormWithPhotos = Omit<RawFormState, 'photos'> & { photos: PhotoItem[] };

interface PropertySelectionStepProps {
    isAgent: boolean;
    isEdit: boolean;
    selectedModerationStatus: string;
    setSelectedModerationStatus: (type: string) => void;
    selectedOfferType: string;
    setSelectedOfferType: (type: string) => void;
    selectedListingType: string;
    setSelectedListingType: (type: string) => void;
    selectedPropertyType: number | null;
    setSelectedPropertyType: (type: number | null) => void;
    selectedBuildingType: number | null;
    setSelectedBuildingType: (type: number | null) => void;
    selectedRooms: number | null;
    setSelectedRooms: (rooms: number | null) => void;
    propertyTypes: SelectOption[];
    buildingTypes: SelectOption[];
    onNext: () => void;
    form: FormWithPhotos;
    onChange: (
        e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => void;
}

const BASE_STATUSES: { id: string; name: string }[] = [
    {id: 'pending', name: 'На модерации'},
    {id: 'approved', name: 'Одобрено'},
];

const FULL_STATUSES: { id: string; name: string }[] = [
    {id: 'pending', name: 'На модерации'},
    {id: 'approved', name: 'Одобрено'},
    {id: 'deposit', name: 'Залог'},
    {id: 'sold', name: 'Продано агентом'},
    {id: 'sold_by_owner', name: 'Продано владельцем'},
    {id: 'rented', name: 'Арендовано'},
    {id: 'denied', name: 'Отказано клиентом'},
    // {id: 'deleted', name: 'Удалено'},
];

const STATUS_REQUIRING_COMMENT = ['sold', 'sold_by_owner', 'rented', 'denied', 'deleted'];
const STATUS_REQUIRING_DEPOSIT = ['deposit', 'sold'];
const STATUS_REQUIRING_DEAL = ['sold', 'rented'];
const STATUS_REQUIRING_RENT = ['rented'];

export function PropertySelectionStep({
                                          isAgent,
                                          isEdit,
                                          selectedModerationStatus,
                                          setSelectedModerationStatus,
                                          selectedOfferType,
                                          setSelectedOfferType,
                                          selectedListingType,
                                          setSelectedListingType,
                                          selectedPropertyType,
                                          setSelectedPropertyType,
                                          selectedBuildingType,
                                          setSelectedBuildingType,
                                          selectedRooms,
                                          setSelectedRooms,
                                          propertyTypes,
                                          buildingTypes,
                                          onNext,
                                          form,
                                          onChange
                                      }: PropertySelectionStepProps) {

    const [statusComment, setStatusComment] = useState<string>('');


    const isValidBase = Boolean(selectedPropertyType && selectedBuildingType && selectedRooms);

    // Если агент и VIP/urgent -> принудительно pending
    useEffect(() => {
        if (isAgent && selectedListingType !== 'regular' && selectedModerationStatus !== 'pending') {
            setSelectedModerationStatus('pending');
        }
        setStatusComment(form.status_comment)
    }, [isAgent, selectedListingType, selectedModerationStatus, setSelectedModerationStatus]);

    /**
     * Фильтрация статусов:
     * - если агент и VIP/urgent -> только pending (как было раньше)
     * - иначе: отфильтровываем статусы, которые не подходят под selectedOfferType
     *   * при 'sale' удаляем 'rented'
     *   * при 'rent' удаляем 'sold' и 'sold_by_owner' и (если нужно) 'denied' — т.к. он про отказ в продаже
     */

    const moderationOptions = useMemo(() => {
        // базовые статусы (делаем копию, не мутируем константу)
        let base = [...BASE_STATUSES];

        // админ может видеть "deleted"
        if (!isAgent) {
            base.push({id: 'deleted', name: 'Удалено'});
        }

        // если это создание — только базовые статусы
        if (!isEdit) {
            return base;
        }

        // агент + VIP / urgent → только pending
        if (isAgent && selectedListingType !== 'regular') {
            return [{id: 'pending', name: 'На модерации'}];
        }

        let list = [...FULL_STATUSES];

        // фильтрация по типу сделки
        if (selectedOfferType === 'sale') {
            list = list.filter(s => s.id !== 'rented');
        } else if (selectedOfferType === 'rent') {
            list = list.filter(s =>
                !['sold', 'sold_by_owner'].includes(s.id)
            );
        }

        // админ может удалять (гарантируем, что deleted только один)
        if (!isAgent && !list.some(s => s.id === 'deleted')) {
            list.push({id: 'deleted', name: 'Удалено'});
        }

        return list;
    }, [isEdit, isAgent, selectedListingType, selectedOfferType]);

    // Если текущий выбранный статус больше не доступен — сбрасываем его безопасно
    useEffect(() => {
        const ids = moderationOptions.map(o => o.id);
        if (!ids.includes(selectedModerationStatus)) {
            // Предпочтительно: pending, иначе первый доступный, иначе ''
            if (ids.includes('pending')) {
                setSelectedModerationStatus('pending');
            } else if (moderationOptions.length > 0) {
                setSelectedModerationStatus(moderationOptions[0].id);
            } else {
                setSelectedModerationStatus('');
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [moderationOptions, selectedModerationStatus]);

    const moderationDisabled = isAgent && selectedListingType !== 'regular';

    const mustProvideComment = STATUS_REQUIRING_COMMENT.includes(selectedModerationStatus);
    const mustProvideDeposit = STATUS_REQUIRING_DEPOSIT.includes(selectedModerationStatus);
    const mustProvideDeal = STATUS_REQUIRING_DEAL.includes(selectedModerationStatus);
    const mustProvideRent = STATUS_REQUIRING_RENT.includes(selectedModerationStatus);

    const isValid =
        isValidBase &&
        (!mustProvideComment || statusComment.trim() !== '') &&

        // залог / продажа
        (!mustProvideDeposit ||
            (!!form.deposit_amount &&
                !!form.planned_contract_signed_at &&
                !!form.company_expected_income &&
                !!form.money_holder)) &&

        // продажа
        (selectedModerationStatus !== 'sold' || !!form.actual_sale_price) &&

        // аренда
        (!mustProvideRent ||
            (!!form.deposit_amount &&
                !!form.planned_contract_signed_at &&
                !!form.company_expected_income &&
                !!form.money_holder));


    return (
        <div className="flex flex-col gap-6">
            <SelectToggle
                title="Сделка"
                options={[
                    {id: 'sale', name: 'Продажа'},
                    {id: 'rent', name: 'Аренда'},
                ]}
                selected={selectedOfferType}
                setSelected={setSelectedOfferType}
            />

            <SelectToggle
                title="Тип объявления"
                options={[
                    {id: 'regular', name: 'Обычное'},
                    {id: 'vip', name: 'VIP'},
                    {id: 'urgent', name: 'Срочная продажа'},
                ]}
                selected={selectedListingType}
                setSelected={setSelectedListingType}
            />

            <SelectToggle
                title="Тип недвижимости"
                options={propertyTypes}
                selected={selectedPropertyType}
                setSelected={setSelectedPropertyType}
            />

            <SelectToggle
                title="Тип объекта"
                options={buildingTypes}
                selected={selectedBuildingType}
                setSelected={setSelectedBuildingType}
            />

            <SelectToggle
                title="Количество комнат"
                options={[1, 2, 3, 4, 5, 6].map((num) => ({
                    id: num,
                    name: num === 6 ? '6 и больше' : `${num}-комнатные`,
                }))}
                selected={selectedRooms}
                setSelected={setSelectedRooms}
            />

            <SelectToggle
                title="Статус модерации"
                options={moderationOptions}
                selected={selectedModerationStatus}
                setSelected={setSelectedModerationStatus}
                disabled={moderationDisabled}
            />

            {mustProvideDeposit && (
                <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
                    Для статуса <b>«{selectedModerationStatus === 'sold' ? 'Продано агентом' : 'Залог'}» </b>
                    потребуется заполнить данные залога
                    {selectedModerationStatus === 'sold' && ' и сделки'}.
                </div>
            )}

            {mustProvideDeposit && (
                <div className="rounded-xl border p-4 bg-amber-50">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                            label="ФИО покупателя"
                            name="buyer_full_name"
                            value={form.buyer_full_name ?? ''}
                            required
                            onChange={onChange}
                        />

                        <Input
                            label="Телефон покупателя"
                            name="buyer_phone"
                            value={form.buyer_phone ?? ''}
                            required
                            onChange={onChange}
                        />

                        <Input
                            label="Сумма залога"
                            name="deposit_amount"
                            type="number"
                            value={form.deposit_amount ?? ''}
                            required
                            onChange={onChange}
                        />

                        <Input
                            label="Дата получения залога"
                            name="deposit_received_at"
                            type="datetime-local"
                            value={form.deposit_received_at ?? ''}
                            required
                            onChange={onChange}
                        />

                        <Input
                            label="Планируемая дата договора"
                            name="planned_contract_signed_at"
                            type="datetime-local"
                            value={form.planned_contract_signed_at ?? ''}
                            required
                            onChange={onChange}
                        />

                        <Input
                            label="Ожидаемый доход компании"
                            name="company_expected_income"
                            type="number"
                            value={form.company_expected_income ?? ''}
                            required
                            onChange={onChange}
                        />
                    </div>
                    <div className="mt-4">
                        <label className="block text-sm mb-1 font-medium">
                            У кого находятся деньги <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={form.money_holder ?? ''}
                            onChange={onChange}
                            className="w-full border rounded-lg p-2"
                            name="money_holder"
                            required
                        >
                            <option value="">— выберите —</option>
                            <option value="company">Компания</option>
                            <option value="agent">Агент</option>
                            <option value="owner">Владелец</option>
                            <option value="developer">Застройщик</option>
                            <option value="client">Клиент</option>
                        </select>
                    </div>
                </div>
            )}

            {selectedModerationStatus === 'sold' && (
                <div className="rounded-xl border p-4 bg-gray-50">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                            label="Фактическая сумма сделки"
                            name="actual_sale_price"
                            type="number"
                            value={form.actual_sale_price ?? ''}
                            required
                            onChange={onChange}
                        />

                        <Input
                            label="Комиссия компании"
                            name="company_commission_amount"
                            type="number"
                            value={form.company_commission_amount ?? ''}
                            required
                            onChange={onChange}
                        />
                    </div>
                </div>
            )}
            {selectedModerationStatus === 'rented' && (
                <div className="rounded-xl border p-4 bg-blue-50">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                            label="Сумма залога"
                            name="deposit_amount"
                            type="number"
                            value={form.deposit_amount ?? ''}
                            required
                            onChange={onChange}
                        />

                        <Input
                            label="Планируемая дата договора"
                            name="planned_contract_signed_at"
                            type="datetime-local"
                            value={form.planned_contract_signed_at ?? ''}
                            required
                            onChange={onChange}
                        />

                        <Input
                            label="Ожидаемый доход компании"
                            name="company_expected_income"
                            type="number"
                            value={form.company_expected_income ?? ''}
                            required
                            onChange={onChange}
                        />
                    </div>

                    <div className="mt-4">
                        <label className="block text-sm mb-1 font-medium">
                            У кого находятся деньги <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={form.money_holder ?? ''}
                            onChange={onChange}
                            className="w-full border rounded-lg p-2"
                            name="money_holder"
                            required
                        >
                            <option value="">— выберите —</option>
                            <option value="company">Компания</option>
                            <option value="agent">Агент</option>
                            <option value="owner">Владелец</option>
                            <option value="developer">Застройщик</option>
                            <option value="client">Клиент</option>
                        </select>
                    </div>
                </div>
            )}

            {/* Показываем поле комментария к статусу если выбран требующий статус */}
            {mustProvideComment && (
                <div className="mb-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Причина смены статуса
                        (обязательно)</label>
                    <textarea
                        value={statusComment}
                        onChange={(e: ChangeEvent<HTMLTextAreaElement>) => {
                            form.status_comment = e.target.value
                            setStatusComment(form.status_comment)
                        }}
                        rows={4}
                        className="w-full p-3 border rounded-lg text-sm"
                        placeholder="Напишите причину изменения статуса..."
                    />
                </div>
            )}

            <div className="flex justify-end">
                <Button onClick={onNext} disabled={!isValid} className="mt-8">
                    Продолжить
                </Button>
            </div>
        </div>
    );
}