import { keepPreviousData, useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PROPERTY_QUERY_KEYS } from "./constants";
import {
  getMyProperties,
  getProperties,
  getPropertyById,
  getPropertiesInfinite,
  getMyPropertiesInfinite,
  getPropertiesMapData,
  getPropertiesStats,
  refreshPropertyPublication,
} from "./api";
import { MapBounds, PropertyFilters } from "./types";
import { addPostApi } from "@/services/add-post";
import { useSelectedLocation } from "@/hooks/useSelectedLocation";

export const useGetPropertiesQuery = (
  filters?: PropertyFilters,
  withAuth: boolean = false
) => {
  const { selectedLocationId } = useSelectedLocation();

  return useQuery({
    queryKey: [
      PROPERTY_QUERY_KEYS.PROPERTY,
      selectedLocationId,
      filters,
      withAuth,
    ],
    queryFn: () => getProperties(filters, withAuth),
  });
};

export const useGetPropertyTypesQuery = () =>
  useQuery({
    queryKey: ["get-property-types"],
    queryFn: addPostApi.getPropertyTypes,
  });

export const useGetPropertiesInfiniteQuery = (
  filters?: PropertyFilters,
  withAuth: boolean = false
) => {
  const { selectedLocationId } = useSelectedLocation();

  return useInfiniteQuery({
    queryKey: [
      PROPERTY_QUERY_KEYS.PROPERTY,
      "infinite",
      selectedLocationId,
      filters,
      withAuth,
    ],
    queryFn: ({ pageParam }) =>
      getPropertiesInfinite({ pageParam, filters, withAuth }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (
        !lastPage.next_page_url ||
        lastPage.current_page >= lastPage.last_page
      ) {
        return undefined;
      }
      return lastPage.current_page + 1;
    },
    getPreviousPageParam: (firstPage) => {
      if (firstPage.current_page <= 1) {
        return undefined;
      }
      return firstPage.current_page - 1;
    },
  });
};

export const useGetMyPropertiesQuery = (
  filters?: PropertyFilters,
  withAuth: boolean = false
) => {
  return useQuery({
    queryKey: [PROPERTY_QUERY_KEYS.PROPERTY, "my", filters, withAuth],
    queryFn: () => getMyProperties(filters, withAuth),
  });
};

export const useGetAllPropertiesQuery = (
  filters?: PropertyFilters,
  withAuth: boolean = false
) => {
  return useQuery({
    queryKey: [PROPERTY_QUERY_KEYS.PROPERTY, "my", filters, withAuth],
    queryFn: () => getMyProperties(filters, withAuth),
  });
};

export const useGetMyPropertiesInfiniteQuery = (
  filters?: PropertyFilters,
  withAuth: boolean = false
) => {
  return useInfiniteQuery({
    queryKey: [PROPERTY_QUERY_KEYS.PROPERTY, "my-infinite", filters, withAuth],
    queryFn: ({ pageParam }) =>
      getMyPropertiesInfinite({ pageParam, filters, withAuth }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (
        !lastPage.next_page_url ||
        lastPage.current_page >= lastPage.last_page
      ) {
        return undefined;
      }
      return lastPage.current_page + 1;
    },
    getPreviousPageParam: (firstPage) => {
      if (firstPage.current_page <= 1) {
        return undefined;
      }
      return firstPage.current_page - 1;
    },
  });
};

export const useGetPropertyByIdQuery = (
  id: string,
  withAuth: boolean = false,
  source: "local" | "aura" = "local"
) => {
  return useQuery({
    queryKey: [PROPERTY_QUERY_KEYS.PROPERTY_DETAIL, id, withAuth, source],
    queryFn: () => getPropertyById(id, withAuth, source),
    enabled: !!id,
  });
};

export const useRefreshPropertyPublicationMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (propertyId: string | number) => refreshPropertyPublication(propertyId),
    onSuccess: (updatedProperty) => {
      queryClient.invalidateQueries({ queryKey: [PROPERTY_QUERY_KEYS.PROPERTY] });
      queryClient.invalidateQueries({
        queryKey: [PROPERTY_QUERY_KEYS.PROPERTY_DETAIL, String(updatedProperty.id)],
      });
    },
  });
};

export const useGetPropertiesMapQuery = (
  bounds: MapBounds | null,
  zoom: number,
  filters?: PropertyFilters,
  withAuth: boolean = false,
  enabled: boolean = true
) => {
  const { selectedLocationId } = useSelectedLocation();

  return useQuery({
    queryKey: [
      PROPERTY_QUERY_KEYS.PROPERTY_MAP,
      selectedLocationId,
      bounds,
      zoom,
      filters,
      withAuth,
    ],
    queryFn: async () => {
      if (!bounds) {
        throw new Error("Map bounds are required");
      }
      const response = await getPropertiesMapData(
        bounds,
        zoom,
        filters,
        withAuth
      );

      return {
        ...response,
        features: response.features.map((feature) => ({
          ...feature,

          properties: feature.properties || feature.property,
        })),
      };
    },
    enabled: !!bounds && enabled,
    staleTime: 20 * 1000,
    placeholderData: keepPreviousData,
  });
};

export const useGetPropertiesStatsQuery = (
  filters?: PropertyFilters,
  enabled: boolean = true
) => {
  const { selectedLocationId } = useSelectedLocation();

  return useQuery({
    queryKey: [
      PROPERTY_QUERY_KEYS.PROPERTY,
      "stats",
      selectedLocationId,
      filters,
    ],
    queryFn: () => getPropertiesStats(filters),
    enabled,
    staleTime: 60_000,
  });
};
