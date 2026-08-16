import { Router, Request, Response } from "express";
import { requireAuth, requireAdmin } from "../../middleware/auth";
import { createAdminClient } from "../../lib/supabase";

const router = Router();

/**
 * GET /api/admin/subadmins
 */
router.get("/", requireAuth, requireAdmin, async (req: Request, res: Response) => {
  try {
    const supabase = createAdminClient();
    const { data: groups, error } = await supabase
      .from("groups")
      .select(`
        id, name, max_users, max_device_per_user, is_system, system_type, created_at, branding,
        group_decks(deck_id, expired_at, deck:decks(title)),
        group_users(
          is_subadmin,
          user:users(
            id, email, role, created_at, max_devices,
            user_devices!user_devices_user_id_fkey(device_id, device_name, ip_address, last_seen),
            user_decks(deck_id, expired_at, progress_percent, learned_count, deck:decks(title))
          )
        )
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Subadmins fetch error:", error);
      return res.status(500).json({ error: error.message });
    }

    const processed = (groups ?? []).map((g: any) => ({
      ...g,
      user_count: g.group_users?.length || 0,
      group_users: (g.group_users ?? [])
        .sort((a: any, b: any) => {
          if (a.is_subadmin && !b.is_subadmin) return -1;
          if (!a.is_subadmin && b.is_subadmin) return 1;
          return 0;
        })
        .map((gu: any) => {
          const u = gu.user;
          return {
            id: u.id, email: u.email, role: u.role, created_at: u.created_at, max_devices: u.max_devices,
            is_group_subadmin: gu.is_subadmin,
            device_count: u.user_devices?.length || 0,
            deck_count: u.user_decks?.length || 0,
            user_devices: u.user_devices || [],
            user_decks: u.user_decks || [],
            decks: (u.user_decks ?? []).map((ud: any) => ({ id: ud.deck_id, title: ud.deck?.title })),
          };
        }),
    }));

    return res.json({ groups: processed });
  } catch (err: any) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
