import { NextRequest, NextResponse } from 'next/server';
import { supabaseRest } from '@/lib/db';
import { hashPassword } from '@/lib/hash';

export async function POST(req: NextRequest) {
  try {
    const { token, new_password } = await req.json();

    const cleanToken = String(token || '').trim();
    const cleanPassword = String(new_password || '');

    if (!cleanToken) {
      return NextResponse.json({ success: false, error: 'Mã khôi phục không hợp lệ.' }, { status: 400 });
    }

    if (cleanPassword.length < 6) {
      return NextResponse.json({ success: false, error: 'Mật khẩu mới phải có ít nhất 6 ký tự.' }, { status: 400 });
    }

    // 1. Find user by reset_password_token
    const uRes = await supabaseRest(
      `users?reset_password_token=eq.${encodeURIComponent(cleanToken)}&select=id,reset_password_expires_at`
    );

    if (!uRes.ok) {
      return NextResponse.json({ success: false, error: 'Lỗi kiểm tra token.' }, { status: 500 });
    }

    const users = await uRes.json();
    if (!users || users.length === 0) {
      return NextResponse.json({ success: false, error: 'Mã khôi phục không hợp lệ hoặc đã qua sử dụng.' }, { status: 400 });
    }

    const user = users[0];
    if (new Date(user.reset_password_expires_at).getTime() < Date.now()) {
      return NextResponse.json({ success: false, error: 'Mã khôi phục đã hết hạn. Vui lòng gửi lại yêu cầu.' }, { status: 400 });
    }

    // 2. Hash new password with Bcrypt
    const passwordHash = await hashPassword(cleanPassword);

    // 3. Update password and clear reset token
    await supabaseRest(`users?id=eq.${user.id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        password_hash: passwordHash,
        reset_password_token: null,
        reset_password_expires_at: null,
        updated_at: new Date().toISOString()
      })
    });

    // 4. Revoke all previous sessions (force re-login everywhere)
    await supabaseRest(`user_sessions?user_id=eq.${user.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ is_revoked: true })
    });

    return NextResponse.json({
      success: true,
      message: 'Mật khẩu đã được thay đổi thành công! Vui lòng đăng nhập lại.'
    });
  } catch (err: any) {
    console.error('[RESET_PASSWORD_ERROR]', err);
    return NextResponse.json({ success: false, error: 'Lỗi đổi mật khẩu.' }, { status: 500 });
  }
}

