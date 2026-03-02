export interface Agent {
  name: string;
  position: string;
  image: string;
  phone: string;
  address: string;
  description: string;
  building: number;
  builded: number;
  founded: number;
  projects: number;
}

export interface ApartmentDetails {
  type: string;
  area: string;
  bathroom: string;
  repair: string;
  district: string;
}

export interface BuildingDetails {
  year: string;
  elevators: string;
  type: string;
  parking: string;
  heating: string;
}

export interface BuildingData {
  id: string;
  title: string;
  publishedAt: string;
  price: string;
  images: string[];
  agent: Agent;
  apartment: ApartmentDetails;
  building: BuildingDetails;
  description: string;
}

export interface Amenity {
  type: string;
  distance: string;
  icon: string;
}

export interface ApartmentOffering {
  id: string;
  title: string;
  location: string;
  rooms: number;
  bathrooms: number;
  area: number;
  floor: number;
  price: number;
  pricePerMeter: number;
  image: string;
}

export interface BuildingComponentProps {
  apartmentData: BuildingData;
}
