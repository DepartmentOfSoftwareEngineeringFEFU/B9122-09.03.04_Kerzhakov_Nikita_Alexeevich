import type { CarDto, CreateCarPayload, PaginatedResponse } from "../types/domain";
import type { PaginatedQueryParams } from "../types/pagination";
import { api } from "./client";
import { buildPaginationQueryParams } from "./paginationQuery";

export async function getCarsPage(
  query: PaginatedQueryParams
): Promise<PaginatedResponse<CarDto>> {
  const res = await api.get<PaginatedResponse<CarDto>>("/cars", {
    params: buildPaginationQueryParams(query),
  });
  return res.data;
}

export async function getCarById(id: string): Promise<CarDto> {
  const res = await api.get<CarDto>(`/cars/${encodeURIComponent(id)}`);
  return res.data;
}

export type DictionaryItemDto = {
  code: string;
  label: string;
};

export type CarDictionariesDto = {
  bodyTypes: DictionaryItemDto[];
  loadingTypes: DictionaryItemDto[];
};

export async function getCarDictionaries(): Promise<CarDictionariesDto> {
  const res = await api.get<CarDictionariesDto>("/cars/dictionaries");
  return res.data;
}

export async function createCar(payload: CreateCarPayload): Promise<CarDto> {
  const res = await api.post<CarDto>("/cars", payload);
  return res.data;
}

export async function updateCar(id: string, payload: CreateCarPayload): Promise<CarDto> {
  const res = await api.put<CarDto>(`/cars/${encodeURIComponent(id)}`, payload);
  return res.data;
}

export async function retryCarPhotoAnalysis(id: string): Promise<CarDto> {
  const res = await api.post<CarDto>(`/cars/${encodeURIComponent(id)}/photo-analysis/retry`);
  return res.data;
}

export async function deleteCar(id: string): Promise<void> {
  await api.delete(`/cars/${encodeURIComponent(id)}`);
}
