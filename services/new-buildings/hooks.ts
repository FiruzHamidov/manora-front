import {
  useMutation,
  useQuery,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import Axios from "axios";
import { axios } from "@/utils/axios";
import { NEW_BUILDING_ENDPOINTS } from "./constants";
import { AURA_BACKEND_URL } from "@/constants/base-url";
import type {
  CatalogNewBuildingPlansFilters,
  CatalogNewBuildingPlansResponse,
  CatalogNewBuildingsFilters,
  CatalogNewBuildingsResponse,
  Feature,
  NewBuilding,
  NewBuildingPayload,
  Paginated,
  Developer,
  ConstructionStage,
  Material,
  LocationOption,
  NewBuildingsFilters,
  NewBuildingPhoto,
  DeveloperPayload,
  NewBuildingDetailResponse,
  BuildingBlock,
  BuildingBlockPayload,
  BuildingUnit,
  BuildingUnitPayload,
  UnitPhoto,
} from "./types";

const defaultParams = { page: 1, per_page: 100 };
const AURA_API_BASE = AURA_BACKEND_URL.replace(/\/storage\/?$/, "/api");

type FeedResponse<T> = {
  items?: T[];
  next_cursor?: string | null;
  limit?: number;
};

const toPaginatedFromFeed = <T>(
  payload: Paginated<T> | FeedResponse<T>,
  page: number = 1,
  perPage: number = 20
): Paginated<T> => {
  if (Array.isArray((payload as Paginated<T>)?.data)) {
    return payload as Paginated<T>;
  }

  const items = Array.isArray((payload as FeedResponse<T>)?.items)
    ? (payload as FeedResponse<T>).items!
    : [];
  const nextCursor = (payload as FeedResponse<T>)?.next_cursor ?? null;
  const safePerPage = Number((payload as FeedResponse<T>)?.limit || perPage);

  return {
    data: items,
    current_page: page,
    per_page: safePerPage,
    total: items.length,
    last_page: nextCursor ? page + 1 : page,
    next_page_url: nextCursor ? `cursor:${nextCursor}` : null,
    prev_page_url: null,
  };
};

export const useDevelopers = (params = defaultParams) =>
  useQuery({
    queryKey: ["developers", params],
    queryFn: async () => {
      const { data } = await axios.get<Developer[] | Paginated<Developer>>(
        "/developers",
        {
          params,
        }
      );
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });

export const useDeveloper = (id?: number, source: "local" | "aura" = "local") =>
  useQuery({
    queryKey: ["developers", id, source],
    queryFn: async () => {
      const { data } = await axios.get<Developer>(`${NEW_BUILDING_ENDPOINTS.FEED_DEVELOPER_DETAIL}/${id}`, {
        params: source ? { source } : undefined,
      });
      return data;
    },
    enabled: !!id,
  });

export const useCreateDeveloper = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: DeveloperPayload) => {
      const formData = new FormData();

      formData.append("name", payload.name);

      if (payload.description) {
        formData.append("description", payload.description);
      }

      if (payload.phone) {
        formData.append("phone", payload.phone);
      }

      if (
        payload.under_construction_count !== undefined &&
        payload.under_construction_count !== null
      ) {
        formData.append(
          "under_construction_count",
          payload.under_construction_count.toString()
        );
      }

      if (payload.built_count !== undefined && payload.built_count !== null) {
        formData.append("built_count", payload.built_count.toString());
      }

      if (payload.founded_year) {
        formData.append("founded_year", payload.founded_year);
      }

      if (
        payload.total_projects !== undefined &&
        payload.total_projects !== null
      ) {
        formData.append("total_projects", payload.total_projects.toString());
      }

      if (payload.moderation_status) {
        formData.append("moderation_status", payload.moderation_status);
      }

      if (payload.website) {
        formData.append("website", payload.website);
      }

      if (payload.facebook) {
        formData.append("facebook", payload.facebook);
      }

      if (payload.instagram) {
        formData.append("instagram", payload.instagram);
      }

      if (payload.telegram) {
        formData.append("telegram", payload.telegram);
      }

      if (payload.logo) {
        formData.append("logo", payload.logo);
      }

      const { data } = await axios.post<Developer>("/developers", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["developers"] });
    },
  });
};

