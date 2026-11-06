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
    const isLoopback = hostname === 'localhost' || hostname === '127.0.0.1';

    // Allow localhost / loopback in development / testing (http: or https:)
    if (allowLocalhost && isLoopback) {
      return trimmed;
    }

    // Security: Non-loopback targets MUST strictly use HTTPS to protect master SSO tokens against cleartext transmission
    if (parsed.protocol !== 'https:') {
      return '/';
    }

    // Dynamic target domain from env/parameter without hardcoded fallback (GEMINI.md Rule 1)
    const targetDomain = (cookieDomain || process.env.COOKIE_DOMAIN || '')
      .trim()
      .replace(/^\.+/, '')
      .toLowerCase();

    // If COOKIE_DOMAIN is unconfigured or empty, fail-safe to relative root '/'
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
