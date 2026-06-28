import type { UserDto, UserRequest } from "../types/domain";
import { api } from "./client";

export async function getUserByUuid(uuid: string): Promise<UserDto> {
  const res = await api.get<UserDto>(`/users/${encodeURIComponent(uuid)}`);
  return res.data;
}

export async function updateUser(
  uuid: string,
  payload: UserRequest
): Promise<UserDto> {
  const res = await api.put<UserDto>(`/users/${encodeURIComponent(uuid)}`, payload);
  return res.data;
}
