import type { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { getSupabaseClient, getAdminClient } from '../config/supabase.js';
import { memoryCache } from '../services/cacheService.js';
import type { UserRole } from '@huytutor/shared';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: UserRole;
  max_devices?: number | null;
  device_id?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      token?: string;
    }
  }
}

function verifySsoJwt(token: string, secret: string): any {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [headerB64, payloadB64, sigB64] = parts;
    const expectedSig = crypto
      .createHmac('sha256', secret)
      .update(`${headerB64}.${payloadB64}`)
      .digest('base64url');
    if (sigB64 !== expectedSig) return null;
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
    if (payload.exp && payload.exp * 1000 < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

/**
 * Tính toán hạn mức thiết bị tối đa cho người dùng theo phân cấp:
 * users.max_devices > groups.max_device_per_user > app_settings.global_max_devices > 3
 */
async function getUserDeviceQuota(admin: any, userId: string, profileMaxDevices?: number | null): Promise<number> {
  if (typeof profileMaxDevices === 'number') {
    return profileMaxDevices;
  }

  try {
    const { data: userGroups } = await admin
      .from('group_users')
      .select('group_id, groups(max_device_per_user)')
      .eq('user_id', userId);

    if (userGroups && userGroups.length > 0) {
      for (const ug of userGroups as any[]) {
        const quota = ug.groups?.max_device_per_user;
        if (typeof quota === 'number') {
          return quota;
        }
      }
    }
  } catch {}

  try {
    const { data: setting } = await admin
      .from('app_settings')
      .select('value')
      .eq('key', 'global_max_devices')
      .maybeSingle();

    if (setting?.value) {
      const parsed = parseInt(setting.value, 10);
      if (!isNaN(parsed) && parsed > 0) return parsed;
    }
  } catch {}

  return 3;
}

/**
 * Middleware requiring valid Bearer JWT or Master SSO Cookie.
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const cookieHeader = req.headers.cookie;
  const cookieToken =
    cookieHeader?.match(/(?:^|;\s*)ht_sso_token=([^;]*)/)?.[1]
      ? decodeURIComponent(cookieHeader.match(/(?:^|;\s*)ht_sso_token=([^;]*)/)![1])
      : cookieHeader?.match(/(?:^|;\s*)hut_access_token=([^;]*)/)?.[1]
      ? decodeURIComponent(cookieHeader.match(/(?:^|;\s*)hut_access_token=([^;]*)/)![1])
      : '';

  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ')
    ? authHeader.split(' ')[1]
    : cookieToken;

  if (!token) {
    return res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Vui lòng đăng nhập để tiếp tục' },
    });
  }

  req.token = token;

  // 1. Check in-memory RAM cache
  const cacheKey = `user_token_${token}`;
  let authUser = memoryCache.get<AuthenticatedUser>(cacheKey);

  if (!authUser) {
    let userId: string | null = null;
    let userEmail: string = '';
    let ssoDeviceId: string | undefined = undefined;

    // 2. Validate token via SSO JWT (HS256)
    const ssoSecret = process.env.JWT_SECRET;
    const ssoPayload = ssoSecret ? verifySsoJwt(token, ssoSecret) : null;
    if (ssoPayload?.sub) {
      userId = ssoPayload.sub;
      userEmail = ssoPayload.email ? ssoPayload.email : '';
      ssoDeviceId = ssoPayload.device_id;
    } else {
      // Fallback: Supabase GoTrue Auth
      try {
        const supabase = getSupabaseClient();
        const { data: { user }, error } = await supabase.auth.getUser(token);
        if (!error && user) {
          userId = user.id;
          userEmail = user.email ?? '';
        }
      } catch {}
    }

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { code: 'INVALID_TOKEN', message: 'Phiên làm việc hết hạn hoặc không hợp lệ' },
      });
    }

    // 3. Retrieve user role & metadata from public.users and verify session status
    const admin = getAdminClient();

    try {
      const { data: sessionRecord } = await admin
        .from('user_sessions')
        .select('is_revoked, expires_at')
        .eq('session_token', token)
        .maybeSingle();

      if (
        sessionRecord &&
        (sessionRecord.is_revoked === true ||
          (sessionRecord.expires_at && new Date(sessionRecord.expires_at).getTime() < Date.now()))
      ) {
        return res.status(401).json({
          success: false,
          error: { code: 'SESSION_REVOKED', message: 'Phiên làm việc đã bị thu hồi hoặc đã hết hạn.' },
        });
      }
    } catch {}

    const { data: profile } = await admin
      .from('users')
      .select('role, max_devices')
      .eq('id', userId)
      .single();

    authUser = {
      id: userId,
      email: userEmail,
      role: (profile?.role as UserRole) ?? 'USER',
      max_devices: profile?.max_devices ?? null,
      device_id: ssoDeviceId,
    };

    // Cache in RAM for 5 minutes
    memoryCache.set(cacheKey, authUser, 20);
  }

  // 4. SEC-007: Device Binding & Flashcard Quota Verification
  // Admins bypass all device restrictions
  if (authUser.role !== 'ADMIN') {
    const cookieHeader = req.headers.cookie;
    const deviceId =
      (req.headers['x-device-id'] as string)?.trim() ||
      (cookieHeader?.match(/(?:^|;\s*)hut_device_id=([^;]*)/)?.[1]
        ? decodeURIComponent(cookieHeader.match(/(?:^|;\s*)hut_device_id=([^;]*)/)![1])
        : '') ||
      (cookieHeader?.match(/(?:^|;\s*)device_id=([^;]*)/)?.[1]
        ? decodeURIComponent(cookieHeader.match(/(?:^|;\s*)device_id=([^;]*)/)![1])
        : '') ||
      authUser.device_id ||
      '';

    const isRegisterEndpoint =
      (req.originalUrl && req.originalUrl.includes('/register-device')) ||
      (req.path && req.path.includes('/register-device'));

    if (!deviceId && !isRegisterEndpoint) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'DEVICE_ID_REQUIRED',
          message: 'Không tìm thấy định danh thiết bị truy cập.',
        },
      });
    }

    if (deviceId && !isRegisterEndpoint) {
      const admin = getAdminClient();
      const { data: deviceRecord } = await admin
        .from('user_devices')
        .select('id')
        .eq('user_id', authUser.id)
        .eq('device_id', deviceId)
        .maybeSingle();

      if (deviceRecord) {
        // Device is already bound to Flashcard, update last_seen
        admin
          .from('user_devices')
          .update({ last_seen: new Date().toISOString() })
          .eq('id', deviceRecord.id)
          .then();
      } else {
        // Device is NOT in user_devices (e.g. logged into Shop from a new device, or revoked)
        // Check user quota
        const maxDevices = await getUserDeviceQuota(admin, authUser.id, authUser.max_devices);

        const { count } = await admin
          .from('user_devices')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', authUser.id);

        const currentCount = count ?? 0;

        if (currentCount >= maxDevices) {
          const ssoBase = process.env.SSO_URL ? process.env.SSO_URL.replace(/\/+$/, '') : '';
          const ssoDevicesUrl = ssoBase ? `${ssoBase}/devices` : '/devices';

          // Reject device with 403 DEVICE_LIMIT_EXCEEDED
          return res.status(403).json({
            success: false,
            error: {
              code: 'DEVICE_LIMIT_EXCEEDED',
              message: `Tài khoản của bạn đã đạt giới hạn tối đa ${maxDevices} thiết bị học Flashcard.`,
              maxDevices,
              currentCount,
              ssoUrl: ssoDevicesUrl,
            },
          });
        }

        // Under quota: automatically register new device for Flashcard
        const devName =
          (req.headers['x-device-name'] as string) ||
          (req.headers['user-agent'] ? req.headers['user-agent'].substring(0, 100) : 'Thiết bị Web');
        const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() || req.ip || null;

        await admin.from('user_devices').insert({
          user_id: authUser.id,
          device_id: deviceId,
          device_name: devName,
          ip_address: clientIp,
          last_seen: new Date().toISOString(),
        });
      }
    }
  }

  req.user = authUser;
  return next();
}

/**
 * Middleware optionally verifying Bearer JWT or Master SSO Cookie if present.
 */
export async function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const cookieHeader = req.headers.cookie;
  const cookieToken =
    cookieHeader?.match(/(?:^|;\s*)ht_sso_token=([^;]*)/)?.[1]
      ? decodeURIComponent(cookieHeader.match(/(?:^|;\s*)ht_sso_token=([^;]*)/)![1])
      : cookieHeader?.match(/(?:^|;\s*)hut_access_token=([^;]*)/)?.[1]
      ? decodeURIComponent(cookieHeader.match(/(?:^|;\s*)hut_access_token=([^;]*)/)![1])
      : '';

  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ')
    ? authHeader.split(' ')[1]
    : cookieToken;

  if (!token) {
    return next();
  }

  req.token = token;

  const cacheKey = `user_token_${token}`;
  const cachedUser = memoryCache.get<AuthenticatedUser>(cacheKey);
  if (cachedUser) {
    req.user = cachedUser;
    return next();
  }

  let userId: string | null = null;
  let userEmail: string = '';
  let ssoDeviceId: string | undefined = undefined;

  const ssoSecret = process.env.JWT_SECRET;
  const ssoPayload = ssoSecret ? verifySsoJwt(token, ssoSecret) : null;
  if (ssoPayload?.sub) {
    userId = ssoPayload.sub;
    userEmail = ssoPayload.email ? ssoPayload.email : '';
    ssoDeviceId = ssoPayload.device_id;
  } else {
    try {
      const supabase = getSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser(token);
      if (user) {
        userId = user.id;
        userEmail = user.email ?? '';
      }
    } catch {}
  }

  if (userId) {
    const admin = getAdminClient();
    const { data: profile } = await admin
      .from('users')
      .select('role, max_devices')
      .eq('id', userId)
      .single();

    const authUser: AuthenticatedUser = {
      id: userId,
      email: userEmail,
      role: (profile?.role as UserRole) ?? 'USER',
      max_devices: profile?.max_devices ?? null,
      device_id: ssoDeviceId,
    };

    memoryCache.set(cacheKey, authUser, 20);
    req.user = authUser;
  }

  return next();
}
