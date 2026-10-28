import { z } from "zod";

export const registerDeviceSchema = z.object({
  device_id: z.string().min(3, "Device ID không hợp lệ"),
  device_name: z.string().optional(),
});

export const updatePasswordSchema = z.object({
  password: z.string().min(6, "Mật khẩu tối thiểu 6 ký tự"),
  current_password: z.string().optional(),
  is_recovery: z.boolean().optional(),
});

export const loginAuthSchema = z.object({
  email: z.string().email("Email không đúng định dạng"),
  password: z.string().min(1, "Vui lòng nhập mật khẩu"),
  device_id: z.string().min(3, "Device ID không hợp lệ"),
  device_name: z.string().optional(),
});

export const registerAuthSchema = z.object({
  email: z.string().email("Email không đúng định dạng"),
  password: z.string().min(6, "Mật khẩu tối thiểu 6 ký tự"),
  full_name: z.string().min(2, "Họ và tên tối thiểu 2 ký tự"),
});

export const verifyOtpAuthSchema = z.object({
  email: z.string().email("Email không đúng định dạng"),
  token: z.string().min(6, "Mã OTP phải có 6 ký tự").max(8),
  type: z.enum(["signup", "recovery", "email_change", "invite"]).default("signup"),
});

export const forgotPasswordAuthSchema = z.object({
  email: z.string().email("Email không đúng định dạng"),
});

export const resetPasswordAuthSchema = z.object({
  email: z.string().email("Email không đúng định dạng"),
  token: z.string().min(6, "Mã OTP phải có 6 ký tự").max(8),
  new_password: z.string().min(6, "Mật khẩu mới tối thiểu 6 ký tự"),
});

export type RegisterDeviceInput = z.infer<typeof registerDeviceSchema>;
export type UpdatePasswordInput = z.infer<typeof updatePasswordSchema>;
export type LoginAuthInput = z.infer<typeof loginAuthSchema>;
export type RegisterAuthInput = z.infer<typeof registerAuthSchema>;
export type VerifyOtpAuthInput = z.infer<typeof verifyOtpAuthSchema>;
export type ForgotPasswordAuthInput = z.infer<typeof forgotPasswordAuthSchema>;
export type ResetPasswordAuthInput = z.infer<typeof resetPasswordAuthSchema>;
