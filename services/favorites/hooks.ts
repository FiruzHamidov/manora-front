import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { addToFavorites, removeFromFavorites, getFavorites } from "./api";
import { FavoriteResponse } from "./types";

export const useAddToFavorites = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addToFavorites,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
    },
  });
};

export const useRemoveFromFavorites = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: removeFromFavorites,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
    },
  });
};

export const useFavorites = (enabled: boolean = true) => {
  return useQuery({
    queryKey: ["favorites"],
    queryFn: getFavorites,
    enabled,
  });
};

export const useAuraFavoriteIds = (enabled: boolean = true) => {
  const { data: favorites = [], isLoading, isFetching } = useFavorites(enabled);

  const data = useMemo(
    () =>
      favorites
        .filter((favorite) => (favorite.source ?? "local") === "aura")
        .map((favorite) => Number(favorite.external_property_id ?? favorite.property_id ?? favorite.property?.id))
        .filter((id) => Number.isFinite(id) && id > 0),
    [favorites]
  );

  return { data, isLoading, isFetching };
};

export const useAuraFavorites = (enabled: boolean = true) => {
  const { data: favorites = [], isLoading, isFetching } = useFavorites(enabled);
  const data = useMemo(
    () => favorites.filter((favorite) => (favorite.source ?? "local") === "aura"),
    [favorites]
  );

  return { data, isLoading, isFetching };
};

export const useToggleFavorite = () => {
  const addMutation = useAddToFavorites();
  const removeMutation = useRemoveFromFavorites();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      propertyId,
      isFavorite,
      source = "local",
      listingType,
    }: {
      propertyId: number;
      isFavorite: boolean;
      source?: "local" | "aura";
      listingType?: string;
    }) => {
      if (isFavorite) {
        await removeMutation.mutateAsync({ propertyId, source, listingType });
      } else {
        await addMutation.mutateAsync({ propertyId, source, listingType });
      }

      await queryClient.invalidateQueries({ queryKey: ["favorites", "aura", "ids"] });
      await queryClient.invalidateQueries({ queryKey: ["favorites", "aura", "items"] });
      await queryClient.invalidateQueries({ queryKey: ["favorites"] });
    },
  });
};