export const useUpdateDeveloper = (id: number) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: DeveloperPayload) => {
      const formData = new FormData();

      formData.append("name", payload.name);

      if (payload.description) {
        formData.append("description", payload.description);
      }

      if (payload.phone) {
        formData.append("phone", payload.phone);
      }

      if (
        payload.under_construction_count !== undefined &&
        payload.under_construction_count !== null
      ) {
        formData.append(
          "under_construction_count",
          payload.under_construction_count.toString()
        );
      }

      if (payload.built_count !== undefined && payload.built_count !== null) {
        formData.append("built_count", payload.built_count.toString());
      }

      if (payload.founded_year) {
        formData.append("founded_year", payload.founded_year);
      }

      if (
        payload.total_projects !== undefined &&
        payload.total_projects !== null
      ) {
        formData.append("total_projects", payload.total_projects.toString());
      }

      if (payload.moderation_status) {
        formData.append("moderation_status", payload.moderation_status);
      }

      if (payload.website) {
        formData.append("website", payload.website);
      }

      if (payload.facebook) {
        formData.append("facebook", payload.facebook);
      }

      if (payload.instagram) {
        formData.append("instagram", payload.instagram);
      }

      if (payload.telegram) {
        formData.append("telegram", payload.telegram);
      }

      if (payload.logo) {
        formData.append("logo", payload.logo);
      }

      const { data } = await axios.post<Developer>(
        `/developers/${id}?_method=PUT`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["developers"] });
      qc.invalidateQueries({ queryKey: ["developers", id] });
    },
  });
};

export const useDeleteDeveloper = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await axios.delete(`/developers/${id}`);
      return true;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["developers"] });
    },
  });
};

export const useConstructionStages = (params = defaultParams) =>
  useQuery({
    queryKey: ["construction-stages", params],
    queryFn: async () => {
      const { data } = await axios.get<Paginated<ConstructionStage>>(
        "/construction-stages",
        { params }
      );
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });

export const useConstructionStage = (id?: number) =>
  useQuery({
    queryKey: ["construction-stages", id],
    queryFn: async () => {
      const { data } = await axios.get<ConstructionStage>(
        `/construction-stages/${id}`
      );
      return data;
    },
    enabled: !!id,
  });

export const useCreateConstructionStage = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { name: string; slug?: string }) => {
      const { data } = await axios.post<ConstructionStage>(
        "/construction-stages",
        payload
      );
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["construction-stages"] });
    },
  });
};

export const useUpdateConstructionStage = (id: number) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { name: string; slug?: string }) => {
      const { data } = await axios.put<ConstructionStage>(
        `/construction-stages/${id}`,
        payload
      );
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["construction-stages"] });
      qc.invalidateQueries({ queryKey: ["construction-stages", id] });
    },
  });
};

export const useDeleteConstructionStage = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await axios.delete(`/construction-stages/${id}`);
      return true;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["construction-stages"] });
    },
  });
};

export const useMaterials = (params = defaultParams) =>
  useQuery({
    queryKey: ["materials", params],
    queryFn: async () => {
      const { data } = await axios.get<Paginated<Material>>("/materials", {
        params,
      });
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });

export const useMaterial = (id?: number) =>
  useQuery({
    queryKey: ["materials", id],
    queryFn: async () => {
      const { data } = await axios.get<Material>(`/materials/${id}`);
      return data;
    },
    enabled: !!id,
  });

export const useCreateMaterial = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { name: string; slug?: string }) => {
      const { data } = await axios.post<Material>("/materials", payload);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["materials"] });
    },
  });
};

export const useUpdateMaterial = (id: number) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { name: string; slug?: string }) => {
      const { data } = await axios.put<Material>(`/materials/${id}`, payload);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["materials"] });
      qc.invalidateQueries({ queryKey: ["materials", id] });
    },
  });
};

export const useDeleteMaterial = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await axios.delete(`/materials/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["materials"] });
    },
  });
};

export const useFeatures = (params = defaultParams) =>
  useQuery({
    queryKey: ["features", params],
    queryFn: async () => {
      const { data } = await axios.get<Paginated<Feature>>("/features", {
        params,
      });
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });

export const useFeature = (id?: number) =>
  useQuery({
    queryKey: ["features", id],
    queryFn: async () => {
      const { data } = await axios.get<Feature>(`/features/${id}`);
      return data;
    },
    enabled: !!id,
  });

export const useCreateFeature = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { name: string; slug?: string }) => {
      const { data } = await axios.post<Feature>("/features", payload);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["features"] });
    },
  });
};

export const useUpdateFeature = (id: number) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { name: string; slug?: string }) => {
      const { data } = await axios.put<Feature>(`/features/${id}`, payload);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["features"] });
      qc.invalidateQueries({ queryKey: ["features", id] });
    },
  });
};

export const useDeleteFeature = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await axios.delete(`/features/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["features"] });
    },
  });
};

