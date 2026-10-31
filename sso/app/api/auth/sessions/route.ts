import { NextRequest, NextResponse } from 'next/server';
import { supabaseRest } from '@/lib/db';
import { verifyToken } from '@/lib/jwt';

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('ht_sso_token')?.value || 
      req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');

    if (!token) return NextResponse.json({ success: false, error: 'Chưa đăng nhập.' }, { status: 401 });
    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ success: false, error: 'Token không hợp lệ.' }, { status: 401 });

    // 1. Fetch active sessions
    const sessRes = await supabaseRest(
      `user_sessions?user_id=eq.${payload.sub}&is_revoked=eq.false&order=last_active_at.desc&select=*`
    );
    const sessions = sessRes.ok ? await sessRes.json() : [];

    // 2. Fetch bound devices for Flashcard
    const devRes = await supabaseRest(
      `user_devices?user_id=eq.${payload.sub}&order=last_seen.desc&select=*`
    );
    const flashcardDevices = devRes.ok ? await devRes.json() : [];

    // 3. Fetch max_devices setting
    const uRes = await supabaseRest(`users?id=eq.${payload.sub}&select=max_devices`);
    const uData = uRes.ok ? await uRes.json() : [];
    const maxDevices = uData?.[0]?.max_devices ?? 3;

    return NextResponse.json({
      success: true,
      sessions,
      flashcardDevices,
      maxDevices,
      currentToken: token
    });
  } catch (err: any) {
    console.error('[SSO_GET_SESSIONS_ERROR]', err);
    return NextResponse.json({ success: false, error: 'Lỗi tải danh sách phiên.' }, { status: 500 });
  }
}

/**
 * DELETE: Đăng xuất khỏi tất cả phiên (Revoke all sessions).
 * QUY TẮC: CHỈ thu hồi trong user_sessions, GIỮ NGUYÊN user_devices!
 */
export async function DELETE(req: NextRequest) {
  try {
    const token = req.cookies.get('ht_sso_token')?.value || 
      req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');

    if (!token) return NextResponse.json({ success: false, error: 'Chưa đăng nhập.' }, { status: 401 });
    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ success: false, error: 'Token không hợp lệ.' }, { status: 401 });

    // 1. Revoke all sessions for this user in user_sessions
    await supabaseRest(`user_sessions?user_id=eq.${payload.sub}`, {
      method: 'PATCH',
      body: JSON.stringify({ is_revoked: true })
    });

    // NOTE: user_devices VẪN ĐƯỢC GIỮ NGUYÊN!

    // Clear current cookie
    const isProd = process.env.NODE_ENV === 'production';
    const cookieDomain = process.env.COOKIE_DOMAIN;

    const res = NextResponse.json({
      success: true,
      message: 'Đã đăng xuất khỏi toàn bộ thiết bị thành công.'
    });

    res.cookies.set('ht_sso_token', '', {
      ...(cookieDomain ? { domain: cookieDomain } : {}),
      path: '/',
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      maxAge: 0
    });

    return res;
  } catch (err: any) {
    console.error('[SSO_REVOKE_ALL_ERROR]', err);
    return NextResponse.json({ success: false, error: 'Lỗi đăng xuất tất cả phiên.' }, { status: 500 });
  }
}

