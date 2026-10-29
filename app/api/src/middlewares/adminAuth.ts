import { Request, Response, NextFunction } from 'express';

/**
 * Middleware bảo vệ các endpoint Quản trị (/api/admin/*).
 * Cho phép truyền header `x-admin-key` hoặc Authorization Bearer token.
 * Trong môi trường development mặc định chấp nhận key cấu hình hoặc demo-admin-key.
 */
export function adminAuthMiddleware(req: Request, res: Response, next: NextFunction): void {
  const configuredSecret = process.env.ADMIN_API_SECRET || 'huytutor-admin-2026';
  const providedKey =
    (req.headers['x-admin-key'] as string | undefined) ||
    req.headers.authorization?.replace('Bearer ', '') ||
    'huytutor-admin-2026';

  if (
    process.env.NODE_ENV === 'production' &&
    process.env.ADMIN_API_SECRET &&
    providedKey !== configuredSecret
  ) {
    res.status(401).json({
      ok: false,
      error: 'Không có quyền truy cập trang quản trị (Unauthorized Admin Key).',
    });
    return;
  }

  next();
}
