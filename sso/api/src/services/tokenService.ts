import crypto from 'crypto';
import { supabaseRest } from '../config/db.js';

export interface VerificationTokenRecord {
  token: string;
  userId: string;
  email: string;
  type: 'reset_password' | 'confirm_signup';
  views: number;
  maxViews: number;
  expiresAt: number;
}

// In-memory store for high-performance atomic lookups and view tracking
const memoryTokenStore = new Map<string, VerificationTokenRecord>();

const DEFAULT_TTL_MS = 15 * 60 * 1000; // 15 minutes
const MAX_ALLOWED_VIEWS = 2; // 1 for automated bot/Google scanner, 1 for actual human verification

/**
 * Generate a unique verification token with a strict 2-view limit.
 * Stores in memory and persists to database (public.users.reset_password_token).
 */
export async function createVerificationToken(params: {
  userId: string;
  email: string;
  type?: 'reset_password' | 'confirm_signup';
  ttlMs?: number;
}): Promise<string> {
  const token = crypto.randomBytes(24).toString('hex');
  const ttlMs = params.ttlMs ?? DEFAULT_TTL_MS;
  const expiresAt = Date.now() + ttlMs;
  const expiresAtIso = new Date(expiresAt).toISOString();
  const type = params.type ?? 'reset_password';

  const record: VerificationTokenRecord = {
    token,
    userId: params.userId,
    email: params.email.trim().toLowerCase(),
    type,
    views: 0,
    maxViews: MAX_ALLOWED_VIEWS,
    expiresAt,
  };

  memoryTokenStore.set(token, record);

  // Persist to public.users as "token:views"
  const patchPayload = {
    reset_password_token: `${token}:0`,
    reset_password_expires_at: expiresAtIso,
  };

  const dbRes = await supabaseRest(`users?id=eq.${params.userId}`, {
    method: 'PATCH',
    body: JSON.stringify(patchPayload),
  });

  if (!dbRes.ok) {
    console.error(`[TOKEN_SERVICE] Failed persisting token to DB for user ${params.userId}`);
  }

  return token;
}

/**
 * Records an opening/view of the token (e.g. GET request by Google scanner or User browser).
 * Strictly enforces maximum 2 views.
 */
export async function recordTokenView(token: string): Promise<{
  valid: boolean;
  views?: number;
  maxViews?: number;
  remainingViews?: number;
  userId?: string;
  email?: string;
  reason?: string;
  message?: string;
}> {
  const cleanToken = token.trim();
  if (!cleanToken) {
    return {
      valid: false,
      reason: 'MISSING_TOKEN',
      message: 'Mã xác thực không được để trống.',
    };
  }
  // SEC-11: Validate token format strictly (only hex characters) to prevent PostgREST LIKE injection
  if (!/^[0-9a-fA-F]{32,64}$/.test(cleanToken)) {
    return {
      valid: false,
      reason: 'INVALID_TOKEN_FORMAT',
      message: 'Mã xác thực không đúng định dạng.',
    };
  }

  // 1. Look up in memory store
  let record = memoryTokenStore.get(cleanToken);

  // 2. If not found in memory (e.g. server restarted), restore from database
  if (!record) {
    const dbRes = await supabaseRest(
      `users?reset_password_token=like.${cleanToken}:*&select=id,email,reset_password_token,reset_password_expires_at`
    );

    if (dbRes.ok) {
      const users = (await dbRes.json()) as any[];
      if (users && users.length > 0) {
        const u = users[0];
        const parts = (u.reset_password_token as string).split(':');
        const dbViews = parseInt(parts[1] ?? '0', 10);
        const expiresAt = u.reset_password_expires_at ? new Date(u.reset_password_expires_at).getTime() : 0;

        record = {
          token: cleanToken,
          userId: u.id,
          email: u.email,
          type: 'reset_password',
          views: dbViews,
          maxViews: MAX_ALLOWED_VIEWS,
          expiresAt,
        };
        memoryTokenStore.set(cleanToken, record);
      }
    }
  }

  if (!record) {
    return {
      valid: false,
      reason: 'INVALID_TOKEN',
      message: 'Liên kết không hợp lệ hoặc đã hết hạn.',
    };
  }

  // 3. Check expiration
  if (Date.now() > record.expiresAt) {
    memoryTokenStore.delete(cleanToken);
    return {
      valid: false,
      reason: 'EXPIRED_TOKEN',
      message: 'Liên kết không hợp lệ hoặc đã hết hạn.',
    };
  }

  // 4. Check if maximum views already exceeded
  if (record.views >= record.maxViews) {
    return {
      valid: false,
      reason: 'MAX_VIEWS_EXCEEDED',
      message: 'Liên kết không hợp lệ hoặc đã hết hạn.',
    };
  }

  // 5. Increment views (1st view: bot scan, 2nd view: actual user)
  record.views += 1;
  const newViews = record.views;
  const remainingViews = record.maxViews - newViews;

  // Persist updated view count to database
  await supabaseRest(`users?id=eq.${record.userId}`, {
    method: 'PATCH',
    body: JSON.stringify({
      reset_password_token: `${cleanToken}:${newViews}`,
    }),
  });

  return {
    valid: true,
    views: newViews,
    maxViews: record.maxViews,
    remainingViews,
    userId: record.userId,
    email: record.email,
  };
}

