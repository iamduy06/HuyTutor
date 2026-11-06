import type { Request, Response, NextFunction } from 'express';

// Strict regex identifying command-line and automated testing tools
const CLI_TOOL_REGEX = /^(curl|wget|python|httpie|postmanruntime|insomnia|aiohttp|urllib|requests)/i;

function getConfiguredOrigins(): string[] {
  const rawCors = process.env.CORS_ORIGINS;
  if (!rawCors) return [];
  return rawCors
    .split(',')
    .map((o) => o.trim().replace(/\/+$/, ''))
    .filter(Boolean);
}

export function isOriginAllowed(origin: string): boolean {
  if (!origin) return false;
  const clean = origin.trim().replace(/\/+$/, '');

  let parsed: URL;
  try {
    parsed = new URL(clean);
  } catch {
    return false;
  }

  // 1. Local development environments: strict hostname check for loopback
  if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
    if (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1') {
      return true;
    }
  }

  // 2. Official production & staging subdomains derived dynamically from COOKIE_DOMAIN
  const cookieDomain = process.env.COOKIE_DOMAIN?.trim().replace(/^\.+/, '');
  if (cookieDomain) {
    const escaped = cookieDomain.replace(/\./g, '\\.');
    // Matches https://cookieDomain or https://*.cookieDomain with valid DNS labels
    const domainRegex = new RegExp(`^https:\\/\\/([a-zA-Z0-9-]+\\.)*${escaped}$`);
    if (domainRegex.test(clean)) {
      return true;
    }
  }

  // 3. Configured origins from environment variables
  const configured = getConfiguredOrigins();
  return configured.some((allowed) => {
    if (allowed === clean) return true;
    if (allowed.includes('*')) {
      // Escape regex special chars except *, then replace * with safe DNS label regex
      const safePattern = allowed
        .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
        .replace(/\*/g, '[a-zA-Z0-9-]+');
      const reg = new RegExp(`^${safePattern}$`);
      return reg.test(clean);
    }
    return false;
  });
}

/**
 * Strict Security Guard Middleware:
 * - Blocks automated command-line tools (curl, wget, python, postman) from direct invocation
 * - Enforces Origin & Referer domain whitelist
 * - Emits strict CORS headers for legitimate browser frontends
 */
export function corsMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Exempt health-check endpoint for Render / UptimeRobot monitoring
  if (req.path === '/health') {
    next();
    return;
  }

  const userAgent = req.headers['user-agent'] || '';

  // 1. Block command-line tools (curl, wget, python, postman, etc.)
  if (CLI_TOOL_REGEX.test(userAgent)) {
    res.status(403).json({
      success: false,
      error: {
        code: 'CLI_ACCESS_FORBIDDEN',
        message: 'Truy cập bằng dòng lệnh hoặc công cụ tự động (curl, CLI, scripts) bị chặn vì lý do an toàn.'
      }
    });
    return;
  }

  const origin = req.headers.origin;
  const referer = req.headers.referer;

  // 2. Validate Origin if present
  if (origin) {
    if (!isOriginAllowed(origin)) {
      res.status(403).json({
        success: false,
        error: {
          code: 'CORS_ORIGIN_DENIED',
          message: `Tên miền không được phép truy cập (CORS Origin Blocked: ${origin}).`
        }
      });
      return;
    }

    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.setHeader(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization, X-Requested-With, X-Device-Id, X-Device-Name, X-Session-Token, X-Admin-Key'
    );
  } else if (referer) {
    // 3. Validate Referer if present (e.g. from navigations or standard browser requests)
    try {
      const refOrigin = new URL(referer).origin;
      if (!isOriginAllowed(refOrigin)) {
        res.status(403).json({
          success: false,
          error: {
            code: 'CORS_REFERER_DENIED',
            message: 'Nguồn truy cập (Referer) không thuộc danh sách tên miền được phép.'
          }
        });
        return;
      }
    } catch {
      res.status(403).json({
        success: false,
        error: {
          code: 'INVALID_REFERER',
          message: 'Tiêu đề Referer không hợp lệ.'
        }
      });
      return;
    }
  }

  // 4. Handle CORS Preflight request immediately
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  next();
}
