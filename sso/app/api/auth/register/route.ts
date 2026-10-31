import { NextRequest, NextResponse } from 'next/server';
import { supabaseRest } from '@/lib/db';
import { hashPassword } from '@/lib/hash';
import { signToken } from '@/lib/jwt';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, full_name, phone } = body;

    const cleanEmail = String(email || '').trim().toLowerCase();
    if (!cleanEmail || !password || String(password).length < 6) {
      return NextResponse.json(
        { success: false, error: { message: 'Email không hợp lệ hoặc mật khẩu ít hơn 6 ký tự.' } },
        { status: 400 }
      );
    }

    // 1. Check if email already registered in public.users
    const existRes = await supabaseRest(`users?email=eq.${encodeURIComponent(cleanEmail)}&select=id`);
    if (existRes.ok) {
      const existing = await existRes.json();
      if (existing.length > 0) {
        return NextResponse.json(
          { success: false, error: { message: 'Địa chỉ email này đã được đăng ký. Vui lòng đăng nhập.' } },
          { status: 400 }
        );
      }
    }

    // 2. Hash password with Bcrypt
    const passwordHash = await hashPassword(password);

    // 3. Insert new user into public.users
    const userRes = await supabaseRest('users', {
      method: 'POST',
      headers: { 'Prefer': 'return=representation' },
      body: JSON.stringify({
        email: cleanEmail,
        password_hash: passwordHash,
        full_name: String(full_name || '').trim(),
        phone: String(phone || '').trim(),
        role: 'USER',
        max_devices: 3,
        customer_group: 'Học sinh'
      })
    });

    if (!userRes.ok) {
      const errText = await userRes.text();
      return NextResponse.json(
        { success: false, error: { message: `Lỗi tạo tài khoản: ${errText}` } },
        { status: 500 }
      );
    }

    const createdUsers = await userRes.json();
    const newUser = createdUsers[0];

    // 4. Auto assign to SYSTEM_REGISTERED group in Flashcard
    try {
      const gRes = await supabaseRest(`groups?name=eq.SYSTEM_REGISTERED&select=id`);
      if (gRes.ok) {
        const groups = await gRes.json();
        if (groups.length > 0) {
          await supabaseRest('group_users', {
            method: 'POST',
            body: JSON.stringify({
              group_id: groups[0].id,
              user_id: newUser.id,
              is_subadmin: false
            })
          });
        }
      }
    } catch (gErr) {
      console.warn('[Auto-assign group warning]', gErr);
    }

    // 5. Issue token and create session
    const token = signToken({
      sub: newUser.id,
      email: newUser.email,
      role: newUser.role,
      full_name: newUser.full_name
    });

    const isProd = process.env.NODE_ENV === 'production';
    const cookieDomain = process.env.COOKIE_DOMAIN;

    const res = NextResponse.json({
      success: true,
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        role: newUser.role,
        full_name: newUser.full_name
      }
    });

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
    console.error('[SSO_REGISTER_ERROR]', err);
    return NextResponse.json(
      { success: false, error: { message: 'Lỗi máy chủ khi đăng ký tài khoản.' } },
      { status: 500 }
    );
  }
}

