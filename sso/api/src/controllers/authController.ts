import type { Request, Response } from 'express';
import { supabaseRest } from '../config/db.js';
import { signToken, type JWTPayload } from '../config/jwt.js';
import { verifyPassword, hashPassword } from '../utils/hash.js';
import { checkAndRegisterDevice, calculateUserDeviceQuota } from '../services/deviceService.js';
import { createSession, revokeSession, revokeAllUserSessions, revokeSessionById, revokeUserSessionsByApp } from '../services/sessionService.js';
import type { AuthenticatedRequest } from '../middlewares/auth.js';
import { sendSignupVerificationOtp, sendPasswordResetOtp } from '../services/emailService.js';
import { createVerificationToken, recordTokenView, consumeTokenFinal } from '../services/tokenService.js';

const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { email, password, app, device_id, device_name } = req.body;

    if (!email || !password) {
      res.status(400).json({
        success: false,
        error: { code: 'MISSING_FIELDS', message: 'Vui lòng nhập đầy đủ Email và Mật khẩu.' }
      });
      return;
    }

    const cleanEmail = email.trim().toLowerCase();

    // 1. Tìm tài khoản trong public.users
    const userRes = await supabaseRest(
      `users?email=eq.${encodeURIComponent(cleanEmail)}&select=id,email,role,password_hash,full_name,phone,customer_group,is_active`
    );

    if (!userRes.ok) {
      res.status(500).json({
        success: false,
        error: { code: 'DATABASE_ERROR', message: 'Lỗi truy vấn cơ sở dữ liệu.' }
      });
      return;
    }

    const users = (await userRes.json()) as any[];
    if (!users || users.length === 0) {
      res.status(401).json({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'Tài khoản hoặc mật khẩu không chính xác.' }
      });
      return;
    }

    const user = users[0];

    if (user.is_active === false) {
      res.status(403).json({
        success: false,
        error: { code: 'ACCOUNT_LOCKED', message: 'Tài khoản đã bị tạm khóa. Vui lòng liên hệ hỗ trợ.' }
      });
      return;
    }

    // 2. So khớp mật khẩu bcrypt ($2a$, $2b$)
    const isValid = await verifyPassword(password, user.password_hash);
    if (!isValid) {
      res.status(401).json({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'Tài khoản hoặc mật khẩu không chính xác.' }
      });
      return;
    }

    // 3. Xử lý ngữ cảnh thiết bị (Context-Aware Device Guard)
    const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Unknown Browser';

    const deviceResult = await checkAndRegisterDevice({
      userId: user.id,
      userRole: user.role,
      appName: app || 'sso',
      deviceId: device_id || '',
      deviceName: device_name || 'Thiết bị mặc định',
      userAgent,
      ipAddress: clientIp
    });

    if (!deviceResult.allowed) {
      res.status(403).json({
        success: false,
        error: {
          code: deviceResult.code,
          message: deviceResult.message,
          quota: deviceResult.quota,
          currentCount: deviceResult.currentCount,
          devices: deviceResult.devices
        }
      });
      return;
    }

    // 4. Tạo token JWT HS256 có thời hạn 3 NGÀY
    const token = signToken({
      sub: user.id,
      email: user.email,
      role: user.role,
      full_name: user.full_name,
      device_id
    });

    // 5. Lưu phiên vào public.user_sessions có thời hạn 3 NGÀY
    await createSession({
      userId: user.id,
      sessionToken: token,
      deviceId: device_id,
      deviceName: device_name,
      appName: app || 'sso',
      ipAddress: clientIp,
      userAgent
    });

    // Cập nhật last_login_at
    await supabaseRest(`users?id=eq.${user.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ last_login_at: new Date().toISOString() })
    });

    // 6. Cấp Master Cookie ht_sso_token (3 ngày)
    const isProd = process.env.NODE_ENV === 'production';
    const cookieDomain = process.env.COOKIE_DOMAIN;

    res.cookie('ht_sso_token', token, {
      ...(cookieDomain ? { domain: cookieDomain } : {}),
      path: '/',
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      maxAge: THREE_DAYS_MS
    });

    res.json({
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
  } catch (err: any) {
    console.error('[SSO_LOGIN_ERROR]', err);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Lỗi máy chủ khi đăng nhập.' }
    });
  }
}

export async function register(req: Request, res: Response): Promise<void> {
  try {
    const { email, password, confirm_password, full_name, phone, school_or_org, customer_group } = req.body;

    if (!email || !password) {
      res.status(400).json({
        success: false,
        error: { code: 'MISSING_FIELDS', message: 'Vui lòng điền đầy đủ Email và Mật khẩu.' }
      });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_PASSWORD', message: 'Mật khẩu phải có tối thiểu 6 ký tự.' }
      });
      return;
    }

    if (confirm_password && confirm_password !== password) {
      res.status(400).json({
        success: false,
        error: { code: 'PASSWORD_MISMATCH', message: 'Mật khẩu xác nhận không khớp.' }
      });
      return;
    }

    const cleanEmail = email.trim().toLowerCase();

    // 1. Kiểm tra email trùng
    const checkRes = await supabaseRest(`users?email=eq.${encodeURIComponent(cleanEmail)}&select=id`);
    if (checkRes.ok) {
      const existing = (await checkRes.json()) as any[];
      if (existing && existing.length > 0) {
        res.status(409).json({
          success: false,
          error: { code: 'EMAIL_EXISTS', message: 'Email này đã được sử dụng trên hệ thống.' }
        });
        return;
      }
    }

    // 2. Hash mật khẩu bằng bcrypt
    const hashedPassword = await hashPassword(password);

    // 3. Tạo tài khoản mới trong public.users
    const finalFullName = full_name?.trim() || cleanEmail.split('@')[0];

    const createRes = await supabaseRest('users', {
      method: 'POST',
      headers: { 'Prefer': 'return=representation' },
      body: JSON.stringify({
        email: cleanEmail,
        password_hash: hashedPassword,
        full_name: finalFullName,
        phone: phone?.trim() || null,
        school_or_org: school_or_org?.trim() || null,
        customer_group: customer_group || 'Học sinh',
        role: 'USER',
        is_active: true
      })
    });

    if (!createRes.ok) {
      res.status(500).json({
        success: false,
        error: { code: 'CREATE_USER_FAILED', message: 'Không thể khởi tạo tài khoản mới.' }
      });
      return;
    }

    const createdUsers = (await createRes.json()) as any[];
    const newUser = createdUsers[0];

    // 4. Tự động gán vào nhóm mặc định
    try {
      const defGroupRes = await supabaseRest('groups?name=eq.SYSTEM_REGISTERED&limit=1');
      if (defGroupRes.ok) {
        const defGroups = (await defGroupRes.json()) as any[];
        if (defGroups && defGroups.length > 0) {
          await supabaseRest('group_users', {
            method: 'POST',
            body: JSON.stringify({
              group_id: defGroups[0].id,
              user_id: newUser.id
            })
          });
        }
      }
    } catch (gErr) {
      console.warn('[Auto-assign group warning]', gErr);
    }

    // 5. Cấp Token và Cookie 3 ngày
    const token = signToken({
      sub: newUser.id,
      email: newUser.email,
      role: newUser.role,
      full_name: newUser.full_name
    });

    const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Unknown Browser';

    await createSession({
      userId: newUser.id,
      sessionToken: token,
      appName: 'sso',
      ipAddress: clientIp,
      userAgent
    });

    const isProd = process.env.NODE_ENV === 'production';
    const cookieDomain = process.env.COOKIE_DOMAIN;

    res.cookie('ht_sso_token', token, {
      ...(cookieDomain ? { domain: cookieDomain } : {}),
      path: '/',
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      maxAge: THREE_DAYS_MS
    });

    // 6. Gửi email xác nhận đăng ký tài khoản qua custom verification token
    createVerificationToken({ userId: newUser.id, email: cleanEmail, type: 'confirm_signup' })
      .then((signupToken) => sendSignupVerificationOtp(cleanEmail, signupToken))
      .catch((err) => {
        console.warn('[SSO_REGISTER_EMAIL_WARN]', err);
      });

    res.json({
      success: true,
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        role: newUser.role,
        full_name: newUser.full_name
      }
    });
  } catch (err: any) {
    console.error('[SSO_REGISTER_ERROR]', err);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Lỗi máy chủ khi đăng ký.' }
    });
  }
}

export async function logout(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const token = req.token || req.cookies?.ht_sso_token || req.headers.authorization?.replace(/^Bearer\s+/i, '');

    if (token) {
      // 1. Thu hồi phiên trong user_sessions (Token invalidation)
      await revokeSession(token);
      // NOTE: TUYỆT ĐỐI KHÔNG XÓA RECORD TRONG user_devices!
    }

    const isProd = process.env.NODE_ENV === 'production';
    const cookieDomain = process.env.COOKIE_DOMAIN || '.huytutor.edu.vn';

    const clearOpts = {
      path: '/',
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax' as const,
      maxAge: 0,
      expires: new Date(0),
    };

    // 1. Clear on root domain (.huytutor.edu.vn and huytutor.edu.vn)
    res.cookie('ht_sso_token', '', { ...clearOpts, domain: cookieDomain });
    if (cookieDomain.startsWith('.')) {
      res.cookie('ht_sso_token', '', { ...clearOpts, domain: cookieDomain.slice(1) });
    }

    // 2. Clear host-only (no domain specified)
    res.cookie('ht_sso_token', '', clearOpts);

    res.json({ success: true, message: 'Đăng xuất thành công.' });
  } catch (err: any) {
    console.error('[SSO_LOGOUT_ERROR]', err);
    res.status(500).json({ success: false, error: { message: 'Lỗi khi đăng xuất.' } });
  }
}

export async function getMe(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userPayload = req.user!;

    const userRes = await supabaseRest(
      `users?id=eq.${userPayload.sub}&select=id,email,role,full_name,phone,school_or_org,customer_group,default_tax_cccd,default_invoice_address,is_active,last_login_at,created_at`
    );

    if (!userRes.ok) {
      res.status(404).json({ success: false, error: 'Không tìm thấy thông tin người dùng.' });
      return;
    }

    const users = (await userRes.json()) as any[];
    if (!users || users.length === 0) {
      res.status(404).json({ success: false, error: 'Tài khoản không tồn tại.' });
      return;
    }

    res.json({
      success: true,
      user: users[0],
      token: req.token || ''
    });
  } catch (err: any) {
    console.error('[SSO_ME_ERROR]', err);
    res.status(500).json({ success: false, error: 'Lỗi máy chủ khi lấy thông tin người dùng.' });
  }
}

/**
 * Endpoint xác thực thiết bị chuyên dụng cho Flashcard:
 * Xử lý trường hợp người dùng login bên Shop rồi chuyển sang Flashcard trên máy thứ 4!
 */
export async function verifyDevice(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userPayload = req.user!;
    const { device_id, device_name } = req.body;

    if (userPayload.role === 'ADMIN') {
      res.json({ success: true, valid: true, message: 'Admin bypass.' });
      return;
    }

    if (!device_id) {
      res.status(400).json({ success: false, valid: false, message: 'Thiếu mã định danh X-Device-Id.' });
      return;
    }

    const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Unknown Browser';

    // Rà soát thiết bị với Flashcard rules
    const result = await checkAndRegisterDevice({
      userId: userPayload.sub,
      userRole: userPayload.role,
      appName: 'flashcard',
      deviceId: device_id,
      deviceName: device_name || 'Thiết bị mới',
      userAgent,
      ipAddress: clientIp
    });

    if (!result.allowed) {
      res.status(403).json({
        success: false,
        valid: false,
        code: 'DEVICE_LIMIT_EXCEEDED',
        message: result.message,
        quota: result.quota,
        currentCount: result.currentCount,
        devices: result.devices
      });
      return;
    }

    res.json({
      success: true,
      valid: true,
      quota: result.quota,
      currentCount: result.currentCount
    });
  } catch (err: any) {
    console.error('[VERIFY_DEVICE_ERROR]', err);
    res.status(500).json({ success: false, error: 'Lỗi khi kiểm tra thiết bị.' });
  }
}

/**
 * Trả về danh sách thiết bị và phiên đăng nhập của người dùng
 * QUY TẮC BẢO MẬT: Người dùng KHÔNG ĐƯỢC PHÉP tự ý xóa thiết bị trong user_devices.
 * Chỉ Admin mới có quyền xóa phần cứng.
 */
export async function listDevices(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userPayload = req.user!;

    // 1. Lấy danh sách thiết bị Flashcard trong public.user_devices
    const devRes = await supabaseRest(
      `user_devices?user_id=eq.${userPayload.sub}&order=last_seen.desc`
    );
    const devices = devRes.ok ? ((await devRes.json()) as any[]) : [];

    // 2. Lấy danh sách phiên đang hoạt động trong public.user_sessions
    const sessRes = await supabaseRest(
      `user_sessions?user_id=eq.${userPayload.sub}&is_revoked=eq.false&order=created_at.desc`
    );
    const sessions = sessRes.ok ? ((await sessRes.json()) as any[]) : [];

    const quota = await calculateUserDeviceQuota(userPayload.sub);

    res.json({
      success: true,
      quota,
      maxDevices: quota,
      currentCount: devices.length,
      devices,
      flashcardDevices: devices,
      sessions,
      canDeleteDevice: userPayload.role === 'ADMIN' // Chỉ Admin mới được xóa!
    });
  } catch (err: any) {
    console.error('[LIST_DEVICES_ERROR]', err);
    res.status(500).json({ success: false, error: 'Lỗi khi tải danh sách thiết bị.' });
  }
}

/**
 * Thu hồi toàn bộ phiên đăng nhập của người dùng (Đăng xuất khỏi tất cả phiên)
 * Hoặc thu hồi riêng theo phân hệ ứng dụng (app = 'shop' | 'flashcard')
 * Giữ nguyên bản ghi phần cứng trong user_devices.
 */
export async function revokeAllSessions(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userPayload = req.user!;
    const appFilter = (req.query.app as string | undefined)?.toLowerCase();

    if (appFilter && (appFilter === 'shop' || appFilter === 'flashcard')) {
      await revokeUserSessionsByApp(userPayload.sub, appFilter);
      res.json({
        success: true,
        message: `Đã đăng xuất khỏi toàn bộ phiên ${appFilter === 'shop' ? 'Huy Tutor Shop' : 'Flashcard'}.`
      });
      return;
    }

    await revokeAllUserSessions(userPayload.sub);

    const isProd = process.env.NODE_ENV === 'production';
    const cookieDomain = process.env.COOKIE_DOMAIN;

    res.cookie('ht_sso_token', '', {
      ...(cookieDomain ? { domain: cookieDomain } : {}),
      path: '/',
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      maxAge: 0
    });

    res.json({
      success: true,
      message: 'Đã đăng xuất khỏi toàn bộ phiên thành công. Các liên kết thiết bị Flashcard được giữ nguyên.'
    });
  } catch (err: any) {
    console.error('[REVOKE_ALL_ERROR]', err);
    res.status(500).json({ success: false, error: 'Lỗi khi thu hồi phiên đăng nhập.' });
  }
}

/**
 * Thu hồi một phiên đăng nhập cụ thể theo ID
 */
export async function revokeSingleSession(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userPayload = req.user!;
    const sessionId = String(req.params.id || '');

    if (!sessionId) {
      res.status(400).json({ success: false, error: 'Thiếu mã định danh phiên.' });
      return;
    }

    await revokeSessionById(sessionId, userPayload.sub);

    res.json({
      success: true,
      message: 'Đã thu hồi phiên đăng nhập thành công.'
    });
  } catch (err: any) {
    console.error('[REVOKE_SINGLE_SESSION_ERROR]', err);
    res.status(500).json({ success: false, error: 'Lỗi khi thu hồi phiên đăng nhập.' });
  }
}

/**
 * Gửi mã xác thực khôi phục mật khẩu qua Email (SMTP)
 * Sinh verification token gắn với SSO để xác thực
 */
export async function forgotPassword(req: Request, res: Response): Promise<void> {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ success: false, error: { code: 'MISSING_EMAIL', message: 'Vui lòng cung cấp email.' } });
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    const userRes = await supabaseRest(
      `users?email=eq.${encodeURIComponent(cleanEmail)}&select=id,email,is_active`
    );

    if (userRes.ok) {
      const users = (await userRes.json()) as any[];
      if (users && users.length > 0 && users[0].is_active !== false) {
        const user = users[0];
        const token = await createVerificationToken({
          userId: user.id,
          email: cleanEmail,
          type: 'reset_password',
        });

        await sendPasswordResetOtp(cleanEmail, token);
      }
    }

    res.json({
      success: true,
      message: 'Mã xác nhận khôi phục mật khẩu đã được gửi tới email của bạn.',
    });
  } catch (err: any) {
    console.error('[FORGOT_PASSWORD_ERROR]', err);
    res.status(500).json({ success: false, error: { message: 'Lỗi khi xử lý yêu cầu khôi phục mật khẩu.' } });
  }
}

/**
 * Kiểm tra và xác thực token trên SSO portal
 */
export async function verifyToken(req: Request, res: Response): Promise<void> {
  try {
    const token = ((req.query.token as string) || req.body?.token || '').trim();
    if (!token) {
      res.status(400).json({
        success: false,
        error: { code: 'MISSING_TOKEN', message: 'Thiếu mã token xác thực.' },
      });
      return;
    }

    const result = await recordTokenView(token);

    if (!result.valid) {
      res.status(400).json({
        success: false,
        error: { code: result.reason ?? 'INVALID_TOKEN', message: result.message },
      });
      return;
    }

    res.json({
      success: true,
      valid: true,
      views: result.views,
      maxViews: result.maxViews,
      remainingViews: result.remainingViews,
      email: result.email,
    });
  } catch (err: any) {
    console.error('[VERIFY_TOKEN_ERROR]', err);
    res.status(500).json({ success: false, error: { message: 'Lỗi khi xác thực token.' } });
  }
}

export const verifyOtp = verifyToken;

/**
 * Đặt lại mật khẩu mới sau khi xác thực token
 * Tiêu thụ và hủy hoàn toàn token để không thể sử dụng lại
 */
export async function resetPassword(req: Request, res: Response): Promise<void> {
  try {
    const { token, new_password } = req.body;
    if (!token || !new_password) {
      res.status(400).json({
        success: false,
        error: { code: 'MISSING_FIELDS', message: 'Thiếu mã xác thực hoặc mật khẩu mới.' },
      });
      return;
    }

    const cleanToken = token.trim();
    const result = await consumeTokenFinal(cleanToken);

    if (!result.valid || !result.userId) {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_TOKEN', message: result.message ?? 'Mã xác thực không hợp lệ hoặc đã hết hạn.' },
      });
      return;
    }

    const hashedPassword = await hashPassword(new_password);
    await supabaseRest(`users?id=eq.${result.userId}`, {
      method: 'PATCH',
      body: JSON.stringify({
        password_hash: hashedPassword,
        reset_password_token: null,
        reset_password_expires_at: null,
        updated_at: new Date().toISOString(),
      }),
    });

    // Revoke all active sessions so all previous logins are terminated
    await revokeAllUserSessions(result.userId);

    res.json({
      success: true,
      message: 'Mật khẩu đã được cập nhật thành công. Vui lòng đăng nhập lại.',
    });
  } catch (err: any) {
    console.error('[RESET_PASSWORD_ERROR]', err);
    res.status(500).json({ success: false, error: { message: 'Đã có lỗi xảy ra, vui lòng thử lại.' } });
  }
}

/**
 * Đổi mật khẩu cho người dùng đang đăng nhập (Change Password)
 * Xử lý tập trung tại SSO, xác thực mật khẩu hiện tại bằng bcrypt
 */
export async function changePassword(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userPayload = req.user;
    if (!userPayload?.sub) {
      res.status(401).json({
        success: false,
        error: { message: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.' },
      });
      return;
    }

    const { current_password, new_password, password } = req.body;
    const finalNewPassword = (new_password || password || '').trim();

    if (!current_password || !finalNewPassword) {
      res.status(400).json({
        success: false,
        error: { message: 'Vui lòng nhập đầy đủ thông tin.' },
      });
      return;
    }

    if (finalNewPassword.length < 6) {
      res.status(400).json({
        success: false,
        error: { message: 'Mật khẩu mới phải từ 6 ký tự trở lên.' },
      });
      return;
    }

    // 1. Tìm thông tin người dùng trong public.users
    const userRes = await supabaseRest(
      `users?id=eq.${userPayload.sub}&select=id,password_hash`
    );

    if (!userRes.ok) {
      res.status(400).json({
        success: false,
        error: { message: 'Đã có lỗi xảy ra, vui lòng thử lại.' },
      });
      return;
    }

    const users = (await userRes.json()) as any[];
    if (!users || users.length === 0) {
      res.status(404).json({
        success: false,
        error: { message: 'Tài khoản không tồn tại.' },
      });
      return;
    }

    const dbUser = users[0];

    // 2. So khớp mật khẩu hiện tại bằng bcrypt
    const isValid = await verifyPassword(current_password, dbUser.password_hash);
    if (!isValid) {
      res.status(400).json({
        success: false,
        error: { message: 'Mật khẩu hiện tại không chính xác.' },
      });
      return;
    }

    // 3. Hash mật khẩu mới và cập nhật vào public.users
    const hashed = await hashPassword(finalNewPassword);
    const updateRes = await supabaseRest(`users?id=eq.${userPayload.sub}`, {
      method: 'PATCH',
      body: JSON.stringify({
        password_hash: hashed,
        updated_at: new Date().toISOString(),
      }),
    });

    if (!updateRes.ok) {
      res.status(500).json({
        success: false,
        error: { message: 'Đã có lỗi xảy ra, vui lòng thử lại.' },
      });
      return;
    }

    res.json({
      success: true,
      message: 'Đổi mật khẩu thành công.',
    });
  } catch (err: any) {
    console.error('[CHANGE_PASSWORD_ERROR]', err);
    res.status(500).json({
      success: false,
      error: { message: 'Đã có lỗi xảy ra, vui lòng thử lại.' },
    });
  }
}
