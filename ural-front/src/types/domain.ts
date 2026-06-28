/** Ответ пагинированного списка (Spring / типичный REST). */
export interface PaginatedResponse<T> {
  currentPageNumber: number;
  totalPageCount: number;
  totalResultCount: number;
  items: T[];
  itemsOnPage: number;
}

export interface ContractDto {
  id: number;
  carId?: number;
  cargoId?: number;
  car?: CarDto;
  cargo?: CargoDto;
  status?: string;
  price: number;
  priceRequestedByUuid?: string;
  priceUpdatedAt?: string;
  ownerUuid?: string;
  relatedUserUuid?: string;
  createdAt?: string;
  updatedAt?: string;
  route?: RouteDto | null;
}

export interface RoutePointDto {
  latitude?: number | null;
  longitude?: number | null;
}

export interface RouteDto {
  id: number;
  contractId: number;
  points?: RoutePointDto[] | null;
  distanceMeters?: number | null;
  timeMs?: number | null;
  createdAt?: string;
  updatedAt?: string | null;
}

export interface NotificationContractDto {
  id: number;
  title: string;
  body: string;
  userUuids: string[];
  contractId?: number | null;
  isRead: boolean;
}

export interface CreateContractPayload {
  carId: number;
  cargoId: number;
  price: number;
}

export interface ContractPriceOfferRequest {
  price: number;
}

export interface ContractRatingRequest {
  rating: number;
}

export interface ContractRatingDto {
  id: number;
  contractId: number;
  raterUserUuid: string;
  ratedUserUuid: string;
  rating: number;
  createdAt?: string;
  updatedAt?: string | null;
}

export interface UserCompletedContractsDto {
  userUuid: string;
  completedContractsCount: number;
  contracts: ContractDto[];
}

export interface RecommendedCarDto {
  car: CarDto;
  score: number;
  reasons: string[];
}

export interface RecommendedCargoDto {
  cargo: CargoDto;
  score: number;
  reasons: string[];
}

export type CarPhotoAnalysisStatus =
  | "EXCELLENT"
  | "GOOD"
  | "NEEDS_REPAIR"
  | "CRITICAL"
  | "UNKNOWN";

export interface CarDto {
  id: string;
  carType: string;
  carName: string;
  carModel: string;
  bodyType?: string[] | null;
  loadingType?: string[] | null;
  loadCapacity?: number | null;
  departurePlace?: AddressDto | null;
  destinationPlace?: AddressDto | null;
  yearProduction: number;
  userUuid: string;
  createdAt: string;
  updatedAt: string;
  vinNumber: string;
  fileIds?: number[] | null;
  photoAnalysisSummary?: string | null;
  photoAnalysisStatus?: CarPhotoAnalysisStatus | null;
  gibddInfo?: GibddInfoDto | null;
}

export interface GibddInfoDto {
  ownersCount?: number | null;
  accidentsCount?: number | null;
  hasRegistrationRestrictions?: boolean | null;
  wanted?: boolean | null;
  pledged?: boolean | null;
  lastCheckAt?: string | null;
  rawResponse?: Record<string, unknown> | null;
}

/** Поля для POST /cars (без id, пользователя и меток времени). */
export interface CreateCarPayload {
  carType: string;
  carName: string;
  carModel: string;
  bodyType: string[];
  loadingType: string[];
  loadCapacity?: number | null;
  departurePlace?: AddressDto | null;
  destinationPlace?: AddressDto | null;
  yearProduction: number;
  vinNumber: string;
  fileIds?: number[] | null;
}

export interface AddressDto {
  id?: string;
  country?: string;
  region?: string;
  city?: string;
  street?: string;
  house?: string;
  building?: string;
  apartment?: string;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
}

export interface CargoDto {
  id: number;
  userUuid: string;
  name: string;
  bodyTypes: string[];
  loadingTypes: string[];
  unloadingTypes: string[];
  length: number;
  width: number;
  height: number;
  weight: number;
  loadingPlace: AddressDto;
  unloadingPlace: AddressDto;
  price: number;
  comment?: string;
  createdAt: string;
  updatedAt: string;
  fileIds?: number[] | null;
}

export interface CreateCargoPayload {
  name: string;
  bodyTypes: string[];
  loadingTypes: string[];
  unloadingTypes: string[];
  length: number;
  width: number;
  height: number;
  weight: number;
  loadingPlace: AddressDto;
  unloadingPlace: AddressDto;
  price: number;
  comment?: string;
  fileIds?: number[];
}

export interface AvatarRequest {
  photoId?: number;
  photoThumbnailId?: number;
  cropX?: number;
  cropY?: number;
  cropSize?: number;
}

export interface AvatarDto {
  id: number;
  photoId?: number;
  photoThumbnailId?: number;
  cropX?: number;
  cropY?: number;
  cropSize?: number;
}

export interface AvatarUploadMetadata {
  cropX: number;
  cropY: number;
  cropSize: number;
}

export interface AvatarResponse {
  photoId: number;
  photoThumbnailId: number;
  cropX: number;
  cropY: number;
  cropSize: number;
}

export interface UserDto {
  uuid: string;
  email: string;
  firstName: string;
  lastName: string;
  patronymic?: string;
  phoneNumber?: string;
  avatar?: AvatarDto | null;
  averageRating?: number;
  ratingsCount?: number;
}

export interface UserRequest {
  email: string;
  firstName: string;
  lastName: string;
  patronymic?: string;
  phoneNumber?: string;
  avatar?: AvatarRequest | null;
}
