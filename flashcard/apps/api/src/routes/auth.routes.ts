import { Router } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { env } from '../config/env.js';
import type { Request, Response } from 'express';
import { requireAuth } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { 
  registerDeviceSchema, 
  updatePasswordSchema,
  loginAuthSchema,
  registerAuthSchema,
  verifyOtpAuthSchema,
  forgotPasswordAuthSchema,
  resetPasswordAuthSchema
} from '@huytutor/shared';
import type { UserRole } from '@huytutor/shared';
import { getAdminClient, getSupabaseClient } from '../config/supabase.js';
import { authLimiter } from '../middlewares/rateLimiter.js';
import { memoryCache } from '../services/cacheService.js';

const router = Router();

// ─── POST /auth/login (Atomic Login & Device Check) ──────────────────────────
router.post(
  '/auth/login',
  authLimiter,
  validate({ body: loginAuthSchema }),
  async (req: Request, res: Response) => {
    const { email, password, device_id, device_name } = req.body;
    const anonClient = getSupabaseClient();
    const admin = getAdminClient();

    // 1. Authenticate with master public.users table or fallback to Supabase GoTrue Auth
    let user: { id: string; email: string; role: UserRole; max_devices?: number | null; full_name?: string } | null = null;
    let sessionToken: string = '';
    let sessionExpiresAt: number = Math.floor(Date.now() / 1000) + 7 * 24 * 3600;

    const cleanEmail = email.trim().toLowerCase();
    const { data: dbUser } = await admin
      .from('users')
      .select('id, email, password_hash, role, max_devices, full_name, is_active')
      .eq('email', cleanEmail)
      .maybeSingle();

    if (dbUser && dbUser.password_hash) {
      const isValid = await bcrypt.compare(password, dbUser.password_hash);
      if (isValid && dbUser.is_active !== false) {
        user = {
          id: dbUser.id,
          email: dbUser.email,
          role: (dbUser.role as UserRole) ?? 'USER',
          max_devices: dbUser.max_devices ?? null,
          full_name: dbUser.full_name ?? '',
        };
        const secret = env.JWT_SECRET || 'secret';
        const now = Math.floor(Date.now() / 1000);
        const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
        const payload = Buffer.from(JSON.stringify({
          sub: user.id,
          email: user.email,
          role: user.role,
          device_id,
          iat: now,
          exp: now + 7 * 24 * 3600,
        })).toString('base64url');
        const sig = crypto.createHmac('sha256', secret).update(`${header}.${payload}`).digest('base64url');
        sessionToken = `${header}.${payload}.${sig}`;
      }
    }

    if (!user) {
      const { data: authData, error: authError } = await anonClient.auth.signInWithPassword({
        email,
        password,
      });

      if (!authError && authData.user && authData.session) {
        const { data: profile } = await admin
          .from('users')
          .select('role, max_devices, full_name')
          .eq('id', authData.user.id)
          .maybeSingle();

        user = {
          id: authData.user.id,
          email: authData.user.email ?? email,
          role: (profile?.role as UserRole) ?? 'USER',
          max_devices: profile?.max_devices ?? null,
          full_name: profile?.full_name ?? (authData.user.user_metadata?.full_name as string) ?? '',
        };
        sessionToken = authData.session.access_token;
        sessionExpiresAt = authData.session.expires_at ?? (Math.floor(Date.now() / 1000) + 7 * 24 * 3600);
      }
    }

    if (!user || !sessionToken) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Email hoặc mật khẩu không chính xác',
        },
      });
    }

    const role = user.role;

    // 3. Atomic Device Limit Enforcement (Admins bypass limit)
    if (role !== 'ADMIN') {
      const { data: setting } = await admin
        .from('app_settings')
        .select('value')
        .eq('key', 'global_max_devices')
        .single();

      const maxDevices = user.max_devices ?? parseInt(setting?.value ?? '3', 10);

      const { data: existing } = await admin
        .from('user_devices')
        .select('id')
        .eq('user_id', user.id)
        .eq('device_id', device_id)
        .maybeSingle();

      if (!existing) {
        const { count } = await admin
          .from('user_devices')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);

        if ((count ?? 0) >= maxDevices) {
          return res.status(403).json({
            success: false,
            error: {
              code: 'DEVICE_LIMIT_EXCEEDED',
              message: `Tài khoản của bạn đã đạt giới hạn tối đa ${maxDevices} thiết bị.`,
              contactUrl: 'https://web.facebook.com/huytutor',
              currentCount: count,
              maxDevices,
            },
          });
        }
      }

      await upsertDevice(admin, user.id, device_id, device_name, req);

      // Race condition post-verification
      const { count: finalCount } = await admin
        .from('user_devices')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      if ((finalCount ?? 0) > maxDevices) {
        await admin
          .from('user_devices')
          .delete()
          .eq('user_id', user.id)
          .eq('device_id', device_id);

        return res.status(403).json({
          success: false,
          error: {
            code: 'DEVICE_LIMIT_EXCEEDED',
            message: `Tài khoản của bạn đã đạt giới hạn tối đa ${maxDevices} thiết bị.`,
            contactUrl: 'https://web.facebook.com/huytutor',
            currentCount: finalCount ? finalCount - 1 : maxDevices,
            maxDevices,
          },
        });
      }
    } else {
      await upsertDevice(admin, user.id, device_id, device_name, req);
    }

    return res.status(200).json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        role,
        full_name: user.full_name ?? '',
      },
      session: {
        access_token: sessionToken,
        expires_at: sessionExpiresAt,
        expires_in: 7 * 24 * 3600,
      },
    });
  }
);

