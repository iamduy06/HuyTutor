import type { Request, Response, NextFunction } from 'express';

export function errorHandler(
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  console.error('[UNHANDLED_ERROR]', err);

  const status = typeof err?.status === 'number' ? err.status : 500;
  const message = err?.message || 'Đã có lỗi hệ thống xảy ra';
  const code = err?.code || 'INTERNAL_SERVER_ERROR';

  res.status(status).json({
    success: false,
    error: {
      code,
      message,
    },
  });
}
