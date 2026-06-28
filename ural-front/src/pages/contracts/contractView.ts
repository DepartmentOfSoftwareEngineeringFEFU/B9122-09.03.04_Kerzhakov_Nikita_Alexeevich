import type { ContractDto } from "../../types/domain";

const statusTextByCode: Record<string, string> = {
  AGREEMENT: "Согласование",
  READY_EXECUTION: "Готов к исполнению",
  PROCESS: "В процессе",
  FINISHED: "Завершён",
  ACTIVE: "Активен",
  COMPLETED: "Завершён",
  CLOSED: "Отклонён",
  CANCELED: "Отменён",
  CANCELLED: "Отменён",
};

export function getContractStatusText(status: string | undefined): string {
  if (!status) return "—";
  return statusTextByCode[status] ?? status;
}

export function isContractAgreementStatus(status: string | undefined): boolean {
  return status === "AGREEMENT" || status === "Согласование" || status === "На согласовании";
}

export function isContractCompletedStatus(status: string | undefined): boolean {
  return status === "FINISHED" || status === "COMPLETED" || status === "Завершён" || status === "Завершен";
}

export function isContractRejectedStatus(status: string | undefined): boolean {
  return (
    status === "CANCELED" ||
    status === "CANCELLED" ||
    status === "CLOSED" ||
    status === "REJECTED" ||
    status === "Отменён" ||
    status === "Отменен" ||
    status === "Отклонён" ||
    status === "Отклонен"
  );
}

export function getContractCarTitle(contract: ContractDto): string {
  if (contract.car) {
    return [contract.car.carName, contract.car.carModel].filter(Boolean).join(" ") || "Транспорт";
  }
  return contract.carId ? `Транспорт #${contract.carId}` : "Транспорт не указан";
}

export function getContractCargoTitle(contract: ContractDto): string {
  if (contract.cargo?.name) return contract.cargo.name;
  return contract.cargoId ? `Груз #${contract.cargoId}` : "Груз не указан";
}
