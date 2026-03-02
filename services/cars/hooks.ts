import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { getCarById, getCars } from "./api";
import type { CarsFilters } from "./types";

export const useGetCarsQuery = (params?: CarsFilters) =>
  useQuery({
    queryKey: ["cars", params],
    queryFn: () => getCars(params),
  });

export const useGetCarByIdQuery = (
  id: string | number,
  source: "local" | "aura" = "local"
) =>
  useQuery({
    queryKey: ["cars", "detail", id, source],
    queryFn: () => getCarById(id, source),
    enabled: Boolean(id),
  });

export const useGetCarsInfiniteQuery = (params?: Omit<CarsFilters, "page">) =>
  useInfiniteQuery({
    queryKey: ["cars", "infinite", params],
    initialPageParam: 1,
    queryFn: ({ pageParam }) => getCars({ ...params, page: Number(pageParam) }),
    getNextPageParam: (lastPage) => {
      const currentPage = lastPage.current_page ?? 1;
      const lastPageNumber = lastPage.last_page;

      if (lastPageNumber) {
        return currentPage < lastPageNumber ? currentPage + 1 : undefined;
      }

      const pageSize = Number(params?.per_page ?? 0);
      if (pageSize > 0) {
        return lastPage.data.length >= pageSize ? currentPage + 1 : undefined;
      }

      return undefined;
    },
  });
