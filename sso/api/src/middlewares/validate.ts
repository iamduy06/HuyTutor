import type { Request, Response, NextFunction } from 'express';
import { z, ZodError, type ZodSchema } from 'zod';

export interface ValidationSchemas {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}

export function validate(schemas: ValidationSchemas) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (schemas.body) {
        req.body = await schemas.body.parseAsync(req.body);
      }
      if (schemas.query) {
        const parsedQuery = await schemas.query.parseAsync(req.query);
        Object.defineProperty(req, 'query', {
          value: parsedQuery,
          writable: true,
          enumerable: true,
          configurable: true,
        });
      }
      if (schemas.params) {
        req.params = (await schemas.params.parseAsync(req.params)) as any;
      }
      return next();
    } catch (err: any) {
      if (err instanceof ZodError) {
        const firstIssue = err.issues[0]?.message || 'Dữ liệu yêu cầu không hợp lệ';
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: firstIssue,
            details: err.issues.map((i) => ({
              field: i.path.join('.'),
              message: i.message,
            })),
          },
        });
      }
      return next(err);
    }
  };
}

export const ssoLoginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Email không được để trống')
    .email('Định dạng email không hợp lệ')
    .max(100, 'Email tối đa 100 ký tự'),
  password: z
    .string()
    .min(1, 'Mật khẩu không được để trống')
    .max(100, 'Mật khẩu tối đa 100 ký tự'),
  app: z.string().trim().max(50).optional().default('sso'),
  device_id: z.string().trim().max(128).optional(),
  device_name: z.string().trim().max(100).optional(),
});

export const ssoRegisterSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Email không được để trống')
    .email('Định dạng email không hợp lệ')
    .max(100, 'Email tối đa 100 ký tự'),
  password: z
    .string()
    .min(6, 'Mật khẩu phải từ 6 ký tự trở lên')
    .max(100, 'Mật khẩu tối đa 100 ký tự'),
  full_name: z
    .string()
    .trim()
    .min(2, 'Họ và tên phải có ít nhất 2 ký tự')
    .max(100, 'Họ và tên tối đa 100 ký tự'),
  phone: z.string().trim().max(20).optional().nullable(),
  school_or_org: z.string().trim().max(150).optional().nullable(),
  customer_group: z
    .enum(['Giáo viên', 'Học sinh', 'Phụ huynh', 'Khác'])
    .optional()
    .default('Học sinh'),
});

export const ssoVerifyDeviceSchema = z.object({
  device_id: z
    .string()
    .trim()
    .min(1, 'Thiếu mã định danh X-Device-Id')
    .max(128),
  device_name: z.string().trim().max(100).optional(),
});
