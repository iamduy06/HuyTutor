import { Router, Request, Response } from "express";
import { requireAuth, requireSubAdmin } from "../../middleware/auth";
import { createAdminClient } from "../../lib/supabase";

const router = Router();

/**
 * GET /api/subadmin/dashboard
 * Auth: SubAdmin or Admin required
 * Returns all data needed for the subadmin overview page.
 */
router.get("/", requireAuth, requireSubAdmin, async (req: Request, res: Response) => {
  try {
    const me = req.userProfile;
    const admin = createAdminClient();

    // Lấy danh sách nhóm mà user này là subadmin
    const { data: managedGroups } = await admin
      .from("group_users")
      .select("group_id, groups(id, name, max_users)")
      .eq("user_id", me.id)
      .eq("is_subadmin", true);

    const groupIds = (managedGroups ?? []).map((g: any) => g.group_id);

    const isAdmin = me.role === "ADMIN";

    // Đếm số user trong nhóm quản lý
    const { count: managedCount } = isAdmin
      ? await admin.from("users").select("*", { count: "exact", head: true })
      : await admin.from("group_users").select("*", { count: "exact", head: true }).in("group_id", groupIds);

    // Lấy danh sách deck được gán cho nhóm
    const { data: myDecks } = isAdmin
      ? await admin.from("decks").select("id, title")
      : await admin.from("group_decks").select("deck:decks(id, title)").in("group_id", groupIds);

    const totalMaxUsers = isAdmin
      ? 0
      : (managedGroups ?? []).reduce((acc: number, g: any) => acc + (g.groups?.max_users ?? 0), 0);

    return res.json({
      me: { id: me.id, email: me.email, role: me.role },
      managedGroups: managedGroups ?? [],
      managedCount: managedCount ?? 0,
      totalMaxUsers,
      myDecks: myDecks ?? [],
      isAdmin,
    });
  } catch (err: any) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
