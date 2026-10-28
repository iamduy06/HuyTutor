import { z } from "zod";

export const subadminCreateUserSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
  password: z.string().min(6, "Mật khẩu tối thiểu 6 ký tự").optional(),
  group_id: z.string().min(1, "group_id là bắt buộc").optional(),
  role: z.enum(["USER", "SUBADMIN"]).default("USER").optional(),
  assign_all_decks: z.boolean().optional(),
  expired_at: z.string().nullable().optional(),
});

export const subadminUpdateUserSchema = z.object({
  action: z.enum([
    "reset_password",
    "assign_deck",
    "revoke_deck",
    "change_role",
    "remove_device",
    "reset_devices",
    "change_max_devices",
  ]),
  role: z.enum(["USER", "SUBADMIN"]).optional(),
  deck_id: z.string().optional(),
  expired_at: z.string().nullable().optional(),
  device_id: z.string().optional(),
  max_devices: z.coerce.number().nullable().optional(),
  password: z.string().min(6, "Mật khẩu tối thiểu 6 ký tự").optional(),
});

export const subadminBrandingSchema = z.object({
  group_id: z.string().min(1, "group_id là bắt buộc"),
  header_logo_text: z.string().nullable().optional(),
  show_header: z.boolean().optional(),
  show_footer: z.boolean().optional(),
  branding: z
    .object({
      header_logo_text: z.string().nullable().optional(),
      show_header: z.boolean().optional(),
      show_footer: z.boolean().optional(),
    })
    .optional(),
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
