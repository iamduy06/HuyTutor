export interface TurnstileVerificationResult {
  success: boolean;
  error?: string;
  errorCodes?: string[];
  hostname?: string;
}

/**
 * Service xác thực Cloudflare Turnstile token trên Backend API.
 * Gọi trực tiếp tới Cloudflare Siteverify Endpoint.
 */
export async function verifyTurnstileToken(
  token?: string,
  remoteIp?: string
): Promise<TurnstileVerificationResult> {
  const secretKey = process.env.TURNSTILE_SECRET_KEY?.trim();

  // 1. Nếu hệ thống chưa cấu hình Secret Key:
  // Cho phép bypass trong môi trường local development để không chặn luồng dev/test.
  if (!secretKey) {
    if (process.env.NODE_ENV === 'production') {
      console.warn('[TURNSTILE_WARN] Biến môi trường TURNSTILE_SECRET_KEY chưa được cấu hình trên production.');
    }
    return { success: true };
  }

  // 2. Kiểm tra token gửi lên
  if (!token || typeof token !== 'string' || token.trim().length === 0) {
    return {
      success: false,
      error: 'Thiếu mã xác thực bảo mật Turnstile. Vui lòng thử lại.',
    };
  }

  try {
    const formData = new URLSearchParams();
    formData.append('secret', secretKey);
    formData.append('response', token.trim());
    if (remoteIp && typeof remoteIp === 'string') {
      formData.append('remoteip', remoteIp.trim());
    }

    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    if (!res.ok) {
      console.error(`[TURNSTILE_HTTP_ERROR] Cloudflare siteverify trả về HTTP status ${res.status}`);
      return {
        success: false,
        error: 'Lỗi kết nối tới máy chủ kiểm tra bảo mật Cloudflare. Vui lòng thử lại sau.',
      };
    }

    const data = (await res.json()) as {
      success: boolean;
      'error-codes'?: string[];
      hostname?: string;
    };

    if (!data.success) {
      console.warn('[TURNSTILE_VERIFY_FAILED] Cloudflare từ chối token:', data['error-codes']);
      return {
        success: false,
        error: 'Xác thực bảo mật chống spam không thành công hoặc phiên đã hết hạn. Vui lòng thử lại.',
        errorCodes: data['error-codes'],
      };
    }

    return {
      success: true,
      hostname: data.hostname,
    };
  } catch (err: any) {
    console.error('[TURNSTILE_EXCEPTION]', err);
    return {
      success: false,
      error: 'Không thể kết nối tới dịch vụ bảo mật Cloudflare. Vui lòng thử lại sau.',
    };
  }
}
