/**
 * Error Sanitization Utility for Flashcard Web
 * Compliance: GEMINI.md Section 4 (Error Sanitization)
 *
 * - Route Quản trị viên (/admin): Hiển thị đầy đủ, chi tiết lỗi kỹ thuật để Admin dễ dàng kiểm tra và khắc phục.
 * - Tất cả route còn lại (Người dùng, Khách hàng, Subadmin):
 *   Hiển thị dạng thông báo chung chung, lịch sự, an toàn; lọc bỏ toàn bộ chi tiết kỹ thuật hệ thống
 *   (stack trace, Supabase, Postgres, SQL, PGRST, token, internal server errors).
 */

export function getClientErrorMessage(
  rawError: any,
  fallbackMessage = "Đã có lỗi xảy ra trong quá trình xử lý. Vui lòng thử lại sau hoặc liên hệ hỗ trợ."
): string {
  const isAdminRoute =
    typeof window !== "undefined" && window.location.pathname.startsWith("/admin");

  const rawMsg = String(
    rawError?.response?.data?.error?.message ||
    rawError?.response?.data?.error ||
    rawError?.response?.data?.message ||
    rawError?.error?.message ||
    rawError?.error ||
    rawError?.message ||
    (typeof rawError === "string" ? rawError : "")
  ).trim();

  // 1. Tuyến đường Admin (/admin): Cho phép hiển thị đầy đủ chi tiết lỗi kỹ thuật phục vụ debug
  if (isAdminRoute) {
    if (rawMsg) return rawMsg;
    if (typeof rawError === "object" && rawError !== null) {
      try {
        return JSON.stringify(rawError);
      } catch {
        return fallbackMessage;
      }
    }
    return fallbackMessage;
  }

  // 2. Tuyến đường Client & Subadmin:
  // Lọc bỏ toàn bộ lỗi kỹ thuật (Database, SQL, Supabase, PGRST, Server 500, UUID, Token, Internal...)
  const isTechnicalError =
    /supabase|pgrst|postgres|database|syntax|column|relation|table|uuid|stack|jwt|token|bearer|crypto|sha3|sha256|500|502|503|504|econnrefused|failed to fetch|networkerror|internal server/i.test(
      rawMsg
    );

  if (isTechnicalError || !rawMsg) {
    return fallbackMessage;
  }

  // Cho phép các câu thông báo xác thực thân thiện, có ý nghĩa nghiệp vụ (Validation prompts):
  const isSafeUserPrompt =
    rawMsg.startsWith("Vui lòng") ||
    rawMsg.startsWith("Bạn không") ||
    rawMsg.startsWith("Không tìm thấy") ||
    rawMsg.startsWith("Không thể") ||
    rawMsg.startsWith("Người dùng") ||
    rawMsg.startsWith("Quy tắc") ||
    rawMsg.startsWith("⚠️") ||
    rawMsg.includes("không khớp") ||
    rawMsg.includes("không chính xác") ||
    rawMsg.includes("đã được sử dụng") ||
    rawMsg.includes("chỉ được phép") ||
    rawMsg.includes("quyền") ||
    rawMsg.includes("tồn tại") ||
    rawMsg.includes("hết hạn") ||
    rawMsg.includes("giới hạn") ||
    rawMsg.includes("phạm vi");

  if (isSafeUserPrompt) {
    return rawMsg;
  }

  return fallbackMessage;
}
