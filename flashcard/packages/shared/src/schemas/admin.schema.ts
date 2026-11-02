import { z } from "zod";

export const adminCreateUserSchema = z.object({
  email: z.string().email("Email không đúng định dạng"),
  password: z.string().optional(),
  role: z.enum(["USER", "SUBADMIN", "ADMIN"]).optional().default("USER"),
  max_devices: z.union([z.number(), z.string()]).optional(),
  group_id: z.string().optional(),
  auto_assign_group_decks: z.boolean().optional(),
});

export const adminUpdateUserSchema = z.object({
  action: z.enum([
    "reset_password",
    "change_info",
    "assign_group",
    "remove_from_group",
    "assign_deck",
    "revoke_deck",
    "remove_device",
    "reset_devices",
  ]),
  role: z.enum(["USER", "SUBADMIN", "ADMIN"]).optional(),
  max_devices: z.union([z.number(), z.string(), z.null()]).optional(),
  group_id: z.string().optional(),
  revoke_old_decks: z.boolean().optional(),
  assign_new_decks: z.boolean().optional(),
  deck_id: z.string().optional(),
  expired_at: z.string().nullable().optional(),
  device_id: z.string().optional(),
});

export const adminCreateSubadminGroupSchema = z.object({
  name: z.string().min(1, "Tên nhóm không được để trống"),
  max_users: z.union([z.number(), z.string()]).optional(),
  max_device_per_user: z.union([z.number(), z.string()]).optional(),
  branding: z.record(z.any()).optional(),
});

export const adminUpdateSubadminGroupSchema = z.object({
  name: z.string().min(1).optional(),
  max_users: z.coerce.number().int().positive().optional(),
  max_device_per_user: z.coerce.number().int().positive().optional(),
});

export const adminSubadminGroupActionSchema = z.object({
  action: z.enum([
    "toggle_subadmin",
    "assign_group_deck",
    "revoke_group_deck",
    "change_group_deck_expiry",
    "assign_user_deck",
    "revoke_user_deck",
    "move_user",
    "remove_user",
  ]),
  user_id: z.string().optional(),
  is_subadmin: z.boolean().optional(),
  deck_id: z.string().optional(),
  deck_ids: z.array(z.string()).optional(),
  expired_at: z.string().nullable().optional(),
  assign_all_users: z.boolean().optional(),
  target_group_id: z.string().optional(),
});

export const adminCreateGroupSchema = z.object({
  name: z.string().min(1, "Tên nhóm là bắt buộc"),
  description: z.string().nullable().optional(),
  max_users: z.coerce.number().int().min(1).optional(),
});

export const adminUpdateGroupSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  max_users: z.coerce.number().int().min(1).optional(),
  max_device_per_user: z.coerce.number().int().min(1).optional(),
});

export const adminCreateDeckGroupSchema = z.object({
  name: z.string().min(1, "Tên nhóm bộ đề là bắt buộc"),
  description: z.string().nullable().optional(),
  order_index: z.coerce.number().int().optional(),
});

export const adminUpdateDeckGroupSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  order_index: z.coerce.number().int().optional(),
});

export const adminAppSettingsSchema = z.object({
  global_max_devices: z.union([z.coerce.number().int().min(1), z.string()]).optional(),
  key: z.string().optional(),
  value: z.string().optional(),
});

export const adminExportQuerySchema = z.object({
  type: z.enum(["users", "decks", "groups"]),
  format: z.enum(["json", "json_full", "csv", "xlsx"]).optional(),
});

export const idParamSchema = z.object({
  id: z.string().uuid("ID phải là định dạng UUID hợp lệ"),
});

export const adminPatchDevicesSchema = z.object({
  global_max_devices: z.union([z.coerce.number().int().min(1), z.string()]).optional(),
  user_id: z.string().uuid("user_id phải là UUID hợp lệ").optional(),
  max_devices: z.union([z.coerce.number().int().min(1), z.null()]).optional(),
});

export const adminDeleteDevicesSchema = z.object({
  user_id: z.string().uuid("user_id phải là UUID hợp lệ"),
  device_id: z.string().trim().max(128).optional(),
});

export const adminImportUserItemSchema = z.object({
  email: z.string().email("Email không đúng định dạng"),
  password: z.string().optional(),
  group_id: z.string().optional(),
  role: z.enum(["USER", "SUBADMIN", "ADMIN"]).optional(),
  deck: z.union([z.string(), z.array(z.string())]).optional(),
  expire_at: z.string().optional(),
});

export const adminImportUsersSchema = z.union([
  adminImportUserItemSchema,
  z.array(adminImportUserItemSchema),
]);

export const adminImportDeckItemSchema = z.object({
  title: z.string().min(1, "Tên bộ đề không được để trống"),
  description: z.string().optional().nullable(),
  level: z.string().optional().nullable(),
  access_level: z.record(z.any()).optional(),
});

export const adminImportDecksSchema = z.union([
  adminImportDeckItemSchema,
  z.array(adminImportDeckItemSchema),
]);

export const adminImportGroupItemSchema = z.object({
  group_name: z.string().min(1, "Tên nhóm không được để trống"),
  user_email_or_id: z.string().optional(),
  deck_name_or_id: z.string().optional(),
  deck_expire_at: z.string().optional(),
});

export const adminImportGroupsSchema = z.union([
  adminImportGroupItemSchema,
  z.array(adminImportGroupItemSchema),
]);

export const adminAssignUserDeckSchema = z.object({
  userId: z.string().min(1, "userId là bắt buộc"),
  deckIds: z.array(z.string()),
  expiredAt: z.string().optional(),
});

export type AdminCreateUserInput = z.infer<typeof adminCreateUserSchema>;
export type AdminUpdateUserInput = z.infer<typeof adminUpdateUserSchema>;
export type AdminCreateSubadminGroupInput = z.infer<typeof adminCreateSubadminGroupSchema>;
export type AdminUpdateSubadminGroupInput = z.infer<typeof adminUpdateSubadminGroupSchema>;
export type AdminSubadminGroupActionInput = z.infer<typeof adminSubadminGroupActionSchema>;
export type AdminCreateGroupInput = z.infer<typeof adminCreateGroupSchema>;
export type AdminUpdateGroupInput = z.infer<typeof adminUpdateGroupSchema>;
export type AdminCreateDeckGroupInput = z.infer<typeof adminCreateDeckGroupSchema>;
export type AdminUpdateDeckGroupInput = z.infer<typeof adminUpdateDeckGroupSchema>;
export type AdminAppSettingsInput = z.infer<typeof adminAppSettingsSchema>;
export type AdminExportQueryInput = z.infer<typeof adminExportQuerySchema>;
export type AdminAssignUserDeckInput = z.infer<typeof adminAssignUserDeckSchema>;

