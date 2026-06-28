/** Соответствует бэкенду PaginatedParamsDto (query). */
export interface PaginatedQueryParams {
  currentPageNumber: number;
  itemsOnPage: number;
  sorting?: string;
  sortingValue?: string;
  filters?: Record<string, string>;
}
