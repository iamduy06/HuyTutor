import { supabaseRest } from '../config/db.js';

export interface CreateSessionParams {
  userId: string;
  sessionToken: string;
  deviceId?: string;
  deviceName?: string;
  appName?: string;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Tạo phiên đăng nhập mới có thời hạn chính xác là 3 NGÀY (259,200 giây)
 */
export async function createSession(params: CreateSessionParams): Promise<void> {
  const expiresAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();

  await supabaseRest('user_sessions', {
    method: 'POST',
    body: JSON.stringify({
      user_id: params.userId,
      session_token: params.sessionToken,
      device_id: params.deviceId || null,
      device_name: params.deviceName || null,
      app_source: params.appName || 'sso',
      ip_address: params.ipAddress || null,
      user_agent: params.userAgent || null,
      expires_at: expiresAt,
      is_revoked: false
    })
  });
}

/**
 * Thu hồi một phiên đăng nhập theo token
 */
export async function revokeSession(sessionToken: string): Promise<void> {
  await supabaseRest(`user_sessions?session_token=eq.${encodeURIComponent(sessionToken)}`, {
    method: 'PATCH',
    body: JSON.stringify({ is_revoked: true })
  });
}

/**
 * Thu hồi TOÀN BỘ phiên đăng nhập của người dùng
 * QUY TẮC BẢO MẬT & CHỐNG GIAN LẬN:
 * Chỉ cập nhật is_revoked = true trong public.user_sessions.
 * TUYỆT ĐỐI KHÔNG XÓA DỮ LIỆU TRONG public.user_devices ĐỂ BẢO TOÀN HẠN MỨC PHẦN CỨNG!
 */
export async function revokeAllUserSessions(userId: string): Promise<void> {
  await supabaseRest(`user_sessions?user_id=eq.${userId}`, {
    method: 'PATCH',
    body: JSON.stringify({ is_revoked: true })
  });
}

/**
 * Kiểm tra xem phiên đăng nhập có hợp lệ và còn hạn không
 */
export async function isSessionActive(sessionToken: string): Promise<boolean> {
  try {
    const res = await supabaseRest(
      `user_sessions?session_token=eq.${encodeURIComponent(sessionToken)}&select=is_revoked,expires_at`
    );
    if (!res.ok) return false;
    const sessions = (await res.json()) as any[];
    if (!sessions || sessions.length === 0) return false;

    const session = sessions[0];
    if (session.is_revoked) return false;

    const expiresAt = new Date(session.expires_at).getTime();
    if (expiresAt < Date.now()) return false;

    return true;
  } catch {
    return false;
  }
}
