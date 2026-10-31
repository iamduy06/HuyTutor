import { Request, Response, NextFunction } from 'express';
import { authService, PublicUserProfile } from '../services/authService';

declare global {
  namespace Express {
    interface Request {
      user?: PublicUserProfile;
      sessionToken?: string;
    }
  }
}

export function extractBearerToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim();
    return token || null;
  }
  const customToken = req.headers['x-session-token'];
  if (typeof customToken === 'string' && customToken.trim()) {
    return customToken.trim();
  }
  const cookieHeader = req.headers.cookie;
  if (cookieHeader) {
    const match = cookieHeader.match(/(?:^|;\s*)ht_sso_token=([^;]*)/);
    if (match && match[1]) {
      const decoded = decodeURIComponent(match[1]).trim();
      if (decoded) return decoded;
    }
  }
  return null;
}

/**
 * Middleware yêu cầu người dùng đã đăng nhập với phiên (Session) hợp lệ.
 */
export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const token = extractBearerToken(req);
    if (!token) {
      res.status(401).json({
        ok: false,
        error: 'Vui lòng đăng nhập để sử dụng tính năng này.',
      });
      return;
    }

    const validated = await authService.validateSession(token);
    if (!validated) {
      res.status(401).json({
        ok: false,
        error: 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.',
      });
      return;
    }

    req.user = validated.user;
    req.sessionToken = token;
    next();
  } catch (err: any) {
    res.status(401).json({
      ok: false,
      error: err?.message || 'Lỗi xác thực phiên đăng nhập.',
    });
  }
}

/**
 * Middleware tùy chọn: Nếu có gửi kèm session_token hợp lệ thì gắn req.user,
 * nếu không có thì vẫn cho phép đi tiếp (dùng khi đặt hàng).
 */
export async function optionalAuth(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const token = extractBearerToken(req);
    if (token) {
      const validated = await authService.validateSession(token);
      if (validated) {
        req.user = validated.user;
        req.sessionToken = token;
      }
    }
  } catch {
    // Bỏ qua lỗi xác thực ở chế độ optional
  }
  next();
}