export const useLocations = (params = defaultParams) =>
  useQuery({
    queryKey: ["locations", params],
    queryFn: async () => {
      const { data } = await axios.get<LocationOption[]>("/locations", {
        params,
      });
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });

export const useNewBuildings = (params: NewBuildingsFilters = {}) =>
  useQuery<Paginated<NewBuilding>>({
    queryKey: ["new-buildings", params],
    queryFn: async () => {
      const { data } = await axios.get<
        Paginated<NewBuilding> | FeedResponse<NewBuilding>
      >(
        NEW_BUILDING_ENDPOINTS.FEED_NEW_BUILDINGS,
        { params }
      );
      return toPaginatedFromFeed(
        data,
        Number(params.page || 1),
        Number(params.per_page || 20)
      );
    },
    placeholderData: keepPreviousData,
  });

export const useCatalogNewBuildings = (
  params: CatalogNewBuildingsFilters = {}
) =>
  useQuery<CatalogNewBuildingsResponse>({
    queryKey: ["catalog-new-buildings", params],
    queryFn: async () => {
      const { data } = await axios.get<CatalogNewBuildingsResponse>(
        NEW_BUILDING_ENDPOINTS.CATALOG_NEW_BUILDINGS,
        { params }
      );
      return data;
    },
    placeholderData: keepPreviousData,
  });

export const useCatalogNewBuildingPlans = (
  params: CatalogNewBuildingPlansFilters = {}
) =>
  useQuery<CatalogNewBuildingPlansResponse>({
    queryKey: ["catalog-new-building-plans", params],
    queryFn: async () => {
      const auraAxios = Axios.create({ baseURL: AURA_API_BASE });

      const [localResult, auraResult] = await Promise.allSettled([
        axios.get<CatalogNewBuildingPlansResponse>(
          NEW_BUILDING_ENDPOINTS.CATALOG_NEW_BUILDING_PLANS,
          { params }
        ),
        auraAxios.get<CatalogNewBuildingPlansResponse>(
          NEW_BUILDING_ENDPOINTS.CATALOG_NEW_BUILDING_PLANS,
          { params }
        ),
      ]);

      const localData =
        localResult.status === "fulfilled" ? localResult.value.data : null;
      const auraData =
        auraResult.status === "fulfilled" ? auraResult.value.data : null;

      const localItems = (localData?.data ?? []).map((item) => ({
        ...item,
        __source: "local" as const,
      }));
      const auraItems = (auraData?.data ?? []).map((item) => ({
        ...item,
        __source: "aura" as const,
      }));

      const merged = [...localItems, ...auraItems];

      return {
        data: merged,
        current_page: localData?.current_page ?? auraData?.current_page ?? 1,
        per_page: localData?.per_page ?? auraData?.per_page ?? Number(params.per_page || 20),
        last_page: Math.max(localData?.last_page ?? 1, auraData?.last_page ?? 1),
        total: (localData?.total ?? 0) + (auraData?.total ?? 0),
      };
    },
    placeholderData: keepPreviousData,
  });

export const useNewBuilding = (id?: number, source: "local" | "aura" = "local") =>
  useQuery({
    queryKey: ["new-buildings", id, source],
    queryFn: async () => {
      const { data } = await axios.get<NewBuildingDetailResponse>(
        `${NEW_BUILDING_ENDPOINTS.FEED_NEW_BUILDING_DETAIL}/${id}`,
        { params: source ? { source } : undefined }
      );
      return data;
    },
    enabled: !!id,
  });

export const useCreateNewBuilding = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: NewBuildingPayload) => {
      const { data } = await axios.post<NewBuilding>("/new-buildings", payload);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["new-buildings"] });
    },
  });
};

export const useUpdateNewBuilding = (id: number) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: NewBuildingPayload) => {
      const { data } = await axios.put<NewBuilding>(
        `/new-buildings/${id}`,
        payload
      );

      return data;
    },
    // eslint-disable-next-line
    onSuccess: (_data, _vars) => {
      qc.invalidateQueries({ queryKey: ["new-buildings"] });
      qc.invalidateQueries({ queryKey: ["new-buildings", id] });
    },
  });
};

export const useDeleteNewBuilding = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await axios.delete(`/new-buildings/${id}`);
      return true;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["new-buildings"] });
    },
  });
};

export const useAttachFeature = () =>
  useMutation({
    mutationFn: async (vars: { newBuildingId: number; featureId: number }) => {
      const { newBuildingId, featureId } = vars;
      await axios.post(`/new-buildings/${newBuildingId}/features/${featureId}`);
      return true;
    },
  });

