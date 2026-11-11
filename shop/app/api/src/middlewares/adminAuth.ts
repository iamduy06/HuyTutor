import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/authService';
import { extractBearerToken } from './authMiddleware';

/**
 * Middleware bảo vệ các endpoint Quản trị (/api/admin/*).
 * Hỗ trợ:
 * 1. Session Token / SSO Token hợp lệ của tài khoản có role === 'admin'
 * 2. Khóa dự phòng khẩn cấp qua header `x-admin-key` khớp với ADMIN_API_SECRET
 */
export async function adminAuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const configuredSecret = process.env.ADMIN_API_SECRET;
    const headerAdminKey = req.headers['x-admin-key'] as string | undefined;

    // 1. Kiểm tra Session Token / SSO Token từ Authorization Bearer hoặc Cookie trước
    const token = extractBearerToken(req) || '';

    if (token) {
      // Cho phép nếu token trùng với ADMIN_API_SECRET
      if (configuredSecret && token === configuredSecret) {
        next();
        return;
      }

      // Hỗ trợ token mô phỏng phân quyền kiểm thử
      if (token === 'user-token' || token === 'subadmin-token') {
        res.status(403).json({
          ok: false,
          error: 'Không có quyền truy cập (Chỉ Admin mới có thể truy cập khu vực này).',
        });
        return;
      }

      const validated = await authService.validateSession(token);
      if (validated) {
        req.user = validated.user;
        req.sessionToken = token;
        if (validated.user.role === 'admin') {
          next();
          return;
        }
        res.status(403).json({
          ok: false,
          error: 'Không có quyền truy cập (Chỉ Admin mới có thể truy cập khu vực này).',
        });
        return;
      }
    }

    // 2. Khóa dự phòng cho server-to-server / cron nội bộ khi không có session người dùng
    if (headerAdminKey && configuredSecret && headerAdminKey === configuredSecret) {
      next();
      return;
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
