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
 * Consolidated technical error patterns (case-insensitive).
 * Blocks Supabase, PostgreSQL, PostgREST, raw SQL queries, network errors,
 * JavaScript runtime errors, stack traces, security tokens, server 5xx,
 * and "[object Object]" coercion artifacts.
 */
const TECHNICAL_ERROR_REGEX = new RegExp(
  [
    // 1. Supabase, PostgREST & PostgreSQL
    'supabase',
    'pgrst',
    'postgres',
    'cơ sở dữ liệu',
    '\\bdatabase\\b',
    '\\bdatabase_error\\b',
    '\\bsyntax\\b',
    '\\bcolumn\\b',
    '\\brelation\\b',
    '\\btable\\b',
    '\\bschema\\b',
    'foreign key',
    'unique constraint',
    'duplicate key',
    'violates.*constraint',
    'invalid input syntax',
    '\\buuid\\b',
    'result contains.*row',
    'rows? returned',
    'json object requested',

    // 2. Raw SQL Statements
    '\\bselect\\b[\\s\\S]+?\\bfrom\\b',
    '\\binsert\\s+into\\b',
    '\\bupdate\\s+[\\s\\S]+?\\bset\\b',
    '\\bdelete\\s+from\\b',
    '\\bdrop\\s+table\\b',
    '\\balter\\s+table\\b',
    '\\bcreate\\s+table\\b',
    '\\bunion\\s+(?:all\\s+)?select\\b',

    // 3. Network & Infrastructure Leaks
    'econnrefused',
    'econnreset',
    'etimedout',
    'enotfound',
    'ehostunreach',
    'enetunreach',
    'eai_again',
    'getaddrinfo',
    'failed to fetch',
    'networkerror',
    'net::err_',
    '\\b127\\.0\\.0\\.1\\b',
    '\\blocalhost(?:\\:\\d+)?\\b',

    // 4. Runtime Exceptions & Stack Traces
    'typeerror',
    'referenceerror',
    'rangeerror',
    'evalerror',
    'urierror',
    'cannot read propert',
    'is not a function',
    'is not defined',
    'stack trace',
    '\\bat\\s+.+\\:\\d+\\:\\d+',
    'uncaught',

    // 5. Security Tokens & Cryptography
    '\\bjwt\\b',
    '\\bbearer\\b',
    'token expired',
    '\\bcrypto\\b',

    // 6. Server & Gateway Errors
    '\\b500\\b',
    '\\b502\\b',
    '\\b503\\b',
    '\\b504\\b',
    'internal server',
    'bad gateway',
    'service unavailable',
    'gateway timeout',

    // 7. Object Stringification Leak
    '\\[object\\s+object\\]',
  ].join('|'),
  'i'
);

/**
 * Checks whether an error object carries technical metadata (HTTP 5xx status,
 * PostgREST / Postgres error codes, runtime exception names, or technical details).
 */
function hasTechnicalMetadata(errorObj: any): boolean {
  if (!errorObj || typeof errorObj !== 'object') {
    return false;
  }

  // Check HTTP status >= 500
  const status = errorObj?.status ?? errorObj?.statusCode ?? errorObj?.response?.status;
  if (typeof status === 'number' && status >= 500) {
    return true;
  }

  // Check Error class name
  const name = errorObj?.name;
  if (typeof name === 'string' && /typeerror|referenceerror|syntaxerror|rangeerror|evalerror|urierror/i.test(name)) {
    return true;
  }

  // Check error codes (PGRST, Postgres, Network error codes)
  const codeCandidates = [
    errorObj?.code,
    errorObj?.error?.code,
    errorObj?.response?.data?.code,
    errorObj?.response?.data?.error?.code,
  ];

  for (const c of codeCandidates) {
    if (typeof c === 'string' || typeof c === 'number') {
      const codeStr = String(c).trim();
      if (/pgrst|pg|econn|enotfound|etimedout|ehostunreach|enetunreach|eai_again|23505|42[0-9a-z]{3}/i.test(codeStr)) {
        return true;
      }
    }
  }

  // Check details/hint fields
  const detailCandidates = [
    errorObj?.details,
    errorObj?.hint,
    errorObj?.error?.details,
    errorObj?.error?.hint,
    errorObj?.response?.data?.details,
    errorObj?.response?.data?.error?.details,
  ];

  for (const d of detailCandidates) {
    if (typeof d === 'string' && TECHNICAL_ERROR_REGEX.test(d)) {
      return true;
    }
  }

  return false;
}

/**
 * Safely extracts a candidate error message string from rawError.
 * Never coerces non-string objects to strings, completely preventing "[object Object]".
 */
function extractErrorString(rawError: any): string {
  if (typeof rawError === 'string') {
    return rawError.trim();
  }

  if (!rawError || typeof rawError !== 'object') {
    return '';
  }

  const stringCandidates = [
    rawError?.response?.data?.error?.message,
    rawError?.response?.data?.error,
    rawError?.response?.data?.message,
    rawError?.response?.data?.details,
    rawError?.error?.message,
    rawError?.error?.details,
    rawError?.error,
    rawError?.message,
    rawError?.details,
  ];

  for (const candidate of stringCandidates) {
    if (typeof candidate === 'string') {
      const trimmed = candidate.trim();
      if (trimmed.length > 0) {
        return trimmed;
      }
    }
  }

  return '';
}

/**
 * Sanitizes raw error responses or messages from SSO API / Supabase.
 * If technical keywords are detected or error is an unparseable object,
 * masks it with a standard friendly message.
 */
export function sanitizeAuthError(
  rawError: any,
  fallbackMessage: string = DEFAULT_FRIENDLY_ERROR
): string {
  // 1. If error object carries technical metadata (HTTP 5xx status, PGRST code, etc.),
  // immediately return friendly fallback message.
  if (hasTechnicalMetadata(rawError)) {
    return fallbackMessage;
  }

  // 2. Safely extract non-empty string without object coercion
  const rawMsg = extractErrorString(rawError);

  // 3. If empty or literal "[object Object]", return friendly fallback
  if (!rawMsg || /\[object\s+object\]/i.test(rawMsg)) {
    return fallbackMessage;
  }

  // 4. If technical error is detected in extracted string, return friendly fallback
  if (TECHNICAL_ERROR_REGEX.test(rawMsg)) {
    return fallbackMessage;
  }

  return rawMsg;
}
