import type { Request, Response, NextFunction } from 'express';
import { env } from '../config/env.js';

// Strict regex identifying command-line and automated testing tools
const CLI_TOOL_REGEX = /^(curl|wget|python|httpie|postmanruntime|insomnia|aiohttp|urllib|requests)/i;

const allowedOriginsList = env.CORS_ORIGIN.split(',').map((o) => o.trim().replace(/\/+$/, ''));

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

  // 4. Origins configured in environment
  return allowedOriginsList.some((allowed) => {
    if (allowed.includes('*')) {
      const reg = new RegExp('^' + allowed.replace(/\./g, '\\.').replace(/\*/g, '.*') + '$');
      return reg.test(clean);
    }
    return allowed === clean;
  });
}

/**
 * Strict Security Guard Middleware for Flashcard API:
 * - Blocks CLI tools (curl, wget, python, postman) from direct invocation
 * - Enforces Origin & Referer domain whitelist (huytutor.edu.vn, vercel.app, localhost)
 * - Sets strict CORS response headers
 */
export function corsSecurityMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Exempt health-check endpoints for Render monitoring
  if (
    req.path === '/health' ||
    req.path === '/api/health' ||
    req.path === '/api/v1/health'
  ) {
    next();
    return;
  }

  const userAgent = req.headers['user-agent'] || '';

  // 1. Block command-line tools
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
    // 3. Validate Referer if present
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

  // 4. Handle CORS Preflight request
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  next();
}
