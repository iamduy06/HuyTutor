import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function secureCompare(a: string, b: string): boolean {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const cleanA = a.trim();
  const cleanB = b.trim();
  const bufA = Buffer.from(cleanA);
  const bufB = Buffer.from(cleanB);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

export async function POST(req: Request) {
  try {
    // 1. Kiểm tra xác thực qua Secret Key từ Backend API (Bảo vệ chống Timing Attack)
    const rawAuthHeader =
      req.headers.get('x-admin-secret') ||
      req.headers.get('x-admin-key') ||
      req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
    const authHeader = rawAuthHeader?.trim();
    const serverSecret = (process.env.ADMIN_API_SECRET || process.env.ADMIN_API_KEY)?.trim();

    if (!serverSecret || !authHeader || !secureCompare(authHeader, serverSecret)) {
      console.warn('[VERCEL_SMTP_AUTH_FAILED] Rejecting request: Invalid or missing admin secret.');
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Invalid admin secret' },
        { status: 401 }
      );
    }

    // 2. Parse và kiểm tra dữ liệu yêu cầu
    const body = await req.json();
    const { to, subject, html, text, type, fromName, fromEmail } = body;

    if (!to || typeof to !== 'string' || !EMAIL_REGEX.test(to.trim())) {
      return NextResponse.json(
        { success: false, error: 'Địa chỉ email người nhận không hợp lệ.' },
        { status: 400 }
      );
    }

    if (!subject || typeof subject !== 'string' || subject.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Tiêu đề email không được để trống.' },
        { status: 400 }
      );
    }

    if (!html || typeof html !== 'string' || html.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Nội dung email HTML không được để trống.' },
        { status: 400 }
      );
    }

    const cleanTo = to.trim().toLowerCase();
    const emailPurpose = type || 'general';
    console.log(`[VERCEL_SMTP_DISPATCH] Bắt đầu gửi email [${emailPurpose}] tới ${cleanTo}`);

    // 3. Cấu hình SMTP Gmail trên Vercel (Tuyệt đối không fallback ngầm hoặc toán tử ||)
    const host = process.env.SMTP_HOST;
    const portStr = process.env.SMTP_PORT;
    const secureStr = process.env.SMTP_SECURE;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const senderEmail = fromEmail || process.env.SMTP_FROM_EMAIL;
    const senderName = fromName || process.env.SMTP_FROM_NAME;

    if (!host) {
      console.error('[VERCEL_SMTP_CONFIG_ERROR] Missing required env: SMTP_HOST');
      return NextResponse.json(
        { success: false, error: 'Thiếu biến môi trường SMTP_HOST trên Vercel.' },
        { status: 500 }
      );
    }

    if (!portStr) {
      console.error('[VERCEL_SMTP_CONFIG_ERROR] Missing required env: SMTP_PORT');
      return NextResponse.json(
        { success: false, error: 'Thiếu biến môi trường SMTP_PORT trên Vercel.' },
        { status: 500 }
      );
    }

    if (!user) {
      console.error('[VERCEL_SMTP_CONFIG_ERROR] Missing required env: SMTP_USER');
      return NextResponse.json(
        { success: false, error: 'Thiếu biến môi trường SMTP_USER trên Vercel.' },
        { status: 500 }
      );
    }

    if (!pass) {
      console.error('[VERCEL_SMTP_CONFIG_ERROR] Missing required env: SMTP_PASS');
      return NextResponse.json(
        { success: false, error: 'Thiếu biến môi trường SMTP_PASS trên Vercel.' },
        { status: 500 }
      );
    }

    if (!senderEmail) {
      console.error('[VERCEL_SMTP_CONFIG_ERROR] Missing required env: SMTP_FROM_EMAIL');
      return NextResponse.json(
        { success: false, error: 'Thiếu biến môi trường SMTP_FROM_EMAIL trên Vercel.' },
        { status: 500 }
      );
    }

    if (!senderName) {
      console.error('[VERCEL_SMTP_CONFIG_ERROR] Missing required env: SMTP_FROM_NAME');
      return NextResponse.json(
        { success: false, error: 'Thiếu biến môi trường SMTP_FROM_NAME trên Vercel.' },
        { status: 500 }
      );
    }

    const port = parseInt(portStr.trim(), 10);
    const secure = secureStr?.trim() === 'true' || port === 465;

    // 4. Khởi tạo Transporter với timeout bảo vệ
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
    });

    // 5. Gửi email
    const info = await transporter.sendMail({
      from: `"${senderName}" <${senderEmail}>`,
      to: cleanTo,
      subject,
      text: text || '',
      html,
    });

    console.log(`[VERCEL_SMTP_SUCCESS] Đã gửi thành công [${emailPurpose}] tới ${cleanTo} | MessageId: ${info.messageId}`);

    return NextResponse.json({
      success: true,
      messageId: info.messageId,
      purpose: emailPurpose,
    });
  } catch (err: any) {
    console.error('[VERCEL_SMTP_FATAL_ERROR]', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Lỗi khi gửi email qua Vercel SMTP.' },
      { status: 500 }
    );
  }
}
