import { z } from "zod";

export const subadminCreateUserSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
  password: z.string().min(6, "Mật khẩu tối thiểu 6 ký tự"),
  group_id: z.string().min(1, "group_id là bắt buộc"),
});

export const subadminUpdateUserSchema = z.object({
  password: z.string().min(6, "Mật khẩu tối thiểu 6 ký tự").optional(),
  max_devices: z.coerce.number().optional(),
});

export const subadminBrandingSchema = z.object({
  header_logo_text: z.string().nullable().optional(),
  show_header: z.boolean().optional(),
  show_footer: z.boolean().optional(),
});

export const subadminAssignDecksSchema = z.object({
  userId: z.string().min(1, "userId là bắt buộc"),
  deckIds: z.array(z.string()),
  expiredAt: z.string().optional(),
});

export type SubadminCreateUserInput = z.infer<typeof subadminCreateUserSchema>;
export type SubadminUpdateUserInput = z.infer<typeof subadminUpdateUserSchema>;
export type SubadminBrandingInput = z.infer<typeof subadminBrandingSchema>;
export type SubadminAssignDecksInput = z.infer<typeof subadminAssignDecksSchema>;
