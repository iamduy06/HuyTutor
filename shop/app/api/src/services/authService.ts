import { supabaseAdmin, isSupabaseConfigured } from '../config/supabase';
import { dbService, SeedCustomerGroup, SeedUser, SeedUserSession } from './dbService';
import { hashSha3_256, verifySha3_256, generateSecureToken } from '../utils/hash';
import { verifySsoJwt } from '../utils/jwt';

const SESSION_TTL_DAYS = Number(process.env.SESSION_TTL_DAYS);

export interface PublicUserProfile {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  role: 'user' | 'admin';
  customerGroup: SeedCustomerGroup;
  schoolOrOrg: string;
  defaultTaxCccd: string;
  defaultInvoiceAddress: string;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

export function toPublicUserProfile(user: SeedUser): PublicUserProfile {
  return {
    id: user.id,
    email: user.email,
    fullName: user.full_name,
    phone: user.phone || '',
    role:
      String(user.role || '').toUpperCase() === 'ADMIN'
        ? 'admin'
        : 'user',
    customerGroup: user.customer_group || 'Giáo viên công lập',
    schoolOrOrg: user.school_or_org || '',
    defaultTaxCccd: user.default_tax_cccd || '',
    defaultInvoiceAddress: user.default_invoice_address || '',
    isActive: Boolean(user.is_active),
    lastLoginAt: user.last_login_at,
    createdAt: user.created_at,
  };
}

export const authService = {
  /**
   * Đăng ký tài khoản mới (Mặc định role = 'user', mật khẩu băm SHA3-256)
   * và khởi tạo phiên đăng nhập (Session) ngay lập tức.
   */
  /**
   * @deprecated Toàn bộ xác thực đã chuyển về SSO tập trung.
   */
  async register(params: {
    email: string;
    password: string;
    fullName: string;
    phone?: string;
    customerGroup?: SeedCustomerGroup;
    schoolOrOrg?: string;
    userAgent?: string;
    ipAddress?: string;
  }) {
    const cleanEmail = String(params.email || '').trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!cleanEmail || !emailRegex.test(cleanEmail)) {
      throw new Error('Địa chỉ email không hợp lệ.');
    }

    const rawPassword = String(params.password || '');
    if (rawPassword.length < 6) {
      throw new Error('Mật khẩu phải có ít nhất 6 ký tự.');
    }

    const fullName = String(params.fullName || '').trim();
    if (fullName.length < 2) {
      throw new Error('Vui lòng nhập đầy đủ Họ và tên.');
    }

    const existing = await dbService.getUserByEmail(cleanEmail);
    if (existing) {
      throw new Error('Địa chỉ email này đã được đăng ký. Vui lòng đăng nhập hoặc dùng email khác.');
    }

    const passwordHash = hashSha3_256(rawPassword);

    const newUser = await dbService.createUser({
      email: cleanEmail,
      password_hash: passwordHash,
      full_name: fullName,
      phone: params.phone,
      role: 'user',
      customer_group: params.customerGroup || 'Giáo viên',
      school_or_org: params.schoolOrOrg || '',
    });

    const sessionToken = generateSecureToken(32);
    const expiresAt = new Date(
      Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000
    ).toISOString();

    const session = await dbService.createSession({
      user_id: newUser.id,
      session_token: sessionToken,
      user_agent: params.userAgent,
      ip_address: params.ipAddress,
      expires_at: expiresAt,
    });

    return {
      token: session.session_token,
      user: toPublicUserProfile(newUser),
      session: {
        id: session.id,
        expiresAt: session.expires_at,
        createdAt: session.created_at,
      },
    };
  },

  /**
   * Đăng nhập bằng Email + Mật khẩu (kiểm tra chuỗi băm SHA3-256)
   * và tạo bản ghi Session mới trong bảng user_sessions.
   */
  async login(params: {
    email: string;
    password: string;
    userAgent?: string;
    ipAddress?: string;
  }) {
    const cleanEmail = String(params.email || '').trim().toLowerCase();
    const rawPassword = String(params.password || '');

    if (!cleanEmail || !rawPassword) {
      throw new Error('Vui lòng nhập đầy đủ Email và Mật khẩu.');
    }

    const user = await dbService.getUserByEmail(cleanEmail);
    if (!user) {
      throw new Error('Email hoặc mật khẩu không chính xác.');
    }

    if (!user.is_active) {
      throw new Error('Tài khoản này đang tạm khóa. Vui lòng liên hệ Quản trị viên.');
    }

    const isMatched = verifySha3_256(rawPassword, user.password_hash);
    if (!isMatched) {
      throw new Error('Email hoặc mật khẩu không chính xác.');
    }

    const nowIso = new Date().toISOString();
    const updatedUser =
      (await dbService.updateUser(user.id, { last_login_at: nowIso })) || user;

    const sessionToken = generateSecureToken(32);
    const expiresAt = new Date(
      Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000
    ).toISOString();

    const session = await dbService.createSession({
      user_id: updatedUser.id,
      session_token: sessionToken,
      user_agent: params.userAgent,
      ip_address: params.ipAddress,
      expires_at: expiresAt,
    });

    return {
      token: session.session_token,
      user: toPublicUserProfile(updatedUser),
      session: {
        id: session.id,
        expiresAt: session.expires_at,
        createdAt: session.created_at,
      },
    };
  },