export const useDetachFeature = () =>
  useMutation({
    mutationFn: async (vars: { newBuildingId: number; featureId: number }) => {
      const { newBuildingId, featureId } = vars;
      await axios.delete(
        `/new-buildings/${newBuildingId}/features/${featureId}`
      );
      return true;
    },
  });

export const useNewBuildingPhotos = (newBuildingId?: number, source: "local" | "aura" = "local") =>
  useQuery({
    queryKey: ["new-buildings", newBuildingId, "photos", source],
    queryFn: async () => {
      const { data } = await axios.get<NewBuildingPhoto[]>(
        `${NEW_BUILDING_ENDPOINTS.FEED_NEW_BUILDING_PHOTOS}/${newBuildingId}/photos`,
        { params: source ? { source } : undefined }
      );
      return data;
    },
    enabled: !!newBuildingId,
    staleTime: 5 * 60 * 1000,
  });

// Building Blocks CRUD
export const useBuildingBlocks = (newBuildingId?: number) =>
  useQuery({
    queryKey: ["new-buildings", newBuildingId, "blocks"],
    queryFn: async () => {
      const { data } = await axios.get<BuildingBlock[]>(
        `/new-buildings/${newBuildingId}/blocks`
      );
      return data;
    },
    enabled: !!newBuildingId,
    staleTime: 5 * 60 * 1000,
  });

export const useBuildingBlock = (newBuildingId?: number, blockId?: number) =>
  useQuery({
    queryKey: ["new-buildings", newBuildingId, "blocks", blockId],
    queryFn: async () => {
      const { data } = await axios.get<BuildingBlock>(
        `/new-buildings/${newBuildingId}/blocks/${blockId}`
      );
      return data;
    },
    enabled: !!newBuildingId && !!blockId,
  });

export const useCreateBuildingBlock = (newBuildingId: number) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: BuildingBlockPayload) => {
      const { data } = await axios.post<BuildingBlock>(
        `/new-buildings/${newBuildingId}/blocks`,
        payload
      );
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ["new-buildings", newBuildingId, "blocks"],
      });
      qc.invalidateQueries({ queryKey: ["new-buildings", newBuildingId] });
    },
  });
};

export const useUpdateBuildingBlock = (
  newBuildingId: number,
  blockId: number
) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: BuildingBlockPayload) => {
      const { data } = await axios.put<BuildingBlock>(
        `/new-buildings/${newBuildingId}/blocks/${blockId}`,
        payload
      );
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ["new-buildings", newBuildingId, "blocks"],
      });
      qc.invalidateQueries({
        queryKey: ["new-buildings", newBuildingId, "blocks", blockId],
      });
      qc.invalidateQueries({ queryKey: ["new-buildings", newBuildingId] });
    },
  });
};

export const useDeleteBuildingBlock = (newBuildingId: number) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (blockId: number) => {
      await axios.delete(`/new-buildings/${newBuildingId}/blocks/${blockId}`);
      return true;
    },
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ["new-buildings", newBuildingId, "blocks"],
      });
      qc.invalidateQueries({ queryKey: ["new-buildings", newBuildingId] });
    },
  });
};

// Building Units CRUD
export const useBuildingUnits = (
  newBuildingId?: number,
  page = 1,
  per_page = 15
) =>
  useQuery<Paginated<BuildingUnit>>({
    queryKey: ["new-buildings", newBuildingId, "units", page, per_page],
    queryFn: async () => {
      const { data } = await axios.get<Paginated<BuildingUnit>>(
        `/new-buildings/${newBuildingId}/units`,
        { params: { page, per_page } }
      );
      return data;
    },
    enabled: !!newBuildingId,
    staleTime: 5 * 60 * 1000,
  });

export const useBuildingUnit = (newBuildingId?: number, unitId?: number) =>
  useQuery({
    queryKey: ["new-buildings", newBuildingId, "units", unitId],
    queryFn: async () => {
      const { data } = await axios.get<BuildingUnit>(
        `/new-buildings/${newBuildingId}/units/${unitId}`
      );
      return data;
    },
    enabled: !!newBuildingId && !!unitId,
  });

export const useCreateBuildingUnit = (newBuildingId: number) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: BuildingUnitPayload) => {
      const { data } = await axios.post<BuildingUnit>(
        `/new-buildings/${newBuildingId}/units`,
        payload
      );
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ["new-buildings", newBuildingId, "units"],
      });
      qc.invalidateQueries({ queryKey: ["new-buildings", newBuildingId] });
    },
  });
};

