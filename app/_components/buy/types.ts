export interface Image {
  url: string;
  alt?: string;
}

export interface Agent {
  name: string;
  role: string;
  avatarUrl?: string;
}

export interface Listing {
  id: number;
  images: Image[];
  price: number;
  currency: string;
  title: string;
  locationName: string;
  description: string;
  roomCountLabel: string;
  area: number;
  floorInfo: string;
  agent?: Agent;
  date?: string;
  type?: string;
  moderation_status?: string;
  listing_type?: string;
}
