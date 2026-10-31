import { NextRequest, NextResponse } from 'next/server';
import { supabaseRest, supabaseAdminAuth } from '@/lib/db';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    const cleanEmail = String(email || '').trim().toLowerCase();

    if (!cleanEmail) {
      return NextResponse.json({ success: false, error: 'Vui lòng nhập địa chỉ email.' }, { status: 400 });
    }

    // 1. Check if user exists in public.users
    const uRes = await supabaseRest(`users?email=eq.${encodeURIComponent(cleanEmail)}&select=id`);
    if (!uRes.ok) {
      return NextResponse.json({ success: false, error: 'Lỗi kiểm tra email.' }, { status: 500 });
    }

    const users = await uRes.json();
    if (users.length === 0) {
      // Don't disclose if email exists
      return NextResponse.json({
        success: true,
        message: 'Nếu email tồn tại trên hệ thống, hướng dẫn đặt lại mật khẩu đã được gửi đến bạn.'
      });
    }

    // 2. Generate secure reset token (15 mins TTL)
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    await supabaseRest(`users?id=eq.${users[0].id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        reset_password_token: resetToken,
        reset_password_expires_at: expiresAt
      })
    });

    // 3. Trigger Supabase Email Gateway (generateLink with type: recovery)
    try {
      const resetLink = `https://sso.huytutor.edu.vn/reset-password?token=${resetToken}`;
      await supabaseAdminAuth('generate_link', {
        method: 'POST',
        body: JSON.stringify({
          type: 'recovery',
          email: cleanEmail,
          options: {
            redirectTo: resetLink
          }
        })
      });
    } catch (mailErr: any) {
      console.warn('[Supabase Email Gateway warning]', mailErr.message);
    }

    return NextResponse.json({
      success: true,
      message: 'Hướng dẫn khôi phục mật khẩu đã được gửi tới email của bạn.'
    });
  } catch (err: any) {
    console.error('[FORGOT_PASSWORD_ERROR]', err);
    return NextResponse.json({ success: false, error: 'Lỗi gửi yêu cầu khôi phục.' }, { status: 500 });
  }
}

