import { axios } from "@/utils/axios";
import { FavoriteResponse, FavoriteTogglePayload } from "./types";

export const addToFavorites = async ({
  propertyId,
  source = "local",
}: FavoriteTogglePayload): Promise<FavoriteResponse> => {
  const response = await axios.post("/favorites", {
    property_id: propertyId,
    source,
  });
  return response.data;
};

export const removeFromFavorites = async ({
  propertyId,
  source = "local",
}: FavoriteTogglePayload): Promise<FavoriteResponse> => {
  const response = await axios.delete(`/favorites/${propertyId}`, {
    params: { source },
  });
  return response.data;
};

export const getFavorites = async (): Promise<FavoriteResponse[]> => {
  const response = await axios.get("/favorites");
  return response.data;
};
