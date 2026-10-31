import { NextRequest, NextResponse } from 'next/server';
import { supabaseRest } from '@/lib/db';
import { verifyToken } from '@/lib/jwt';

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('ht_sso_token')?.value || 
      req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');

    if (token) {
      // 1. Revoke session in user_sessions (Token invalidation)
      await supabaseRest(`user_sessions?session_token=eq.${encodeURIComponent(token)}`, {
        method: 'PATCH',
        body: JSON.stringify({ is_revoked: true })
      });
      // NOTE: QUY TẮC QUAN TRỌNG: KHÔNG XOÁ RECORD TRONG user_devices
      // Ràng buộc phần cứng của Flashcard được giữ nguyên để bảo toàn quota 3 máy!
    }

    const isProd = process.env.NODE_ENV === 'production';
    const cookieDomain = process.env.COOKIE_DOMAIN;

    const res = NextResponse.json({ success: true, message: 'Đăng xuất thành công.' });

    // Clear root cookie
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
    console.error('[SSO_LOGOUT_ERROR]', err);
    return NextResponse.json({ success: false, error: { message: 'Lỗi khi đăng xuất.' } }, { status: 500 });
  }
}

