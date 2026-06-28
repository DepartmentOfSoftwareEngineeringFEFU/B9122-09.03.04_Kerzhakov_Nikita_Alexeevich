import { api } from "./client";
import type { AvatarResponse, AvatarUploadMetadata } from "../types/domain";

export type FileType = "IMAGE" | "DOCUMENT";

export interface FileDto {
  id: number;
  name: string;
  extension: string;
  url: string;
}

export async function uploadFiles(args: {
  files: File[];
  types: FileType[];
}): Promise<FileDto[]> {
  const form = new FormData();

  args.files.forEach((f) => form.append("files", f));
  args.types.forEach((t) => form.append("types", t));

  const res = await api.post<FileDto[]>("/files", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}

export async function getFiles(ids: number[]): Promise<FileDto[]> {
  if (ids.length === 0) return [];
  const unique = Array.from(new Set(ids));
  const query = unique.map((id) => `ids=${encodeURIComponent(id)}`).join("&");
  const res = await api.get<FileDto[]>(`/files?${query}`);
  return res.data;
}

export async function uploadAvatar(args: {
  file: File;
  metadata: AvatarUploadMetadata;
}): Promise<AvatarResponse> {
  const form = new FormData();
  form.append("file", args.file);
  form.append(
    "metadata",
    new Blob([JSON.stringify(args.metadata)], { type: "application/json" })
  );

  const res = await api.post<AvatarResponse>("/files/avatar", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}
