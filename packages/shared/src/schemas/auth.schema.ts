import { z } from "zod";

export const registerDeviceSchema = z.object({
  device_id: z.string().min(3, "Device ID không hợp lệ"),
  device_name: z.string().optional(),
});

export const updatePasswordSchema = z.object({
  password: z.string().min(6, "Mật khẩu tối thiểu 6 ký tự"),
});

export type RegisterDeviceInput = z.infer<typeof registerDeviceSchema>;
export type UpdatePasswordInput = z.infer<typeof updatePasswordSchema>;

