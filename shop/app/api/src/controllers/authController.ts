import { Request, Response } from 'express';
import { authService } from '../services/authService';

function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.trim()) {
    return forwarded.split(',')[0].trim();
  }
  return req.socket?.remoteAddress || '127.0.0.1';
}

export const authController = {
  /**
   * POST /api/auth/register
   */
  async register(req: Request, res: Response): Promise<void> {
    try {
      const { email, password, fullName, phone, customerGroup, schoolOrOrg } = req.body;
      const result = await authService.register({
        email,
        password,
        fullName,
        phone,
        customerGroup,
        schoolOrOrg,
        userAgent: String(req.headers['user-agent'] || 'Trình duyệt Web'),
        ipAddress: getClientIp(req),
      });

      res.status(201).json({
        ok: true,
        ...result,
      });
    } catch (err: any) {
      res.status(400).json({
        ok: false,
        error: err?.message || 'Lỗi đăng ký tài khoản.',
      });
    }
  },

  /**
   * POST /api/auth/login
   */
  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;
      const result = await authService.login({
        email,
        password,
        userAgent: String(req.headers['user-agent'] || 'Trình duyệt Web'),
        ipAddress: getClientIp(req),
      });

      res.json({
        ok: true,
        ...result,
      });
    } catch (err: any) {
      res.status(401).json({
        ok: false,
        error: err?.message || 'Đăng nhập không thành công.',
      });
    }
  },

  /**
   * GET /api/auth/me
   */
  async me(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          ok: false,
          error: 'Chưa đăng nhập.',
        });
        return;
      }

      const sessions = await authService.listSessions(req.user.id, req.sessionToken);
      res.json({
        ok: true,
        user: req.user,
        activeSessionCount: sessions.length,
      });
    } catch (err: any) {
      res.status(500).json({
        ok: false,
        error: err?.message || 'Lỗi tải thông tin tài khoản.',
      });
    }
  },

  /**
   * POST /api/auth/logout
   */
  async logout(req: Request, res: Response): Promise<void> {
    try {
      if (req.sessionToken) {
        await authService.logout(req.sessionToken);
      }
      res.json({
        ok: true,
        message: 'Đã đăng xuất khỏi phiên hiện tại.',
      });
    } catch (err: any) {
      res.status(500).json({
        ok: false,
        error: err?.message || 'Lỗi đăng xuất.',
      });
    }
  },

  /**
   * POST /api/auth/logout-all
   */
  async logoutAll(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ ok: false, error: 'Chưa đăng nhập.' });
        return;
      }
      const result = await authService.logoutAll(req.user.id);
      res.json({
        ok: true,
        revokedCount: result.revokedCount,
        message: 'Đã đăng xuất khỏi toàn bộ thiết bị.',
      });
    } catch (err: any) {
      res.status(500).json({
        ok: false,
        error: err?.message || 'Lỗi thu hồi toàn bộ phiên đăng nhập.',
      });
    }
  },

  /**
   * GET /api/auth/sessions
   */
  async listSessions(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ ok: false, error: 'Chưa đăng nhập.' });
        return;
      }
      const sessions = await authService.listSessions(req.user.id, req.sessionToken);
      res.json({
        ok: true,
        sessions,
      });
    } catch (err: any) {
      res.status(500).json({
        ok: false,
        error: err?.message || 'Lỗi tải danh sách phiên đăng nhập.',
      });
    }
  },

  /**
   * DELETE /api/auth/sessions/:sessionId
   */
  async revokeSession(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ ok: false, error: 'Chưa đăng nhập.' });
        return;
      }
      const sessionId = String(req.params.sessionId || '');
      const result = await authService.revokeSession(req.user.id, sessionId);
      res.json({
        ok: true,
        revoked: result.revoked,
        message: 'Đã thu hồi phiên đăng nhập của thiết bị được chọn.',
      });
    } catch (err: any) {
      res.status(500).json({
        ok: false,
        error: err?.message || 'Lỗi thu hồi phiên đăng nhập.',
      });
    }
  },

  /**
   * POST /api/auth/change-password
   */
  async changePassword(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ ok: false, error: 'Chưa đăng nhập.' });
        return;
      }
      const { currentPassword, newPassword } = req.body;
      const result = await authService.changePassword({
        userId: req.user.id,
        currentPassword,
        newPassword,
      });
      res.json(result);
    } catch (err: any) {
      res.status(400).json({
        ok: false,
        error: err?.message || 'Lỗi đổi mật khẩu.',
      });
    }
  },

  /**
   * POST /api/auth/forgot-password
   */
  async forgotPassword(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.body;
      const origin = String(process.env.FRONTEND_URL);
      const result = await authService.forgotPassword(email, origin);
      res.json(result);
    } catch (err: any) {
      res.status(400).json({
        ok: false,
        error: err?.message || 'Lỗi gửi yêu cầu khôi phục mật khẩu.',
      });
    }
  },

  /**
   * POST /api/auth/reset-password
   */
  async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      const { token, newPassword } = req.body;
      const result = await authService.resetPassword(token, newPassword);
      res.json(result);
    } catch (err: any) {
      res.status(400).json({
        ok: false,
        error: err?.message || 'Lỗi đặt lại mật khẩu.',
      });
    }
  },
};

