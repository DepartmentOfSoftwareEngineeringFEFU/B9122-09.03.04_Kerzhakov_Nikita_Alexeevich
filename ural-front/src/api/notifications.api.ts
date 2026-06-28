import type { NotificationContractDto } from "../types/domain";
import { api } from "./client";

export async function getNotifications(): Promise<NotificationContractDto[]> {
  const res = await api.get<NotificationContractDto[]>("/notifications");
  return res.data;
}

export async function markNotificationRead(id: number): Promise<void> {
  await api.patch<null>(`/notifications/${id}`);
}
