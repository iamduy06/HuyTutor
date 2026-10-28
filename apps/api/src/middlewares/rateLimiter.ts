import rateLimit from 'express-rate-limit';

// Global limiter: 120 requests per minute per IP
export const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Quá nhiều yêu cầu từ địa chỉ IP của bạn. Vui lòng thử lại sau 1 phút.',
    },
  },
});

// Auth & sensitive actions: 15 requests per minute per IP
export const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'AUTH_RATE_LIMIT_EXCEEDED',
      message: 'Thao tác quá nhanh hoặc quá số lần cho phép. Vui lòng đợi 1 phút trước khi thử lại.',
    },
  },
});

// Export & intensive reports: 10 requests per minute per IP
export const exportLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'EXPORT_RATE_LIMIT_EXCEEDED',
      message: 'Vui lòng không xuất báo cáo liên tục. Vui lòng thử lại sau 1 phút.',
    },
  },
});
