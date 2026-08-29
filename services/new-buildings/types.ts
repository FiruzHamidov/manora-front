import type { MediaSource } from './media';
export interface BuildingFloorPlan {
  id: number;
  new_building_id: number;
  block_id: number;
  entrance_id: number | null;
  name: string;
  floor_from: number;
  floor_to: number;
  version: number;
  archived_at: string | null;
  block?: { id: number; name: string };
  entrance?: { id: number; name: string } | null;
}

export interface ResidentialDrawing {
  sources?: MediaSource[];
  original_download_url?: string | null;
  id: number;
  url: string;
  alt: string;
  caption: string | null;
  width: number;
  height: number;
  is_cover: boolean;
  sort_order: number;
}

export type BuildingApiError = {
  response?: {
    data?: {
      message?: string;
      errors?: Record<string, string[]>;
      [k: string]: unknown;
    };
  };
};

export interface Developer {
  id: number;
  name: string;
  logo_path?: string | null;
  description?: string | null;
  website?: string | null;
  created_at: string;
  updated_at: string;
  built_count?: number;
  founded_year?: string;
  phone?: string;
  instagram?: string | null;
  facebook?: string | null;
  telegram?: string | null;
  whatsapp?: string | null;
  address?: string | null;
  total_projects?: number;
  under_construction_count?: number;
  moderation_status?: ModerationStatus;
}

export type DevelopersResponse = Developer[] | Paginated<Developer>;

export interface DeveloperPayload {
  name: string;
  description?: string | null;
  address?: string | null;
  phone?: string | null;
  under_construction_count?: number | null;
  built_count?: number | null;
  founded_year?: string | null;
  total_projects?: number | null;
  moderation_status?: ModerationStatus;
  website?: string | null;
  facebook?: string | null;
  instagram?: string | null;
  telegram?: string | null;
  whatsapp?: string | null;
  logo?: File | null;
}

export interface ConstructionStage {
  id: number;
  name: string;
  slug: string;
  sort_order?: number;
  is_active?: boolean;
  created_at: string;
  updated_at: string;
}

export interface Material {
  id: number;
  name: string;
  slug: string;
  created_at: string;
  updated_at: string;
}

export interface Feature {
  id: number;
  name: string;
  slug: string;
  created_at: string;
  updated_at: string;
  pivot?: {
    new_building_id: number;
    feature_id: number;
    created_at: string;
    updated_at: string;
  };
}

export interface LocationOption {
  id: number;
  city: string;
  code?: string | null;
}

export type ModerationStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "draft"
  | "deleted";

export interface NewBuildingPhoto {
  sources?: MediaSource[];
  original_download_url?: string | null;
  alt?: string | null;
  caption?: string | null;
  inventory_version?: number;
  id?: number;
  new_building_id?: number;
  path?: string;
  url?: string;
  is_cover?: boolean;
  sort_order?: number;
  order?: number;
  created_at?: string;
  updated_at?: string;
}

export interface CatalogNewBuildingUnit {
  rooms: number | null;
  area_from: number | null;
  price_from: number | null;
  currency: string | null;
  cover_photo: string | null;
}

export interface CatalogNewBuilding {
  id: number;
  title: string;
  description: string | null;
  address: string | null;
  district: string | null;
  latitude: number | null;
  longitude: number | null;
  developer: string | null;
  stage: string | null;
  material: string | null;
  photos: NewBuildingPhoto[];
  installment_available: boolean;
  units: CatalogNewBuildingUnit[];
}

export interface CatalogNewBuildingsResponse {
  data: CatalogNewBuilding[];
  current_page: number;
  per_page: number;
  last_page: number;
  total: number;
}

export interface CatalogNewBuildingsFilters {
  page?: number;
  per_page?: number;
  developer_id?: number | string;
  stage_id?: number | string;
  material_id?: number | string;
  search?: string;
  ceiling_height_min?: number | string;
  ceiling_height_max?: number | string;
  sort?:
    | "title"
    | "district"
    | "developer"
    | "stage"
    | "material"
    | "min_price"
    | "min_area"
    | "installment_available"
    | "completion_at"
    | "created_at";
  dir?: "asc" | "desc";
}

