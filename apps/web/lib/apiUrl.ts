/**
 * Chuẩn hóa URL backend API: Đảm bảo luôn kết thúc bằng /api/v1
 * Bất kể NEXT_PUBLIC_API_URL trên Vercel có kèm /api/v1 hay không.
 */
export function getApiUrl(): string {
  const raw = process.env.NEXT_PUBLIC_API_URL || "https://flashcard-api-svav.onrender.com/api/v1";
  const trimmed = raw.replace(/\/+$/, "");
  return trimmed.endsWith("/api/v1") ? trimmed : `${trimmed}/api/v1`;
}