  /**
   * Kiểm tra tính hợp lệ của session_token trên mỗi request.
   */
  async validateSession(token: string): Promise<{
    user: PublicUserProfile;
    rawUser: SeedUser;
    session: SeedUserSession;
  } | null> {
    const cleanToken = String(token || '').trim();
    if (!cleanToken) return null;

    // 1. Kiểm tra nếu token là SSO JWT Token (HS256)
    const jwtSecret = process.env.JWT_SECRET;
    if (cleanToken.includes('.') && jwtSecret) {
      const payload = verifySsoJwt(cleanToken, jwtSecret);
      if (payload && payload.sub) {
        // Kiểm tra xem phiên này đã bị thu hồi trong public.user_sessions chưa
        const dbSession = await dbService.getSessionByToken(cleanToken);
        if (dbSession && (dbSession.is_revoked || new Date(dbSession.expires_at).getTime() <= Date.now())) {
          return null;
        }

        let user = await dbService.getUserById(payload.sub);
        if (!user && payload.email) {
          user = await dbService.getUserByEmail(payload.email);
        }
        if (user && user.is_active !== false) {
          const syntheticSession: SeedUserSession = {
            id: dbSession?.id || `sso_${payload.sub}`,
            user_id: user.id,
            session_token: cleanToken,
            user_agent: dbSession?.user_agent || 'SSO Federated Client',
            ip_address: dbSession?.ip_address || '',
            is_revoked: false,
            created_at: payload.iat ? new Date(payload.iat * 1000).toISOString() : new Date().toISOString(),
            last_active_at: new Date().toISOString(),
            expires_at: payload.exp ? new Date(payload.exp * 1000).toISOString() : new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
          };
          return {
            user: toPublicUserProfile(user),
            rawUser: user,
            session: syntheticSession,
          };
        }
      }
    }

    const session = await dbService.getSessionByToken(cleanToken);
    if (!session || session.is_revoked) {
      return null;
    }

    if (new Date(session.expires_at).getTime() <= Date.now()) {
      await dbService.revokeSessionByToken(cleanToken);
      return null;
    }

    const user = await dbService.getUserById(session.user_id);
    if (!user || !user.is_active) {
      return null;
    }

    // Cập nhật thời điểm hoạt động gần nhất
    await dbService.touchSession(session.id, cleanToken);

    return {
      user: toPublicUserProfile(user),
      rawUser: user,
      session,
    };
  },

  /**
   * Đăng xuất phiên hiện tại.
   */
  async logout(token: string) {
    await dbService.revokeSessionByToken(token);
    return { ok: true };
  },

  /**
   * Đăng xuất khỏi toàn bộ thiết bị của người dùng.
   */
  async logoutAll(userId: string) {
    const revokedCount = await dbService.revokeAllUserSessions(userId);
    return { ok: true, revokedCount };
  },

  /**
   * Thu hồi 1 phiên đăng nhập cụ thể theo sessionId.
   */
  async revokeSession(userId: string, sessionId: string) {
    const revoked = await dbService.revokeSessionById(userId, sessionId);
    return { ok: true, revoked };
  },

  /**
   * Lấy danh sách toàn bộ các phiên đang hoạt động của người dùng.
   */
  async listSessions(userId: string, currentToken?: string) {
    const sessions = await dbService.getUserSessions(userId);
    return sessions.map((s) => ({
      id: s.id,
      userAgent: s.user_agent || 'Trình duyệt Web',
      ipAddress: s.ip_address || '',
      createdAt: s.created_at,
      lastActiveAt: s.last_active_at,
      expiresAt: s.expires_at,
      isCurrent: Boolean(currentToken && s.session_token === currentToken),
    }));
  },

  /**
   * Đổi mật khẩu: Đã chuyển hướng 100% sang SSO tập trung.
   */
  async changePassword(_params: {
    userId: string;
    currentPassword: string;
    newPassword: string;
  }) {
    throw new Error('Tính năng đổi mật khẩu đã chuyển sang cổng SSO tập trung (sso.huytutor.edu.vn).');
  },

  /**
   * Quên mật khẩu: Đã chuyển hướng 100% sang SSO tập trung.
   */
  async forgotPassword(_email: string, _frontendOrigin?: string) {
    throw new Error('Tính năng khôi phục mật khẩu đã chuyển sang cổng SSO tập trung (sso.huytutor.edu.vn).');
  },

  /**
   * Đặt lại mật khẩu: Đã chuyển hướng 100% sang SSO tập trung.
   */
  async resetPassword(_token: string, _newPassword: string) {
    throw new Error('Tính năng đặt lại mật khẩu đã chuyển sang cổng SSO tập trung (sso.huytutor.edu.vn).');
  },
};

