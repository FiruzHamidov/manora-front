export interface PropertiesResponse {
    current_page: number;
    data: Property[];
    first_page_url: string;
    from: number;
    last_page: number;
    last_page_url: string;
    links: PaginationLink[];
    next_page_url: string | null;
    path: string;
    per_page: number;
    prev_page_url: string | null;
    to: number;
    total: number;
    meta?: CatalogMeta;
}

export interface CatalogMeta {
    partial: boolean;
    sources: {
        local: { status: 'ok' | 'unavailable' };
        aura: {
            status: 'ok' | 'unsupported_filter' | 'unavailable';
            unsupported?: string[];
        };
    };
}

export interface ContractType {
    created_at: string;
    id: number;
    name: string;
    slug: string;
    updated_at: string;
}

export interface Property {
    __source?: 'local' | 'aura';
    __entity?: string;
    __uid?: string;
    contract_type: ContractType;
    id: number;
    title?: string;
    description: string;
    moderation_status: string;
    is_published?: boolean;
    published_at?: string | null;
    publication_expires_at?: string | null;
    can_refresh_publication?: boolean;
    next_refresh_at?: string | null;
    refresh_available_in?: number | null;
    created_by: number;
    created_at: string;
    updated_at: string;
    price: string;
    price_tjs?: string | number | null;
    currency: string;
    rooms: number;
    floor: string;
    creator?: {
        id: number;
        name: string;
        phone?: string;
        photo?: string;
        email?: string;
        role_id: number;
    };
    agent_id?: number;
    type_id?: number;
    status_id?: number;
    location_id?: number;
    repair_type_id?: number;
    developer_id?: number;
    new_building_id?: number;
    object_type_code?: string | null;
    object_subtype_code?: string | null;
    developer?: {
        id: number;
        name: string;
    }
    contract_type_id?: number;
    document_type?: string | null;
    heating_type_id?: number;
    parking_type_id?: number;
    total_area?: string;
    land_size?: string;
    living_area?: string;
    total_floors?: string;
    year_built?: string;
    youtube_link?: string;
    condition?: string;
    apartment_type?: string;
    has_garden?: boolean;
    has_parking?: boolean;
    is_mortgage_available?: boolean;
    is_bargain_available?: boolean;
    is_exchange_available?: boolean;
    is_installment_available?: boolean;
    initial_payment?: string;
    is_from_developer?: boolean;
    is_business_owner: boolean,
    is_full_apartment: boolean,
    is_for_aura: boolean,
    landmark?: string;
    latitude?: string;
    longitude?: string;
    owner_phone?: string;
    object_key?: string;
    owner_name?: string;
    listing_type: string;
    district?: string;
    address?: string;
    offer_type?: string;
    rent_term?: 'long_term' | 'daily' | null;
    market_source?: 'secondary' | 'developer' | null;
    transaction_subtype?: 'standard' | 'assignment' | null;
    construction_status?: 'completed' | 'under_construction' | null;
    location_visibility?: 'exact' | 'rounded' | 'area_only';
    sold_at?: string;
    rejection_comment?: string;
    status_comment?: string;
    type: PropertyType;
    status: PropertyStatus;
    location: PropertyLocation | null;
    photos: PropertyPhoto[];
    bathroom_count?: string | number;
    elevator_count?: string | number;
    building_type?: {
        id: number;
        name: string
    };
    parking?: {
        id: number;
        name: string
    };
    heating?: {
        id: number;
        name: string
    };
    repair_type?: {
        id: number;
        name: string;
        created_at: string;
        updated_at: string;
    };
    heating_type?: {
        id: number;
        name: string;
    };
    parking_type?: {
        id: number;
        name: string;
    };
    views_count?: number;
    apartment_details?: Record<string, unknown> | null;
    house_details?: Record<string, unknown> | null;
    land_details?: Record<string, unknown> | null;
    commercial_details?: Record<string, unknown> | null;
    parking_details?: Record<string, unknown> | null;
    industrial_details?: Record<string, unknown> | null;
    details?: Record<string, unknown> | null;
    category_code?: 'apartments' | 'houses' | 'land' | 'commercial' | 'new-buildings' | 'parking' | 'industrial' | null;