// ─── POST /auth/register ──────────────────────────────────────────────────────
router.post(
  '/auth/register',
  authLimiter,
  validate({ body: registerAuthSchema }),
  async (req: Request, res: Response) => {
    const { email, password, full_name } = req.body;
    const cleanEmail = email.trim().toLowerCase();
    const admin = getAdminClient();

    // 1. Check if user already exists
    const { data: existingUser } = await admin
      .from('users')
      .select('id')
      .eq('email', cleanEmail)
      .maybeSingle();

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: { code: 'USER_ALREADY_EXISTS', message: 'Email này đã được sử dụng trên hệ thống.' },
      });
    }

    // 2. Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3. Create user in public.users
    const { data: newUser, error: createErr } = await admin
      .from('users')
      .insert({
        email: cleanEmail,
        password_hash: hashedPassword,
        full_name: full_name?.trim() ?? '',
        role: 'USER',
        is_active: true,
      })
      .select('id, email, full_name, role')
      .single();

    if (createErr || !newUser) {
      return res.status(500).json({
        success: false,
        error: { code: 'REGISTRATION_FAILED', message: createErr?.message ?? 'Không thể khởi tạo tài khoản mới.' },
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Đăng ký tài khoản thành công.',
      email: cleanEmail,
      user: { id: newUser.id, email: newUser.email },
    });
  }
);

// ─── POST /auth/verify-otp ────────────────────────────────────────────────────
router.post(
  '/auth/verify-otp',
  authLimiter,
  validate({ body: verifyOtpAuthSchema }),
  async (_req: Request, res: Response) => {
    return res.status(400).json({
      success: false,
      error: {
        code: 'USE_SSO',
        message: 'Sử dụng SSO portal để xác thực tài khoản của bạn.',
      },
    });
  }
);

// ─── POST /auth/forgot-password ──────────────────────────────────────────────
router.post(
  '/auth/forgot-password',
  authLimiter,
  validate({ body: forgotPasswordAuthSchema }),
  async (_req: Request, res: Response) => {
    return res.status(200).json({
      success: true,
      message: 'Khôi phục mật khẩu được xử lý tập trung tại SSO portal.',
    });
  }
);

// ─── POST /auth/reset-password ───────────────────────────────────────────────
router.post(
  '/auth/reset-password',
  authLimiter,
  validate({ body: resetPasswordAuthSchema }),
  async (_req: Request, res: Response) => {
    return res.status(400).json({
      success: false,
      error: {
        code: 'USE_SSO',
        message: 'Sử dụng SSO portal để đặt lại mật khẩu của bạn.',
      },
    });
  }
);

// ─── POST /auth/refresh ───────────────────────────────────────────────────────
router.post('/auth/refresh', async (req: Request, res: Response) => {
  const { refresh_token } = req.body;
  if (!refresh_token) {
    return res.status(400).json({
      success: false,
      error: { code: 'REFRESH_TOKEN_REQUIRED', message: 'Thiếu refresh_token' },
    });
  }
  const anonClient = getSupabaseClient();
  const { data, error } = await anonClient.auth.refreshSession({ refresh_token });
  if (error || !data.session) {
    return res.status(401).json({
      success: false,
      error: { code: 'INVALID_REFRESH_TOKEN', message: error?.message || 'Phiên làm việc hết hạn' },
    });
  }
  return res.status(200).json({
    success: true,
    session: {
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_at: data.session.expires_at,
      expires_in: data.session.expires_in,
    },
  });
});

