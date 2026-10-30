import type { Request, Response, NextFunction } from 'express';
import { env } from '../config/env.js';

const SENSITIVE_DB_PATTERNS = [
  /relation.*does not exist/i,
  /column.*does not exist/i,
  /syntax error/i,
  /violates.*constraint/i,
  /duplicate key/i,
  /foreign key/i,
  /invalid input syntax/i,
  /null value in column/i,
  /table.*not found/i,
  /PostgreSQL/i,
  /pg_/i,
];

export function errorHandler(
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  console.error('[UNHANDLED_ERROR]', err);

  const status = typeof err?.status === 'number' ? err.status : 500;
  let message = err?.message || 'Đã có lỗi hệ thống xảy ra';
  let code = err?.code || 'INTERNAL_SERVER_ERROR';

  // SEC-012: In production, mask internal PostgreSQL errors & 500 server stack details
  if (env.NODE_ENV === 'production') {
    const isDbLeak = typeof message === 'string' && SENSITIVE_DB_PATTERNS.some(p => p.test(message));
    if (status >= 500 || isDbLeak) {
      message = 'Đã có lỗi hệ thống xảy ra. Vui lòng thử lại sau.';
      code = 'INTERNAL_SERVER_ERROR';
    }
  }

  res.status(status).json({
    success: false,
    error: {
      code,
      message,
    },
  });
}
