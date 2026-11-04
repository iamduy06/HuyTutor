import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  fromEmail: string;
  fromName: string;
}

/**
 * Strict SMTP config loader: NO fallback data, strictly reads from env variables.
 * Throws explicit error if any required configuration is missing.
 */
function getSmtpConfig(): SmtpConfig {
  const host = process.env.SMTP_HOST;
  const portStr = process.env.SMTP_PORT;
  const secureStr = process.env.SMTP_SECURE;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const fromEmail = process.env.SMTP_FROM_EMAIL;
  const fromName = process.env.SMTP_FROM_NAME;

  if (!host) {
    throw new Error('[EMAIL_CONFIG_ERROR] Missing required environment variable: SMTP_HOST');
  }
  if (!portStr) {
    throw new Error('[EMAIL_CONFIG_ERROR] Missing required environment variable: SMTP_PORT');
  }
  if (!user) {
    throw new Error('[EMAIL_CONFIG_ERROR] Missing required environment variable: SMTP_USER');
  }
  if (!pass) {
    throw new Error('[EMAIL_CONFIG_ERROR] Missing required environment variable: SMTP_PASS');
  }
  if (!fromEmail) {
    throw new Error('[EMAIL_CONFIG_ERROR] Missing required environment variable: SMTP_FROM_EMAIL');
  }
  if (!fromName) {
    throw new Error('[EMAIL_CONFIG_ERROR] Missing required environment variable: SMTP_FROM_NAME');
  }

  const port = parseInt(portStr, 10);
  if (isNaN(port)) {
    throw new Error(`[EMAIL_CONFIG_ERROR] Invalid SMTP_PORT: "${portStr}". Must be a valid integer.`);
  }

  const secure = secureStr === 'true';

  return { host, port, secure, user, pass, fromEmail, fromName };
}

/**
 * Strict SSO URL loader: NO fallback data, strictly reads from env variables.
 */
export function getSsoBaseUrl(): string {
  const ssoUrl = process.env.SSO_URL;
  if (!ssoUrl) {
    throw new Error('[ENV_ERROR] Missing required environment variable: SSO_URL');
  }
  return ssoUrl.trim().replace(/\/+$/, '');
}

/**
 * Strict SHOP URL loader: NO fallback data, strictly reads from env variables.
 */
export function getShopBaseUrl(): string {
  const shopUrl = process.env.SHOP_URL;
  if (!shopUrl) {
    throw new Error('[ENV_ERROR] Missing required environment variable: SHOP_URL');
  }
  return shopUrl.trim().replace(/\/+$/, '');
}

let cachedTransporter: Transporter | null = null;

function getTransporter(): Transporter {
  const config = getSmtpConfig();

  if (!cachedTransporter) {
    cachedTransporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: {
        user: config.user,
        pass: config.pass,
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
    });
  }

  return cachedTransporter;
}

