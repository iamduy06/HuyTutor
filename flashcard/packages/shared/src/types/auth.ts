export type UserRole = "USER" | "SUBADMIN" | "ADMIN";
export type UIMode = "standard" | "kid";
export type CefrLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";

export interface UserProfile {
  id: string;
  email: string;
  role: UserRole;
  created_at: string;
  max_devices?: number | null;
  /** True nếu là subadmin của ít nhất 1 group */
  is_subadmin?: boolean;
}

export interface UserDevice {
  id: string;
  user_id: string;
  device_id: string;
  device_name: string | null;
  ip_address: string | null;
  last_seen: string;
  created_at: string;
}

export interface AppSettings {
  global_max_devices: number;
}
