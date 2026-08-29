'use client';

import { ChangeEvent, FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import {
    getRepairTypeValidationError,
    withRequiredRepairType,
} from '@/services/add-post/repair-type-form';

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

const PROPERTY_DRAFT_KEY = 'manora:property-draft:v2';
const PROPERTY_DRAFT_VERSION = 2;
const MAX_PROPERTY_PHOTOS = 40;
const MAX_PROPERTY_PHOTO_BYTES = 8 * 1024 * 1024;
const SUPPORTED_PROPERTY_PHOTO_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

const PROFILE_SCOPED_FORM_DEFAULTS: Partial<FormState> = {
    repair_type_id: '',
    developer_id: '',
    document_type: '',
    total_area: '',
    land_size: '',
    living_area: '',
    floor: '',
    total_floors: '',
    new_building_id: '',
    construction_status: '',
};

const cid = () =>
    typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}_${Math.random().toString(36).slice(2)}`;

type PropertyPhotoFromServer = {
    id: number;
    file_path?: string | null;
    url?: string | null;
};

const extractPropertyProfileDetails = (property: Property): Record<string, string | boolean> => {
    const source = property.apartment_details
        ?? property.house_details
        ?? property.land_details
        ?? property.commercial_details
        ?? property.parking_details
        ?? property.industrial_details
        ?? property.details
        ?? {};

    return Object.fromEntries(
        Object.entries(source)
            .filter(([key, value]) => !['property_id', 'created_at', 'updated_at'].includes(key) && value != null)
            .map(([key, value]) => [key, typeof value === 'boolean' ? value : String(value)])
    );
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
    document_type: '',
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
    is_bargain_available: false,
    is_exchange_available: false,
    is_installment_available: false,
    initial_payment: '',
    is_business_owner: false,
    is_full_apartment: false,
    is_for_aura: false,
    is_from_developer: false,
    object_type_code: '',
    object_subtype_code: '',
    rent_term: '',
    market_source: 'secondary',
    transaction_subtype: 'standard',
    construction_status: '',
    location_visibility: 'rounded',
    new_building_id: '',
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
    profile_details: {},
};

interface UseAddPostFormProps {
    editMode?: boolean;
    propertyData?: Property;
    forcePendingModeration?: boolean;
}

export function useAddPostForm({
    editMode = false,
    propertyData,
    forcePendingModeration = false,
}: UseAddPostFormProps = {}) {
    // справочники
    const { data: propertyTypes = [] } = useGetPropertyTypesQuery();
    const { data: buildingTypes = [] } = useGetBuildingTypesQuery();
    const { data: locations = [] } = useGetLocationsQuery();
    const repairTypesQuery = useGetRepairTypesQuery();
    const repairTypes = repairTypesQuery.data ?? [];
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
    const [selectedModerationStatus, setSelectedModerationStatus] = useState(
        forcePendingModeration ? 'pending' : 'approved'
    );
    const [selectedPropertyType, setSelectedPropertyType] = useState<number | null>(null);
    const [selectedBuildingType, setSelectedBuildingType] = useState<number | null>(null);
    const [selectedListingType, setSelectedListingType] = useState('regular');
    const [selectedRooms, setSelectedRooms] = useState<number | null>(null);
    const [submissionKey, setSubmissionKey] = useState(cid);
    const [draftReady, setDraftReady] = useState(editMode);
    const [draftRestored, setDraftRestored] = useState(false);
    const [draftSavedAt, setDraftSavedAt] = useState<Date | null>(null);

    const [dupDialogOpen, setDupDialogOpen] = useState(false);
    const [duplicates, setDuplicates] = useState<DuplicateCandidate[]>([]);
    const [pendingCreatePayload, setPendingCreatePayload] = useState<FormData | null>(null);

    // «грязная форма» → предупреждение при уходе
    const [isDirty, setIsDirty] = useState(false);

    const isInitialized = useRef(false);

    useEffect(() => {
        if (editMode) return;

        try {
            const raw = localStorage.getItem(PROPERTY_DRAFT_KEY);
            if (!raw) return;
            const draft = JSON.parse(raw) as {
                version?: number;
                form?: Partial<FormState>;
                selectedOfferType?: string;
                selectedModerationStatus?: string;
                selectedPropertyType?: number | null;
                selectedBuildingType?: number | null;
                selectedListingType?: string;
                selectedRooms?: number | null;
                submissionKey?: string;
                savedAt?: string;
            };
            if (draft.version !== PROPERTY_DRAFT_VERSION || !draft.form) return;

            setForm({...initialFormState, ...draft.form, photos: []});
            setSelectedOfferType(draft.selectedOfferType || 'sale');
            setSelectedModerationStatus(
                forcePendingModeration ? 'pending' : (draft.selectedModerationStatus || 'approved')
            );
            setSelectedPropertyType(draft.selectedPropertyType ?? null);
            setSelectedBuildingType(draft.selectedBuildingType ?? null);
            setSelectedListingType(draft.selectedListingType || 'regular');
            setSelectedRooms(draft.selectedRooms ?? null);
            setSubmissionKey(draft.submissionKey || cid());
            setDraftSavedAt(draft.savedAt ? new Date(draft.savedAt) : null);
            setDraftRestored(true);
        } catch {
            localStorage.removeItem(PROPERTY_DRAFT_KEY);
        } finally {
            setDraftReady(true);
        }
    }, [editMode, forcePendingModeration]);

    const selectedPropertyOption = useMemo(
        () =>
            propertyTypes.find((item) => Number(item.id) === Number(selectedPropertyType)) ?? null,
        [propertyTypes, selectedPropertyType]
    );

    const requiresRooms = useMemo(() => {
        if (!selectedPropertyOption) return false;
        return ['apartments', 'houses', 'new-buildings', 'secondary', 'apartment', 'house'].includes(
            selectedPropertyOption.slug ?? ''
        );
    }, [selectedPropertyOption]);

    const requiresRepair = useMemo(() => {
        const code = selectedPropertyOption?.slug ?? '';
        return ['apartments', 'houses', 'new-buildings', 'commercial', 'secondary', 'apartment'].includes(code);
    }, [selectedPropertyOption]);

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
                document_type: propertyData.document_type || '',
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
                is_bargain_available: propertyData.is_bargain_available || false,
                is_exchange_available: propertyData.is_exchange_available || false,
                is_installment_available: propertyData.is_installment_available || false,
                initial_payment: propertyData.initial_payment || '',
                is_from_developer: propertyData.is_from_developer || false,
                object_type_code: propertyData.object_type_code || '',
                object_subtype_code: propertyData.object_subtype_code || '',
                rent_term: propertyData.rent_term || '',
                market_source: propertyData.market_source || 'secondary',
                transaction_subtype: propertyData.transaction_subtype || 'standard',
                construction_status: propertyData.construction_status || '',
                location_visibility: propertyData.location_visibility || 'rounded',
                new_building_id: propertyData.new_building_id?.toString() || '',
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
                profile_details: extractPropertyProfileDetails(propertyData),

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

    useEffect(() => {
        if (editMode || !draftReady) return;

        const timeout = window.setTimeout(() => {
            const hasDraftContent = JSON.stringify(form) !== JSON.stringify(initialFormState)
                || selectedPropertyType !== null
                || selectedBuildingType !== null
                || selectedRooms !== null
                || selectedOfferType !== 'sale'
                || selectedListingType !== 'regular';
            if (!hasDraftContent) {
                localStorage.removeItem(PROPERTY_DRAFT_KEY);
                setDraftSavedAt(null);
                return;
            }

            const savedAt = new Date();
            const serializableForm = {...form, photos: []};
            localStorage.setItem(PROPERTY_DRAFT_KEY, JSON.stringify({
                version: PROPERTY_DRAFT_VERSION,
                savedAt: savedAt.toISOString(),
                submissionKey,
                form: serializableForm,
                selectedOfferType,
                selectedModerationStatus,
                selectedPropertyType,
                selectedBuildingType,
                selectedListingType,
                selectedRooms,
            }));
            setDraftSavedAt(savedAt);
        }, 500);

        return () => window.clearTimeout(timeout);
    }, [
        draftReady,
        editMode,
        form,
        selectedBuildingType,
        selectedListingType,
        selectedModerationStatus,
        selectedOfferType,
        selectedPropertyType,
        selectedRooms,
        submissionKey,
    ]);

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

    const setFieldValue = useCallback(<K extends keyof FormState>(name: K, value: FormState[K]) => {
        setForm((prev) => ({ ...prev, [name]: value }));
        setIsDirty(true);
    }, []);

    const setProfileDetailValue = useCallback((name: string, value: string | boolean) => {
        setForm((prev) => ({
            ...prev,
            profile_details: {...prev.profile_details, [name]: value},
        }));
        setIsDirty(true);
    }, []);

    const applyPropertyProfile = useCallback((allowedFields: readonly string[]) => {
        const allowed = new Set(allowedFields);

        setForm((prev) => {
            const nextDetails = Object.fromEntries(
                Object.entries(prev.profile_details).filter(([name]) => allowed.has(name))
            );

            const nextForm = {...prev, profile_details: nextDetails};
            let changed = Object.keys(nextDetails).length !== Object.keys(prev.profile_details).length;

            for (const [field, emptyValue] of Object.entries(PROFILE_SCOPED_FORM_DEFAULTS)) {
                if (allowed.has(field)) continue;
                const key = field as keyof FormState;
                if (nextForm[key] === emptyValue) continue;
                Object.assign(nextForm, {[key]: emptyValue});
                changed = true;
            }

            return changed ? nextForm : prev;
        });

        if (!allowed.has('rooms')) {
            setSelectedRooms(null);
        }
    }, []);

    // --- Добавление новых файлов (File -> PhotoItem) ---
    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return;
        const availableSlots = Math.max(0, MAX_PROPERTY_PHOTOS - form.photos.length);
        const selectedFiles = Array.from(e.target.files);
        const validFiles = selectedFiles.filter(
            (file) => SUPPORTED_PROPERTY_PHOTO_TYPES.has(file.type) && file.size <= MAX_PROPERTY_PHOTO_BYTES
        );
        const additions: PhotoItem[] = validFiles.slice(0, availableSlots).map((f) => ({
            id: cid(),
            url: URL.createObjectURL(f),
            file: f,
        }));

        if (validFiles.length !== selectedFiles.length) {
            showToast('error', 'Поддерживаются JPG, PNG и WebP размером до 8 МБ.');
        } else if (validFiles.length > availableSlots) {
            showToast('error', `Можно загрузить не более ${MAX_PROPERTY_PHOTOS} фотографий.`);
        }

        e.target.value = '';
        if (additions.length === 0) return;
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
        if (target.url.startsWith('blob:')) URL.revokeObjectURL(target.url);
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
        form.photos.forEach((photo) => {
            if (photo.url.startsWith('blob:')) URL.revokeObjectURL(photo.url);
        });
        setForm(initialFormState);
        setSelectedOfferType('sale');
        setSelectedModerationStatus(forcePendingModeration ? 'pending' : 'approved');
        setSelectedPropertyType(null);
        setSelectedBuildingType(null);
        setSelectedRooms(null);
        setSelectedListingType('regular');
        setDupDialogOpen(false);
        setDuplicates([]);
        setPendingCreatePayload(null);
        setIsDirty(false);
        setSubmissionKey(cid());
        setDraftRestored(false);
        setDraftSavedAt(null);
        if (!editMode) localStorage.removeItem(PROPERTY_DRAFT_KEY);
        isInitialized.current = false;
    };

    // --- Валидация обязательных селектов ---
    const validateForm = () => {
        if (
            !selectedPropertyType ||
            (requiresRooms && selectedRooms === null) ||
            (requiresRepair && getRepairTypeValidationError(form.repair_type_id))
        ) {
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
        if (!validateForm()) return false;

        // 1) Плоские поля (без массива photos)
        const propertyPayload = {
            ...form.profile_details,
            description: form.description,
            type_id: selectedPropertyType!,
            object_type_code: form.object_type_code,
            object_subtype_code: form.object_subtype_code,
            status_id: selectedBuildingType ?? undefined,
            location_id: form.location_id,
            address: form.address,
            district: form.district,
            landmark: form.landmark,
            price: form.price,
            currency: 'TJS',
            offer_type: selectedOfferType,
            rent_term: selectedOfferType === 'rent' ? (form.rent_term || 'long_term') : undefined,
            market_source: form.market_source || 'secondary',
            transaction_subtype: form.transaction_subtype || 'standard',
            construction_status: form.construction_status || undefined,
            location_visibility: form.location_visibility || 'rounded',
            moderation_status: forcePendingModeration ? 'pending' : selectedModerationStatus,
            listing_type: forcePendingModeration ? 'regular' : selectedListingType,
            rooms: selectedRooms ?? undefined,
            total_area: form.total_area,
            living_area: form.living_area,
            land_size: form.land_size,
            floor: form.floor,
            total_floors: form.total_floors,
            latitude: form.latitude,
            longitude: form.longitude,
            title: form.title,
            document_type: form.document_type,
            is_mortgage_available: form.is_mortgage_available,
            is_bargain_available: form.is_bargain_available,
            is_exchange_available: form.is_exchange_available,
            is_installment_available: form.is_installment_available,
            initial_payment: form.initial_payment,
            new_building_id: form.new_building_id,
            developer_id: form.developer_id,
        };
        const propertyDataToSubmit = requiresRepair
            ? withRequiredRepairType(propertyPayload, form.repair_type_id)
            : propertyPayload;

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
                    return true;
                };

                if (!isWrappedUpd(resUpdAny)) {
                    return await handleUpdateSuccess();
                } else if (resUpdAny.ok) {
                    return await handleUpdateSuccess();
                } else if (resUpdAny.code === 409 && 'duplicates' in resUpdAny) {
                    setDuplicates(resUpdAny.duplicates ?? []);
                    setDupDialogOpen(true);
                } else {
                    showToast('error', resUpdAny.message || 'Ошибка при обновлении объявления');
                }
            } else {
                // CREATE
                const fd = buildFormData(propertyDataToSubmit);
                fd.set('_idempotency_key', submissionKey);

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
                    return true;
                } else if (res.ok) {
                    showToast('success', 'Объявление успешно добавлено!');
                    resetForm();
                    return true;
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
                return false;
            }
            console.error(err);
            showToast('error', editMode ? 'Ошибка при обновлении объявления' : 'Ошибка при добавлении объявления');
        }

        return false;
    };

    return {
        // справочники
        propertyTypes,
        buildingTypes,
        locations,
        repairTypes,
        isRepairTypesLoading: repairTypesQuery.isLoading,
        isRepairTypesError: repairTypesQuery.isError,
        retryRepairTypes: repairTypesQuery.refetch,
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
        setFieldValue,
        setProfileDetailValue,
        applyPropertyProfile,
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
        draftRestored,
        draftSavedAt,
    };
}