export interface CatalogNewBuildingPlan {
  __source?: "local" | "aura";
  unit_id: number;
  building_id: number;
  building_title: string;
  building_address: string | null;
  building_latitude: number | null;
  building_longitude: number | null;
  rooms: number | null;
  area: number | null;
  price: number | null;
  currency: string | null;
  cover_photo: string | null;
}

export interface CatalogNewBuildingPlansResponse {
  data: CatalogNewBuildingPlan[];
  current_page: number;
  per_page: number;
  last_page: number;
  total: number;
}

export interface CatalogNewBuildingPlansFilters {
  page?: number;
  per_page?: number;
  developer_id?: number | string;
  stage_id?: number | string;
  material_id?: number | string;
  search?: string;
  ceiling_height_min?: number | string;
  ceiling_height_max?: number | string;
  sort?:
    | "title"
    | "building_title"
    | "building_address"
    | "price"
    | "min_price"
    | "area"
    | "rooms"
    | "created_at";
  dir?: "asc" | "desc";
}

export interface BuildingBlock {
  completion_precision?: CompletionPrecision;
  completion_year?: number | null;
  completion_quarter?: number | null;
  archived_at?: string | null;
  version: number;
  id: number;
  new_building_id: number;
  name: string;
  floors_from: number | null;
  floors_to: number | null;
  completion_at: string;
  created_at: string;
  updated_at: string;
}

export interface BuildingBlockPayload {
  version?: number;
  completion_precision?: CompletionPrecision;
  completion_year?: number | null;
  completion_quarter?: number | null;
  name: string;
  floors_from: number | null;
  floors_to: number | null;
  completion_at: string;
}

export type UnitWindowView = 'courtyard' | 'street' | 'park' | 'mountains' | 'city' | 'panoramic';
export interface BuildingUnit {
  id: number;
  version: number;
  new_building_id: number;
  block_id: number | null;
  entrance_id: number | null;
  layout_id: number | null;
  number: string | null;
  position_on_floor: number | null;
  external_id?: string | null;
  rooms: number | null;
  bedrooms?: number;
  bathrooms: number | null;
  area: string | null;
  living_area: string | null;
  kitchen_area: string | null;
  floor: number | null;
  name: string;
  description?: string | null;
  finishing: string | null;
  price?: number;
  currency: string;
  pricing_basis: 'total' | 'per_sqm';
  price_per_sqm: string | null;
  total_price: string | null;
  discount_price: string | null;
  publication_status: PublicationStatus;
  availability_status: 'available' | 'reserved' | 'sold' | 'withdrawn';
  moderation_status: 'pending' | 'available' | 'sold' | 'reserved';
  is_available?: boolean;
  window_view: UnitWindowView | null;
  created_at: string;
  updated_at: string;
  entrance?: BuildingEntrance | null;
  layout?: UnitLayout | null;
}

export type BuildingUnitPayload = Partial<Omit<BuildingUnit, 'id' | 'new_building_id' | 'created_at' | 'updated_at' | 'entrance' | 'layout'>> & { reason?: string };

export interface BuildingEntrance {
  id: number;
  block_id: number;
  name: string;
  residential_floor_from: number | null;
  residential_floor_to: number | null;
  positions_per_floor: number | null;
  sort_order: number;
  version: number;
  archived_at: string | null;
  units_count: number;
}

export interface UnitLayout {
  id: number;
  new_building_id: number;
  code: string;
  name: string | null;
  rooms: number | null;
  area: string | null;
  living_area: string | null;
  kitchen_area: string | null;
  version: number;
  archived_at: string | null;
  units_count: number;
}