    // Покупатель
    buyer_full_name?: string;
    buyer_phone?: string;

    // Планируемый договор
    planned_contract_signed_at?: string;

    // Доход / комиссия компании
    company_expected_income?: number | string;
    company_expected_income_currency?: 'TJS' | 'USD';

    company_commission_amount?: string | number;
    company_commission_currency?: 'TJS' | 'USD';

// === Deal / Sale fields ===
    actual_sale_price?: string | number;
    actual_sale_currency?: 'TJS' | 'USD';


    money_holder?: 'company' | 'agent' | 'owner' | 'developer' | 'client';

    money_received_at?: string;
    contract_signed_at?: string;

    // Deposit
    deposit_amount?: number;
    deposit_currency?: 'TJS' | 'USD';
    deposit_received_at?: string;
    deposit_taken_at?: string;

    // Agents involved in deal
    sale_agents?: Array<{
        id: number;
        name?: string;
        phone?: string;
        role: 'main' | 'assistant' | 'partner';
        agent_commission_amount?: string | number;
        agent_commission_currency?: 'TJS' | 'USD';
        agent_paid_at?: string;
    }>;
}

export interface PropertyLocation {
    id: number;
    city: string;
    district: string | null;
    latitude: string;
    longitude: string;
    created_at: string;
    updated_at: string;
}

export interface PropertyPhoto {
    id: number;
    property_id: number;
    file_path: string;
    type: "photo" | "video";
    created_at: string;
    updated_at: string;
}

export interface PropertyType {
    id: number;
    name: string;
    slug: string;
}

export interface PropertyStatus {
    id: number;
    name: string;
    slug: string;
    created_at: string;
    updated_at: string;
}

export interface MapBounds {
    south: number;
    west: number;
    north: number;
    east: number;
}

export interface MapPointProperties {
    id: number;
    title: string;
    price?: string | number;
    currency?: string;
    price_label?: string;
    label?: string;
    formatted_price?: string;
    price_formatted?: string;
    price_text?: string;
    price_human?: string;
    amount?: string | number;
    price_value?: string | number;
}

export interface MapClusterProperties {
    cluster: true;
    point_count: number;
    min_price?: string | number;
    min_price_label?: string;
    price_from?: string | number;
    price_from_label?: string;
    currency?: string;
}

export interface MapFeature {
    type: "Feature";
    geometry: {
        type: "Point";
        coordinates: [number, number];
    };
    properties?: MapPointProperties | MapClusterProperties;
    property?: MapPointProperties | MapClusterProperties;
}

export interface MapResponse {
    type: "FeatureCollection";
    features: MapFeature[];
    meta?: CatalogMeta;
}

