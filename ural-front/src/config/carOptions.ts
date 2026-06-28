import type { CarPhotoAnalysisStatus } from "../types/domain";

type CarOption = {
  value: string;
  label: string;
};

export const carTypeOptions: CarOption[] = [
  { value: "PASSENGER", label: "Легковой автомобиль" },
  { value: "CARGO_TRUCK", label: "Грузовой автомобиль" },
];

const carTypeLabelByValue = new Map(carTypeOptions.map((option) => [option.value, option.label]));
const carTypeValueByLabel = new Map(carTypeOptions.map((option) => [option.label, option.value]));

export function getCarTypeLabel(value: string) {
  return carTypeLabelByValue.get(value) ?? value;
}

export function getCarTypeValue(value: string) {
  return carTypeValueByLabel.get(value) ?? value;
}

export function formatCarType(value: string | null | undefined) {
  if (!value) return "—";
  return getCarTypeLabel(value);
}

const photoAnalysisStatusLabels: Record<CarPhotoAnalysisStatus, string> = {
  EXCELLENT: "Отличное",
  GOOD: "Хорошее",
  NEEDS_REPAIR: "Нужен ремонт",
  CRITICAL: "Критическое",
  UNKNOWN: "Не определено",
};

const photoAnalysisStatusColors: Record<CarPhotoAnalysisStatus, string> = {
  EXCELLENT: "green",
  GOOD: "blue",
  NEEDS_REPAIR: "orange",
  CRITICAL: "red",
  UNKNOWN: "default",
};

export function formatPhotoAnalysisStatus(
  value: CarPhotoAnalysisStatus | null | undefined
) {
  if (!value) return "—";
  return photoAnalysisStatusLabels[value] ?? value;
}

export function getPhotoAnalysisStatusColor(
  value: CarPhotoAnalysisStatus | null | undefined
) {
  if (!value) return "default";
  return photoAnalysisStatusColors[value] ?? "default";
}
