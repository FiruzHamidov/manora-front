// services/add-post/types.ts

import {DuplicateCandidate, Property} from '../properties/types';

/** Справочники */
export interface SelectOption { id: number; name: string; city?: string; slug?: string }
export interface PropertyType { id: number; name: string; slug?: string }
export interface BuildingType { id: number; name: string; slug?: string }
export interface Location { id: number; name: string; city: string; slug?: string }
export interface RepairType { id: number; name: string; slug?: string }
export interface HeatingType { id: number; name: string; slug?: string }
export interface ParkingType { id: number; name: string; slug?: string }
export interface ContractType { id: number; name: string; slug?: string }

/** Единый клиентский тип фото для UI (превью + DnD) */
export type PhotoItem = {
    id: string;       // стабильный client-id для key и сортировки
    url: string;      // objectURL (для новых файлов) или url CDN/Storage (для серверных)
    file?: File;      // есть только у новых фото
    serverId?: number;// есть только у серверных фото
};

/** «Сырой» тип формы, используемый в проекте (оставляем как есть) */
export interface FormState {
    title: string;
    description: string;
    location_id: string;
    repair_type_id: string;
    developer_id: string;
    heating_type_id: string;
    parking_type_id: string;
    contract_type_id: string;
    moderation_status: string;
    owner_phone: string;
    owner_name: string;
    object_key: string;
    price: string;
    currency: string;
    total_area: string;
    land_size: string;
    living_area: string;
    floor: string;
    total_floors: string;
    year_built: string;
    youtube_link: string;
    sold_at: string;
    condition: string;
    apartment_type: string;
    status_comment: string;
    has_garden: boolean;
    has_parking: boolean;
    is_mortgage_available: boolean;
    is_from_developer: boolean;
    is_business_owner: boolean;
    is_full_apartment: boolean;
    is_for_aura: boolean;
    landmark: string;
    latitude: string;
    longitude: string;
    agent_id: string;
    district: string;
    created_by: string;
    address: string;

    // ===== Сделка / залог (опционально, заполняется по статусу) =====

    // Покупатель
    buyer_full_name?: string;
    buyer_phone?: string;

    // Залог
    deposit_amount?: number | string;
    deposit_currency?: 'TJS' | 'USD';
    deposit_received_at?: string;
    deposit_taken_at?: string;

    // Планируемый договор
    planned_contract_signed_at?: string;

    // Доход / комиссия компании
    company_expected_income?: number | string;
    company_expected_income_currency?: 'TJS' | 'USD';

    company_commission_amount?: number | string;
    company_commission_currency?: 'TJS' | 'USD';

    // Фактическая сделка
    actual_sale_price?: number | string;
    actual_sale_currency?: 'TJS' | 'USD';

    // У кого деньги
    money_holder?: 'company' | 'agent' | 'owner' | 'developer' | 'client';

    // Текущая форма проекта (новые File + серверные объекты)
    photos: (File | { id: number; file_path: string; type: string })[];
}

/** JSON-DTO (редко нужен при наличии фото; обычно шлём FormData) */
export interface CreatePropertyRequest {
    description: string;
    type_id: number;
    status_id: number;
    location_id: string;
    address: string;
    district: string;
    moderation_status: string;
    repair_type_id: string;
    heating_type_id: string;
    parking_type_id: string;
    contract_type_id: string;
    price: string;
    currency: string;
    offer_type: string;
    status_comment?: string;
    listing_type: string;
    rooms: number;
    total_area: string;
    living_area: string;
    land_size: string;
    floor: string;
    total_floors: string;
    year_built: string;
    condition: string;
    apartment_type: string;
    has_garden: boolean;
    has_parking: boolean;
    is_mortgage_available: boolean;
    is_from_developer: boolean;
    is_business_owner: boolean;
    is_full_apartment: boolean;
    is_for_aura: boolean;
    landmark: string;
    owner_phone?: string;
    owner_name?: string;
    object_key?: string;
    youtube_link?: string;
    sold_at?: string;
    latitude?: string;
    longitude?: string;
    agent_id?: string;

    // ниже — опциональные поля для сценария JSON-апдейта
    photos: File[];
    photos_keep?: number[];
    remove_ids?: number[];
    cover_id?: number;
}

export type CreatePropertyResponse =
    | { ok: true; data: Property }
    | { ok: false; code: 409; message: string; duplicates: DuplicateCandidate[] }
    | { ok: false; code: number; message: string };


export type CreatePropertyPayload = FormData | CreatePropertyRequest;


export type UpdatePropertyPayload =
    | { id: string; formData: FormData }                           // multipart (дозагрузка фото и поля)
    | { id: string; json: Partial<CreatePropertyRequest> };        // JSON-патч (без файлов)