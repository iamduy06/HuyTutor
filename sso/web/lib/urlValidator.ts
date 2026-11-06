/**
 * URL Validator Utility for SSO Redirection & Token Protection
 * Strict compliance with GEMINI.md Rule 1 (strict-env-urls) and open-redirect defense.
 */

export function validateRedirectUrl(
  redirectUrl: string | null | undefined,
  cookieDomain: string | undefined = process.env.COOKIE_DOMAIN,
  allowLocalhost: boolean = true
): string {
  if (!redirectUrl || typeof redirectUrl !== 'string') return '/';
  const trimmed = redirectUrl.trim();
  if (!trimmed) return '/';

  // 1. Reject control characters, CRLF, and backslashes (prevents /\evil.com and \\evil.com bypasses)
  if (/[\r\n\t\x00-\x1f\x7f]/.test(trimmed) || trimmed.includes('\\')) {
    return '/';
  }

  // 2. Reject protocol-relative URLs (e.g. //evil.com)
  if (trimmed.startsWith('//')) {
    return '/';
  }

  // 3. Reject dangerous URI schemes like javascript:, data:, vbscript:
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed) && !trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    return '/';
  }

  // 4. Safe relative path validation (must start with single '/', no backslashes, no '//')
  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) {
    return trimmed;
  }

  // 5. Absolute URL validation
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return '/';
    }

    // Reject userinfo spoofing (e.g., https://huytutor.edu.vn@evil.com)
    if (parsed.username || parsed.password) {
      return '/';
    }

    const hostname = parsed.hostname.toLowerCase();

    // Allow localhost / loopback in development / testing
    if (allowLocalhost && (hostname === 'localhost' || hostname === '127.0.0.1')) {
      return trimmed;
    }

    const targetDomain = (cookieDomain || process.env.COOKIE_DOMAIN || 'huytutor.edu.vn')
      .trim()
      .replace(/^\.+/, '')
      .toLowerCase();

    if (!targetDomain) return '/';

    // Hostname must strictly equal targetDomain or end with .targetDomain
    if (hostname === targetDomain || hostname.endsWith('.' + targetDomain)) {
      return trimmed;
    }

    return '/';
  } catch {
    return '/';
  }
}
