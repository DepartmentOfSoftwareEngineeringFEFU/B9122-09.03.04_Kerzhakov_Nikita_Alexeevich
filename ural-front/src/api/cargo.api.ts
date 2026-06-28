import type { CargoDto, CreateCargoPayload, PaginatedResponse } from "../types/domain";
import type { PaginatedQueryParams } from "../types/pagination";
import { api } from "./client";
import { buildPaginationQueryParams } from "./paginationQuery";

export async function getCargoPage(
  query: PaginatedQueryParams
): Promise<PaginatedResponse<CargoDto>> {
  const res = await api.get<PaginatedResponse<CargoDto>>("/cargo", {
    params: buildPaginationQueryParams(query),
  });
  return res.data;
}

export async function getCargoById(id: number): Promise<CargoDto> {
  const res = await api.get<CargoDto>(`/cargo/${id}`);
  return res.data;
}

export type DictionaryItemDto = {
  code: string;
  label: string;
};

export type CargoDictionariesDto = {
  bodyTypes: DictionaryItemDto[];
  loadingTypes: DictionaryItemDto[];
  unloadingTypes: DictionaryItemDto[];
};

export async function getCargoDictionaries(): Promise<CargoDictionariesDto> {
  const res = await api.get<CargoDictionariesDto>("/cargo/dictionaries");
  return res.data;
}

export async function createCargo(payload: CreateCargoPayload): Promise<CargoDto> {
  const res = await api.post<CargoDto>("/cargo", payload);
  return res.data;
}

export async function updateCargo(id: number, payload: CreateCargoPayload): Promise<CargoDto> {
  const res = await api.put<CargoDto>(`/cargo/${id}`, payload);
  return res.data;
}

export async function deleteCargo(id: number): Promise<void> {
  await api.delete(`/cargo/${id}`);
}
