import type { Request, Response, NextFunction } from 'express';
import type { UserRole } from '@huytutor/shared';

/**
 * Middleware restricting access to specified roles.
 * Must be placed AFTER requireAuth.
 */
export function requireRole(...allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Yêu cầu đăng nhập' },
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Bạn không có quyền thực hiện thao tác này' },
      });
    }

    return next();
  };
}
