/**
 * Error Handling Utility for Huy Tutor Shop
 * Quy chuẩn hiển thị lỗi:
 * - Route Quản trị viên (/admin): Hiển thị đầy đủ, chi tiết lỗi kỹ thuật để Admin dễ dàng kiểm tra và khắc phục.
 * - Tất cả route còn lại (Người dùng, Khách hàng, Subadmin trên các trang mua hàng/tài khoản):
 *   Hiển thị dạng chung chung, an toàn, không để lộ chi tiết kỹ thuật hệ thống.
 */

export function getClientErrorMessage(
  rawError: any,
  fallbackOrIsAdmin: string | boolean = 'Đã có lỗi xảy ra trong quá trình xử lý, vui lòng thử lại sau hoặc liên hệ hỗ trợ.',
  isAdminRouteParam?: boolean
): string {
  let fallbackMessage = 'Đã có lỗi xảy ra trong quá trình xử lý, vui lòng thử lại sau hoặc liên hệ hỗ trợ.';
  let isAdminRoute =
    typeof window !== 'undefined' && window.location.pathname.startsWith('/admin');

  if (typeof fallbackOrIsAdmin === 'boolean') {
    isAdminRoute = fallbackOrIsAdmin;
  } else if (typeof fallbackOrIsAdmin === 'string') {
    fallbackMessage = fallbackOrIsAdmin;
    if (typeof isAdminRouteParam === 'boolean') {
      isAdminRoute = isAdminRouteParam;
    }
  }

  const rawMsg = String(
    rawError?.response?.data?.error ||
    rawError?.response?.data?.message ||
    rawError?.message ||
    (typeof rawError === 'string' ? rawError : '')
  ).trim();

  // 1. Nếu đang ở trên Route Admin: Luôn trả về đầy đủ chi tiết lỗi kỹ thuật
  if (isAdminRoute) {
    if (rawMsg) return rawMsg;
    if (typeof rawError === 'object') {
      try {
        return JSON.stringify(rawError);
      } catch {
        return fallbackMessage;
      }
    }
    return fallbackMessage;
  }

  // 2. Nếu ở ngoài Route Admin (Người dùng bình thường, khách mua hàng, subadmin ở giao diện shop):
  // Lọc bỏ toàn bộ lỗi kỹ thuật (Database, SQL, Supabase, PGRST, Server 500, UUID, Token, Internal...)
  const isTechnicalError =
    /supabase|pgrst|postgres|database|syntax|column|relation|table|uuid|stack|jwt|token|bearer|crypto|sha3|sha256|500|502|503|504|econnrefused|failed to fetch|networkerror|internal server/i.test(
      rawMsg
    );

  if (isTechnicalError || !rawMsg) {
    return fallbackMessage;
  }

  // Chỉ cho phép các câu thông báo xác thực người dùng chuẩn (Validation):
  const isSafeUserPrompt =
    rawMsg.startsWith('Vui lòng') ||
    rawMsg.startsWith('Quy tắc') ||
    rawMsg.startsWith('⚠️') ||
    rawMsg.includes('không khớp') ||
    rawMsg.includes('không chính xác') ||
    rawMsg.includes('đã được sử dụng') ||
    rawMsg.includes('chỉ được phép') ||
    rawMsg.includes('Tủ sách cá nhân');

  if (isSafeUserPrompt) {
    return rawMsg;
  }

  return fallbackMessage;
}
