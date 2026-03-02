'use client';

import { ChangeEvent, FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import {
    useCreatePropertyMutation,
    useGetBuildingTypesQuery,
    useGetContractTypesQuery,
    useGetHeatingTypesQuery,
    useGetLocationsQuery,
    useGetParkingTypesQuery,
    useGetPropertyTypesQuery,
    useGetRepairTypesQuery,
    useUpdatePropertyMutation,
    useReorderPropertyPhotosMutation,
    useDeletePropertyPhotoMutation, useGetDevelopers, // ← опечатка исправлена
} from '@/services/add-post';
import { showToast } from '@/ui-components/Toast';
import { Property } from '@/services/properties/types';
import { extractValidationMessages } from '@/utils/validationErrors';
import { isAxiosError } from 'axios'; // ← добавлено

import type {
    CreatePropertyPayload,
    FormState as RawFormState,
    PhotoItem,
    UpdatePropertyPayload,
} from '@/services/add-post/types';

// для обработки дублей
import type {
    DuplicateCandidate,
    CreatePropertyResult,
} from '@/services/properties/types';

type FormState = Omit<RawFormState, 'photos'> & { photos: PhotoItem[] };

const cid = () =>
    typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}_${Math.random().toString(36).slice(2)}`;

type PropertyPhotoFromServer = {
    id: number;
    file_path?: string | null;
    url?: string | null;
};

// ---------- Начальное состояние ----------
const initialFormState: FormState = {
    title: '',
    description: '',
    location_id: '',
    moderation_status: 'approved',
    repair_type_id: '',
    developer_id: '',
    heating_type_id: '',
    parking_type_id: '',
    contract_type_id: '',
    price: '',
    currency: 'TJS',
    total_area: '',
    land_size: '',
    living_area: '',
    floor: '',
    total_floors: '',
    year_built: '',
    youtube_link: '',
    condition: '',
    apartment_type: '',
    has_garden: false,
    has_parking: false,
    is_mortgage_available: false,
    is_business_owner: false,
    is_full_apartment: false,
    is_for_aura: false,
    is_from_developer: false,
    landmark: '',
    latitude: '',
    longitude: '',
    agent_id: '',
    photos: [],
    owner_phone: '',
    owner_name: '',
    object_key: '',
    district: '',
    created_by: '',
    address: '',
    sold_at: '',
    status_comment: '',
};

interface UseAddPostFormProps {
    editMode?: boolean;
    propertyData?: Property;
}

export function useAddPostForm({ editMode = false, propertyData }: UseAddPostFormProps = {}) {
    // справочники
    const { data: propertyTypes = [] } = useGetPropertyTypesQuery();
    const { data: buildingTypes = [] } = useGetBuildingTypesQuery();
    const { data: locations = [] } = useGetLocationsQuery();
    const { data: repairTypes = [] } = useGetRepairTypesQuery();
    const { data: developers = [] } = useGetDevelopers();
    const { data: heatingTypes = [] } = useGetHeatingTypesQuery();
    const { data: parkingTypes = [] } = useGetParkingTypesQuery();
    const { data: contractTypes = [] } = useGetContractTypesQuery();

    // мутации
    const createPropertyMutation = useCreatePropertyMutation(); // возвращает CreatePropertyResult (union)
    const updatePropertyMutation = useUpdatePropertyMutation(); // возвращает union, но при успехе — Property
    const deletePhotoMutation = useDeletePropertyPhotoMutation(); // ← опечатка фиксанута
    const reorderPhotosMutation = useReorderPropertyPhotosMutation();

    // состояние формы
    const [form, setForm] = useState<FormState>(initialFormState);
    const [selectedOfferType, setSelectedOfferType] = useState('sale');
    const [selectedModerationStatus, setSelectedModerationStatus] = useState('approved');
    const [selectedPropertyType, setSelectedPropertyType] = useState<number | null>(null);
    const [selectedBuildingType, setSelectedBuildingType] = useState<number | null>(null);
    const [selectedListingType, setSelectedListingType] = useState('regular');
    const [selectedRooms, setSelectedRooms] = useState<number | null>(null);

    const [dupDialogOpen, setDupDialogOpen] = useState(false);
    const [duplicates, setDuplicates] = useState<DuplicateCandidate[]>([]);
    const [pendingCreatePayload, setPendingCreatePayload] = useState<FormData | null>(null);

    // «грязная форма» → предупреждение при уходе
    const [isDirty, setIsDirty] = useState(false);

    const isInitialized = useRef(false);

    const mapServerPhotos = (photos: Property['photos'] | undefined | null): PhotoItem[] => {
        if (!photos) return [];
        return photos.map((p): PhotoItem => {
            const src = p as unknown as PropertyPhotoFromServer;
            return {
                id: cid(),
                url: (src.file_path && String(src.file_path)) || (src.url && String(src.url)) || '',
                serverId: src.id,
            };
        });
    };

    // --- Инициализация формы из propertyData (edit mode) ---
    useEffect(() => {
        if (editMode && propertyData && !isInitialized.current) {
            setForm({
                title: propertyData.title || '',
                description: propertyData.description || '',
                location_id: propertyData.location_id?.toString() || '',
                repair_type_id: propertyData.repair_type_id?.toString() || '',
                developer_id: propertyData.developer_id?.toString() || '',
                heating_type_id: propertyData.heating_type_id?.toString() || '',
                parking_type_id: propertyData.parking_type_id?.toString() || '',
                contract_type_id: propertyData.contract_type_id?.toString() || '',
                moderation_status: propertyData.moderation_status?.toString() || '',
                price: propertyData.price || '',
                currency: 'TJS',
                total_area: propertyData.total_area || '',
                land_size: propertyData.land_size || '',
                living_area: propertyData.living_area || '',
                floor: propertyData.floor || '',
                total_floors: propertyData.total_floors || '',
                year_built: propertyData.year_built || '',
                youtube_link: propertyData.youtube_link || '',
                condition: propertyData.condition || '',
                apartment_type: propertyData.apartment_type || '',
                has_garden: propertyData.has_garden || false,
                has_parking: propertyData.has_parking || false,
                is_mortgage_available: propertyData.is_mortgage_available || false,
                is_from_developer: propertyData.is_from_developer || false,
                is_business_owner: propertyData.is_business_owner || false,
                is_full_apartment: propertyData.is_full_apartment || false,
                is_for_aura: propertyData.is_for_aura || false,
                landmark: propertyData.landmark || '',
                latitude: propertyData.latitude || '',
                longitude: propertyData.longitude || '',
                agent_id: propertyData.agent_id?.toString() || '',
                photos: mapServerPhotos(propertyData.photos),
                owner_phone: propertyData.owner_phone || '',
                owner_name: propertyData.owner_name || '',
                object_key: propertyData.object_key || '',
                district: propertyData.district || '',
                created_by: propertyData.created_by?.toString() || '',
                address: propertyData.address || '',
                sold_at: propertyData.sold_at || '',
                status_comment: propertyData.status_comment || '',

                // ===== Залог / сделка (восстановление при редактировании) =====
                buyer_full_name: propertyData.buyer_full_name || '',
                buyer_phone: propertyData.buyer_phone || '',

                deposit_amount: propertyData.deposit_amount ?? '',
                deposit_currency: propertyData.deposit_currency ?? 'TJS',
                deposit_received_at: propertyData.deposit_received_at ?? '',
                deposit_taken_at: propertyData.deposit_taken_at ?? '',

                planned_contract_signed_at:
                    propertyData.planned_contract_signed_at ?? '',

                company_expected_income:
                    propertyData.company_expected_income ?? '',
                company_expected_income_currency:
                    propertyData.company_expected_income_currency ?? 'TJS',

                company_commission_amount:
                    propertyData.company_commission_amount ?? '',
                company_commission_currency:
                    propertyData.company_commission_currency ?? 'TJS',

                actual_sale_price:
                    propertyData.actual_sale_price ?? '',
                actual_sale_currency:
                    propertyData.actual_sale_currency ?? 'TJS',

                money_holder: propertyData.money_holder,
            });

            setSelectedOfferType(propertyData.offer_type || 'sale');
            setSelectedModerationStatus(propertyData.moderation_status || 'approved');
            setSelectedPropertyType(propertyData.type_id || null);
            setSelectedListingType(propertyData.listing_type || 'regular');
            setSelectedBuildingType(propertyData.status_id || null);
            setSelectedRooms(propertyData.rooms || null);

            isInitialized.current = true;
        }
    }, [editMode, propertyData?.id]); // eslint-disable-line react-hooks/exhaustive-deps

    // предупреждение при закрытии\обновлении вкладки
    useEffect(() => {
        const onBeforeUnload = (e: BeforeUnloadEvent) => {
            if (isDirty) {
                e.preventDefault();
                e.returnValue = '';
            }
        };
        window.addEventListener('beforeunload', onBeforeUnload);
        return () => window.removeEventListener('beforeunload', onBeforeUnload);
    }, [isDirty]);

    useEffect(() => {
        const hasChanges = JSON.stringify(form) !== JSON.stringify(initialFormState);
        setIsDirty(hasChanges);
    }, [form]);

    // --- Общий onChange полей формы ---
    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, type, value } = e.target;
        const input = e.target as HTMLInputElement;
        const newValue = name === 'currency'
            ? 'TJS'
            : type === 'checkbox'
                ? input.checked
                : value;
        setForm((prev) => ({ ...prev, [name]: newValue }));
        setIsDirty(true);
    };

    // --- Добавление новых файлов (File -> PhotoItem) ---
    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return;
        const additions: PhotoItem[] = Array.from(e.target.files).map((f) => ({
            id: cid(),
            url: URL.createObjectURL(f),
            file: f,
        }));
        setForm((prev) => ({ ...prev, photos: [...prev.photos, ...additions] }));
        setIsDirty(true);
    };

    // --- Удаление фото по индексу (только UI) ---
    const removePhoto = async (index: number) => {
        const target = form.photos[index];
        if (!target) return;

        // 1) Оптимистично убираем из UI
        const prev = form.photos;
        const next = prev.filter((_, i) => i !== index);
        setForm((p) => ({ ...p, photos: next }));
        setIsDirty(true);

        // 2) Если это серверное фото и мы в editMode — зовём DELETE
        if (editMode && target.serverId && propertyData?.id) {
            try {
                await deletePhotoMutation.mutateAsync({
                    propertyId: propertyData.id,
                    photoId: target.serverId,
                });

                // 3) Подтвердим новый порядок оставшихся серверных фото
                const remainingServerIds = next
                    .filter((x): x is PhotoItem & { serverId: number } => typeof x.serverId === 'number')
                    .map((x) => x.serverId);

                if (remainingServerIds.length) {
                    await reorderPhotosMutation.mutateAsync({
                        id: propertyData.id,
                        order: remainingServerIds,
                    });
                }
            } catch (e) {
                // Откат UI при ошибке
                setForm((p) => ({ ...p, photos: prev }));
                showToast('error', 'Не удалось удалить фото. Проверьте доступ и повторите.');
                console.error(e);
            }
        }
    };

    // --- Применение нового порядка от DnD ---
    const handleReorder = (next: PhotoItem[]) => {
        setForm((prev) => ({ ...prev, photos: next }));
        setIsDirty(true);
    };

    // --- Сброс формы ---
    const resetForm = () => {
        setForm(initialFormState);
        setSelectedOfferType('sale');
        setSelectedModerationStatus('approved');
        setSelectedPropertyType(null);
        setSelectedBuildingType(null);
        setSelectedRooms(null);
        setSelectedListingType('regular');
        setDupDialogOpen(false);
        setDuplicates([]);
        setPendingCreatePayload(null);
        setIsDirty(false);
        isInitialized.current = false;
    };

    // --- Валидация обязательных селектов ---
    const validateForm = () => {
        if (!selectedPropertyType || !selectedBuildingType || !selectedRooms) {
            showToast('error', 'Пожалуйста, заполните все обязательные поля');
            return false;
        }
        return true;
    };

    // --- Сборка FormData (строго нормализуем булевы) ---
    const buildFormData = (payload: Record<string, unknown>) => {
        const fd = new FormData();

        const appendKV = (key: string, value: unknown) => {
            if (value === null || value === undefined) return;
            if (typeof value === 'boolean') {
                fd.append(key, value ? '1' : '0');
                return;
            }
            if (value === 'true' || value === 'false') {
                fd.append(key, value === 'true' ? '1' : '0');
                return;
            }
            const s = String(value);
            if (s === '') return;
            fd.append(key, s);
        };

        Object.entries(payload).forEach(([k, v]) => appendKV(k, v));

        // Новые фото и их позиции (позиция = индекс карточки в UI)
        let fileIndex = 0;
        form.photos.forEach((p, uiIndex) => {
            if (p.file) {
                fd.append('photos[]', p.file);
                fd.append(`photo_positions[${fileIndex}]`, String(uiIndex));
                fileIndex += 1;
            }
        });

        return fd;
    };

    // --- Принудительное создание (force=1) после 409 ---
    const forceCreate = useCallback(async () => {
        if (!pendingCreatePayload) return;
        pendingCreatePayload.set('force', '1');
        try {
            const res = await createPropertyMutation.mutateAsync(
                pendingCreatePayload as CreatePropertyPayload
            );

            // Detect wrapped union vs plain success object
            const isWrapped = (r: unknown): r is CreatePropertyResult =>
                typeof r === 'object' && r !== null && 'ok' in (r as Record<string, unknown>);

            if (!isWrapped(res)) {
                // Plain success (Property)
                showToast('success', 'Объявление добавлено (несмотря на найденные дубликаты)');
                resetForm();
                setDupDialogOpen(false);
                return;
            }

            if (res.ok) {
                showToast('success', 'Объявление добавлено (несмотря на найденные дубликаты)');
                resetForm();
                setDupDialogOpen(false);
                return;
            }

            if (res.code === 409 && 'duplicates' in res) {
                setDuplicates(res.duplicates ?? []);
                setDupDialogOpen(true);
                return;
            }

            showToast('error', res.message || 'Не удалось сохранить с принудительным добавлением');
        } catch (e: unknown) {
            if (isAxiosError(e) && e.response?.status === 409) {
                const dups = (e.response.data?.duplicates ?? []) as DuplicateCandidate[];
                setDuplicates(dups);
                setDupDialogOpen(true);
                return;
            }
            showToast('error', 'Не удалось сохранить с принудительным добавлением');
        }
    }, [pendingCreatePayload, createPropertyMutation, resetForm]);

    // --- Сабмит с сохранением порядка ---
    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;

        // 1) Плоские поля (без массива photos)
        const propertyDataToSubmit = {
            description: form.description,
            type_id: selectedPropertyType!,
            status_id: selectedBuildingType!,
            location_id: form.location_id,
            repair_type_id: form.repair_type_id,
            developer_id: form.developer_id,
            heating_type_id: form.heating_type_id,
            contract_type_id: form.contract_type_id,
            address: form.address,
            district: form.district,
            created_by: form.created_by,
            parking_type_id: form.parking_type_id,
            price: form.price,
            currency: 'TJS',
            offer_type: selectedOfferType,
            moderation_status: selectedModerationStatus,
            listing_type: selectedListingType,
            rooms: selectedRooms!,
            total_area: form.total_area,
            living_area: form.living_area,
            land_size: form.land_size,
            floor: form.floor,
            total_floors: form.total_floors,
            year_built: form.year_built,
            condition: form.condition,
            apartment_type: form.apartment_type,
            has_garden: form.has_garden,
            has_parking: form.has_parking,
            is_mortgage_available: form.is_mortgage_available,
            is_from_developer: form.is_from_developer,
            is_for_aura: Boolean(form.is_for_aura),
            is_business_owner: Boolean(form.is_business_owner),
            is_full_apartment: Boolean(form.is_full_apartment),
            landmark: form.landmark,
            owner_phone: form.owner_phone,
            youtube_link: form.youtube_link,
            latitude: form.latitude,
            longitude: form.longitude,
            agent_id: form.agent_id,
            title: form.title,
            sold_at: form.sold_at,
            object_key: form.object_key,
            owner_name: form.owner_name,
            status_comment: form.status_comment,

            // ===== Залог / сделка =====
            buyer_full_name: form.buyer_full_name,
            buyer_phone: form.buyer_phone,

            deposit_amount: form.deposit_amount,
            deposit_currency: form.deposit_currency,
            deposit_received_at: form.deposit_received_at,
            deposit_taken_at: form.deposit_taken_at,

            planned_contract_signed_at: form.planned_contract_signed_at,

            company_expected_income: form.company_expected_income,
            company_expected_income_currency: form.company_expected_income_currency,

            company_commission_amount: form.company_commission_amount,
            company_commission_currency: form.company_commission_currency,

            actual_sale_price: form.actual_sale_price,
            actual_sale_currency: form.actual_sale_currency,

            money_holder: form.money_holder,
        };

        // 2) Текущий порядок существующих фото (по id из БД)
        const existingPhotoOrder = form.photos
            .filter((p): p is PhotoItem & { serverId: number } => typeof p.serverId === 'number')
            .map((p) => p.serverId);

        try {
            if (editMode && propertyData?.id) {
                // UPDATE: дозагрузка новых фото + обновление полей
                const fd = buildFormData(propertyDataToSubmit);
                if (!fd.has('_method')) fd.append('_method', 'PUT');

                const updatePayload: UpdatePropertyPayload = {
                    id: propertyData.id.toString(),
                    formData: fd,
                };
                const resUpdAny = await updatePropertyMutation.mutateAsync(updatePayload);

                const isWrappedUpd = (r: unknown): r is CreatePropertyResult =>
                    typeof r === 'object' && r !== null && 'ok' in (r as Record<string, unknown>);

                const handleUpdateSuccess = async () => {
                    if (existingPhotoOrder.length) {
                        await reorderPhotosMutation.mutateAsync({
                            id: propertyData.id,
                            order: existingPhotoOrder,
                        });
                    }
                    showToast('success', 'Объявление успешно обновлено!');
                    setIsDirty(false);
                };

                if (!isWrappedUpd(resUpdAny)) {
                    await handleUpdateSuccess();
                } else if (resUpdAny.ok) {
                    await handleUpdateSuccess();
                } else if (resUpdAny.code === 409 && 'duplicates' in resUpdAny) {
                    setDuplicates(resUpdAny.duplicates ?? []);
                    setDupDialogOpen(true);
                } else {
                    showToast('error', resUpdAny.message || 'Ошибка при обновлении объявления');
                }
            } else {
                // CREATE
                const fd = buildFormData(propertyDataToSubmit);

                // сохраним payload — понадобится, если сервер вернёт 409 и пользователь нажмёт «Добавить всё равно»
                setPendingCreatePayload(fd);

                const res = await createPropertyMutation.mutateAsync(
                    fd as CreatePropertyPayload
                );

                const isWrappedCreate = (r: unknown): r is CreatePropertyResult =>
                    typeof r === 'object' && r !== null && 'ok' in (r as Record<string, unknown>);
                if (!isWrappedCreate(res)) {
                    showToast('success', 'Объявление успешно добавлено!');
                    resetForm();
                } else if (res.ok) {
                    showToast('success', 'Объявление успешно добавлено!');
                    resetForm();
                } else if (res.code === 409 && 'duplicates' in res) {
                    setDuplicates(res.duplicates ?? []);
                    setDupDialogOpen(true);
                } else {
                    showToast('error', res.message || 'Ошибка при добавлении объявления');
                }
            }
        } catch (err: unknown) {

            // Если сервер вернул 409 как axios-ошибку (без union-ответа)
            if (isAxiosError(err) && err.response?.status === 409) {
                const dups = (err.response.data?.duplicates ?? []) as DuplicateCandidate[];
                setDuplicates(dups);
                setDupDialogOpen(true);
                return;
            }
            // подробный лог для отладки
            console.group('[CreateProperty] caught error');
            console.log('isAxiosError:', isAxiosError(err));
            console.log('typeof err:', typeof err);
            try {
                console.dir(err);
                console.log('ownProps:', JSON.stringify(err, Object.getOwnPropertyNames(err)));
            } catch (e) {
                console.warn('Could not stringify err', e);
            }
            console.groupEnd();
            const messages = extractValidationMessages(err);
            if (messages) {
                showToast('error', `Исправьте ошибки:\n• ${messages.join('\n• ')}`);
                return;
            }
            console.error(err);
            showToast('error', editMode ? 'Ошибка при обновлении объявления' : 'Ошибка при добавлении объявления');
        }
    };

    return {
        // справочники
        propertyTypes,
        buildingTypes,
        locations,
        repairTypes,
        developers,
        heatingTypes,
        parkingTypes,
        contractTypes,

        // состояние формы
        form,
        selectedOfferType,
        selectedPropertyType,
        selectedBuildingType,
        selectedListingType,
        selectedModerationStatus,
        selectedRooms,

        // сеттеры
        setSelectedOfferType,
        setSelectedListingType,
        setSelectedPropertyType,
        setSelectedBuildingType,
        setSelectedModerationStatus,
        setSelectedRooms,

        // операции
        handleChange,
        handleFileChange,
        removePhoto,
        handleReorder,
        handleSubmit,
        resetForm,

        // дубли
        dupDialogOpen,
        setDupDialogOpen,
        duplicates,
        forceCreate,

        // прочее
        isSubmitting: editMode ? updatePropertyMutation.isPending : createPropertyMutation.isPending,
        editMode,
        isDirty,
        hasNewFiles: form.photos.some(p => !!p.file),
    };
}
