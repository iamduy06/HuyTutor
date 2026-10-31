import { NextRequest, NextResponse } from 'next/server';
import { supabaseRest } from '@/lib/db';
import { verifyToken } from '@/lib/jwt';

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('ht_sso_token')?.value || 
      req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');

    if (!token) {
      return NextResponse.json({ success: false, error: 'Chưa đăng nhập.' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ success: false, error: 'Token không hợp lệ hoặc đã hết hạn.' }, { status: 401 });
    }

    // Verify session in DB
    const sessRes = await supabaseRest(`user_sessions?session_token=eq.${encodeURIComponent(token)}&select=is_revoked,expires_at`);
    if (sessRes.ok) {
      const sessData = await sessRes.json();
      if (sessData.length > 0) {
        if (sessData[0].is_revoked || new Date(sessData[0].expires_at).getTime() <= Date.now()) {
          return NextResponse.json({ success: false, error: 'Phiên đăng nhập đã bị thu hồi.' }, { status: 401 });
        }
      }
    }

    // Fetch user profile
    const uRes = await supabaseRest(`users?id=eq.${payload.sub}&select=id,email,role,max_devices,full_name,phone,customer_group,school_or_org,default_tax_cccd,default_invoice_address,is_active,created_at`);
    if (!uRes.ok) {
      return NextResponse.json({ success: false, error: 'Lỗi tải hồ sơ người dùng.' }, { status: 500 });
    }

    const users = await uRes.json();
    if (!users || users.length === 0 || !users[0].is_active) {
      return NextResponse.json({ success: false, error: 'Tài khoản không tồn tại hoặc bị khóa.' }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      user: users[0]
    });
  } catch (err: any) {
    console.error('[SSO_ME_ERROR]', err);
    return NextResponse.json({ success: false, error: 'Lỗi máy chủ.' }, { status: 500 });
  }
}

