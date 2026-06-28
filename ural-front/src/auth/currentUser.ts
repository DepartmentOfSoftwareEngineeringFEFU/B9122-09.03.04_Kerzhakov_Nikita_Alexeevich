import { getAccessToken } from "../api/client";

type JwtClaims = Record<string, unknown>;

function decodeBase64Url(value: string): string {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(
    normalized.length + ((4 - (normalized.length % 4)) % 4),
    "="
  );
  return atob(padded);
}

export function readJwtClaims(token = getAccessToken()): JwtClaims | null {
  if (!token) return null;
  const [, payload] = token.split(".");
  if (!payload) return null;

  try {
    return JSON.parse(decodeBase64Url(payload)) as JwtClaims;
  } catch {
    return null;
  }
}

export function getCurrentUserUuid(): string | null {
  const claims = readJwtClaims();
  if (!claims) return null;

  const candidates = [
    claims.uuid,
    claims.userUuid,
    claims.user_uuid,
    claims.userId,
    claims.sub,
  ];

  const value = candidates.find((x) => typeof x === "string" && x.length > 0);
  return typeof value === "string" ? value : null;
}
