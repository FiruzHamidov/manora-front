import { NewBuildingPhoto } from "@/services/new-buildings/types";

export interface ApartmentOption {
  rooms: number;
  area: number;
  price: number;
  currency?: string;
}

export interface NewBuildingCardProps {
  id: string | number;
  slug?: string;
  source?: 'local' | 'aura';
  ownerUserId?: number | null;
  title: string;
  subtitle: string;
  image: {
    src: string;
    alt: string;
  };
  apartmentOptions: ApartmentOption[];
  location: string;
  developer: {
    id: number | string;
    name: string;
    logo_path: string;
    phone?: string | null;
  };
  photos: NewBuildingPhoto[];
  hasInstallmentOption?: boolean;
  stageName?: string | null;
  className?: string;
  onClick?: () => void;
}