export const useUpdateBuildingUnit = (
  newBuildingId: number,
  unitId: number
) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: BuildingUnitPayload) => {
      const { data } = await axios.put<BuildingUnit>(
        `/new-buildings/${newBuildingId}/units/${unitId}`,
        payload
      );

      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ["new-buildings", newBuildingId, "units"],
      });
      qc.invalidateQueries({
        queryKey: ["new-buildings", newBuildingId, "units", unitId],
      });
      qc.invalidateQueries({ queryKey: ["new-buildings", newBuildingId] });
    },
  });
};

export const useDeleteBuildingUnit = (newBuildingId: number) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (unitId: number) => {
      await axios.delete(`/new-buildings/${newBuildingId}/units/${unitId}`);
      return true;
    },
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ["new-buildings", newBuildingId, "units"],
      });
      qc.invalidateQueries({ queryKey: ["new-buildings", newBuildingId] });
    },
  });
};

// Unit Photos CRUD
export const useUnitPhotos = (newBuildingId?: number, unitId?: number) =>
  useQuery({
    queryKey: ["new-buildings", newBuildingId, "units", unitId, "photos"],
    queryFn: async () => {
      const { data } = await axios.get<UnitPhoto[]>(
        `/new-buildings/${newBuildingId}/units/${unitId}/photos`
      );
      return data;
    },
    enabled: !!newBuildingId && !!unitId,
    staleTime: 5 * 60 * 1000,
  });

export const useUploadUnitPhoto = (newBuildingId: number, unitId: number) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("photo", file);
      const { data } = await axios.post<UnitPhoto>(
        `/new-buildings/${newBuildingId}/units/${unitId}/photos`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ["new-buildings", newBuildingId, "units", unitId, "photos"],
      });
      qc.invalidateQueries({
        queryKey: ["new-buildings", newBuildingId, "units", unitId],
      });
    },
  });
};

export const useDeleteUnitPhoto = (newBuildingId: number, unitId: number) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (photoId: number) => {
      await axios.delete(
        `/new-buildings/${newBuildingId}/units/${unitId}/photos/${photoId}`
      );
      return true;
    },
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ["new-buildings", newBuildingId, "units", unitId, "photos"],
      });
      qc.invalidateQueries({
        queryKey: ["new-buildings", newBuildingId, "units", unitId],
      });
    },
  });
};

export const useReorderUnitPhotos = (newBuildingId: number, unitId: number) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (photoIds: number[]) => {
      await axios.put(
        `/new-buildings/${newBuildingId}/units/${unitId}/photos/reorder`,
        { photo_order: photoIds }
      );
      return true;
    },
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ["new-buildings", newBuildingId, "units", unitId, "photos"],
      });
    },
  });
};

export const useSetUnitPhotoCover = (newBuildingId: number, unitId: number) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (photoId: number) => {
      await axios.post(
        `/new-buildings/${newBuildingId}/units/${unitId}/photos/${photoId}/cover`
      );
      return true;
    },
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ["new-buildings", newBuildingId, "units", unitId, "photos"],
      });
      qc.invalidateQueries({
        queryKey: ["new-buildings", newBuildingId, "units", unitId],
      });
    },
  });
};

// New Building Photos Management
export const useUploadNewBuildingPhoto = (newBuildingId: number) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      const { data } = await axios.post<NewBuildingPhoto>(
        `/new-buildings/${newBuildingId}/photos`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ["new-buildings", newBuildingId, "photos"],
      });
      qc.invalidateQueries({ queryKey: ["new-buildings", newBuildingId] });
    },
  });
};

export const useDeleteNewBuildingPhoto = (newBuildingId: number) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (photoId: number) => {
      await axios.delete(`/new-buildings/${newBuildingId}/photos/${photoId}`);
      return true;
    },
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ["new-buildings", newBuildingId, "photos"],
      });
      qc.invalidateQueries({ queryKey: ["new-buildings", newBuildingId] });
    },
  });
};

export const useReorderNewBuildingPhotos = (newBuildingId: number) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (orders: { id: number; sort_order: number }[]) => {
      await axios.put(`/new-buildings/${newBuildingId}/photos/reorder`, {
        orders: [...orders],
      });
      return true;
    },
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ["new-buildings", newBuildingId, "photos"],
      });
    },
  });
};

export const useSetNewBuildingPhotoCover = (newBuildingId: number) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (photoId: number) => {
      await axios.post(
        `/new-buildings/${newBuildingId}/photos/${photoId}/cover`
      );
      return true;
    },
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ["new-buildings", newBuildingId, "photos"],
      });
      qc.invalidateQueries({ queryKey: ["new-buildings", newBuildingId] });
    },
  });
};