export function renderConfirmSignupTemplate(token: string, email?: string): string {
  const ssoUrl = getSsoBaseUrl();
  const shopUrl = getShopBaseUrl();
  const confirmUrl = email
    ? `${ssoUrl}/verify-email?token=${token}&email=${encodeURIComponent(email)}`
    : `${ssoUrl}/verify-email?token=${token}`;

  const tokenHtml = `
    <a href="${confirmUrl}" style="color: #ed0046; text-decoration: none; font-size: 0.45em; letter-spacing: 2px; font-weight: 800; display: inline-block; word-break: break-all;">XÁC THỰC TÀI KHOẢN</a>
    <div style="font-size: 0.22em; letter-spacing: 1px; color: #6b7280; margin-top: 10px; font-weight: 600; word-break: break-all;">Mã token: ${token}</div>
  `;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Signup Verification</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@400;600;800&display=swap" rel="stylesheet">
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #fafafa;
      font-family: 'Bricolage Grotesque', sans-serif;
      color: #1a1a2e;
      -webkit-font-smoothing: antialiased;
    }
    .email-wrapper {
      width: 100%;
      background-color: #fafafa;
      padding: 40px 10px;
    }
    .email-container {
      max-width: 500px;
      margin: 0 auto;
      background: #ffffff;
      border: 1.5px solid #f0e0e7;
      border-radius: 24px;
      overflow: hidden;
      box-shadow: 0 8px 24px rgba(237, 0, 70, 0.05);
    }
    .header {
      padding: 30px 40px 20px;
      text-align: center;
    }
    /* Logo Image Styling */
    .logo-img {
      height: 54px;
      width: auto;
      border-radius: 12px;
      display: inline-block;
    }
    .content {
      padding: 0 40px 40px;
      text-align: center;
    }
    .hero-badge {
      display: inline-block;
      background: #fff0f4;
      color: #ed0046;
      font-size: 0.8em;
      font-weight: 700;
      padding: 6px 16px;
      border-radius: 50px;
      margin-bottom: 20px;
      border: 1.5px solid #ffd6e4;
    }
    h2 {
      font-size: 1.8em;
      font-weight: 800;
      margin-bottom: 12px;
      letter-spacing: -0.5px;
    }
    p {
      color: #6b7280;
      font-size: 1em;
      line-height: 1.6;
      margin-bottom: 24px;
    }
    .otp-container {
      background: #fafafa;
      border: 2px dashed #ffd6e4;
      border-radius: 16px;
      padding: 30px;
      margin: 30px 0;
    }
    .otp-code {
      font-size: 3.2em;
      font-weight: 800;
      color: #ed0046;
      letter-spacing: 8px;
      margin: 0;
      line-height: 1;
    }
    .expiry-note {
      font-size: 0.85em;
      color: #ed0046;
      font-weight: 600;
      margin-top: 15px;
    }
    .footer {
      background: #fafafa;
      padding: 24px;
      text-align: center;
      border-top: 1.5px solid #f0e0e7;
    }
    .footer-text {
      font-size: 0.8em;
      color: #6b7280;
      line-height: 1.5;
    }
    .footer-links a {
      color: #ed0046;
      text-decoration: none;
      font-weight: 600;
    }
    @media (max-width: 480px) {
      .otp-code { font-size: 2.5em; letter-spacing: 4px; }
      .content { padding: 0 25px 30px; }
    }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="email-container">
      
      <div class="header">
        <img src="https://drive.google.com/thumbnail?id=1chYG_qCghZCS2li7fgixW8rHcBAL8rPC&sz=w200" alt="Huy Tutor Flashcard" class="logo-img">
      </div>

      <div class="content">
        <div class="hero-badge">✦ ACCOUNT VERIFICATION</div>
        <h2>Confirm Your Signup</h2>
        <p>Thank you for signing up. Please use the verification code (OTP) below to complete your registration:</p>
        <div class="otp-container">
          <div class="otp-code">${tokenHtml}</div>
          <div class="expiry-note">This code expires in 5 minutes</div>
        </div>
        <p style="font-size: 0.9em; color: #ed0046; font-weight: 600;">⚠️ Security Note: Do not share this code with anyone.</p>
      </div>
      
      <div class="footer">
        <div class="footer-text">
          © <strong>Huy Tutor</strong> &nbsp;|&nbsp; Standard & Detailed<br>
          <div class="footer-links" style="margin-top: 8px;">
            <a href="${shopUrl}">Website</a> &nbsp;•&nbsp; 
            <a href="https://www.facebook.com/huytutor">Fanpage</a>
          </div>
        </div>
      </div>

    </div>
  </div>
