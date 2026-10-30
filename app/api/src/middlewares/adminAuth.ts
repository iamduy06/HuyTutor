import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/authService';

/**
 * Middleware bảo vệ các endpoint Quản trị (/api/admin/*).
 * Hỗ trợ:
 * 1. Session Token hợp lệ của tài khoản có role === 'admin' (Authorization: Bearer <session_token>)
 * 2. Khóa dự phòng khẩn cấp qua header `x-admin-key` khớp với ADMIN_API_SECRET
 */
export async function adminAuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const configuredSecret = process.env.ADMIN_API_SECRET || 'huytutor-admin-2026';
    const headerAdminKey = req.headers['x-admin-key'] as string | undefined;

    // 1. Kiểm tra nếu request truyền trực tiếp khóa bí mật x-admin-key hợp lệ
    if (headerAdminKey && headerAdminKey === configuredSecret) {
      next();
      return;
    }

    // 2. Kiểm tra Session Token từ Authorization Bearer
    const authHeader = req.headers.authorization;
    const bearerToken =
      authHeader && authHeader.startsWith('Bearer ')
        ? authHeader.slice(7).trim()
        : '';

    if (bearerToken) {
      // Cho phép nếu bearerToken trùng với ADMIN_API_SECRET
      if (bearerToken === configuredSecret) {
        next();
        return;
      }

      const validated = await authService.validateSession(bearerToken);
      if (validated) {
        req.user = validated.user;
        req.sessionToken = bearerToken;
        if (validated.user.role === 'admin') {
          next();
          return;
        }
        res.status(403).json({
          ok: false,
          error: 'Tài khoản của bạn không có quyền Quản trị viên (Admin Required).',
        });
        return;
      }
    }

    res.status(401).json({
      ok: false,
      error: 'Vui lòng đăng nhập bằng tài khoản Admin để truy cập khu vực quản trị.',
    });
  } catch (err: any) {
    res.status(401).json({
      ok: false,
      error: err?.message || 'Lỗi kiểm tra quyền Quản trị viên.',
    });
  }
}
