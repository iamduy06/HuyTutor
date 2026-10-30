/**
 * Lấy URL backend API từ biến môi trường bí mật API_URL hoặc NEXT_PUBLIC_API_URL (dự phòng).
 * Chuẩn hóa để đảm bảo luôn kết thúc bằng /api/v1 nếu được cấu hình.
 */
export function getApiUrl(): string {
  const raw = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "";
  if (!raw) return "";
  const trimmed = raw.replace(/\/+$/, "");
  return trimmed.endsWith("/api/v1") ? trimmed : `${trimmed}/api/v1`;
}
