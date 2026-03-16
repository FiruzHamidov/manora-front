import Axios from "axios";
import type { InternalAxiosRequestConfig, AxiosInstance } from "axios";
import { API_BASE_URL, JSON_HEADERS } from "@/config/api";
import { PUBLIC_API_ROUTES } from "@/constants/routes";
import {
  clearStoredAuth,
  getStoredAuthToken,
} from "@/services/login/storage";

export const axios: AxiosInstance = Axios.create({
  baseURL: API_BASE_URL,
  headers: {
    ...JSON_HEADERS,
  },
});

export const getAuthToken = (): string | null => getStoredAuthToken();

const isPublicRoute = (url: string, method: string = "GET"): boolean => {
  // Catalog resources are public only for GET; mutations require auth.
  if (
    url.includes("/properties") ||
    url.includes("/cars") ||
    url.includes("/new-buildings") ||
    url.includes("/developers")
  ) {
    return method.toLowerCase() === "get";
  }

  // Other routes check against PUBLIC_API_ROUTES
  return PUBLIC_API_ROUTES.some((route) => url.includes(route));
};

axios.interceptors.request.use(
  (
    config: InternalAxiosRequestConfig<unknown>
  ): InternalAxiosRequestConfig<unknown> => {
    const newConfig: InternalAxiosRequestConfig<unknown> = config;
    newConfig.headers = newConfig.headers || {};

    if (
      typeof FormData !== "undefined" &&
      newConfig.data instanceof FormData
    ) {
      delete newConfig.headers["Content-Type"];
    } else if (!newConfig.headers["Content-Type"]) {
      newConfig.headers["Content-Type"] = JSON_HEADERS["Content-Type"];
    }

    if (!newConfig.headers.Accept) {
      newConfig.headers.Accept = JSON_HEADERS.Accept;
    }

    if (!isPublicRoute(config.url || "", config.method || "GET")) {
      const localToken: string | null = getAuthToken();
      if (localToken) {
        newConfig.headers.Authorization = `Bearer ${localToken}`;
      }
    }

    return newConfig;
  }
);

axios.interceptors.response.use(
  (response) => response,
  (error) => {
    // On 401, keep the SPA alive and let the UI react without a full page reload.
    if (error?.response?.status === 401) {
      if (typeof window !== 'undefined') {
        const hasAuthContext =
          Boolean(getAuthToken()) ||
          Boolean(error?.config?.headers?.Authorization);

        if (hasAuthContext) {
          clearStoredAuth();
          window.dispatchEvent(
            new CustomEvent('auth:unauthorized', {
              detail: {
                pathname: window.location.pathname,
                search: window.location.search,
              },
            })
          );
        }
      }
    }

    // Always rethrow the original axios error so callers receive a rejected promise
    return Promise.reject(error);
  }
);
