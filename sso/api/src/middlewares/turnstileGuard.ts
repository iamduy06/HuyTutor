import type { Request, Response, NextFunction } from 'express';
import { verifyTurnstileToken } from '../services/turnstileService.js';

/**
 * Middleware bảo vệ các tuyến đường nhạy cảm chống Spam / Bot / DDoS database.
 * Xác thực token Cloudflare Turnstile trước khi chuyển sang Controller xử lý.
 */
export async function turnstileGuard(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  // Lấy token từ body hoặc header
  const token =
    req.body?.turnstileToken ||
    req.body?.cfTurnstileResponse ||
    (req.headers['x-turnstile-token'] as string | undefined);

  // Lấy IP người dùng để Cloudflare phân tích rủi ro
  const rawIp =
    (req.headers['cf-connecting-ip'] as string) ||
    (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
    req.socket.remoteAddress ||
    '';
  const clientIp = typeof rawIp === 'string' ? rawIp.trim() : undefined;

  const result = await verifyTurnstileToken(token, clientIp);

  if (!result.success) {
    res.status(403).json({
      success: false,
      error: {
        code: 'TURNSTILE_VERIFICATION_FAILED',
        message: result.error || 'Xác thực không thành công, vui lòng thử lại.',
      },
    });
    return;
  }

  next();
}