// ─── POST /auth/logout ────────────────────────────────────────────────────────
router.post('/auth/logout', requireAuth, async (req: Request, res: Response) => {
  if (req.user?.id) {
    memoryCache.invalidateUserTokens(req.user.id);
  }
  if (req.token) {
    memoryCache.delete(`user_token_${req.token}`);
    try {
      const admin = getAdminClient();
      await admin.from('user_sessions').update({ is_revoked: true }).eq('session_token', req.token);
    } catch {}
  }
  return res.status(200).json({ success: true });
});

// ─── GET /auth/me ─────────────────────────────────────────────────────────────
router.get('/auth/me', requireAuth, async (req: Request, res: Response) => {
  const user = req.user!;
  const admin = getAdminClient();

  const { data: profile } = await admin
    .from('users')
    .select('id, email, role, created_at')
    .eq('id', user.id)
    .maybeSingle();

  return res.status(200).json({
    success: true,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      full_name: (user as any).user_metadata?.full_name ?? '',
    },
  });
});

// ─── POST /auth/register-device (Legacy support) ─────────────────────────────
router.post(
  '/auth/register-device',
  authLimiter,
  requireAuth,
  validate({ body: registerDeviceSchema }),
  async (req: Request, res: Response) => {
    const user = req.user!;
    const { device_id, device_name } = req.body;
    const admin = getAdminClient();

    if (user.role === 'ADMIN') {
      await upsertDevice(admin, user.id, device_id, device_name, req);
      return res.status(200).json({ allowed: true });
    }

    const { data: profile } = await admin
      .from('users')
      .select('max_devices')
      .eq('id', user.id)
      .single();

    const { data: setting } = await admin
      .from('app_settings')
      .select('value')
      .eq('key', 'global_max_devices')
      .single();

    const maxDevices = profile?.max_devices ?? parseInt(setting?.value ?? '3', 10);

    const { data: existing } = await admin
      .from('user_devices')
      .select('id')
      .eq('user_id', user.id)
      .eq('device_id', device_id)
      .maybeSingle();

    if (existing) {
      await upsertDevice(admin, user.id, device_id, device_name, req);
      return res.status(200).json({ allowed: true });
    }

    const { count } = await admin
      .from('user_devices')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    if ((count ?? 0) >= maxDevices) {
      return res.status(200).json({
        allowed: false,
        message: `Tài khoản đã đạt giới hạn ${maxDevices} thiết bị.`,
        contactUrl: 'https://web.facebook.com/huytutor',
        currentCount: count,
        maxDevices,
      });
    }

    await upsertDevice(admin, user.id, device_id, device_name, req);

    const { count: finalCount } = await admin
      .from('user_devices')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    if ((finalCount ?? 0) > maxDevices) {
      await admin
        .from('user_devices')
        .delete()
        .eq('user_id', user.id)
        .eq('device_id', device_id);

      return res.status(200).json({
        allowed: false,
        message: `Tài khoản đã đạt giới hạn ${maxDevices} thiết bị.`,
        contactUrl: 'https://web.facebook.com/huytutor',
        currentCount: finalCount ? finalCount - 1 : maxDevices,
        maxDevices,
      });
    }

    return res.status(200).json({
      allowed: true,
      currentCount: finalCount ?? ((count ?? 0) + 1),
      maxDevices,
    });
  }
);

// ─── POST /auth/update-password ───────────────────────────────────────────────
router.post(
  '/auth/update-password',
  authLimiter,
  requireAuth,
  async (_req: Request, res: Response) => {
    const ssoUrl = env.SSO_URL || '';
    return res.status(400).json({
      success: false,
      error: {
        code: 'USE_SSO',
        message: 'Sử dụng SSO portal để đổi mật khẩu của bạn',
        ...(ssoUrl ? { sso_url: `${ssoUrl}/change-password` } : {}),
      },
    });
  }
);

async function upsertDevice(
  admin: ReturnType<typeof getAdminClient>,
  userId: string,
  deviceId: string,
  deviceName: string | undefined,
  req: Request
) {
  const ip = req.ip || null;

  await admin.from('user_devices').upsert(
    {
      user_id: userId,
      device_id: deviceId,
      device_name: deviceName ?? null,
      ip_address: ip,
      last_seen: new Date().toISOString(),
    },
    { onConflict: 'user_id,device_id' }
  );
}

export default router;
