import { Request, Response } from 'express';
import { authService } from '../services/authService';

export const authController = {
  /**
   * POST /api/auth/register
   */
  async register(_req: Request, res: Response): Promise<void> {
    const ssoUrl = process.env.SSO_URL || '';
    res.status(400).json({
      ok: false,
      error: 'Sử dụng SSO portal để đăng ký tài khoản của bạn.',
      ...(ssoUrl ? { sso_url: `${ssoUrl}/register` } : {}),
    });
  },

  /**
   * POST /api/auth/login
   */
  async login(_req: Request, res: Response): Promise<void> {
    const ssoUrl = process.env.SSO_URL || '';
    res.status(400).json({
      ok: false,
      error: 'Sử dụng SSO portal để đăng nhập tài khoản của bạn.',
      ...(ssoUrl ? { sso_url: `${ssoUrl}/login` } : {}),
    });
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
   * POST /api/auth/logout & GET /api/auth/logout
   * Đăng xuất phiên hiện tại và xóa sạch cookie đa domain (.huytutor.edu.vn)
   */
  async logout(req: Request, res: Response): Promise<void> {
    try {
      if (req.sessionToken) {
        await authService.logout(req.sessionToken);
      }

      // Thông báo đồng bộ tới SSO API (nếu có cấu hình SSO_URL)
      const ssoUrl = process.env.SSO_URL;
      if (ssoUrl && req.sessionToken) {
        try {
          await fetch(`${ssoUrl.replace(/\/+$/, '')}/api/auth/logout`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${req.sessionToken}`,
              'Content-Type': 'application/json',
            },
            signal: AbortSignal.timeout(2000),
          });
        } catch {
          /* Bỏ qua lỗi kết nối nền tới SSO */
        }
      }

      // Hủy toàn bộ cookie phiên trên mọi cấp độ domain (.huytutor.edu.vn, huytutor.edu.vn, host-only)
      const isProd = process.env.NODE_ENV === 'production';
      const cookieDomain = process.env.COOKIE_DOMAIN || '.huytutor.edu.vn';

      const clearOpts = {
        path: '/',
        httpOnly: true,
        secure: isProd,
        sameSite: 'lax' as const,
        maxAge: 0,
        expires: new Date(0),
      };

      const cookieNames = ['ht_sso_token', 'ht_session_token', 'session_token'];

      for (const name of cookieNames) {
        res.cookie(name, '', { ...clearOpts, domain: cookieDomain });
        if (cookieDomain.startsWith('.')) {
          res.cookie(name, '', { ...clearOpts, domain: cookieDomain.slice(1) });
        }
        res.cookie(name, '', clearOpts);
      }

      if (req.method === 'GET') {
        const frontendUrl = process.env.FRONTEND_URL || '/';
        res.redirect(`${frontendUrl.replace(/\/+$/, '')}/?logout=true`);
        return;
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

      const ssoUrl = process.env.SSO_URL;
      if (ssoUrl && req.sessionToken) {
        try {
          await fetch(`${ssoUrl.replace(/\/+$/, '')}/api/auth/sessions`, {
            method: 'DELETE',
            headers: {
              Authorization: `Bearer ${req.sessionToken}`,
              'Content-Type': 'application/json',
            },
            signal: AbortSignal.timeout(2000),
          });
        } catch {
          /* Bỏ qua lỗi kết nối nền tới SSO */
        }
      }

      const isProd = process.env.NODE_ENV === 'production';
      const cookieDomain = process.env.COOKIE_DOMAIN || '.huytutor.edu.vn';

      const clearOpts = {
        path: '/',
        httpOnly: true,
        secure: isProd,
        sameSite: 'lax' as const,
        maxAge: 0,
        expires: new Date(0),
      };

      const cookieNames = ['ht_sso_token', 'ht_session_token', 'session_token'];

      for (const name of cookieNames) {
        res.cookie(name, '', { ...clearOpts, domain: cookieDomain });
        if (cookieDomain.startsWith('.')) {
          res.cookie(name, '', { ...clearOpts, domain: cookieDomain.slice(1) });
        }
        res.cookie(name, '', clearOpts);
      }

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
  async changePassword(_req: Request, res: Response): Promise<void> {
    const ssoUrl = process.env.SSO_URL || '';
    res.status(400).json({
      ok: false,
      error: 'Sử dụng SSO portal để đổi mật khẩu của bạn.',
      ...(ssoUrl ? { sso_url: `${ssoUrl}/change-password` } : {}),
    });
  },

  /**
   * POST /api/auth/forgot-password
   */
  async forgotPassword(_req: Request, res: Response): Promise<void> {
    const ssoUrl = process.env.SSO_URL || '';
    res.status(400).json({
      ok: false,
      error: 'Sử dụng SSO portal để khôi phục mật khẩu của bạn.',
      ...(ssoUrl ? { sso_url: `${ssoUrl}/forgot-password` } : {}),
    });
  },

  /**
   * POST /api/auth/reset-password
   */
  async resetPassword(_req: Request, res: Response): Promise<void> {
    const ssoUrl = process.env.SSO_URL || '';
    res.status(400).json({
      ok: false,
      error: 'Sử dụng SSO portal để đặt lại mật khẩu của bạn.',
      ...(ssoUrl ? { sso_url: `${ssoUrl}/reset-password` } : {}),
    });
  },
};
