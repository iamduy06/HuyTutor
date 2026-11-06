/**
 * Central Error Handler & Sanitization Utility for SSO Web Client
 * Strict compliance with GEMINI.md Rule 4 (Error Sanitization).
 *
 * All client-facing authentication errors must be friendly and generic when
 * internal database, SQL, Supabase, or backend system details are detected.
 */

export const DEFAULT_FRIENDLY_ERROR =
  'Đã có lỗi xảy ra trong quá trình xử lý, vui lòng thử lại sau hoặc liên hệ hỗ trợ.';

/**
 * Sanitizes raw error responses or messages from SSO API / Supabase.
 * If technical keywords are detected, masks them with a standard friendly message.
 */
export function sanitizeAuthError(
  rawError: any,
  fallbackMessage: string = DEFAULT_FRIENDLY_ERROR
): string {
  const rawMsg = String(
    rawError?.response?.data?.error?.message ||
    rawError?.response?.data?.error ||
    rawError?.response?.data?.message ||
    rawError?.error?.message ||
    rawError?.error ||
    rawError?.message ||
    (typeof rawError === 'string' ? rawError : '')
  ).trim();

  if (!rawMsg) {
    return fallbackMessage;
  }

  // Detect technical errors (Database, Postgres, SQL, Supabase, internal system errors)
  const isTechnicalError =
    /supabase|pgrst|postgres|cơ sở dữ liệu|database|syntax|column|relation|table|uuid|stack trace|token expired|jwt|bearer|crypto|500|502|503|504|internal server|database_error|foreign key|unique constraint/i.test(
      rawMsg
    );

  if (isTechnicalError) {
    return fallbackMessage;
  }

  return rawMsg;
}
