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
 * Middleware requiring valid Bearer JWT.
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Vui lòng đăng nhập để tiếp tục' },
    });
  }

  const token = authHeader.split(' ')[1];
  req.token = token;

  // 1. Check in-memory RAM cache
  const cacheKey = `user_token_${token}`;
  let authUser = memoryCache.get<AuthenticatedUser>(cacheKey);

  if (!authUser) {
    let userId: string | null = null;
    let userEmail: string = '';

    // 2. Validate token via SSO JWT (HS256)
    const ssoSecret = process.env.JWT_SECRET;
    const ssoPayload = ssoSecret ? verifySsoJwt(token, ssoSecret) : null;
    if (ssoPayload?.sub) {
      userId = ssoPayload.sub;
      userEmail = ssoPayload.email || '';
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

    // 3. Retrieve user role & metadata from public.users
    const admin = getAdminClient();
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
    };

    // Cache in RAM for 5 minutes
    memoryCache.set(cacheKey, authUser, 300);
  }

  // 4. SEC-007: Device Binding Verification
  // Check if client provided X-Device-Id and verify if still active in user_devices
  const deviceId = (req.headers['x-device-id'] as string)?.trim() || '';
  const isRegisterEndpoint =
    (req.originalUrl && req.originalUrl.includes('/register-device')) ||
    (req.path && req.path.includes('/register-device'));

  if (deviceId && authUser.role !== 'ADMIN' && !isRegisterEndpoint) {
    const admin = getAdminClient();
    const { data: deviceRecord } = await admin
      .from('user_devices')
      .select('id')
      .eq('user_id', authUser.id)
      .eq('device_id', deviceId)
      .maybeSingle();

    if (!deviceRecord) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'DEVICE_REVOKED',
          message: 'Thiết bị này đã bị Quản trị viên xoá quyền truy cập. Vui lòng đăng nhập lại.',
        },
      });
    }
  }

  req.user = authUser;
  return next();
}

/**
 * Middleware optionally verifying Bearer JWT if present.
 */
export async function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.split(' ')[1];
  req.token = token;

  const cacheKey = `user_token_${token}`;
  const cachedUser = memoryCache.get<AuthenticatedUser>(cacheKey);
  if (cachedUser) {
    req.user = cachedUser;
    return next();
  }

  let userId: string | null = null;
  let userEmail: string = '';

  const ssoSecret = process.env.JWT_SECRET;
  const ssoPayload = ssoSecret ? verifySsoJwt(token, ssoSecret) : null;
  if (ssoPayload?.sub) {
    userId = ssoPayload.sub;
    userEmail = ssoPayload.email || '';
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
    };

    memoryCache.set(cacheKey, authUser, 300);
    req.user = authUser;
  }

  return next();
}
