import { axios, getAuthToken } from "@/utils/axios";
import { PROPERTY_ENDPOINTS } from "./constants";
import {
  ListingsStatsResponse,
  MapBounds,
  MapResponse,
  PropertiesResponse,
  Property,
  PropertyFilters,
} from "./types";
import { refreshListingPublication } from "@/services/publication-refresh/api";

type FeedResponse<T> = {
  items?: T[];
  next_cursor?: string | null;
  limit?: number;
  meta?: PropertiesResponse['meta'];
};

const toPaginatedFromFeed = (
  payload: PropertiesResponse | FeedResponse<Property>,
  page: number = 1,
  perPage: number = 10
): PropertiesResponse => {
  if (Array.isArray((payload as PropertiesResponse)?.data)) {
    return payload as PropertiesResponse;
  }

  const items = Array.isArray((payload as FeedResponse<Property>)?.items)
    ? (payload as FeedResponse<Property>).items!
    : [];
  const nextCursor = (payload as FeedResponse<Property>)?.next_cursor ?? null;
  const safePerPage = Number((payload as FeedResponse<Property>)?.limit || perPage);

  return {
    current_page: page,
    data: items,
    first_page_url: "",
    from: items.length ? 1 : 0,
    last_page: nextCursor ? page + 1 : page,
    last_page_url: "",
    links: [],
    next_page_url: nextCursor ? `cursor:${nextCursor}` : null,
    path: "",
    per_page: safePerPage,
    prev_page_url: null,
    to: items.length,
    total: items.length,
    meta: (payload as FeedResponse<Property>).meta,
  };
};

// Public federated endpoints accept only canonical location codes.
const getSelectedLocationCode = (): string => {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("selectedLocationCode") ?? "";
};

export const getProperties = async (
  filters?: PropertyFilters,
  withAuth: boolean = false
): Promise<PropertiesResponse> => {
  let url: string = PROPERTY_ENDPOINTS.FEED_PROPERTIES;

  const queryParams = new URLSearchParams();

  const selectedLocationCode = getSelectedLocationCode();
  if (selectedLocationCode !== "") {
    queryParams.append("location_codes", selectedLocationCode);
  }

  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== "") {
        queryParams.append(key, String(value));
      }
    });
  }

  if (queryParams.toString()) {
    url = `${url}?${queryParams.toString()}`;
  }

  const { data } = await axios.get<PropertiesResponse | FeedResponse<Property>>(url, {
    ...(withAuth && {
      headers: {
        Authorization: `Bearer ${getAuthToken()}`,
      },
    }),
  });
  return toPaginatedFromFeed(data, 1);
};

export const getPropertiesInfinite = async ({
  pageParam,
  filters,
  withAuth = false,
}: {
  pageParam?: string | null;
  filters?: PropertyFilters;
  withAuth?: boolean;
}): Promise<PropertiesResponse> => {
  let url: string = PROPERTY_ENDPOINTS.FEED_PROPERTIES;

  const queryParams = new URLSearchParams();
  queryParams.append("limit", "10");
  if (pageParam) {
    queryParams.append("cursor", pageParam);
  }

  const selectedLocationCode = getSelectedLocationCode();
  if (selectedLocationCode !== "") {
    queryParams.append("location_codes", selectedLocationCode);
  }

  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== "" && key !== "page") {
        queryParams.append(key, String(value));
      }
    });
  }

  url = `${url}?${queryParams.toString()}`;

  const { data } = await axios.get<PropertiesResponse | FeedResponse<Property>>(url, {
    ...(withAuth && {
      headers: {
        Authorization: `Bearer ${getAuthToken()}`,
      },
    }),
  });
  return toPaginatedFromFeed(data, 1, 10);
};

