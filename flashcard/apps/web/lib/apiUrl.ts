export function getApiUrl(): string {
  if (typeof window !== "undefined") {
    return "/api/v1";
  }
  const raw = process.env.API_URL;
  if (!raw) return "";
  const trimmed = raw.replace(/\/+$/, "");
  return trimmed.endsWith("/api/v1") ? trimmed : `${trimmed}/api/v1`;
}
