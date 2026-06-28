import type {
  ContractDto,
  ContractPriceOfferRequest,
  ContractRatingDto,
  ContractRatingRequest,
  CreateContractPayload,
  PaginatedResponse,
  UserCompletedContractsDto,
} from "../types/domain";
import type { PaginatedQueryParams } from "../types/pagination";
import { api } from "./client";
import { buildPaginationQueryParams } from "./paginationQuery";

export async function createContract(
  payload: CreateContractPayload
): Promise<ContractDto> {
  const res = await api.post<ContractDto>("/contracts", payload);
  return res.data;
}

export async function getContractsPage(
  query: PaginatedQueryParams
): Promise<PaginatedResponse<ContractDto>> {
  const res = await api.get<PaginatedResponse<ContractDto>>("/contracts", {
    params: buildPaginationQueryParams(query),
  });
  return res.data;
}

export async function getContractById(id: number): Promise<ContractDto> {
  const res = await api.get<ContractDto>(`/contracts/${id}`);
  return res.data;
}

export async function updateContractStatus(
  id: number,
  options?: { isClose?: boolean }
): Promise<ContractDto> {
  const res = await api.patch<ContractDto>(`/contracts/${id}/status`, null, {
    params: options?.isClose ? { isClose: true } : undefined,
  });
  return res.data;
}

export async function offerContractPrice(
  id: number,
  payload: ContractPriceOfferRequest
): Promise<ContractDto> {
  const res = await api.post<ContractDto>(`/contracts/${id}/price-offer`, payload);
  return res.data;
}

export async function rateContract(
  contractId: number,
  payload: ContractRatingRequest
): Promise<ContractRatingDto> {
  const res = await api.post<ContractRatingDto>(`/contracts/${contractId}/rating`, payload);
  return res.data;
}

export async function getUserCompletedContracts(
  userUuid: string
): Promise<UserCompletedContractsDto> {
  const res = await api.get<UserCompletedContractsDto>(
    `/contracts/users/${encodeURIComponent(userUuid)}/completed`
  );
  return res.data;
}