export const getMyProperties = async (
  filters?: PropertyFilters,
  withAuth: boolean = false
): Promise<PropertiesResponse> => {
  let url: string = PROPERTY_ENDPOINTS.MY_PROPERTIES;

  if (filters) {
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== "") {
        queryParams.append(key, String(value));
      }
    });

    if (queryParams.toString()) {
      url = `${url}?${queryParams.toString()}`;
    }
  }

  const { data } = await axios.get<PropertiesResponse>(url, {
    ...(withAuth && {
      headers: {
        Authorization: `Bearer ${getAuthToken()}`,
      },
    }),
  });
  return data;
};

export const getMyPropertiesInfinite = async ({
  pageParam = 1,
  filters,
  withAuth = false,
}: {
  pageParam: number;
  filters?: PropertyFilters;
  withAuth?: boolean;
}): Promise<PropertiesResponse> => {
  let url: string = PROPERTY_ENDPOINTS.MY_PROPERTIES;

  const queryParams = new URLSearchParams();
  queryParams.append("page", String(pageParam));
  queryParams.append("per_page", "10");

  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== "" && key !== "page") {
        queryParams.append(key, String(value));
      }
    });
  }

  url = `${url}?${queryParams.toString()}`;

  const { data } = await axios.get<PropertiesResponse>(url, {
    ...(withAuth && {
      headers: {
        Authorization: `Bearer ${getAuthToken()}`,
      },
    }),
  });
  return data;
};

export const getPropertyById = async (
  id: string,
  withAuth: boolean = false,
  source: "local" | "aura" = "local"
): Promise<Property> => {
  const headers = withAuth
    ? {
        Authorization: `Bearer ${getAuthToken()}`,
      }
    : undefined;

  if (withAuth && source === "local") {
    const { data } = await axios.get<Property>(`${PROPERTY_ENDPOINTS.PROPERTIES}/${id}`, { headers });
    return data;
  }

  const { data } = await axios.get<Property>(`${PROPERTY_ENDPOINTS.FEED_PROPERTY_DETAIL}/${source}/${id}`, {
    headers,
  });
  return data;
};

export const refreshPropertyPublication = async (
  id: string | number
): Promise<Property> =>
  refreshListingPublication<Property>({ id, kind: "property" });

export const getPropertiesMapData = async (
  bounds: MapBounds,
  zoom: number,
  filters?: PropertyFilters,
  withAuth: boolean = false
): Promise<MapResponse> => {
  const bbox = `${bounds.south},${bounds.west},${bounds.north},${bounds.east}`;

  const queryParams = new URLSearchParams();
  queryParams.append("bbox", bbox);
  queryParams.append("zoom", zoom.toString());

  const selectedLocationCode = getSelectedLocationCode();
  if (selectedLocationCode !== "") {
    queryParams.append("location_codes", selectedLocationCode);
  }

  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        queryParams.append(key, String(value));
      }
    });
  }

  const { data } = await axios.get<MapResponse>(
    `${PROPERTY_ENDPOINTS.FEED_PROPERTIES}/map?${queryParams.toString()}`,
    {
      ...(withAuth && {
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
        },
      }),
    }
  );

  return data;
};

export const getPropertiesStats = async (
  filters?: PropertyFilters
): Promise<ListingsStatsResponse> => {
  let url = `${PROPERTY_ENDPOINTS.FEED_PROPERTIES}/stats`;
  const queryParams = new URLSearchParams();

  const selectedLocationCode = getSelectedLocationCode();
  if (selectedLocationCode !== "") {
    queryParams.append("location_codes", selectedLocationCode);
  }

  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (
        value !== undefined &&
        value !== null &&
        value !== "" &&
        key !== "page" &&
        key !== "per_page" &&
        key !== "roomsFrom" &&
        key !== "roomsTo"
      ) {
        queryParams.append(key, String(value));
      }
    });
  }

  if (queryParams.toString()) {
    url = `${url}?${queryParams.toString()}`;
  }

  const { data } = await axios.get<ListingsStatsResponse>(url, {
    headers: { Accept: "application/json" },
  });

  return data;
};
