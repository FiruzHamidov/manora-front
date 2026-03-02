import { Property } from "../properties/types";

export interface FavoriteResponse {
  id: number;
  user_id: number;
  property_id: number;
  created_at: string;
  updated_at: string;
  source?: "local" | "aura";
  external_property_id?: number | string | null;
  property?: Property | null;
}

export interface FavoriteTogglePayload {
  propertyId: number;
  source?: "local" | "aura";
}
