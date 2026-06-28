import type { RecommendedCarDto, RecommendedCargoDto } from "../types/domain";
import { api } from "./client";

export async function getRecommendedCars(cargoId: number): Promise<RecommendedCarDto[]> {
  const res = await api.get<RecommendedCarDto[]>(
    `/ai/recommendations/cargo/${cargoId}/cars`
  );
  return res.data;
}

export async function getRecommendedCargo(carId: number): Promise<RecommendedCargoDto[]> {
  const res = await api.get<RecommendedCargoDto[]>(
    `/ai/recommendations/cars/${carId}/cargo`
  );
  return res.data;
}