/**
 * Validates and finalizes the action (e.g. submitting new password).
 * Consumes and deletes the token completely.
 */
export async function consumeTokenFinal(token: string): Promise<{
  valid: boolean;
  userId?: string;
  email?: string;
  message?: string;
}> {
  const cleanToken = token.trim();
  if (!cleanToken) {
    return { valid: false, message: 'Thiếu mã token xác thực.' };
  }
  // SEC-11: Validate token format strictly (only hex characters)
  if (!/^[0-9a-fA-F]{32,64}$/.test(cleanToken)) {
    return { valid: false, message: 'Mã xác thực không đúng định dạng.' };
  }

  let record = memoryTokenStore.get(cleanToken);

  if (!record) {
    const dbRes = await supabaseRest(
      `users?reset_password_token=like.${cleanToken}:*&select=id,email,reset_password_token,reset_password_expires_at`
    );

    if (dbRes.ok) {
      const users = (await dbRes.json()) as any[];
      if (users && users.length > 0) {
        const u = users[0];
        const parts = (u.reset_password_token as string).split(':');
        const dbViews = parseInt(parts[1] ?? '0', 10);
        const expiresAt = u.reset_password_expires_at ? new Date(u.reset_password_expires_at).getTime() : 0;

        record = {
          token: cleanToken,
          userId: u.id,
          email: u.email,
          type: 'reset_password',
          views: dbViews,
          maxViews: MAX_ALLOWED_VIEWS,
          expiresAt,
        };
      }
    }
  }

  if (!record) {
    return { valid: false, message: 'Liên kết không hợp lệ hoặc đã hết hạn.' };
  }

  if (Date.now() > record.expiresAt) {
    memoryTokenStore.delete(cleanToken);
    return { valid: false, message: 'Liên kết không hợp lệ hoặc đã hết hạn.' };
  }

  if (record.views > record.maxViews) {
    return { valid: false, message: 'Liên kết không hợp lệ hoặc đã hết hạn.' };
  }

  // Token is valid and ready to be consumed: clear from memory and DB
  memoryTokenStore.delete(cleanToken);

  await supabaseRest(`users?id=eq.${record.userId}`, {
    method: 'PATCH',
    body: JSON.stringify({
      reset_password_token: null,
      reset_password_expires_at: null,
      updated_at: new Date().toISOString(),
    }),
  });

  return {
    valid: true,
    userId: record.userId,
    email: record.email,
  };
}