</body>
</html>`;
}

export function renderResetPasswordTemplate(token: string): string {
  const ssoUrl = getSsoBaseUrl();
  const shopUrl = getShopBaseUrl();
  const resetUrl = `${ssoUrl}/reset-password?token=${token}`;

  const tokenHtml = `
    <a href="${resetUrl}" style="color: #ed0046; text-decoration: none; font-size: 0.45em; letter-spacing: 2px; font-weight: 800; display: inline-block; word-break: break-all;">ĐẶT LẠI MẬT KHẨU</a>
    <div style="font-size: 0.22em; letter-spacing: 1px; color: #6b7280; margin-top: 10px; font-weight: 600; word-break: break-all;">Mã token: ${token}</div>
  `;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>OTP Verification</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@400;600;800&display=swap" rel="stylesheet">
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #fafafa;
      font-family: 'Bricolage Grotesque', sans-serif;
      color: #1a1a2e;
      -webkit-font-smoothing: antialiased;
    }
    .email-wrapper {
      width: 100%;
      background-color: #fafafa;
      padding: 40px 10px;
    }
    .email-container {
      max-width: 500px;
      margin: 0 auto;
      background: #ffffff;
      border: 1.5px solid #f0e0e7;
      border-radius: 24px;
      overflow: hidden;
      box-shadow: 0 8px 24px rgba(237, 0, 70, 0.05);
    }
    
    .header {
      padding: 30px 40px 20px;
      text-align: center;
    }
    /* Logo Image Style */
    .logo-img {
      height: 54px;
      width: auto;
      border-radius: 12px;
      display: inline-block;
    }

    .content {
      padding: 0 40px 40px;
      text-align: center;
    }
    .hero-badge {
      display: inline-block;
      background: #fff0f4;
      color: #ed0046;
      font-size: 0.8em;
      font-weight: 700;
      padding: 6px 16px;
      border-radius: 50px;
      margin-bottom: 20px;
      border: 1.5px solid #ffd6e4;
    }
    h2 {
      font-size: 1.8em;
      font-weight: 800;
      margin-bottom: 12px;
      letter-spacing: -0.5px;
    }
    p {
      color: #6b7280;
      font-size: 1em;
      line-height: 1.6;
      margin-bottom: 24px;
    }

    .otp-container {
      background: #fafafa;
      border: 2px dashed #ffd6e4;
      border-radius: 16px;
      padding: 30px;
      margin: 30px 0;
    }
    .otp-code {
      font-size: 3.2em;
      font-weight: 800;
      color: #ed0046;
      letter-spacing: 8px;
      margin: 0;
      line-height: 1;
    }
    .expiry-note {
      font-size: 0.85em;
      color: #ed0046;
      font-weight: 600;
      margin-top: 15px;
    }

    .footer {
      background: #fafafa;
      padding: 24px;
      text-align: center;
      border-top: 1.5px solid #f0e0e7;
    }
    .footer-text {
      font-size: 0.8em;
      color: #6b7280;
      line-height: 1.5;
    }
    .footer-links a {
      color: #ed0046;
      text-decoration: none;
      font-weight: 600;
    }
    
    @media (max-width: 480px) {
      .otp-code { font-size: 2.5em; letter-spacing: 4px; }
      .content { padding: 0 25px 30px; }
    }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="email-container">
      
      <div class="header">
        <img src="https://drive.google.com/thumbnail?id=1chYG_qCghZCS2li7fgixW8rHcBAL8rPC&sz=w200" alt="Huy Tutor Flashcard" class="logo-img">
      </div>

      <div class="content">
        <div class="hero-badge">✦ SECURITY VERIFICATION</div>
        <h2>Reset Password</h2>
        <p>You requested to reset your password. Please use the following OTP code to continue the process:</p>
        
        <div class="otp-container">
          <div class="otp-code">${tokenHtml}</div>
          <div class="expiry-note">This code expires in 5 minutes</div>
        </div>

        <p style="font-size: 0.9em;">If you did not request this, please ignore this email or contact support if you have concerns about your account security.</p>
      </div>

      <div class="footer">
        <div class="footer-text">
          © <strong>Huy Tutor</strong> &nbsp;|&nbsp; Standard & Detailed<br>
          <div class="footer-links" style="margin-top: 8px;">
            <a href="${shopUrl}">Website</a> &nbsp;•&nbsp; 
            <a href="https://www.facebook.com/huytutor">Fanpage</a>
          </div>
        </div>
      </div>

    </div>
  </div>
</body>
</html>`;
}

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  type?: 'signup_verification' | 'reset_password' | 'resend_verification' | 'general';
}

