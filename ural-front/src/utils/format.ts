export function formatDateTime(iso: string | undefined | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatAddress(a: {
  country?: string;
  region?: string;
  city?: string;
  street?: string;
  house?: string;
  building?: string;
  apartment?: string;
  postalCode?: string;
}): string {
  const house = a.house ?? a.building;
  const parts = [
    a.postalCode,
    a.country,
    a.region,
    a.city,
    a.street,
    house && `д. ${house}`,
    a.apartment && `кв. ${a.apartment}`,
  ].filter(Boolean);
  return parts.length ? parts.join(", ") : "—";
}

export function formatRoute(
  loadingPlace: Parameters<typeof formatAddress>[0] | undefined | null,
  unloadingPlace: Parameters<typeof formatAddress>[0] | undefined | null
): string {
  const points = [loadingPlace, unloadingPlace]
    .map((point) => formatAddress(point ?? {}))
    .filter((point) => point !== "—");

  return points.length ? points.join(" → ") : "—";
}

export function formatDecimal(n: number | undefined | null): string {
  if (n === undefined || n === null || Number.isNaN(n)) return "—";
  return String(n);
}

export function calculateCargoVolume(cargo: {
  length?: number | null;
  width?: number | null;
  height?: number | null;
} | undefined | null): number | undefined {
  if (
    cargo?.length === undefined ||
    cargo.length === null ||
    cargo?.width === undefined ||
    cargo.width === null ||
    cargo?.height === undefined ||
    cargo.height === null
  ) {
    return undefined;
  }

  const volume = cargo.length * cargo.width * cargo.height;
  return Number.isFinite(volume) ? volume : undefined;
}

export function formatTonnesFromKg(n: number | undefined | null): string {
  if (n === undefined || n === null || Number.isNaN(n)) return "—";
  return `${formatDecimal(n / 1000)} т`;
}

export function formatKgAndTonnes(n: number | undefined | null): string {
  if (n === undefined || n === null || Number.isNaN(n)) return "—";
  return `${formatDecimal(n)} кг / ${formatDecimal(n / 1000)} т`;
}
