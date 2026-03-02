export type Branch = {
  id: number;
  name: string;
  lat: number | null;
  lng: number | null;
  landmark: string | null;
  photo: string | null;
  created_at?: string;
  updated_at?: string;
};

export type BranchPayload = {
  name: string;
  lat?: number;
  lng?: number;
  landmark?: string;
  photo?: File;
};
