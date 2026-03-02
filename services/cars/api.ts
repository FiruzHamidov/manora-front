import { axios } from "@/utils/axios";
import type { Car, CarsFilters, CarsResponse } from "./types";

export const getCars = async (params?: CarsFilters): Promise<CarsResponse> => {
  const { data } = await axios.get<CarsResponse>("/cars", { params });
  return data;
};

export const getCarById = async (
  id: string | number,
  source: "local" | "aura" = "local"
): Promise<Car> => {
  try {
    const { data } = await axios.get<Car>(`/cars/${id}`, {
      params: { source },
    });
    return data;
  } catch (primaryError) {
    const fallback = await axios.get<CarsResponse>("/cars", {
      params: { search: id, per_page: 50, source },
    });
    const exactMatch = fallback.data.data.find(
      (car) => String(car.id) === String(id)
    );

    if (exactMatch) {
      return exactMatch;
    }

    throw primaryError;
  }
};