export interface UnitPhoto {
  sources?: MediaSource[];
  original_download_url?: string | null;
  inventory_version?: number;
  id: number;
  unit_id: number;
  path: string;
  url: string;
  is_cover: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface NewBuildingStats {
  inventory?: import('./unit-selection').SelectionMeta;
  total_price: {
    min: number | null;
    max: number | null;
    formatted: string | null;
  };
  price_per_sqm: {
    min: number | null;
    max: number | null;
    formatted: string | null;
  };
}

export interface NearbyPlace {
  id: number;
  new_building_id: number;
  type:
    | "mosque"
    | "bus_stop"
    | "downtown"
    | "hospital"
    | "gym"
    | "park"
    | "school"
    | "kindergarten"
    | "supermarket";
  name?: string | null;
  distance: number;
  created_at: string;
  updated_at: string;
}

export type PublicationStatus = 'draft' | 'pending' | 'published' | 'rejected' | 'archived';
export type CompletionPrecision = 'date' | 'quarter' | 'year' | 'unknown';

export interface NewBuilding {
  publication_status: PublicationStatus;
  responsible_user_id?: number | null;
  consultant_user_id?: number | null;
  responsible_employee?: { id: number; name: string } | null;
  consultant?: { name: string; phone: string } | null;
  data_verified_at?: string | null;
  content_verified_at?: string | null;
  completion_precision?: CompletionPrecision;
  completion_year?: number | null;
  completion_quarter?: number | null;
  version: number;
  __source?: "local" | "aura";
  __entity?: string;
  __uid?: string;
  id: number;
  title: string;
  description?: string | null;
  developer_id?: number | null;
  developer?: Developer;
  construction_stage_id?: number | null;
  stage?: ConstructionStage;
  material_id?: number | null;
  material?: Material;
  location_id?: number | null;

  installment_available: boolean;
  heating: boolean;
  has_terrace: boolean;
  heating_description?: string | null;
  parking_description?: string | null;
  landscaping_description?: string | null;
  housing_class?: string | null;
  advantages?: string[] | null;

  floors_range?: string | null;
  completion_at?: string | null;

  address?: string | null;
  district?: string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
  ceiling_height?: number | string | null;
  window_view?: string | null;
  moderation_status: ModerationStatus;
  created_by?: number | null;
  created_at: string;
  updated_at: string;

  features?: Feature[];
  photos?: NewBuildingPhoto[];
  blocks?: BuildingBlock[];
  units?: BuildingUnit[];
  nearby_places?: NearbyPlace[];
}

export interface NewBuildingDetailResponse {
  capabilities?: { manage: boolean; moderate: boolean; assign: boolean; verify_data: boolean; import_inventory?: boolean };
  publication_errors?: Record<string, string>;
  data: NewBuilding;
  stats: NewBuildingStats;
}

export interface NewBuildingPayload {
  version?: number;
  publication_status?: PublicationStatus;
  completion_precision?: CompletionPrecision;
  completion_year?: number | null;
  completion_quarter?: number | null;
  title: string;
  description?: string | null;

  developer_id?: number | null;
  construction_stage_id?: number | null;
  material_id?: number | null;

  location_id?: number | null;

  installment_available?: boolean;
  heating?: boolean;
  has_terrace?: boolean;
  heating_description?: string | null;
  parking_description?: string | null;
  landscaping_description?: string | null;
  housing_class?: string | null;
  advantages?: string[] | null;

  floors_range?: string | null;
  completion_at?: string | null;

  address?: string | null;
  district?: string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;

  ceiling_height?: number | string | null;

  moderation_status?: ModerationStatus;

  features?: number[];
}

export interface Paginated<T> {
  data: T[];
  current_page: number;
  per_page: number;
  total: number;
  last_page?: number;
  next_page_url?: string | null;
  prev_page_url?: string | null;
}

export interface NewBuildingsFilters {
  page?: number;
  per_page?: number;
  developer_id?: number | string;
  stage_id?: number | string;
  material_id?: number | string;
  search?: string;
  ceiling_height_min?: number | string;
  ceiling_height_max?: number | string;
}

export interface NewBuildingsResponse {
  current_page: number;
  data: NewBuilding[];
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
}

export interface PaginationLink {
  url?: string;
  label: string;
  active: boolean;
}
