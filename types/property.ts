export interface FormState {
  title: string;
  description: string;
  location_id: string;
  repair_type_id: string;
  heating_type_id: string;
  parking_type_id: string;
  price: string;
  currency: string;
  total_area: string;
  living_area: string;
  land_size: string;
  floor: string;
  total_floors: string;
  year_built: string;
  youtube_link: string;
  condition: string;
  apartment_type: string;
  has_garden: boolean;
  has_parking: boolean;
  is_mortgage_available: boolean;
  is_from_developer: boolean;
  landmark: string;
  latitude: string;
  longitude: string;
  agent_id: string;
  photos: File[];
}