export interface PropertyFilters {
    limit?: number;
    category_codes?: string | Array<string>;
    object_type_codes?: string | Array<string>;
    renovation_codes?: string | Array<string>;
    object_subtype_codes?: string | Array<string>;
    type_id?: string | number | Array<string | number>;
    status_id?: string | number | Array<string | number>;
    location_id?: string | number | Array<string | number>;
    location_codes?: string | Array<string>;
    area_codes?: string | Array<string>;
    repair_type_id?: string | number | Array<string | number>;
    contract_type_id?: string | number | Array<string | number>;
    document_type?: string | Array<string>;
    developer_id?: string | number | Array<string | number>;
    heating_type_id?: string | number | Array<string | number>;
    parking_type_id?: string | number | Array<string | number>;
    agent_id?: string | number | Array<string | number>;
    created_by?: string | number | Array<string | number>;
    currency?: "TJS" | "USD" | string;
    offer_type?: "rent" | "sale" | string;
    rent_term?: "long_term" | "daily" | string;
    market_source?: "secondary" | "developer" | string;
    transaction_subtype?: "standard" | "assignment" | string;
    listing_type?: "regular" | "vip" | "urgent" | string;
    moderation_status?: "pending" | "approved" | "rejected" | "draft" | "deleted" | "deposit" | "sold" | "rented" | "sold_by_owner" | "denied" | string;
    has_garden?: boolean | string;
    has_parking?: boolean | string;
    is_mortgage_available?: boolean | string;
    is_from_developer?: boolean | string;
    is_business_owner?: boolean | string;
    is_full_apartment?: boolean | string;
    is_for_aura?: boolean | string;
    search?: string;
    q?: string;
    title?: string;
    description?: string;
    district?: string;
    address?: string;
    landmark?: string;
    condition?: string;
    apartment_type?: string;
    owner_phone?: string;
    districts?: string | Array<string | number>;
    priceFrom?: string;
    priceTo?: string;
    price_tjs_from?: string;
    price_tjs_to?: string;
    rooms?: string;
    rooms_from?: string;
    rooms_to?: string;
    roomsFrom?: string;
    roomsTo?: string;
    total_areaFrom?: string;
    total_areaTo?: string;
    total_area_from?: string;
    total_area_to?: string;
    land_area_sotka_from?: string;
    land_area_sotka_to?: string;
    living_areaFrom?: string;
    living_areaTo?: string;
    areaFrom?: string;
    areaTo?: string;
    floorFrom?: string;
    floorTo?: string;
    floor_from?: string;
    floor_to?: string;
    commercial_purpose?: string;
    power_kw_from?: string;
    power_kw_to?: string;
    vehicle_capacity_from?: string;
    vehicle_capacity_to?: string;
    total_floorsFrom?: string;
    total_floorsTo?: string;
    year_builtFrom?: string;
    year_builtTo?: string;
    date_from?: string;
    date_to?: string;
    sold_at_from?: string;
    sold_at_to?: string;
    sort?: string;
    dir?: "asc" | "desc" | string;
    city?: string;
    propertyType?: string;
    branch_id?: string;
    page?: number;
    per_page?: number;
    bbox?: string;
    zoom?: number | string;
}

export interface ListingsStatsResponse {
    total: number;
    room_counts: Record<string, number>;
    pages_processed: number;
    has_more: boolean;
    meta?: CatalogMeta;
}

export type DuplicateCandidate = {
    id: number;
    title?: string | null;
    address?: string | null;
    owner_name?: string | null;
    owner_phone?: string | null;
    total_area?: number | null;
    floor?: number | null;
    price?: number | null;
    currency?: string | null;
    moderation_status?: string | null;
    created_at?: string;
    score?: number; // 0..100
    links?: { view?: string };
    signals?: {
        phone_match?: boolean;
        address_similarity?: number;
        geo_near?: boolean;
        floor_match?: boolean;
        area_delta?: number | null;
    };
};

export type CreatePropertyResult =
    | { ok: true; data: Property }
    | { ok: false; code: 409; duplicates: DuplicateCandidate[]; message: string }
    | { ok: false; code: number; message: string };

export interface User {
    id: number;
    name: string;
    email: string;
    phone: string;
    role_id: number;
    status: string;
    auth_method: string;
    created_at: string;
    updated_at: string;
}

export interface PaginationLink {
    url?: string;
    label: string;
    active: boolean;
}

export const LISTING_TYPE_META: Record<
    string,
    { label: string; classes: string }
> = {
    regular: {
        label: "Продаётся",
        classes: "bg-[#006341] text-white",
    },
    vip: {
        label: "VIP",
        classes: "bg-amber-400 text-[#020617]",
    },
    urgent: {
        label: "Срочная",
        classes: "bg-red-500 text-white",
    },
};
