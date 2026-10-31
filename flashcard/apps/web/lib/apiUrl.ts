export function getApiUrl(): string {
  const raw = process.env.NEXT_PUBLIC_API_URL;
  if (!raw) return "";
  const trimmed = raw.replace(/\/+$/, "");
  return trimmed.endsWith("/api/v1") ? trimmed : `${trimmed}/api/v1`;
}
