import { Request, Response, NextFunction } from 'express';

// Strict regex identifying command-line and automated testing tools
const CLI_TOOL_REGEX = /^(curl|wget|python|httpie|postmanruntime|insomnia|aiohttp|urllib|requests)/i;

function getConfiguredOrigins(): string[] {
  const rawCors = process.env.CORS_ORIGINS;
  if (!rawCors) {
    return [
      'https://huytutor.edu.vn',
      'https://www.huytutor.edu.vn',
      'https://sso.huytutor.edu.vn',
      'https://flashcard.huytutor.edu.vn'
    ];
  }
  return rawCors
    .split(',')
    .map((o) => o.trim().replace(/\/+$/, ''))
    .filter(Boolean);
}

export function isOriginAllowed(origin: string): boolean {
  if (!origin) return false;
  const clean = origin.trim().replace(/\/+$/, '');

  // 1. Local development
  if (
    clean.startsWith('http://localhost') ||
    clean.startsWith('http://127.0.0.1')
  ) {
    return true;
  }

  // 2. Official production & staging subdomains of huytutor.edu.vn
  if (/^https:\/\/([a-zA-Z0-9_\-\.]+\.)?huytutor\.edu\.vn$/.test(clean)) {
    return true;
  }

  // 3. Vercel deployment preview and production domains
  if (/^https:\/\/([a-zA-Z0-9_\-\.]+\.)?vercel\.app$/.test(clean) || clean === 'https://vercel.app') {
    return true;
  }

  // 4. Configured origins from environment variables
  const configured = getConfiguredOrigins();
  return configured.some((allowed) => {
    if (allowed.includes('*')) {
      const reg = new RegExp('^' + allowed.replace(/\./g, '\\.').replace(/\*/g, '.*') + '$');
      return reg.test(clean);
    }
    return allowed === clean;
  });
}

/**
 * Strict Security Guard Middleware for Shop API:
 * - Blocks CLI tools (curl, wget, python, postman) from direct invocation
 * - Enforces Origin & Referer domain whitelist (huytutor.edu.vn, vercel.app, localhost)
 * - Exempts /health and /api/webhook/* for payment gateways
 */
export function corsGuardMiddleware(req: Request, res: Response, next: NextFunction): void {
  // 1. Exempt health-check and banking webhook callbacks (SePay / PayPal)
  if (
    req.path === '/health' ||
    req.path.startsWith('/api/webhook') ||
    req.path.startsWith('/webhook')
  ) {
    next();
    return;
  }

  const userAgent = req.headers['user-agent'] || '';

  // 2. Block command-line tools
  if (CLI_TOOL_REGEX.test(userAgent)) {
    res.status(403).json({
      ok: false,
      error: 'Truy cập bằng dòng lệnh hoặc công cụ tự động (curl, CLI, scripts) bị chặn vì lý do an toàn.'
    });
    return;
  }

  const origin = req.headers.origin;
  const referer = req.headers.referer;

  // 3. Validate Origin if present
  if (origin) {
    if (!isOriginAllowed(origin)) {
      res.status(403).json({
        ok: false,
        error: `Tên miền không được phép truy cập (CORS Origin Blocked: ${origin}).`
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
    // 4. Validate Referer if present
    try {
      const refOrigin = new URL(referer).origin;
      if (!isOriginAllowed(refOrigin)) {
        res.status(403).json({
          ok: false,
          error: 'Nguồn truy cập (Referer) không thuộc danh sách tên miền được phép.'
        });
        return;
      }
    } catch {
      res.status(403).json({
        ok: false,
        error: 'Tiêu đề Referer không hợp lệ.'
      });
      return;
    }
  }

  // 5. Handle CORS Preflight request
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  next();
}

