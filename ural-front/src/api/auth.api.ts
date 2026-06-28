import { AuthDto, RegisterPayload } from "../types/auth";
import { api } from "./client";

export const login = async (data: {
  login: string;
  password: string;
}): Promise<AuthDto> => {
  const res = await api.post("/auth/login", data);
  return res.data as AuthDto;
};

export const register = async (data: RegisterPayload): Promise<AuthDto> => {
  const res = await api.post("/users/registration", data);
  return res.data as AuthDto;
};

export const logout = async () => {
  await api.post("/auth/logout");
};