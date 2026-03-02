export interface CarPhoto {
  id?: number;
  path?: string;
  file_path?: string;
  url?: string;
  is_main?: boolean;
}

export interface Car {
  __source?: "local" | "aura";
  id: number;
  title?: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
  price?: number | string;
  currency?: string;
  year?: number | string;
  mileage?: number | string;
  condition?: "new" | "used";
  fuel_type?: "petrol" | "diesel" | "hybrid" | "electric" | "gas" | "other";
  transmission?: "manual" | "automatic" | "robot" | "variator";
  drive_type?: "front" | "rear" | "all_wheel";
  brand?: {
    id: number;
    name: string;
  };
  model?: {
    id: number;
    name: string;
  };
  category?: {
    id: number;
    name: string;
  };
  latitude?: number | string | null;
  longitude?: number | string | null;
  photos?: CarPhoto[];
}

export interface CarsResponse {
  data: Car[];
  current_page?: number;
  per_page?: number;
  last_page?: number;
  total?: number;
}

export type CarsSortField =
  | "created_at"
  | "price"
  | "year"
  | "mileage"
  | "brand"
  | "model";

export type CarsSortDir = "asc" | "desc";

export interface CarsFilters {
  page?: number;
  per_page?: number;
  category_id?: number | string;
  brand_id?: number | string;
  model_id?: number | string;
  condition?: "new" | "used";
  fuel_type?: "petrol" | "diesel" | "hybrid" | "electric" | "gas" | "other";
  transmission?: "manual" | "automatic" | "robot" | "variator";
  drive_type?: "front" | "rear" | "all_wheel";
  year_from?: number | string;
  year_to?: number | string;
  price_from?: number | string;
  price_to?: number | string;
  mileage_from?: number | string;
  mileage_to?: number | string;
  search?: string;
  sort?: CarsSortField;
  dir?: CarsSortDir;
}
