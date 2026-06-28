import type { AddressDto, CreateCargoPayload } from "../../types/domain";

export function normalizeAddress(address: AddressDto | undefined): AddressDto {
  if (!address) return {};

  const { building, ...rest } = address;
  return {
    ...rest,
    house: address.house ?? building,
  };
}

export function normalizeCargoPayload(values: CreateCargoPayload): CreateCargoPayload {
  return {
    ...values,
    loadingPlace: normalizeAddress(values.loadingPlace),
    unloadingPlace: normalizeAddress(values.unloadingPlace),
  };
}
