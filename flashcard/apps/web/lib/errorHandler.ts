/**
 * Error Sanitization Utility for Flashcard Web
 * Compliance: GEMINI.md Section 4 (Error Sanitization)
 *
 * - Route Quản trị viên (/admin): Hiển thị đầy đủ, chi tiết lỗi kỹ thuật để Admin dễ dàng kiểm tra và khắc phục.
 * - Tất cả route còn lại (Người dùng, Khách hàng, Subadmin):
 *   Hiển thị dạng thông báo chung chung, lịch sự, an toàn; lọc bỏ toàn bộ chi tiết kỹ thuật hệ thống
 *   (stack trace, Supabase, Postgres, SQL, PGRST, token, internal server errors).
 */

export function parseApiErrorMessage(
  data: any,
  fallback = "Đã có lỗi xảy ra trong quá trình xử lý, vui lòng thử lại sau hoặc liên hệ hỗ trợ."
): string {
  if (!data) return fallback;
  if (typeof data === "string") {
    const trimmed = data.trim();
    return trimmed && trimmed !== "[object Object]" ? trimmed : fallback;
  }
  if (typeof data.error === "string" && data.error !== "[object Object]") {
    return data.error;
  }
  if (data.error && typeof data.error === "object") {
    if (typeof data.error.message === "string" && data.error.message) {
      if (Array.isArray(data.error.details) && data.error.details.length > 0) {
        const detailsStr = data.error.details
          .map((d: any) => d.message || (d.path ? `${d.path.join(".")}: ${d.message}` : JSON.stringify(d)))
          .join("; ");
        return `${data.error.message} (${detailsStr})`;
      }
      return data.error.message;
    }
  }
  if (typeof data.message === "string" && data.message && data.message !== "[object Object]") {
    return data.message;
  }
  return fallback;
}

export function getClientErrorMessage(
  rawError: any,
  fallbackOrIsAdmin: string | boolean = "Đã có lỗi xảy ra trong quá trình xử lý, vui lòng thử lại sau hoặc liên hệ hỗ trợ.",
  isAdminRouteParam?: boolean
): string {
  let fallbackMessage = "Đã có lỗi xảy ra trong quá trình xử lý, vui lòng thử lại sau hoặc liên hệ hỗ trợ.";
  let isAdminRoute =
    typeof window !== "undefined" && window.location.pathname.startsWith("/admin");

  if (typeof fallbackOrIsAdmin === "boolean") {
    isAdminRoute = fallbackOrIsAdmin;
  } else if (typeof fallbackOrIsAdmin === "string") {
    fallbackMessage = fallbackOrIsAdmin;
    if (typeof isAdminRouteParam === "boolean") {
      isAdminRoute = isAdminRouteParam;
    }
  }

  let rawMsg = "";
  if (typeof rawError === "string") {
    rawMsg = rawError;
  } else if (rawError && typeof rawError === "object") {
    rawMsg =
      parseApiErrorMessage(rawError?.response?.data, "") ||
      parseApiErrorMessage(rawError, "") ||
      (rawError.message && rawError.message !== "[object Object]" ? rawError.message : "");
  }
  rawMsg = String(rawMsg).trim();
  if (rawMsg === "[object Object]") {
    rawMsg = "";
  }

  // 1. Tuyến đường Admin (/admin): Cho phép hiển thị đầy đủ chi tiết lỗi kỹ thuật phục vụ debug
  if (isAdminRoute) {
    if (rawMsg) return rawMsg;
    if (typeof rawError === "object" && rawError !== null) {
      try {
        const jsonStr = JSON.stringify(rawError);
        if (jsonStr && jsonStr !== "{}" && jsonStr !== "[]") return jsonStr;
      } catch {
        return fallbackMessage;
      }
    }
    return fallbackMessage;
  }

  // 2. Tuyến đường Client & Subadmin:
  // Lọc bỏ toàn bộ lỗi kỹ thuật (Database, SQL, Supabase, PGRST, Server 500, UUID, Token, Internal...)
  const isTechnicalError =
    /supabase|pgrst|postgres|database|syntax|column|relation|table|uuid|stack|jwt|token|bearer|crypto|sha3|sha256|500|502|503|504|econnrefused|failed to fetch|networkerror|internal server|duplicate|unique|constraint/i.test(
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
    rawMsg.startsWith("Bộ thẻ") ||
    rawMsg.startsWith("⚠️") ||
    rawMsg.includes("không khớp") ||
    rawMsg.includes("không chính xác") ||
    rawMsg.includes("đã được sử dụng") ||
    rawMsg.includes("chỉ được phép") ||
    rawMsg.includes("quyền") ||
    rawMsg.includes("tồn tại") ||
    rawMsg.includes("hết hạn") ||
    rawMsg.includes("giới hạn") ||
    rawMsg.includes("phạm vi") ||
    rawMsg.includes("Bộ thẻ") ||
    rawMsg.toLowerCase().includes("slot");

  if (isSafeUserPrompt) {
    return rawMsg;
  }

  return fallbackMessage;
}
