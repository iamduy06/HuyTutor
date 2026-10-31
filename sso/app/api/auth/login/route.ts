import { NextRequest, NextResponse } from 'next/server';
import { supabaseRest } from '@/lib/db';
import { verifyPassword } from '@/lib/hash';
import { signToken } from '@/lib/jwt';
import { enforceFlashcardDevice } from '@/lib/device';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, device_id, device_name, app, redirect_url } = body;

    const cleanEmail = String(email || '').trim().toLowerCase();
    if (!cleanEmail || !password) {
      return NextResponse.json(
        { success: false, error: { message: 'Vui lòng nhập đầy đủ Email và Mật khẩu.' } },
        { status: 400 }
      );
    }

    // 1. Fetch user from public.users
    const userRes = await supabaseRest(`users?email=eq.${encodeURIComponent(cleanEmail)}&select=*`);
    if (!userRes.ok) {
      return NextResponse.json(
        { success: false, error: { message: 'Không thể kết nối cơ sở dữ liệu.' } },
        { status: 500 }
      );
    }

    const users = await userRes.json();
    if (!users || users.length === 0) {
      return NextResponse.json(
        { success: false, error: { message: 'Email hoặc mật khẩu không chính xác.' } },
        { status: 401 }
      );
    }

    const user = users[0];

    if (!user.is_active) {
      return NextResponse.json(
        { success: false, error: { message: 'Tài khoản của bạn đang tạm khóa. Vui lòng liên hệ Admin.' } },
        { status: 403 }
      );
    }

    // 2. Verify Bcrypt password hash
    const isPasswordValid = await verifyPassword(password, user.password_hash);
    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, error: { message: 'Email hoặc mật khẩu không chính xác.' } },
        { status: 401 }
      );
    }

    // Client IP & User Agent
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || req.headers.get('x-real-ip') || '127.0.0.1';
    const userAgent = req.headers.get('user-agent') || 'Trình duyệt Web';

    // 3. Context-aware Device Limiting
    const isFlashcard = app === 'flashcard' || (redirect_url && redirect_url.includes('flashcard.huytutor.edu.vn'));

    if (isFlashcard) {
      const deviceCheck = await enforceFlashcardDevice(
        user.id,
        user.role,
        device_id,
        device_name,
        clientIp
      );

      if (!deviceCheck.allowed) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'DEVICE_LIMIT_EXCEEDED',
              message: deviceCheck.message,
              contactUrl: 'https://web.facebook.com/huytutor',
              currentCount: deviceCheck.currentCount,
              maxDevices: deviceCheck.effectiveMax
            }
          },
          { status: 403 }
        );
      }
    }

    // 4. Issue JWT Token
    const token = signToken({
      sub: user.id,
      email: user.email,
      role: user.role,
      full_name: user.full_name,
      device_id: device_id || ''
    });

    // 5. Store session in public.user_sessions
    const sessionExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    await supabaseRest('user_sessions', {
      method: 'POST',
      body: JSON.stringify({
        user_id: user.id,
        session_token: token,
        app_source: app || 'sso',
        device_id: device_id || '',
        device_name: device_name || '',
        ip_address: clientIp,
        user_agent: userAgent,
        expires_at: sessionExpiresAt
      })
    });

    // 6. Update user's last_login_at
    await supabaseRest(`users?id=eq.${user.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ last_login_at: new Date().toISOString() })
    });

    // 7. Prepare response and set master root cookie (.huytutor.edu.vn)
    const res = NextResponse.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        full_name: user.full_name,
        phone: user.phone,
        customer_group: user.customer_group
      }
    });

    const isProd = process.env.NODE_ENV === 'production';
    const cookieDomain = process.env.COOKIE_DOMAIN;

    res.cookies.set('ht_sso_token', token, {
      ...(cookieDomain ? { domain: cookieDomain } : {}),
      path: '/',
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      maxAge: 7 * 24 * 3600
    });

    return res;
  } catch (err: any) {
    console.error('[SSO_LOGIN_ERROR]', err);
    return NextResponse.json(
      { success: false, error: { message: 'Lỗi hệ thống khi đăng nhập.' } },
      { status: 500 }
    );
  }
}

