import type { Request, Response, NextFunction } from 'express';
import { verifyToken, type JWTPayload } from '../config/jwt.js';
import { isSessionActive } from '../services/sessionService.js';

export interface AuthenticatedRequest extends Request {
  user?: JWTPayload;
  token?: string;
}

export async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  const token = req.cookies?.ht_sso_token || req.headers.authorization?.replace(/^Bearer\s+/i, '');

  if (!token) {
    res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Chưa đăng nhập hoặc phiên làm việc không tồn tại.' }
    });
    return;
  }

  const payload = verifyToken(token);
  if (!payload) {
    res.status(401).json({
      success: false,
      error: { code: 'TOKEN_EXPIRED', message: 'Phiên làm việc đã hết hạn sau 3 ngày. Vui lòng đăng nhập lại.' }
    });
    return;
  }

  const active = await isSessionActive(token);
  if (!active) {
    res.status(401).json({
      success: false,
      error: { code: 'SESSION_REVOKED', message: 'Phiên làm việc đã bị thu hồi hoặc đã hết hạn.' }
    });
    return;
  }

  req.user = payload;
  req.token = token;
  next();
}
