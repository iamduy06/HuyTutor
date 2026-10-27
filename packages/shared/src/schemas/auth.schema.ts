import { z } from "zod";

export const registerDeviceSchema = z.object({
  device_id: z.string().min(3, "Device ID không hợp lệ"),
  device_name: z.string().optional(),
});

export const updatePasswordSchema = z.object({
  password: z.string().min(6, "Mật khẩu tối thiểu 6 ký tự"),
});

export const adminCreateUserSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
  password: z.string().min(6, "Mật khẩu tối thiểu 6 ký tự").optional(),
  role: z.enum(["USER", "SUBADMIN", "ADMIN"]).default("USER"),
  max_devices: z.coerce.number().nullable().optional(),
  group_id: z.string().optional(),
  auto_assign_group_decks: z.boolean().optional(),
});

export const adminUpdateUserSchema = z.object({
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
  role: z.enum(["USER", "SUBADMIN", "ADMIN"]).optional(),
  max_devices: z.coerce.number().nullable().optional(),
  group_id: z.string().nullable().optional(),
});

export type RegisterDeviceInput = z.infer<typeof registerDeviceSchema>;
export type UpdatePasswordInput = z.infer<typeof updatePasswordSchema>;
export type AdminCreateUserInput = z.infer<typeof adminCreateUserSchema>;
export type AdminUpdateUserInput = z.infer<typeof adminUpdateUserSchema>;
