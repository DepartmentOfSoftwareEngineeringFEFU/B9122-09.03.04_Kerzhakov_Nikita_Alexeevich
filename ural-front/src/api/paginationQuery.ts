import type { PaginatedQueryParams } from "../types/pagination";

const DEFAULT_SORTING = "id";
const DEFAULT_SORTING_VALUE = "desc";

/**
 * Собирает query-параметры для GET с пагинацией.
 * Фильтры кладутся как `filters[key]=value` — типичная привязка Spring к `Map<String, String>`.
 */
export function buildPaginationQueryParams(
  p: PaginatedQueryParams
): Record<string, string | number> {
  const out: Record<string, string | number> = {
    currentPageNumber: Math.max(1, p.currentPageNumber),
    itemsOnPage: Math.max(1, p.itemsOnPage),
    sorting: p.sorting ?? DEFAULT_SORTING,
    sortingValue: p.sortingValue ?? DEFAULT_SORTING_VALUE,
  };

  const filters = p.filters ?? {};
  for (const [key, value] of Object.entries(filters)) {
    if (value != null && String(value).trim() !== "") {
      out[`filters[${key}]`] = String(value);
    }
  }

  return out;
}