async function sendViaInternalProxy(options: SendEmailOptions): Promise<boolean> {
  const ssoUrl = getSsoBaseUrl();
  const proxyUrl = process.env.INTERNAL_EMAIL_URL ? process.env.INTERNAL_EMAIL_URL.trim() : `${ssoUrl}/api-internal/send-email`;
  const adminSecret = process.env.ADMIN_API_SECRET;

  if (!adminSecret) {
    throw new Error('[INTERNAL_EMAIL_ERROR] Missing required environment variable: ADMIN_API_SECRET');
  }

  const res = await fetch(proxyUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-secret': adminSecret,
    },
    body: JSON.stringify({
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || '',
      type: options.type || 'general',
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`[INTERNAL_EMAIL_PROXY_ERROR] ${res.status}: ${errorText}`);
  }

  const data = (await res.json()) as any;
  console.log(`[VERCEL_PROXY_EMAIL_SENT] MessageId: ${data?.messageId} [${options.type || 'general'}] to ${options.to}`);
  return true;
}

export async function sendEmail(options: SendEmailOptions): Promise<boolean> {
  // 1. Trong môi trường production hoặc khi có cờ ép buộc: gửi qua Vercel Email Bridge
  // (tránh lỗi Render Free Tier chặn các cổng socket SMTP 587/465)
  const isProd = process.env.NODE_ENV === 'production';
  const forceProxy = process.env.USE_INTERNAL_EMAIL_PROXY === 'true';

  if (isProd || forceProxy) {
    return await sendViaInternalProxy(options);
  }

  // 2. Môi trường phát triển cục bộ (local dev): Gửi trực tiếp qua SMTP Nodemailer
  const transporter = getTransporter();
  const config = getSmtpConfig();

  try {
    const info = await transporter.sendMail({
      from: `"${config.fromName}" <${config.fromEmail}>`,
      to: options.to,
      subject: options.subject,
      text: options.text ?? '',
      html: options.html,
    });
    console.log(`[EMAIL_SENT] MessageId: ${info.messageId} to ${options.to}`);
    return true;
  } catch (err: any) {
    console.error(`[EMAIL_ERROR] Failed sending email to ${options.to}:`, err);
    throw err;
  }
}

export async function sendSignupVerificationOtp(email: string, token: string): Promise<boolean> {
  const ssoUrl = getSsoBaseUrl();
  const cleanEmail = email.trim().toLowerCase();
  const html = renderConfirmSignupTemplate(token, cleanEmail);
  const confirmUrl = `${ssoUrl}/verify-email?token=${token}&email=${encodeURIComponent(cleanEmail)}`;
  return sendEmail({
    to: cleanEmail,
    subject: 'Xác thực tài khoản Huy Tutor của bạn',
    text: `Vui lòng xác thực tài khoản của bạn bằng cách truy cập liên kết: ${confirmUrl}`,
    html,
    type: 'signup_verification',
  });
}

export async function sendPasswordResetOtp(email: string, token: string): Promise<boolean> {
  const ssoUrl = getSsoBaseUrl();
  const html = renderResetPasswordTemplate(token);
  return sendEmail({
    to: email,
    subject: 'Khôi phục mật khẩu tài khoản Huy Tutor',
    text: `Vui lòng sử dụng liên kết sau để đặt lại mật khẩu mới: ${ssoUrl}/reset-password?token=${token}`,
    html,
    type: 'reset_password',
  });
}
